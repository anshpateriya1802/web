"use client"

import React, { useEffect, useRef, useState } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { MonacoBinding } from 'y-monaco'

interface GhostEditorProps {
  roomId: string;
  targetUserId: string;
}

export default function GhostEditor({ roomId, targetUserId }: GhostEditorProps) {
  const editorRef = useRef<any>(null)
  const ydoc = useRef(new Y.Doc())
  const provider = useRef<WebsocketProvider | null>(null)
  const binding = useRef<MonacoBinding | null>(null)
  const [targetViewport, setTargetViewport] = useState({ top: 0, left: 0 })

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Connect to the target user's document
    provider.current = new WebsocketProvider(
      'ws://localhost:3002',
      `room:${roomId}:user:${targetUserId}`,
      ydoc.current
    )

    const type = ydoc.current.getText('monaco')

    // Bind Monaco editor to Yjs document
    binding.current = new MonacoBinding(
      type,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.current.awareness
    )

    // Listen for awareness changes (specifically viewport for visual anchors)
    provider.current.awareness.on('change', () => {
      const states = provider.current?.awareness.getStates()
      if (!states) return
      
      states.forEach((state: any, clientId: number) => {
        // Find the target user's awareness state (not our own read-only ghost connection)
        if (state.viewport) {
          // If they scrolled, we scroll our read-only view to match! (Visual Anchors)
          editor.setScrollTop(state.viewport.scrollTop)
          editor.setScrollLeft(state.viewport.scrollLeft)
        }
      })
    })
  }

  useEffect(() => {
    return () => {
      binding.current?.destroy()
      provider.current?.disconnect()
      ydoc.current.destroy()
    }
  }, [targetUserId, roomId])

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          padding: { top: 16 }
        }}
        onMount={handleEditorMount}
      />
    </div>
  )
}
