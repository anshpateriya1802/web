"use client"

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRoomStore, RoomFile, OpenFile } from '@/stores/roomStore'
import {
  FilePlus, FolderPlus, RefreshCw, ChevronsUpDown,
  Folder, FolderOpen, File, Trash2, Edit2, Check, X, Loader2, ChevronRight, ChevronDown, AlertCircle,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────
interface TreeNode {
  type:     'file' | 'dir'
  name:     string      // display name (last path segment)
  path:     string      // full path from root
  file?:    RoomFile    // only for type=file
  children: TreeNode[]
}

// ── Path → Tree builder ────────────────────────────────────────────────────────
function buildTree(files: RoomFile[]): TreeNode[] {
  const root: TreeNode[] = []

  for (const file of files) {
    const isGitkeep = file.name.endsWith('/.gitkeep') || file.name === '.gitkeep'
    let parts = file.name.split('/').filter(Boolean)
    
    if (isGitkeep) {
      parts = parts.slice(0, -1) // remove .gitkeep from the tree logic
    }
    
    if (parts.length === 0) continue // was just .gitkeep at root, skip creating a node for it

    let nodes = root

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i]
      const path = parts.slice(0, i + 1).join('/')
      const isLast = i === parts.length - 1

      if (isLast && !isGitkeep) {
        nodes.push({ type: 'file', name, path, file, children: [] })
      } else {
        let dir = nodes.find(n => n.type === 'dir' && n.name === name)
        if (!dir) {
          dir = { type: 'dir', name, path, children: [] }
          nodes.push(dir)
        }
        nodes = dir.children
      }
    }
  }

  // Sort: dirs first, then files, both alphabetically
  const sortNodes = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .map(n => ({ ...n, children: sortNodes(n.children) }))
      .sort((a, b) => {
        if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
        return a.name.localeCompare(b.name)
      })

  return sortNodes(root)
}

// ── Language dot color ─────────────────────────────────────────────────────────
function langColor(language: string): string {
  const m: Record<string, string> = {
    typescript: '#3b82f6', javascript: '#f59e0b', python: '#22c55e',
    go: '#06b6d4', rust: '#f97316', cpp: '#a855f7', html: '#ef4444',
    css: '#ec4899', json: '#84cc16', markdown: '#94a3b8', sql: '#f59e0b',
  }
  return m[language] || '#6b7280'
}

// ── Inline renamer input ───────────────────────────────────────────────────────
function InlineInput({
  initial, placeholder, onConfirm, onCancel,
}: { initial: string; placeholder: string; onConfirm: (v: string) => void; onCancel: () => void }) {
  const [val, setVal] = useState(initial)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  return (
    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={e => e.stopPropagation()}>
      <input
        ref={ref}
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter')  { e.preventDefault(); onConfirm(val) }
          if (e.key === 'Escape') { e.preventDefault(); onCancel() }
        }}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-[#1e1e1e] border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white placeholder-gray-600 focus:outline-none"
      />
      <button onClick={() => onConfirm(val)} className="text-green-400 hover:text-green-300 shrink-0"><Check size={11} /></button>
      <button onClick={onCancel}             className="text-gray-500 hover:text-gray-300 shrink-0"><X size={11} /></button>
    </div>
  )
}

// ── Tree Node renderer ─────────────────────────────────────────────────────────
function TreeNodeRow({
  node, depth, activeFileId, allOpen,
  onOpenFile, onRenameFile, onDeleteFile, onDeleteFolder,
  creatingState, onCreateFile, onCreateFolder, onCancelCreate,
}: {
  node:           TreeNode
  depth:          number
  activeFileId:   string | null
  allOpen:        boolean
  onOpenFile:     (file: RoomFile) => void
  onRenameFile:   (id: string, newName: string) => void
  onDeleteFile:   (id: string) => void
  onDeleteFolder: (path: string) => void
  creatingState:  CreatingState
  onCreateFile:   (parentPath: string, name?: string) => void
  onCreateFolder: (parentPath: string, name?: string) => void
  onCancelCreate: () => void
}) {
  const [open,      setOpen]      = useState(true)
  const [renaming,  setRenaming]  = useState(false)
  const [hovered,   setHovered]   = useState(false)

  // Collapse all support
  useEffect(() => { if (!allOpen) setOpen(false) }, [allOpen])

  const indent = depth * 12

  if (node.type === 'file') {
    const isActive = node.file?.id === activeFileId
    return (
      <div
        className={`group flex items-center gap-1.5 py-0.5 pr-2 cursor-pointer rounded-sm transition-colors ${
          isActive ? 'bg-[#2d2d2d]' : 'hover:bg-[#1e1e1e]'
        } ${isActive ? 'text-white' : 'text-gray-400'}`}
        style={{ paddingLeft: `${8 + indent}px` }}
        onClick={() => !renaming && node.file && onOpenFile(node.file)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: langColor(node.file?.language || '') }} />

        {renaming ? (
          <InlineInput
            initial={node.name}
            placeholder="filename"
            onConfirm={v => { if (node.file) onRenameFile(node.file.id, v); setRenaming(false) }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <>
            <span className="text-xs truncate flex-1 min-w-0" title={node.name}>{node.name}</span>
            {hovered && (
              <div className="flex items-center gap-0.5 shrink-0 ml-auto">
                <button
                  onClick={e => { e.stopPropagation(); setRenaming(true) }}
                  className="p-0.5 text-gray-600 hover:text-indigo-400 rounded"
                  title="Rename"
                ><Edit2 size={10} /></button>
                <button
                  onClick={e => { e.stopPropagation(); node.file && onDeleteFile(node.file.id) }}
                  className="p-0.5 text-gray-600 hover:text-red-400 rounded"
                  title="Delete"
                ><Trash2 size={10} /></button>
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  // Directory
  return (
    <div>
      <div
        className="group flex items-center gap-1 py-0.5 pr-2 cursor-pointer hover:bg-[#1e1e1e] rounded-sm text-gray-300"
        style={{ paddingLeft: `${4 + indent}px` }}
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {open
          ? <ChevronDown size={12} className="text-gray-600 shrink-0" />
          : <ChevronRight size={12} className="text-gray-600 shrink-0" />
        }
        {open
          ? <FolderOpen size={13} color="#fbbf24" className="shrink-0" />
          : <Folder     size={13} color="#fbbf24" className="shrink-0" />
        }
        <span className="text-xs font-medium truncate flex-1 min-w-0" title={node.name}>{node.name}</span>
        {hovered && (
          <div className="flex items-center gap-0.5 ml-auto shrink-0">
            <button
              onClick={e => { e.stopPropagation(); onCreateFile(node.path) }}
              className="p-0.5 text-gray-600 hover:text-indigo-400 rounded" title="New file here"
            ><FilePlus size={10} /></button>
            <button
              onClick={e => { e.stopPropagation(); onCreateFolder(node.path) }}
              className="p-0.5 text-gray-600 hover:text-yellow-400 rounded" title="New folder here"
            ><FolderPlus size={10} /></button>
            <button
              onClick={e => { e.stopPropagation(); onDeleteFolder(node.path) }}
              className="p-0.5 text-gray-600 hover:text-red-400 rounded" title="Delete folder"
            ><Trash2 size={10} /></button>
          </div>
        )}
      </div>

      {open && (
        <div>
          {node.children.map(child => (
            <TreeNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              activeFileId={activeFileId}
              allOpen={allOpen}
              onOpenFile={onOpenFile}
              onRenameFile={onRenameFile}
              onDeleteFile={onDeleteFile}
              onDeleteFolder={onDeleteFolder}
              creatingState={creatingState}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onCancelCreate={onCancelCreate}
            />
          ))}
          {/* Inline new-file/folder input inside this dir */}
          {creatingState?.parentPath === node.path && (
            <div className="pl-8 pr-2 py-0.5">
              <InlineInput
                initial=""
                placeholder={creatingState.mode === 'folder' ? 'folder-name' : 'filename.ts'}
                onConfirm={v => {
                  if (creatingState.mode === 'folder') onCreateFolder(node.path, v)
                  else onCreateFile(node.path, v)
                }}
                onCancel={onCancelCreate}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main FileTree ──────────────────────────────────────────────────────────────
interface FileTreeProps { roomId: string }

// Simple creation state again
type CreatingState = null | { parentPath: string; mode: 'file' | 'folder' }

export default function FileTree({ roomId }: FileTreeProps) {
  const { files, setFiles, openFile, activeFileId, setActiveFile, openTabs, closeTab } = useRoomStore()

  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [creating,  setCreating]  = useState<CreatingState>(null)
  const [collapseAll, setCollapseAll] = useState(false)

  const tree = buildTree(files)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/files?roomId=${encodeURIComponent(roomId)}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || `Error ${res.status}`); return }
      if (Array.isArray(data)) setFiles(data)
    } catch (e: any) {
      setError(e.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [roomId])

  useEffect(() => { loadFiles() }, [loadFiles])

  // Open a file: fetch content then push to store
  const handleOpenFile = async (file: RoomFile) => {
    const alreadyOpen = openTabs.find(t => t.id === file.id)
    if (alreadyOpen) { setActiveFile(file.id); return }
    try {
      const res  = await fetch(`/api/files/content?id=${file.id}`)
      const data = await res.json()
      if (data.content !== undefined) {
        openFile({ ...file, content: data.content, isDirty: false } as OpenFile)
      }
    } catch {}
  }

  // Create file (or folder placeholder .gitkeep)
  const handleCreate = async (parentPath: string, rawName: string, mode: 'file' | 'folder') => {
    const name = rawName.trim()
    if (!name) { setCreating(null); return }

    const fullPath = parentPath ? `${parentPath}/${name}${mode === 'folder' ? '/.gitkeep' : ''}` : (mode === 'folder' ? `${name}/.gitkeep` : name)

    try {
      const res  = await fetch('/api/files', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ roomId, name: fullPath }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to create'); return }
      if (data.id && mode === 'file') {
        await loadFiles()
        openFile({ id: data.id, name: data.name, language: data.language, updatedAt: data.updatedAt, content: '', isDirty: false })
      } else {
        await loadFiles()
      }
    } catch (e: any) {
      setError(e.message)
    }
    setCreating(null)
  }



  // Rename
  const handleRename = async (id: string, newName: string) => {
    if (!newName.trim()) return
    try {
      await fetch('/api/files', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id, name: newName.trim() }),
      })
      await loadFiles()
    } catch {}
  }

  // Delete file
  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/files?id=${id}`, { method: 'DELETE' })
      closeTab(id)
      await loadFiles()
    } catch {}
  }

  // Delete folder
  const handleDeleteFolder = async (path: string) => {
    try {
      await fetch(`/api/files?roomId=${encodeURIComponent(roomId)}&path=${encodeURIComponent(path)}`, { method: 'DELETE' })
      // Close any tabs that were inside this folder
      const tabsToClose = openTabs.filter(t => t.name.startsWith(`${path}/`))
      tabsToClose.forEach(t => closeTab(t.id))
      await loadFiles()
    } catch {}
  }

  const triggerCollapseAll = () => {
    setCollapseAll(true)
    setTimeout(() => setCollapseAll(false), 100)
  }

  return (
    <div className="flex flex-col h-full select-none" style={{ background: '#111111' }}>
      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#1e1e1e] shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-600">Explorer</span>
        <div className="flex items-center">
          <button
            onClick={() => setCreating({ parentPath: '', mode: 'file' })}
            className="p-1 text-gray-600 hover:text-gray-200 rounded transition-colors"
            title="New File (Ctrl+N)"
          ><FilePlus size={13} /></button>
          <button
            onClick={() => setCreating({ parentPath: '', mode: 'folder' })}
            className="p-1 text-gray-600 hover:text-yellow-400 rounded transition-colors"
            title="New Folder"
          ><FolderPlus size={13} /></button>
          <button
            onClick={loadFiles}
            className="p-1 text-gray-600 hover:text-gray-200 rounded transition-colors"
            title="Refresh Explorer"
          ><RefreshCw size={12} className={loading ? 'animate-spin' : ''} /></button>
          <button
            onClick={triggerCollapseAll}
            className="p-1 text-gray-600 hover:text-gray-200 rounded transition-colors"
            title="Collapse All"
          ><ChevronsUpDown size={12} /></button>
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="flex items-start gap-2 px-2 py-1.5 bg-red-900/20 border-b border-red-900/30 shrink-0">
          <AlertCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-red-300 leading-snug break-all">{error}</p>
        </div>
      )}

      {/* ── Root create input ── */}
      {creating && creating.parentPath === '' && (
        <div className="px-2 py-1 border-b border-[#1e1e1e] shrink-0">
          <InlineInput
            initial=""
            placeholder={creating.mode === 'folder' ? 'folder-name' : 'filename.py'}
            onConfirm={v => handleCreate('', v, creating.mode)}
            onCancel={() => setCreating(null)}
          />
        </div>
      )}

      {/* ── Tree body ── */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && files.length === 0 && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 size={13} className="animate-spin text-gray-600" />
            <span className="text-[11px] text-gray-600">Loading…</span>
          </div>
        )}

        {!loading && files.length === 0 && !error && (
          <div className="text-center py-8 px-3">
            <File size={18} className="mx-auto text-gray-700 mb-2" />
            <p className="text-[11px] text-gray-600 mb-2">No files yet</p>
            <button
              onClick={() => setCreating({ parentPath: '', mode: 'file' })}
              className="text-[11px] text-indigo-500 hover:text-indigo-400"
            >+ New File</button>
          </div>
        )}

        {tree.map(node => (
          <TreeNodeRow
            key={node.path}
            node={node}
            depth={0}
            activeFileId={activeFileId}
            allOpen={!collapseAll}
            onOpenFile={handleOpenFile}
            onRenameFile={handleRename}
            onDeleteFile={handleDelete}
            onDeleteFolder={handleDeleteFolder}
            creatingState={creating}
            onCreateFile={(parentPath, name) => {
              if (name) handleCreate(parentPath, name, 'file')
              else setCreating({ parentPath, mode: 'file' })
            }}
            onCreateFolder={(parentPath, name) => {
              if (name) handleCreate(parentPath, name, 'folder')
              else setCreating({ parentPath, mode: 'folder' })
            }}
            onCancelCreate={() => setCreating(null)}
          />
        ))}
      </div>
    </div>
  )
}
