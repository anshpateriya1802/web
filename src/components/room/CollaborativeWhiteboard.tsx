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
    <div className="flex flex-col h-full w-full border border-gray-700 bg-[#1e1e1e] overflow-hidden">
      <div className="flex justify-between items-center bg-[#111111] px-4 py-2 border-b border-gray-800 z-10 shrink-0">
        <span className="text-sm font-semibold text-blue-400">Architecture Whiteboard</span>
        <button 
          onClick={toggleWhiteboard}
          className="px-3 py-1 text-xs bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition-colors"
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
