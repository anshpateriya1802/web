"use client"

import { useRoomStore } from '@/stores/roomStore'
import { useState } from 'react'
import { Copy, Check, PenTool, ArrowLeft, FileText, Sparkles } from 'lucide-react'
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
    isAIPanelOpen, toggleAIPanel,
  } = useRoomStore()

  const [copied, setCopied] = useState(false)
  const otherParticipants = participants.filter(p => p.userId !== currentUserId)

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Collapsed sidebar (problem panel open) ──
  if (isProblemOpen) {
    return (
      <aside className="w-14 border-r border-gray-800 bg-[#111111] flex flex-col items-center py-4 space-y-6 shrink-0">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors" title="Back to Dashboard">
          <ArrowLeft size={18} />
        </Link>
        <div className="w-8 h-px bg-gray-800" />
        <button onClick={toggleProblem}
          className="p-2 bg-indigo-600/20 text-indigo-400 rounded-md hover:bg-indigo-600/40 transition-colors"
          title="Close Problem Panel">
          <FileText size={18} />
        </button>
        <button onClick={toggleAIPanel}
          className={`p-2 rounded-md transition-colors ${isAIPanelOpen ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Toggle AI Assistant">
          <Sparkles size={18} />
        </button>
        <button onClick={toggleWhiteboard}
          className={`p-2 rounded-md transition-colors ${isWhiteboardOpen ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          title="Toggle Whiteboard">
          <PenTool size={18} />
        </button>
      </aside>
    )
  }

  // ── Full sidebar ──
  return (
    <aside className="w-56 border-r border-gray-800 bg-[#111111] flex flex-col shrink-0">

      {/* Header */}
      <div className="px-3 py-3 border-b border-gray-800 flex items-center gap-2">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors shrink-0" title="Back">
          <ArrowLeft size={16} />
        </Link>
        <span className="text-sm font-semibold text-white truncate flex-1">{roomId.slice(0, 8)}</span>
        <button onClick={handleCopyLink}
          className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors shrink-0"
          title="Copy invite link">
          {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
        </button>
      </div>

      {/* Workspace tools */}
      <div className="px-3 py-3 border-b border-gray-800 space-y-1.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-2">Tools</p>
        <button onClick={toggleProblem}
          className={`w-full py-1.5 px-2.5 text-xs rounded-md transition-colors flex items-center gap-2 ${
            isProblemOpen ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
          <FileText size={13} />
          <span>{isProblemOpen ? 'Hide Problem' : 'Problem Panel'}</span>
        </button>
        <button onClick={toggleAIPanel}
          className={`w-full py-1.5 px-2.5 text-xs rounded-md transition-colors flex items-center gap-2 ${
            isAIPanelOpen ? 'bg-purple-600/20 text-purple-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
          <Sparkles size={13} />
          <span>{isAIPanelOpen ? 'Hide AI Assistant' : 'AI Assistant'}</span>
        </button>
        <button onClick={toggleWhiteboard}
          className={`w-full py-1.5 px-2.5 text-xs rounded-md transition-colors flex items-center gap-2 ${
            isWhiteboardOpen ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
          }`}>
          <PenTool size={13} />
          <span>{isWhiteboardOpen ? 'Hide Whiteboard' : 'Whiteboard'}</span>
        </button>
      </div>

      {/* Participants */}
      <div className="px-3 py-3 flex-1 overflow-y-auto">
        <p className="text-[9px] font-bold uppercase tracking-widest text-gray-600 mb-3">Participants</p>
        <ul className="space-y-2.5">
          <li className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs text-white truncate">{currentUserEmail}</span>
            <span className="text-[10px] text-gray-600 shrink-0">(you)</span>
          </li>
          {otherParticipants.map((p, idx) => (
            <li key={idx} className="space-y-1.5 pt-1.5 border-t border-gray-800/50">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                <span className="text-xs text-gray-300 truncate">{p.name}</span>
              </div>
              <div className="flex gap-1.5 pl-3.5">
                <button
                  onClick={() => setOverlayUser(p.userId)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    activeOverlayUserId === p.userId
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {activeOverlayUserId === p.userId ? 'Ghosting' : 'Ghost'}
                </button>
                <button
                  onClick={() => { const b = useRoomStore.getState().broadcastSyncAction; if (b) b(p.userId) }}
                  className="px-2 py-0.5 text-[10px] font-bold rounded bg-gray-800 text-green-400 hover:bg-green-900/50"
                >
                  Push
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Voice Channel */}
      <div className="px-3 py-3 border-t border-gray-800">
        <ClientVoiceChannel roomId={roomId} userId={currentUserId} />
      </div>
    </aside>
  )
}
