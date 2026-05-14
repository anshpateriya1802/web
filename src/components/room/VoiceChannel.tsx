"use client"

import {
  LiveKitRoom,
  useLocalParticipant,
  useParticipants,
  RoomAudioRenderer,
  TrackToggle,
} from '@livekit/components-react'
import { Participant, Track } from 'livekit-client'
import { Mic, MicOff, PhoneOff, PhoneCall, Loader2, Wifi, WifiOff } from 'lucide-react'
import { useState, useCallback } from 'react'

interface VoiceChannelProps {
  roomId: string
  userId: string
}

// ── Per-participant tile ───────────────────────────────────────────────────
// Receives the full Participant object — reads isSpeaking directly (no hook context needed)
function ParticipantTile({ participant }: { participant: Participant }) {
  const isSpeaking = participant.isSpeaking
  const initials   = (participant.name || participant.identity).slice(0, 2).toUpperCase()

  return (
    <div className="flex items-center space-x-2 py-1">
      <div
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#c7d2fe',
          background: '#312e81',
          boxShadow: isSpeaking ? '0 0 0 2px #6366f1, 0 0 8px 2px rgba(99,102,241,0.5)' : 'none',
          transition: 'box-shadow 0.15s ease',
        }}
      >
        {initials}
      </div>
      <span className="text-xs text-gray-300 truncate max-w-[120px]" title={participant.name || participant.identity}>
        {participant.name || participant.identity.slice(0, 16)}
      </span>
      {isSpeaking && (
        <span className="ml-auto">
          <Mic size={11} className="text-indigo-400 animate-pulse" />
        </span>
      )}
    </div>
  )
}

// ── Controls bar rendered inside the LiveKitRoom context ──────────────────
function VoiceControls({ onLeave }: { onLeave: () => void }) {
  const { localParticipant, isMicrophoneEnabled } = useLocalParticipant()
  const participants = useParticipants()

  return (
    <div className="space-y-3">
      {/* Status */}
      <div className="flex items-center space-x-2">
        <Wifi size={12} className="text-green-400" />
        <span className="text-xs text-green-400 font-medium">Connected</span>
        <span className="ml-auto text-xs text-gray-600">{participants.length} online</span>
      </div>

      {/* Participant list */}
      <div className="space-y-0.5 max-h-32 overflow-y-auto">
        {participants.map((p) => (
          <ParticipantTile key={p.identity} participant={p} />
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center space-x-2 pt-1">
        <TrackToggle
          source={Track.Source.Microphone}
          className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
            isMicrophoneEnabled
              ? 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40'
              : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
          }`}
          showIcon={false}
        >
          {isMicrophoneEnabled ? <Mic size={14} /> : <MicOff size={14} />}
        </TrackToggle>

        <button
          onClick={onLeave}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors text-xs font-semibold ml-auto"
          title="Leave voice channel"
        >
          <PhoneOff size={13} />
          <span>Leave</span>
        </button>
      </div>

      {/* Renders remote audio tracks automatically */}
      <RoomAudioRenderer />
    </div>
  )
}

// ── Main VoiceChannel component ────────────────────────────────────────────
export default function VoiceChannel({ roomId, userId }: VoiceChannelProps) {
  const [isJoined,  setIsJoined]  = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [token,     setToken]     = useState<string | null>(null)
  const [wsUrl,     setWsUrl]     = useState<string | null>(null)

  const fetchToken = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/livekit/token?roomId=${encodeURIComponent(roomId)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get token')
      setToken(data.token)
      setWsUrl(data.wsUrl)
      setIsJoined(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [roomId])

  const handleLeave = useCallback(() => {
    setIsJoined(false)
    setToken(null)
    setWsUrl(null)
  }, [])

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Voice Channel</h3>
        {isJoined && <Wifi size={11} className="text-green-400" />}
        {!isJoined && !isLoading && <WifiOff size={11} className="text-gray-700" />}
      </div>

      {/* Disconnected state */}
      {!isJoined && !isLoading && (
        <div className="space-y-2">
          {error && (() => {
            const isNotConfigured = error.toLowerCase().includes('not configured')
            if (isNotConfigured) {
              return (
                <div className="rounded-lg border border-yellow-800/40 bg-yellow-900/10 p-3 space-y-2">
                  <p className="text-[11px] text-yellow-400 font-semibold">⚡ LiveKit Setup Required</p>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Add these 3 keys to your <code className="bg-gray-800 px-1 rounded text-yellow-300">.env</code> file:
                  </p>
                  <div className="bg-gray-900 rounded p-2 font-mono text-[10px] text-green-400 space-y-0.5">
                    <p>LIVEKIT_URL=wss://…</p>
                    <p>LIVEKIT_API_KEY=…</p>
                    <p>LIVEKIT_API_SECRET=…</p>
                  </div>
                  <a
                    href="https://cloud.livekit.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-md bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-[11px] font-semibold transition-colors border border-yellow-700/30"
                  >
                    Get free credentials →
                  </a>
                </div>
              )
            }
            return (
              <p className="text-xs text-red-400 bg-red-900/20 rounded p-2 leading-relaxed">{error}</p>
            )
          })()}
          {!error && (
            <button
              onClick={fetchToken}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors text-xs font-semibold border border-indigo-800/30"
            >
              <PhoneCall size={13} />
              <span>Join Voice</span>
            </button>
          )}
          {error && !error.toLowerCase().includes('not configured') && (
            <button
              onClick={fetchToken}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors text-xs font-semibold border border-indigo-800/30"
            >
              <PhoneCall size={13} />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-3 space-x-2">
          <Loader2 size={14} className="text-indigo-400 animate-spin" />
          <span className="text-xs text-gray-500">Connecting...</span>
        </div>
      )}

      {/* Connected — LiveKitRoom provides context for all child hooks */}
      {isJoined && token && wsUrl && (
        <LiveKitRoom
          token={token}
          serverUrl={wsUrl}
          audio={true}
          video={false}
          connect={true}
          onDisconnected={handleLeave}
          style={{ display: 'contents' }}
        >
          <VoiceControls onLeave={handleLeave} />
        </LiveKitRoom>
      )}
    </div>
  )
}
