"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createPortal } from "react-dom"
import { useRoomStore } from '@/stores/roomStore'
import ClientWorkspaceEditor from "@/components/editor/ClientWorkspaceEditor"
import ClientCollaborativeWhiteboard from "@/components/room/ClientCollaborativeWhiteboard"
import ClientProblemPanel from "@/components/room/ClientProblemPanel"
import { X, GripHorizontal, Maximize2, Minimize2 } from "lucide-react"

interface ClientRoomLayoutProps {
  roomId: string;
  userId: string;
  userName: string;
}

const MIN_PANEL_PCT       = 18
const MAX_PANEL_PCT       = 55
const DEFAULT_PROBLEM_PCT = 35
const DEFAULT_WB_SPLIT    = 30  // % when in split view

// Below this container px width, whiteboard becomes a popup
const SPLIT_BREAKPOINT = 900

// ─────────────────────────────────────────────────────────────────────────────
// Floating popup whiteboard
// ─────────────────────────────────────────────────────────────────────────────
interface PopupProps {
  roomId: string;
  onClose: () => void;
}

function WhiteboardPopup({ roomId, onClose }: PopupProps) {
  const [pos,         setPos]         = useState({ x: 80, y: 80 })
  const [size,        setSize]        = useState({ w: 520, h: 420 })
  const [isMaximized, setIsMaximized] = useState(false)
  // Saved state before maximizing so we can restore exactly
  const savedState = useRef({ pos: { x: 80, y: 80 }, size: { w: 520, h: 420 } })

  const dragging  = useRef(false)
  const resizing  = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const resStart  = useRef({ mx: 0, my: 0, w: 0, h: 0 })

  const handleMaximize = () => {
    if (!isMaximized) {
      // Save current state then go fullscreen
      savedState.current = { pos: { ...pos }, size: { ...size } }
      setIsMaximized(true)
    } else {
      // Restore saved state
      setPos(savedState.current.pos)
      setSize(savedState.current.size)
      setIsMaximized(false)
    }
  }

  // ── Drag header ─────────────────────────────────────────────────────────────
  const onDragMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y }

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      setPos({
        x: dragStart.current.px + ev.clientX - dragStart.current.mx,
        y: dragStart.current.py + ev.clientY - dragStart.current.my,
      })
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  // ── Resize handle (bottom-right corner) ─────────────────────────────────────
  const onResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resizing.current = true
    resStart.current = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h }

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return
      setSize({
        w: Math.max(320, resStart.current.w + ev.clientX - resStart.current.mx),
        h: Math.max(240, resStart.current.h + ev.clientY - resStart.current.my),
      })
    }
    const onUp = () => {
      resizing.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return createPortal(
    <div
      style={{
        position:      'fixed',
        left:          isMaximized ? 0      : pos.x,
        top:           isMaximized ? 0      : pos.y,
        width:         isMaximized ? '100vw' : size.w,
        height:        isMaximized ? '100vh' : size.h,
        zIndex:        9999,
        display:       'flex',
        flexDirection: 'column',
        background:    '#111111',
        border:        isMaximized ? 'none' : '1px solid #1f2937',
        borderRadius:  isMaximized ? 0      : 10,
        boxShadow:     isMaximized
          ? '0 0 0 0'
          : '0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
        overflow:      'hidden',
        transition:    'left 0.18s ease, top 0.18s ease, width 0.18s ease, height 0.18s ease, border-radius 0.18s ease',
      }}
    >
      {/* Title bar */}
      <div
        onMouseDown={isMaximized ? undefined : onDragMouseDown}
        style={{
          background:    '#0d0d0d',
          borderBottom:  '1px solid #1f2937',
          padding:       '8px 12px',
          cursor:        isMaximized ? 'default' : 'move',
          display:       'flex',
          alignItems:    'center',
          justifyContent:'space-between',
          userSelect:    'none',
          flexShrink:    0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isMaximized && <GripHorizontal size={14} color="#4b5563" />}
          <span style={{ fontSize: 13, fontWeight: 600, color: '#93c5fd' }}>
            Architecture Whiteboard
          </span>
          <span style={{
            fontSize: 10, color: isMaximized ? '#a78bfa' : '#6b7280',
            background: isMaximized ? '#2e1065' : '#1f2937',
            padding: '1px 6px', borderRadius: 4, marginLeft: 4,
          }}>
            {isMaximized ? 'MAXIMIZED' : 'POPUP'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Maximize / Restore */}
          <button
            onClick={handleMaximize}
            title={isMaximized ? 'Restore window' : 'Maximize'}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '4px 6px', borderRadius: 4, color: '#6b7280',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#1f2937')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            title="Close Whiteboard"
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '4px 6px', borderRadius: 4, color: '#6b7280',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#7f1d1d')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Whiteboard canvas */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <ClientCollaborativeWhiteboard roomId={roomId} />
      </div>

      {/* Resize handle — hidden when maximized */}
      {!isMaximized && (
        <div
          onMouseDown={onResizeMouseDown}
          style={{
            position: 'absolute',
            right: 0, bottom: 0,
            width: 18, height: 18,
            cursor: 'se-resize',
            background: 'linear-gradient(135deg, transparent 50%, #374151 50%)',
            borderTopLeftRadius: 2,
          }}
        />
      )}
    </div>,
    document.body
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main layout
// ─────────────────────────────────────────────────────────────────────────────
export default function ClientRoomLayout({ roomId, userId, userName }: ClientRoomLayoutProps) {
  const { isProblemOpen, isWhiteboardOpen, toggleWhiteboard } = useRoomStore()

  const containerRef = useRef<HTMLDivElement>(null)

  const [problemPct,    setProblemPct]    = useState(0)
  const [whiteboardPct, setWhiteboardPct] = useState(0)

  // ── Breakpoint detection via ResizeObserver ────────────────────────────────
  const [containerWidth, setContainerWidth] = useState<number>(9999)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const useSplitView = containerWidth >= SPLIT_BREAKPOINT

  // ── Open / close panels ────────────────────────────────────────────────────
  useEffect(() => {
    setProblemPct(isProblemOpen ? DEFAULT_PROBLEM_PCT : 0)
  }, [isProblemOpen])

  useEffect(() => {
    // Only reserve space in the split layout when we're actually in split mode
    setWhiteboardPct(isWhiteboardOpen && useSplitView ? DEFAULT_WB_SPLIT : 0)
  }, [isWhiteboardOpen, useSplitView])

  // ── Drag separator factory ────────────────────────────────────────────────
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
            ? startPct + deltaPct
            : startPct - deltaPct
          const clamped = Math.min(Math.max(next, MIN_PANEL_PCT), MAX_PANEL_PCT)
          if (side === 'left') setProblemPct(clamped)
          else                 setWhiteboardPct(clamped)
        }
        const onUp = () => {
          document.removeEventListener('mousemove', onMove)
          document.removeEventListener('mouseup',   onUp)
          document.body.style.cursor     = ''
          document.body.style.userSelect = ''
        }
        document.body.style.cursor     = 'col-resize'
        document.body.style.userSelect = 'none'
        document.addEventListener('mousemove', onMove)
        document.addEventListener('mouseup',   onUp)
      },
    [problemPct, whiteboardPct]
  )

  // ── Separator ────────────────────────────────────────────────────────────
  const Separator = ({ onMouseDown }: { onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void }) => (
    <div
      onMouseDown={onMouseDown}
      style={{
        width: '5px', flexShrink: 0,
        background: '#0d0d0d',
        borderLeft:  '1px solid #1f2937',
        borderRight: '1px solid #1f2937',
        touchAction: 'none',
        cursor: 'col-resize',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 50, userSelect: 'none',
      }}
      className="hover:bg-indigo-900/60 active:bg-indigo-700/70 transition-colors"
    >
      <div className="h-12 w-[3px] bg-gray-600 rounded-full pointer-events-none" />
    </div>
  )

  return (
    <>
      {/* ── Floating whiteboard popup (narrow window) ── */}
      {isWhiteboardOpen && !useSplitView && (
        <WhiteboardPopup
          roomId={roomId}
          onClose={toggleWhiteboard}
        />
      )}

      {/* ── Main flex layout ── */}
      <div
        ref={containerRef}
        className="flex flex-row w-full h-full overflow-hidden bg-[#0a0a0a]"
      >
        {/* Problem Panel */}
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

        {/* Editor — always fills remaining space */}
        <div style={{ flex: '1 1 0%', minWidth: 0 }} className="flex flex-col h-full overflow-hidden">
          <ClientWorkspaceEditor roomId={roomId} userId={userId} userName={userName} />
        </div>

        {/* Whiteboard — split panel (wide screens only) */}
        {isWhiteboardOpen && useSplitView && (
          <>
            <Separator onMouseDown={makeDragHandler('right')} />
            <div
              style={{ width: `${whiteboardPct}%`, minWidth: `${whiteboardPct}%`, maxWidth: `${whiteboardPct}%` }}
              className="flex flex-col h-full overflow-hidden"
            >
              {/* Split-view title bar */}
              <div className="flex justify-between items-center bg-[#111111] px-4 py-2 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-blue-400">Architecture Whiteboard</span>
                  <span className="text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">SPLIT</span>
                </div>
                <button
                  onClick={toggleWhiteboard}
                  className="px-2 py-1 text-xs bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
              <ClientCollaborativeWhiteboard roomId={roomId} />
            </div>
          </>
        )}
      </div>
    </>
  )
}
