"use client"

import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'
import { useRoomStore } from '@/stores/roomStore'

interface CollaborativeWhiteboardProps {
  roomId: string;
}

export default function CollaborativeWhiteboard({ roomId }: CollaborativeWhiteboardProps) {
  const { isWhiteboardOpen, toggleWhiteboard } = useRoomStore()

  if (!isWhiteboardOpen) return null

  // In a full implementation, we would sync Tldraw state using a Yjs provider.
  // For now, this is a local scratchpad to verify the V2 UI layout.
  
  return (
    <div
      style={{ background: 'var(--cr-bg-base)', borderColor: 'var(--cr-border)' }}
      className="flex flex-col h-full w-full border overflow-hidden"
    >
      <div
        style={{ background: 'var(--cr-bg-surface)', borderColor: 'var(--cr-border)' }}
        className="flex justify-between items-center px-4 py-2 border-b z-10 shrink-0"
      >
        <span className="text-sm font-semibold text-blue-400">Architecture Whiteboard</span>
        <button
          onClick={toggleWhiteboard}
          style={{ background: 'var(--cr-bg-elevated)', color: 'var(--cr-text-secondary)' }}
          className="px-3 py-1 text-xs rounded hover:brightness-110 transition-colors"
        >
          Close Whiteboard
        </button>
      </div>
      <div className="flex-1 relative z-0">
        <Tldraw persistenceKey={`tldraw-room-${roomId}`} />
      </div>
    </div>
  )
}
