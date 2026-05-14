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
      { error: 'GITHUB_NOT_CONNECTED', message: 'No GitHub account linked.' },
      { status: 403 }
    )
  }

  // Proxy to GitHub API — list authenticated user's repos
  const res = await fetch(
    'https://api.github.com/user/repos?sort=updated&per_page=50&type=all',
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: err.message || 'GitHub API error' },
      { status: res.status }
    )
  }

  const repos = await res.json()
  // Return only the fields we need
  return NextResponse.json(
    repos.map((r: any) => ({
      id:            r.id,
      name:          r.name,
      fullName:      r.full_name,
      private:       r.private,
      language:      r.language,
      updatedAt:     r.updated_at,
      defaultBranch: r.default_branch,
      description:   r.description,
    }))
  )
}
