"use client"

import React, { useEffect, useState, useRef } from 'react'
import { useRoomStore } from '@/stores/roomStore'

interface Point {
  x: number;
  y: number;
}

interface Path {
  id: number;
  points: Point[];
}

export default function LaserPointer() {
  const theme = useRoomStore((s) => s.theme)
  const [paths, setPaths] = useState<Path[]>([])
  const isDrawing = useRef(false)
  const currentPathId = useRef<number>(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startClearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setPaths([])
      isDrawing.current = false
    }, 3000)
  }

  const cancelClearTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }

  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (e.altKey) {
        cancelClearTimer()
        isDrawing.current = true
        currentPathId.current = Date.now()
        setPaths(prev => [...prev, { id: currentPathId.current, points: [{ x: e.clientX, y: e.clientY }] }])
      }
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (e.altKey && e.buttons > 0) {
        cancelClearTimer()

        if (!isDrawing.current) {
          isDrawing.current = true
          currentPathId.current = Date.now()
          setPaths(prev => [...prev, { id: currentPathId.current, points: [{ x: e.clientX, y: e.clientY }] }])
        }

        setPaths(prev => {
          const newPaths = [...prev]
          const lastPath = newPaths[newPaths.length - 1]
          if (lastPath && lastPath.id === currentPathId.current) {
            lastPath.points.push({ x: e.clientX, y: e.clientY })
          }
          return newPaths
        })
      } else if (isDrawing.current) {
        isDrawing.current = false
        startClearTimer()
      }
    }

    const handlePointerUp = () => {
      if (isDrawing.current) {
        isDrawing.current = false
        startClearTimer()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  if (paths.length === 0) return null

  // In dark mode: "lighten" blend makes the laser bright on dark BG.
  // In light mode: "multiply" + a dark neon colour keeps it visible on white.
  const isLight = theme === 'light'
  const blendMode: React.CSSProperties['mixBlendMode'] = isLight ? 'multiply' : 'lighten'
  const outerColor  = isLight ? '#cc0000' : '#ff0000'   // deeper red on light
  const coreColor   = isLight ? '#550000' : '#ffffff'   // dark core in light mode

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[100000]"
      style={{ width: '100vw', height: '100vh', mixBlendMode: blendMode }}
    >
      <defs>
        <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isLight ? 1.5 : 2} result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {paths.map((path) => {
        if (path.points.length < 2) return null
        const pointsStr = path.points.map(p => `${p.x},${p.y}`).join(' ')
        return (
          <g key={path.id} filter="url(#laser-glow)">
            {/* Outer glow stroke */}
            <polyline
              points={pointsStr}
              fill="none"
              stroke={outerColor}
              strokeWidth={isLight ? 5 : 4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity={isLight ? 0.9 : 0.8}
            />
            {/* Bright inner core */}
            <polyline
              points={pointsStr}
              fill="none"
              stroke={coreColor}
              strokeWidth={isLight ? 2 : 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )
      })}
    </svg>
  )
}
