"use client"

import { useRoomStore } from '@/stores/roomStore'
import { useState } from 'react'
import { Copy, Check, PenTool, ArrowLeft, FileText, Sun, Moon } from 'lucide-react'
import Link from 'next/link'

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
    theme, toggleTheme,
  } = useRoomStore()

  const [copied, setCopied] = useState(false)
  const otherParticipants = participants.filter(p => p.userId !== currentUserId)

  const handleCopyLink = () => {
    const url = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Collapsed sidebar (when problem panel is open) ──────────────────────
  if (isProblemOpen) {
    return (
      <aside
        style={{ background: 'var(--cr-bg-surface)', borderColor: 'var(--cr-border)' }}
        className="w-14 border-r flex flex-col items-center py-4 space-y-5 shrink-0"
      >
        <Link href="/" style={{ color: 'var(--cr-text-secondary)' }} className="hover:text-white transition-colors" title="Back to Dashboard">
          <ArrowLeft size={18} />
        </Link>
        <div style={{ background: 'var(--cr-border)' }} className="w-8 h-px" />
        <button
          onClick={toggleProblem}
          className="p-2 bg-indigo-600/20 text-indigo-400 rounded-md hover:bg-indigo-600/40 transition-colors"
          title="Close Problem Panel"
        >
          <FileText size={18} />
        </button>
        <button
          onClick={toggleWhiteboard}
          style={isWhiteboardOpen ? {} : { color: 'var(--cr-text-secondary)' }}
          className={`p-2 rounded-md transition-colors ${isWhiteboardOpen ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800 hover:text-white'}`}
          title="Toggle Whiteboard"
        >
          <PenTool size={18} />
        </button>

        {/* Theme toggle — compact */}
        <button
          onClick={toggleTheme}
          style={{ color: 'var(--cr-text-secondary)' }}
          className="p-2 rounded-md hover:bg-indigo-600/20 hover:text-indigo-400 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </aside>
    )
  }

  // ── Full sidebar ────────────────────────────────────────────────────────
  return (
    <aside
      style={{ background: 'var(--cr-bg-surface)', borderColor: 'var(--cr-border)', color: 'var(--cr-text-primary)' }}
      className="w-64 border-r flex flex-col shrink-0"
    >
      {/* Header */}
      <div style={{ borderColor: 'var(--cr-border)' }} className="p-4 border-b flex items-center space-x-2">
        <Link href="/" style={{ color: 'var(--cr-text-secondary)' }} className="hover:text-white transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h2 style={{ color: 'var(--cr-text-primary)' }} className="font-bold truncate" title={roomId}>
          Room: {roomId.slice(0, 8)}
        </h2>
      </div>

      {/* Copy Link */}
      <div style={{ borderColor: 'var(--cr-border)' }} className="p-4 border-b">
        <button
          onClick={handleCopyLink}
          style={{ background: 'var(--cr-bg-elevated)', color: 'var(--cr-text-secondary)' }}
          className="w-full py-2 px-3 text-xs rounded-md transition-colors flex items-center justify-center space-x-2 hover:brightness-110"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
          <span>{copied ? "Copied!" : "Copy Invite Link"}</span>
        </button>
      </div>

      {/* Tools */}
      <div style={{ borderColor: 'var(--cr-border)' }} className="p-4 border-b space-y-2">
        <h3 style={{ color: 'var(--cr-text-muted)' }} className="text-xs font-semibold uppercase tracking-wider mb-3">
          Workspace Tools
        </h3>
        <button
          onClick={toggleProblem}
          className={`w-full py-2 px-3 text-xs rounded-md transition-colors flex items-center justify-center space-x-2 ${
            isProblemOpen ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'hover:brightness-110'
          }`}
          style={isProblemOpen ? {} : { background: 'var(--cr-bg-elevated)', color: 'var(--cr-text-secondary)' }}
        >
          <FileText size={14} />
          <span>{isProblemOpen ? "Hide Problem" : "Open Problem"}</span>
        </button>

        <button
          onClick={toggleWhiteboard}
          className={`w-full py-2 px-3 text-xs rounded-md transition-colors flex items-center justify-center space-x-2 ${
            isWhiteboardOpen ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'hover:brightness-110'
          }`}
          style={isWhiteboardOpen ? {} : { background: 'var(--cr-bg-elevated)', color: 'var(--cr-text-secondary)' }}
        >
          <PenTool size={14} />
          <span>{isWhiteboardOpen ? "Hide Whiteboard" : "Open Whiteboard"}</span>
        </button>

        {/* ── Dark / Light Mode Toggle ── */}
        <button
          onClick={toggleTheme}
          className="w-full py-2 px-3 text-xs rounded-md transition-colors flex items-center justify-center space-x-2 hover:brightness-110"
          style={{ background: 'var(--cr-bg-elevated)', color: 'var(--cr-text-secondary)' }}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark'
            ? <><Sun size={14} /><span>Light Mode</span></>
            : <><Moon size={14} /><span>Dark Mode</span></>
          }
        </button>
      </div>

      {/* Participants */}
      <div className="p-4 flex-1 overflow-y-auto">
        <h3 style={{ color: 'var(--cr-text-muted)' }} className="text-xs font-semibold uppercase tracking-wider mb-4">
          Participants
        </h3>
        <ul className="space-y-4">
          <li className="flex flex-col space-y-2">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span style={{ color: 'var(--cr-text-primary)' }} className="text-sm font-medium">
                {currentUserEmail} (You)
              </span>
            </div>
          </li>

          {otherParticipants.map((p, idx) => (
            <li key={idx} style={{ borderColor: 'var(--cr-border)' }} className="flex flex-col space-y-2 border-t pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span style={{ color: 'var(--cr-text-secondary)' }} className="text-sm">{p.name}</span>
                </div>
              </div>
              <div className="flex space-x-2 pl-5">
                <button
                  onClick={() => setOverlayUser(p.userId)}
                  className={`px-2 py-1 text-[10px] uppercase font-bold rounded transition-colors ${
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
                  className="px-2 py-1 text-[10px] uppercase font-bold rounded bg-gray-800 text-green-400 hover:bg-green-900/50 hover:text-green-300 transition-colors"
                >
                  Push Code
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Request Sync */}
      <div style={{ borderColor: 'var(--cr-border)' }} className="p-4 border-t">
        <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-sm font-medium rounded transition-colors shadow-[0_0_15px_-3px_rgba(79,70,229,0.4)]">
          Request Sync
        </button>
        <p style={{ color: 'var(--cr-text-muted)' }} className="text-[10px] text-center mt-2">
          Pushes your buffer to a collaborator
        </p>
      </div>
    </aside>
  )
}
