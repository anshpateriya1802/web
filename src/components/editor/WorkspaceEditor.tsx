"use client"

import React, { useEffect, useRef, useState } from 'react'
import Editor, { useMonaco, OnMount } from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'
import { useRoomStore } from '@/stores/roomStore'
import GhostEditor from './GhostEditor'
import { 
  Play, RotateCcw, Copy, Code2, Terminal, AlertCircle, Loader2, GitBranch,
  Timer, Pause, RefreshCw, Save 
} from 'lucide-react'
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels"
import GitHubImportModal from './GitHubImportModal'
import FileTree from './FileTree'
import FileTabs from './FileTabs'

const BOILERPLATES: Record<string, string> = {
  typescript: `function solve() {\n  // Write your code here\n  console.log("Hello World");\n}\n\nsolve();`,
  javascript: `function solve() {\n  // Write your code here\n  console.log("Hello World");\n}\n\nsolve();`,
  python: `def solve():\n    # Write your code here\n    print("Hello World")\n\nif __name__ == "__main__":\n    solve()`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n    fmt.Println("Hello World")\n}`,
  rust: `fn main() {\n    // Write your code here\n    println!("Hello World");\n}`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    cout << "Hello World" << endl;\n    return 0;\n}`,
  html: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Document</title>\n</head>\n<body>\n  <!-- Write your HTML here -->\n</body>\n</html>`,
  css: `/* Write your CSS here */\nbody {\n  margin: 0;\n}`
};

interface WorkspaceEditorProps {
  roomId:   string;
  roomDbId: string;   // DB CUID — passed to FileTree
  userId:   string;
  userName: string;
}

export default function WorkspaceEditor({ roomId, roomDbId, userId, userName }: WorkspaceEditorProps) {
  const editorRef = useRef<any>(null)
  const { activeOverlayUserId, stagingBufferCode, setStagingBuffer, setOverlayUser, setParticipants,
          activeFileId, openTabs, updateTabContent, markTabSaved, closeAllTabs } = useRoomStore()
  const [isReady, setIsReady] = useState(false)
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem("coderealm_language") || "typescript"
    }
    return "typescript"
  })

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("coderealm_language", language)
  }, [language])
  
  // Execution state
  const [output, setOutput] = useState<string | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  // GitHub import modal
  const [showGitHub, setShowGitHub] = useState(false)

  // Active file tab → sync Monaco content
  const activeTab = openTabs.find(t => t.id === activeFileId) ?? null
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const [isSaving, setIsSaving] = useState(false)

  const saveCurrentFile = async () => {
    if (!editorRef.current || !activeTab) return
    const value = editorRef.current.getValue()
    setIsSaving(true)
    try {
      await fetch('/api/files', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: activeTab.id, content: value }),
      })
      markTabSaved(activeTab.id)
    } finally {
      setIsSaving(false)
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl + S (Strictly Ctrl, no Cmd/Meta to avoid system conflicts)
      if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        saveCurrentFile()
      }
      
      // Close All Tabs: Ctrl + Q
      if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        closeAllTabs()
      }
    }
    window.addEventListener('keydown', handleKeyDown, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true })
  }, [activeTab, closeAllTabs])

  // Autosave every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      saveCurrentFile()
    }, 60000)
    return () => clearInterval(interval)
  }, [activeTab])


  // When active tab changes, load its content into Monaco
  useEffect(() => {
    if (!editorRef.current || !activeTab) return
    const currentValue = editorRef.current.getValue()
    if (currentValue !== activeTab.content) {
      editorRef.current.setValue(activeTab.content)
    }
  }, [activeFileId])

  // Timer state — idle | running | paused
  const [timerStatus, setTimerStatus] = useState<'idle' | 'running' | 'paused'>('idle')
  const [timerSeconds, setTimerSeconds] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerStatus === 'running') {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerStatus])

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
    const s = (totalSeconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // This user's private document
  const ydoc = useRef(new Y.Doc())
  const provider = useRef<WebsocketProvider | null>(null)
  const binding = useRef<MonacoBinding | null>(null)

  const executeCodeRef = useRef<() => void>(() => {})

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Add Keyboard Shortcut: Cmd/Ctrl + Enter to Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      executeCodeRef.current()
    })

    // Configure Monaco for better Autocomplete
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.Latest,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
    })

    // Setup y-websocket connecting to our fastify WS server
    provider.current = new WebsocketProvider(
      'ws://localhost:3002',
      `room:${roomId}:user:${userId}`,
      ydoc.current
    )

    const type = ydoc.current.getText('monaco')

    const store = useRoomStore.getState()
    const localContent = store.openTabs.find(t => t.id === store.activeFileId)?.content

    // To prevent race conditions with Yjs and Fastify room GC, we wait for websocket to connect.
    // If the server says the document is empty (because it was GC'd when we refreshed), we push our local state.
    provider.current.on('sync', (isSynced: boolean) => {
      if (isSynced && type.length === 0) {
        if (localContent) {
          type.insert(0, localContent)
        }
      }
    })

    // Bind Monaco editor to Yjs document
    binding.current = new MonacoBinding(
      type,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.current.awareness
    )

    provider.current.awareness.setLocalStateField('user', {
      userId,
      name: userName,
      color: '#6366f1' // Can be dynamic
    })

    // Update participants in store whenever awareness changes
    provider.current.awareness.on('change', () => {
      const states = provider.current?.awareness.getStates()
      if (!states) return

      const activeUsers: any[] = []
      states.forEach((state: any) => {
        if (state.user) {
          activeUsers.push(state.user)
        }
        
        // Check if anyone pushed code to US
        if (state.syncPush && state.syncPush.targetUserId === userId) {
          // Prevent re-triggering if we already staged it
          const currentStaging = useRoomStore.getState().stagingBufferCode;
          if (currentStaging !== state.syncPush.code) {
             setStagingBuffer(state.syncPush.code)
          }
        }
      })
      setParticipants(activeUsers)
    })

    // Register our ability to push code to someone else
    useRoomStore.getState().setBroadcastSyncAction((targetUserId: string) => {
       const code = editorRef.current?.getValue() || ""
       provider.current?.awareness.setLocalStateField('syncPush', {
          targetUserId,
          code,
          timestamp: Date.now()
       })
       
       // Clear the push after 3 seconds so we don't spam awareness
       setTimeout(() => {
          provider.current?.awareness.setLocalStateField('syncPush', null)
       }, 3000)
    })

    // Visual Anchors: Sync viewport scroll
    editor.onDidScrollChange((e) => {
      provider.current?.awareness.setLocalStateField('viewport', {
        scrollTop: e.scrollTop,
        scrollLeft: e.scrollLeft
      })
    })

    setIsReady(true)
  }

  // Handle cleanup
  useEffect(() => {
    return () => {
      binding.current?.destroy()
      provider.current?.disconnect()
      ydoc.current.destroy()
    }
  }, [])

  const executeCode = async () => {
    const code = editorRef.current?.getValue();
    console.log("Run clicked. Code length:", code?.length);
    
    if (!code || code.trim() === "") {
      setOutput("Please enter some code to execute.");
      return;
    }

    setIsExecuting(true);
    setOutput("Executing...");

    try {
      const apiUrl = `${window.location.protocol}//${window.location.hostname}:3002/api/execute`;
      console.log("Fetching from:", apiUrl);
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      console.log("Execution result:", data);
      setOutput(data.output || data.error || "Execution finished with no output.");
    } catch (err: any) {
      console.error("Execution error:", err);
      setOutput(`Failed to connect to execution engine: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  }

  // Keep the ref updated with the latest executeCode function so the keyboard shortcut doesn't capture stale state
  useEffect(() => {
    executeCodeRef.current = executeCode
  }, [executeCode])

  const insertBoilerplate = () => {
    const bp = BOILERPLATES[language];
    if (bp && editorRef.current) {
      editorRef.current.setValue(bp);
    }
  }

  const resetCode = () => {
    if (editorRef.current) {
      editorRef.current.setValue("");
    }
  }

  return (<>
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* Editor Header Bar */}
      <div className="bg-[#111111] border-b border-gray-800 flex items-center px-2 sm:px-4 py-2 justify-between shrink-0 overflow-x-auto gap-2">
        <div className="text-xs sm:text-sm font-medium text-gray-300 whitespace-nowrap">
          Your Buffer
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-gray-300 text-xs rounded-md px-1.5 sm:px-2 py-1.5 outline-none focus:border-indigo-500 transition-colors w-20 sm:w-auto"
          >
            <option value="typescript">TS</option>
            <option value="javascript">JS</option>
            <option value="python">Python</option>
            <option value="go">Go</option>
            <option value="rust">Rust</option>
            <option value="cpp">C++</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
          </select>
          
          <button
            type="button"
            onClick={insertBoilerplate}
            className="flex items-center space-x-1 px-1.5 sm:px-2 py-1.5 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Insert Boilerplate"
          >
            <Code2 size={14} />
          </button>

          {/* GitHub Import */}
          <button
            type="button"
            onClick={() => setShowGitHub(true)}
            className="flex items-center space-x-1 px-1.5 sm:px-2 py-1.5 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            title="Import from GitHub"
          >
            <GitBranch size={14} />
          </button>
          
          <button
            type="button"
            onClick={resetCode}
            className="flex items-center space-x-1 px-1.5 sm:px-2 py-1.5 rounded-md text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors border-r border-gray-800 pr-2 sm:pr-4"
            title="Reset Code"
          >
            <RotateCcw size={14} />
          </button>

          {/* ── Stopwatch ── Start / Pause / Reset */}
          <div className="flex items-center space-x-1 shrink-0">
            {/* Start / Pause toggle */}
            <button
              type="button"
              onClick={() => setTimerStatus(s => s === 'running' ? 'paused' : 'running')}
              className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                timerStatus === 'running'
                  ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-900/80'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
              title={timerStatus === 'running' ? 'Pause Timer' : timerStatus === 'paused' ? 'Resume Timer' : 'Start Timer'}
            >
              {timerStatus === 'running' ? <Pause size={14} /> : <Timer size={14} />}
              <span className={timerStatus !== 'idle' ? 'inline' : 'hidden sm:inline'}>
                {formatTime(timerSeconds)}
              </span>
            </button>

            {/* Reset — only shown when timer has been used */}
            {timerSeconds > 0 && (
              <button
                type="button"
                onClick={() => { setTimerStatus('idle'); setTimerSeconds(0) }}
                className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-900/30 transition-colors"
                title="Reset Timer"
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={saveCurrentFile}
            disabled={isSaving || !activeTab}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm shrink-0 ${
              isSaving ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500 text-white"
            }`}
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save"}</span>
          </button>
          
          <button
            type="button"
            onClick={executeCode}
            disabled={isExecuting}
            className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm shrink-0 ${
              isExecuting ? "bg-gray-700 text-gray-500 cursor-not-allowed" : "bg-green-600 hover:bg-green-500 text-white"
            }`}
          >
            <Play size={14} />
            <span className="hidden sm:inline">{isExecuting ? "Running..." : "Run"}</span>
          </button>
        </div>
      </div>

      {/* FileTabs */}
      <FileTabs />

      <div className="flex-1 flex overflow-hidden">
        {/* File Tree Sidebar */}
        <div className="shrink-0 border-r border-gray-800 overflow-hidden" style={{ width: 160 }}>
          <FileTree roomId={roomDbId} />
        </div>

        {/* Main Private Editor and Output */}
        <div className={`flex flex-col relative overflow-hidden ${stagingBufferCode ? 'hidden' : 'flex'}`}
          style={{ flex: 1, minWidth: 0 }}
        >
          <PanelGroup orientation="vertical">
            <Panel defaultSize={70} minSize={30} className="relative min-h-0 flex flex-col">
              <div 
                className="h-full w-full" 
                onMouseDownCapture={(e) => {
                  if (e.altKey) {
                    e.stopPropagation()
                  }
                }}
              >
                <Editor
                  height="100%"
                  path={activeTab
                  ? `file://${activeTab.id}`
                  : `file.${language === 'typescript' ? 'ts' : language === 'javascript' ? 'js' : language}`
                }
                language={activeTab ? activeTab.language : language}
                theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'on',
                    padding: { top: 16 },
                    scrollBeyondLastLine: false,
                    multiCursorModifier: 'ctrlCmd',
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
                    fontLigatures: true,
                    smoothScrolling: true,
                    cursorBlinking: 'smooth',
                    cursorSmoothCaretAnimation: 'on',
                    formatOnPaste: true,
                  }}
                onMount={handleEditorMount}
                onChange={(value) => {
                  if (!activeTab || value === undefined) return
                  updateTabContent(activeTab.id, value)
                  // Debounced auto-save to DB
                  if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
                  saveTimerRef.current = setTimeout(async () => {
                    await fetch('/api/files', {
                      method:  'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body:    JSON.stringify({ id: activeTab.id, content: value }),
                    })
                    markTabSaved(activeTab.id)
                  }, 1500)
                }}
              />
              </div>
            </Panel>
            
            <PanelResizeHandle className="h-2 bg-[#0a0a0a] border-y border-gray-800 flex items-center justify-center cursor-row-resize hover:bg-indigo-900/50 transition-colors z-50">
              <div className="w-8 h-1 bg-gray-600 rounded-full" />
            </PanelResizeHandle>

            {/* Terminal Output Panel */}
            <Panel defaultSize={30} minSize={10} className="bg-[#0a0a0a] flex flex-col relative z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
              <div className="flex items-center justify-between px-4 py-2 bg-[#111111] border-b border-gray-800 shrink-0">
                <div className="flex items-center space-x-2 text-xs font-semibold text-gray-400">
                  <Terminal size={14} />
                  <span>Output</span>
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-sm text-gray-300 whitespace-pre-wrap">
                {output || "Ready. Click 'Run' to execute code."}
              </div>
            </Panel>
          </PanelGroup>
        </div>

      {/* Staging Buffer (Diff View) */}
      {stagingBufferCode && (
        <div className="flex-1 flex flex-col border-l border-gray-700">
          <div className="flex justify-between items-center bg-gray-800 px-4 py-2">
            <span className="text-sm font-semibold text-yellow-500">Incoming Sync (Staging)</span>
            <div className="space-x-2">
              <button 
                onClick={() => setStagingBuffer(null)}
                className="px-3 py-1 text-xs bg-red-900 text-red-100 rounded hover:bg-red-800"
              >
                Reject
              </button>
              <button 
                onClick={() => {
                  // Apply staging code to main editor
                  editorRef.current?.setValue(stagingBufferCode)
                  setStagingBuffer(null)
                }}
                className="px-3 py-1 text-xs bg-green-900 text-green-100 rounded hover:bg-green-800"
              >
                Commit to Buffer
              </button>
            </div>
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="typescript"
              theme="vs-dark"
              value={stagingBufferCode}
              options={{
                readOnly: true,
                minimap: { enabled: false }
              }}
            />
          </div>
        </div>
      )}

      {/* Overlay View (Ghost Mode) */}
      {activeOverlayUserId && (
        <div className="flex-1 border-l border-indigo-900/50 flex flex-col relative">
          <div className="flex justify-between items-center px-4 py-2 bg-indigo-900/20 text-indigo-300 text-xs border-b border-indigo-900/50 z-10">
            <span>Viewing User: {activeOverlayUserId} (Ghost Mode)</span>
            <button 
              onClick={() => setOverlayUser(null)}
              className="px-2 py-1 bg-indigo-900/40 hover:bg-indigo-900/60 rounded text-indigo-200 pointer-events-auto"
            >
              Close
            </button>
          </div>
          <div className="flex-1 relative z-0 pointer-events-none opacity-80">
            <GhostEditor roomId={roomId} targetUserId={activeOverlayUserId} />
          </div>
        </div>
      )}
      </div>
    </div>

    {/* GitHub Import Modal */}
    {showGitHub && (
      <GitHubImportModal
        onClose={() => setShowGitHub(false)}
        onImport={(code, language, _filename) => {
          editorRef.current?.setValue(code)
          setLanguage(language)
        }}
      />
    )}
  </>)
}
