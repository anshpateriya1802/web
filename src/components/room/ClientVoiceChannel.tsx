"use client"

import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR — LiveKit uses browser APIs
const VoiceChannel = dynamic(() => import('./VoiceChannel'), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <div className="h-3 w-24 bg-gray-800 rounded animate-pulse" />
      <div className="h-8 w-full bg-gray-800 rounded-lg animate-pulse" />
    </div>
  ),
})

export default function ClientVoiceChannel({ roomId, userId }: { roomId: string; userId: string }) {
  return <VoiceChannel roomId={roomId} userId={userId} />
}
