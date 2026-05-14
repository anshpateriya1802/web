"use client"

import { useRoomStore, OpenFile } from '@/stores/roomStore'
import { X, Circle } from 'lucide-react'

// Language color dot
const LANG_COLORS: Record<string, string> = {
  typescript: '#3b82f6', javascript: '#f59e0b', python: '#22c55e',
  go: '#06b6d4', rust: '#f97316', cpp: '#a855f7', html: '#ef4444',
  css: '#ec4899', json: '#84cc16', markdown: '#94a3b8',
}

export default function FileTabs() {
  const { openTabs, activeFileId, setActiveFile, closeTab } = useRoomStore()

  if (openTabs.length === 0) return null

  return (
    <div
      className="flex items-center overflow-x-auto shrink-0 border-b border-gray-800"
      style={{ background: '#0a0a0a', scrollbarWidth: 'none' }}
    >
      {openTabs.map((tab: OpenFile) => {
        const isActive = tab.id === activeFileId
        const color    = LANG_COLORS[tab.language] || '#6b7280'

        return (
          <div
            key={tab.id}
            onClick={() => setActiveFile(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer shrink-0 border-r border-gray-800 transition-colors group ${
              isActive
                ? 'bg-[#1e1e1e] border-t-2 border-t-indigo-500'
                : 'bg-[#111111] hover:bg-[#161616] border-t-2 border-t-transparent'
            }`}
            style={{ minWidth: 0 }}
          >
            {/* Language dot */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: color }}
            />

            {/* Filename */}
            <span
              className={`text-xs truncate max-w-[120px] ${isActive ? 'text-white' : 'text-gray-400'}`}
              title={tab.name}
            >
              {tab.name}
            </span>

            {/* Dirty indicator or close button */}
            <div className="relative w-3 h-3 shrink-0 ml-0.5">
              {tab.isDirty && (
                <Circle
                  size={8}
                  className="text-indigo-400 fill-indigo-400 absolute inset-0 m-auto group-hover:opacity-0 transition-opacity"
                />
              )}
              <button
                onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                className={`absolute inset-0 flex items-center justify-center text-gray-600 hover:text-white transition-opacity ${
                  tab.isDirty ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                <X size={11} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
