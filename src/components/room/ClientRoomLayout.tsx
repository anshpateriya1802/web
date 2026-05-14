"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRoomStore } from '@/stores/roomStore'
import ClientWorkspaceEditor from "@/components/editor/ClientWorkspaceEditor"
import ClientCollaborativeWhiteboard from "@/components/room/ClientCollaborativeWhiteboard"
import ClientProblemPanel from "@/components/room/ClientProblemPanel"

interface ClientRoomLayoutProps {
  roomId: string;
  userId: string;
  userName: string;
}

const MIN_PANEL_PCT  = 18  // minimum width of problem / whiteboard panels (%)
const MAX_PANEL_PCT  = 55  // maximum width of problem / whiteboard panels (%)
const DEFAULT_PROBLEM_PCT    = 35  // opens at 35% (~1/3)
const DEFAULT_WHITEBOARD_PCT = 30

export default function ClientRoomLayout({ roomId, userId, userName }: ClientRoomLayoutProps) {
  const { isProblemOpen, isWhiteboardOpen } = useRoomStore()

  const containerRef = useRef<HTMLDivElement>(null)

  // Explicit pixel-percentage widths for the side panels
  const [problemPct,    setProblemPct]    = useState(0)
  const [whiteboardPct, setWhiteboardPct] = useState(0)

  // ── Open / close side panels ──────────────────────────────────────────────
  useEffect(() => {
    setProblemPct(isProblemOpen ? DEFAULT_PROBLEM_PCT : 0)
  }, [isProblemOpen])

  useEffect(() => {
    setWhiteboardPct(isWhiteboardOpen ? DEFAULT_WHITEBOARD_PCT : 0)
  }, [isWhiteboardOpen])

  // ── Generic drag-separator factory ────────────────────────────────────────
  const makeDragHandler = useCallback(
    (side: 'left' | 'right') =>
      (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        const container = containerRef.current
        if (!container) return

        const startX   = e.clientX
        const rect     = container.getBoundingClientRect()
        const totalW   = rect.width
        const startPct = side === 'left' ? problemPct : whiteboardPct

        const onMove = (ev: MouseEvent) => {
          const delta    = ev.clientX - startX
          const deltaPct = (delta / totalW) * 100

          const next = side === 'left'
            ? startPct + deltaPct          // drag right → problem grows
            : startPct - deltaPct          // drag left  → whiteboard grows

          const clamped = Math.min(Math.max(next, MIN_PANEL_PCT), MAX_PANEL_PCT)

          if (side === 'left') setProblemPct(clamped)
          else                 setWhiteboardPct(clamped)
        }

        const onUp = () => {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup',   onUp)
          document.body.style.cursor      = ''
          document.body.style.userSelect  = ''
        }

        document.body.style.cursor     = 'col-resize'
        document.body.style.userSelect = 'none'
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup',   onUp)
      },
    [problemPct, whiteboardPct]
  )

  // ── Separator component ────────────────────────────────────────────────────
  const Separator = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void }) => (
    <div
      onMouseDown={onMouseDown}
      className="flex-none w-[6px] bg-[#0d0d0d] border-x border-gray-800 flex items-center justify-center cursor-col-resize hover:bg-indigo-900/60 active:bg-indigo-700/70 transition-colors z-50 select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="h-12 w-[3px] bg-gray-600 rounded-full pointer-events-none" />
    </div>
  )

  // Editor fills whatever space is left
  const editorFlex = `1 1 0%`  // always flex-grow: 1

  return (
    <div
      ref={containerRef}
      className="flex flex-row w-full h-full overflow-hidden bg-[#0a0a0a]"
    >
      {/* ── Problem Panel (left) ── */}
      {isProblemOpen && (
        <>
          <div
            style={{ width: `${problemPct}%`, minWidth: `${problemPct}%`, maxWidth: `${problemPct}%` }}
            className="flex flex-col h-full overflow-hidden"
          >
            <ClientProblemPanel />
          </div>

          <Separator onMouseDown={makeDragHandler('left')} />
        </>
      )}

      {/* ── Editor (centre, fills remaining space) ── */}
      <div
        style={{ flex: editorFlex, minWidth: 0 }}
        className="flex flex-col h-full overflow-hidden"
      >
        <ClientWorkspaceEditor
          roomId={roomId}
          userId={userId}
          userName={userName}
        />
      </div>

      {/* ── Whiteboard Panel (right) ── */}
      {isWhiteboardOpen && (
        <>
          <Separator onMouseDown={makeDragHandler('right')} />

          <div
            style={{ width: `${whiteboardPct}%`, minWidth: `${whiteboardPct}%`, maxWidth: `${whiteboardPct}%` }}
            className="flex flex-col h-full overflow-hidden"
          >
            <ClientCollaborativeWhiteboard roomId={roomId} />
          </div>
        </>
      )}
    </div>
  )
}
