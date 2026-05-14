"use client"

import { useState, useEffect, useRef } from 'react'
import { useRoomStore, RoomFile, OpenFile } from '@/stores/roomStore'
import {
  FilePlus, Trash2, Edit2, File, Loader2, Check, X, RefreshCw,
} from 'lucide-react'

// Icon color by language
function fileColor(language: string): string {
  const map: Record<string, string> = {
    typescript: '#3b82f6', javascript: '#f59e0b', python: '#22c55e',
    go: '#06b6d4', rust: '#f97316', cpp: '#a855f7', html: '#ef4444',
    css: '#ec4899', json: '#84cc16', markdown: '#94a3b8', sql: '#f59e0b',
  }
  return map[language] || '#6b7280'
}

interface FileTreeProps {
  roomId: string
}

export default function FileTree({ roomId }: FileTreeProps) {
  const { files, setFiles, openFile, activeFileId, setActiveFile, openTabs } = useRoomStore()
  const [loading,     setLoading]     = useState(false)
  const [creating,    setCreating]    = useState(false)
  const [newName,     setNewName]     = useState('')
  const [renamingId,  setRenamingId]  = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const newInputRef    = useRef<HTMLInputElement>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)

  // Load file list
  const loadFiles = async () => {
    setLoading(true)
    try {
      const res  = await fetch(`/api/files?roomId=${roomId}`)
      const data = await res.json()
      if (Array.isArray(data)) setFiles(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFiles() }, [roomId])
  useEffect(() => { if (creating)  newInputRef.current?.focus()    }, [creating])
  useEffect(() => { if (renamingId) renameInputRef.current?.focus() }, [renamingId])

  // Open file: fetch content then push to store
  const handleOpen = async (file: RoomFile) => {
    const alreadyOpen = openTabs.find(t => t.id === file.id)
    if (alreadyOpen) { setActiveFile(file.id); return }

    const res  = await fetch(`/api/files/content?id=${file.id}`)
    const data = await res.json()
    if (data.content !== undefined) {
      openFile({ ...file, content: data.content, isDirty: false } as OpenFile)
    }
  }

  // Create new file
  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) { setCreating(false); return }

    const res  = await fetch('/api/files', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ roomId, name }),
    })
    const data = await res.json()
    if (data.id) {
      await loadFiles()
      openFile({ id: data.id, name: data.name, language: data.language, updatedAt: data.updatedAt, content: '', isDirty: false })
    }
    setNewName('')
    setCreating(false)
  }

  // Rename
  const handleRename = async (id: string) => {
    const name = renameValue.trim()
    if (!name) { setRenamingId(null); return }

    await fetch('/api/files', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, name }),
    })
    await loadFiles()
    setRenamingId(null)
  }

  // Delete
  const handleDelete = async (id: string) => {
    await fetch(`/api/files?id=${id}`, { method: 'DELETE' })
    useRoomStore.getState().closeTab(id)
    await loadFiles()
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0d' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-800 shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Files</span>
        <div className="flex items-center gap-1">
          <button
            onClick={loadFiles}
            className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw size={11} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setCreating(true)}
            className="p-1 text-gray-600 hover:text-indigo-400 rounded transition-colors"
            title="New file"
          >
            <FilePlus size={13} />
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto py-1">
        {loading && files.length === 0 && (
          <div className="flex items-center justify-center py-6">
            <Loader2 size={14} className="animate-spin text-gray-600" />
          </div>
        )}

        {!loading && files.length === 0 && !creating && (
          <div className="text-center py-6 px-3">
            <File size={20} className="mx-auto text-gray-700 mb-2" />
            <p className="text-[11px] text-gray-600">No files yet</p>
            <button
              onClick={() => setCreating(true)}
              className="mt-2 text-[11px] text-indigo-500 hover:text-indigo-400"
            >
              + New file
            </button>
          </div>
        )}

        {files.map(file => {
          const isActive  = activeFileId === file.id
          const isRenaming = renamingId === file.id

          return (
            <div
              key={file.id}
              onClick={() => !isRenaming && handleOpen(file)}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-indigo-900/20 border-l-2 border-indigo-500'
                  : 'hover:bg-gray-800/40 border-l-2 border-transparent'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: fileColor(file.language) }}
              />

              {isRenaming ? (
                <div className="flex items-center gap-1 flex-1 min-w-0">
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  handleRename(file.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    onClick={e => e.stopPropagation()}
                    className="flex-1 min-w-0 bg-gray-900 border border-indigo-500 rounded px-1 py-0.5 text-xs text-white focus:outline-none"
                  />
                  <button onClick={e => { e.stopPropagation(); handleRename(file.id) }} className="text-green-400 hover:text-green-300">
                    <Check size={11} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setRenamingId(null) }} className="text-gray-500 hover:text-gray-300">
                    <X size={11} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xs text-gray-300 truncate flex-1 min-w-0" title={file.name}>
                    {file.name}
                  </span>
                  {/* Hover actions */}
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); setRenameValue(file.name); setRenamingId(file.id) }}
                      className="p-0.5 text-gray-600 hover:text-indigo-400 rounded"
                      title="Rename"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(file.id) }}
                      className="p-0.5 text-gray-600 hover:text-red-400 rounded"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* New file input */}
        {creating && (
          <div className="flex items-center gap-2 px-3 py-1.5 border-l-2 border-indigo-500 bg-indigo-900/10">
            <div className="w-2 h-2 rounded-full bg-gray-600 shrink-0" />
            <input
              ref={newInputRef}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter')  handleCreate()
                if (e.key === 'Escape') { setCreating(false); setNewName('') }
              }}
              placeholder="filename.py"
              className="flex-1 min-w-0 bg-transparent border-b border-indigo-500 text-xs text-white placeholder-gray-600 focus:outline-none pb-0.5"
            />
            <button onClick={handleCreate} className="text-green-400 hover:text-green-300 shrink-0">
              <Check size={11} />
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }} className="text-gray-500 hover:text-gray-300 shrink-0">
              <X size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
