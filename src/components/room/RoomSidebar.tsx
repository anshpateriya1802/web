"use client"

import { useRoomStore } from '@/stores/roomStore'
import { useState } from 'react'
import { Copy, Check, PenTool, ArrowLeft, FileText } from 'lucide-react'
import Link from 'next/link'
import ClientVoiceChannel from './ClientVoiceChannel'

interface RoomSidebarProps {
  roomId: string;
  currentUserId: string;
  currentUserEmail: string;
}

export default function RoomSidebar({ roomId, currentUserId, currentUserEmail }: RoomSidebarProps) {
  const {
    participants, activeOverlayUserId, setOverlayUser,
    isWhiteboardOpen, toggleWhiteboard,
    isProblemOpen, toggleProblem,
  } = useRoomStore()

  const [copied, setCopied] = useState(false)
  const otherParticipants = participants.filter(p => p.userId !== currentUserId)

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Collapsed sidebar (when problem panel is open) ──
  if (isProblemOpen) {
    return (
      <aside className="w-14 border-r border-gray-800 bg-[#111111] flex flex-col items-center py-4 space-y-6 shrink-0">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors" title="Back to Dashboard">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-8 h-px bg-gray-800" />
        <button
          onClick={toggleProblem}
          className="p-2 bg-indigo-600/20 text-indigo-400 rounded-md hover:bg-indigo-600/40 transition-colors"
          title="Close Problem Panel"
        >
          <FileText size={18} />
        </button>
        <button
          onClick={toggleWhiteboard}
          className={`p-2 rounded-md transition-colors ${isWhiteboardOpen ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Toggle Whiteboard"
        >
          <PenTool size={18} />
        </button>
      </aside>
    )
  }

  // ── Full sidebar ──
  return (
    <aside className="w-64 border-r border-gray-800 bg-[#111111] flex flex-col shrink-0">
      <div className="p-4 border-b border-gray-800 flex items-center space-x-2">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h2 className="font-bold truncate text-white" title={roomId}>Room: {roomId.slice(0, 8)}</h2>
      </div>

      <div className="p-4 border-b border-gray-800">
        <button
          onClick={handleCopyLink}
          className="w-full py-2 px-3 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded-md transition-colors flex items-center justify-center space-x-2"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          <span>{copied ? "Copied!" : "Copy Invite Link"}</span>
        </button>
      </div>

      <div className="p-4 border-b border-gray-800 space-y-2">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Workspace Tools</h3>
        <button
          onClick={toggleProblem}
          className={`w-full py-2 px-3 text-xs rounded-md transition-colors flex items-center justify-center space-x-2 ${
            isProblemOpen ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <FileText size={14} />
          <span>{isProblemOpen ? "Hide Problem" : "Open Problem"}</span>
        </button>
        <button
          onClick={toggleWhiteboard}
          className={`w-full py-2 px-3 text-xs rounded-md transition-colors flex items-center justify-center space-x-2 ${
            isWhiteboardOpen ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <PenTool size={14} />
          <span>{isWhiteboardOpen ? "Hide Whiteboard" : "Open Whiteboard"}</span>
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Participants</h3>
        <ul className="space-y-4">
          <li className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-white">{currentUserEmail} (You)</span>
            </div>
          </li>
          {otherParticipants.map((p, idx) => (
            <li key={idx} className="flex flex-col space-y-2 border-t border-gray-800/50 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-sm text-gray-300">{p.name}</span>
                </div>
              </div>
              <div className="flex space-x-2 pl-5">
                <button
                  onClick={() => setOverlayUser(p.userId)}
                  className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${
                    activeOverlayUserId === p.userId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {activeOverlayUserId === p.userId ? 'Viewing Ghost' : 'View Ghost'}
                </button>
                <button
                  onClick={() => {
                    const broadcast = useRoomStore.getState().broadcastSyncAction
                    if (broadcast) broadcast(p.userId)
                  }}
                  className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-gray-800 text-green-400 hover:bg-green-900/50 hover:text-green-300"
                >
                  Push Code
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Voice Channel */}
      <div className="p-4 border-t border-gray-800">
        <ClientVoiceChannel roomId={roomId} userId={currentUserId} />
      </div>

      {/* Request Sync footer */}
      <div className="p-4 border-t border-gray-800">
        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-sm font-medium rounded transition-colors shadow-[0_0_15px_-3px_rgba(79,70,229,0.4)]">
          Request Sync
        </button>
        <p className="text-[10px] text-gray-500 text-center mt-2">
          Pushes your buffer to a collaborator
        </p>
      </div>
    </aside>
  )
}
