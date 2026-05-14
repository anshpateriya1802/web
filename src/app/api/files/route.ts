import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', go: 'go', rs: 'rust', cpp: 'cpp', cc: 'cpp', c: 'cpp',
    cs: 'csharp', java: 'java', rb: 'ruby', php: 'php', swift: 'swift',
    kt: 'kotlin', html: 'html', css: 'css', scss: 'css', json: 'json',
    md: 'markdown', yaml: 'yaml', yml: 'yaml', sh: 'shell', sql: 'sql',
    xml: 'xml', toml: 'ini',
  }
  return map[ext] || 'plaintext'
}

// Resolve room code (e.g. "JSGN8U") to its database id
async function resolveRoomId(codeOrId: string): Promise<string | null> {
  // If it's already a cuid (~25 chars starting with 'c'), return as-is
  if (/^c[a-z0-9]{20,}$/.test(codeOrId)) return codeOrId
  const room = await prisma.room.findUnique({ where: { code: codeOrId.toUpperCase() } })
  return room?.id ?? null
}

// GET /api/files?roomId=JSGN8U
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const codeOrId = req.nextUrl.searchParams.get('roomId')
    if (!codeOrId) return NextResponse.json({ error: 'roomId required' }, { status: 400 })

    const roomId = await resolveRoomId(codeOrId)
    if (!roomId) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const files = await prisma.roomFile.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, language: true, updatedAt: true },
    })

    return NextResponse.json(files)
  } catch (err: any) {
    console.error('[GET /api/files]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// POST /api/files
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { roomId: codeOrId, name, content = '' } = await req.json()
    if (!codeOrId || !name) return NextResponse.json({ error: 'roomId and name required' }, { status: 400 })

    const roomId = await resolveRoomId(codeOrId)
    if (!roomId) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

    const file = await prisma.roomFile.create({
      data: {
        roomId,
        userId:   session.user.id,
        name:     name.trim(),
        language: detectLanguage(name),
        content,
      },
    })

    return NextResponse.json(file, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/files]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// PATCH /api/files
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, content, name } = await req.json()
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const updateData: any = {}
    if (content !== undefined) updateData.content  = content
    if (name    !== undefined) {
      updateData.name     = name.trim()
      updateData.language = detectLanguage(name)
    }

    const file = await prisma.roomFile.update({ where: { id }, data: updateData })
    return NextResponse.json(file)
  } catch (err: any) {
    console.error('[PATCH /api/files]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}

// DELETE /api/files?id=xxx OR /api/files?roomId=xxx&path=xxx
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = req.nextUrl.searchParams.get('id')
    const path = req.nextUrl.searchParams.get('path')
    const roomIdCode = req.nextUrl.searchParams.get('roomId')

    if (id) {
      await prisma.roomFile.delete({ where: { id } })
      return NextResponse.json({ ok: true })
    }

    if (path && roomIdCode) {
      // In case FileTree sent the DB id instead of code, resolveRoomId handles both safely
      const roomId = await resolveRoomId(roomIdCode)
      if (!roomId) return NextResponse.json({ error: 'Room not found' }, { status: 404 })

      // Delete all files inside the folder and the .gitkeep itself
      await prisma.roomFile.deleteMany({
        where: {
          roomId,
          OR: [
            { name: { startsWith: `${path}/` } },
            { name: path }
          ]
        }
      })
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'id or path+roomId required' }, { status: 400 })
  } catch (err: any) {
    console.error('[DELETE /api/files]', err)
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
