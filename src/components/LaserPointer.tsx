"use client"

import React, { useEffect, useState, useRef } from 'react'

interface Point {
  x: number;
  y: number;
}

interface Path {
  id: number;
  points: Point[];
}

export default function LaserPointer() {
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

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-[100000]"
      style={{ width: '100vw', height: '100vh', mixBlendMode: 'lighten' }}
    >
      <defs>
        <filter id="laser-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
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
            <polyline
              points={pointsStr}
              fill="none"
              stroke="#ff0000"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.8"
            />
            <polyline
              points={pointsStr}
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )
      })}
    </svg>
  )
}
