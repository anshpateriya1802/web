import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Language detection from filename extension
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

// GET /api/files?roomId=xxx  → list all files for a room
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const roomId = req.nextUrl.searchParams.get('roomId')
  if (!roomId) return NextResponse.json({ error: 'roomId required' }, { status: 400 })

  const files = await prisma.roomFile.findMany({
    where: { roomId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, language: true, updatedAt: true },
  })

  return NextResponse.json(files)
}

// POST /api/files  → create a new file
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roomId, name, content = '' } = await req.json()
  if (!roomId || !name) return NextResponse.json({ error: 'roomId and name required' }, { status: 400 })

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
}

// PATCH /api/files  → update content or name
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, content, name } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updateData: any = { updatedAt: new Date() }
  if (content !== undefined) updateData.content  = content
  if (name    !== undefined) {
    updateData.name     = name.trim()
    updateData.language = detectLanguage(name)
  }

  const file = await prisma.roomFile.update({ where: { id }, data: updateData })
  return NextResponse.json(file)
}

// DELETE /api/files?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  await prisma.roomFile.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}

// GET /api/files/content?id=xxx  → fetch file content (separate to avoid loading all content in list)
