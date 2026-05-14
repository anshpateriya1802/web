import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

// GET /api/files/content?id=xxx → returns just the content of a single file
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const file = await prisma.roomFile.findUnique({
    where: { id },
    select: { id: true, name: true, language: true, content: true },
  })

  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  return NextResponse.json(file)
}
