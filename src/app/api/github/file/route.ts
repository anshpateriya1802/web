import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const githubToken = (session.user as any).githubToken
  if (!githubToken) {
    return NextResponse.json(
      { error: 'No GitHub account linked.' },
      { status: 403 }
    )
  }

  const { searchParams } = req.nextUrl
  const owner  = searchParams.get('owner')
  const repo   = searchParams.get('repo')
  const path   = searchParams.get('path') || ''
  const branch = searchParams.get('branch') || 'main'

  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 })
  }

  // If path is empty or ends with /, list directory contents
  const isDir = path === '' || path.endsWith('/')
  const apiPath = isDir
    ? `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`
    : `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`

  const res = await fetch(apiPath, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: err.message || 'GitHub API error' },
      { status: res.status }
    )
  }

  const data = await res.json()

  // Directory listing — return tree nodes
  if (Array.isArray(data)) {
    return NextResponse.json(
      data.map((item: any) => ({
        name:        item.name,
        path:        item.path,
        type:        item.type,  // 'file' | 'dir'
        size:        item.size,
        downloadUrl: item.download_url,
      }))
    )
  }

  // Single file — decode base64 content
  if (data.type === 'file' && data.content) {
    const content = Buffer.from(data.content, 'base64').toString('utf-8')
    return NextResponse.json({ content, path: data.path, size: data.size })
  }

  return NextResponse.json({ error: 'Unexpected response from GitHub' }, { status: 500 })
}
