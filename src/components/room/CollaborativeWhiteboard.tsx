"use client"

import { Tldraw } from 'tldraw'
import 'tldraw/tldraw.css'

interface CollaborativeWhiteboardProps {
  roomId: string;
}

/**
 * Pure Tldraw canvas — no visibility guard, no close button.
 * Visibility and chrome (title bar, close) are handled by the parent:
 *   - Split view: CollaborativeWhiteboard wrapped in ClientRoomLayout panel
 *   - Popup view:  CollaborativeWhiteboard wrapped in WhiteboardPopup (ClientRoomLayout)
 */
export default function CollaborativeWhiteboard({ roomId }: CollaborativeWhiteboardProps) {
  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] overflow-hidden">
      <div className="flex-1 relative z-0">
        <Tldraw persistenceKey={`tldraw-room-${roomId}`} />
      </div>
    </div>
  )
}
