import { AccessToken } from 'livekit-server-sdk'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const roomId = req.nextUrl.searchParams.get('roomId')
  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
  }

  const apiKey    = process.env.LIVEKIT_API_KEY
  const apiSecret = process.env.LIVEKIT_API_SECRET
  const wsUrl     = process.env.LIVEKIT_URL

  if (!apiKey || !apiSecret || !wsUrl) {
    return NextResponse.json(
      { error: 'LiveKit not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET in .env' },
      { status: 500 }
    )
  }

  // Token identity = userId; display name = email
  const identity    = session.user.id
  const displayName = session.user.name || session.user.email || identity

  const token = new AccessToken(apiKey, apiSecret, {
    identity,
    name: displayName,
    ttl: '4h',
  })

  token.addGrant({
    room:           roomId,
    roomJoin:       true,
    canPublish:     true,
    canSubscribe:   true,
    canPublishData: true,
  })

  return NextResponse.json({ token: await token.toJwt(), wsUrl })
}
