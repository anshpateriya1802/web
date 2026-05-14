"use client"

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  GitBranch, Search, ChevronRight, ChevronDown, File, Folder,
  FolderOpen, X, Loader2, AlertCircle, Lock, Globe, ArrowLeft,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────
interface Repo {
  id:            number
  name:          string
  fullName:      string
  private:       boolean
  language:      string | null
  updatedAt:     string
  defaultBranch: string
  description:   string | null
}

interface TreeNode {
  name:        string
  path:        string
  type:        'file' | 'dir'
  size?:       number
  downloadUrl?: string
}

// Language → Monaco language id
const EXT_MAP: Record<string, string> = {
  ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
  py: 'python', go: 'go', rs: 'rust', cpp: 'cpp', cc: 'cpp', c: 'cpp',
  cs: 'csharp', java: 'java', rb: 'ruby', php: 'php', swift: 'swift',
  kt: 'kotlin', html: 'html', css: 'css', scss: 'css', json: 'json',
  md: 'markdown', yaml: 'yaml', yml: 'yaml', sh: 'shell', bash: 'shell',
  sql: 'sql', xml: 'xml', toml: 'ini', dockerfile: 'dockerfile',
}

function getLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return EXT_MAP[ext] || 'plaintext'
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TreeEntry({
  node,
  depth,
  owner,
  repo,
  branch,
  onFileSelect,
}: {
  node:         TreeNode
  depth:        number
  owner:        string
  repo:         string
  branch:       string
  onFileSelect: (path: string, language: string) => void
}) {
  const [open,     setOpen]     = useState(false)
  const [children, setChildren] = useState<TreeNode[]>([])
  const [loading,  setLoading]  = useState(false)

  const toggle = async () => {
    if (node.type === 'file') {
      onFileSelect(node.path, getLanguage(node.name))
      return
    }
    if (!open && children.length === 0) {
      setLoading(true)
      try {
        const res  = await fetch(`/api/github/file?owner=${owner}&repo=${repo}&path=${node.path}&branch=${branch}`)
        const data = await res.json()
        if (Array.isArray(data)) setChildren(data)
      } finally {
        setLoading(false)
      }
    }
    setOpen(o => !o)
  }

  const Icon = node.type === 'dir'
    ? (open ? FolderOpen : Folder)
    : File

  const iconColor = node.type === 'dir' ? '#fbbf24' : '#94a3b8'

  return (
    <div>
      <button
        onClick={toggle}
        className="w-full flex items-center gap-1.5 px-2 py-1 hover:bg-gray-800/60 rounded transition-colors text-left group"
        style={{ paddingLeft: `${8 + depth * 16}px` }}
      >
        {node.type === 'dir' && (
          <span className="text-gray-600 flex-shrink-0">
            {loading
              ? <Loader2 size={11} className="animate-spin" />
              : open ? <ChevronDown size={11} /> : <ChevronRight size={11} />
            }
          </span>
        )}
        <Icon size={14} color={iconColor} className="flex-shrink-0" />
        <span className="text-xs text-gray-300 group-hover:text-white transition-colors truncate">
          {node.name}
        </span>
      </button>
      {open && children.length > 0 && (
        <div>
          {children
            .sort((a, b) => {
              if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
              return a.name.localeCompare(b.name)
            })
            .map(child => (
              <TreeEntry
                key={child.path}
                node={child}
                depth={depth + 1}
                owner={owner}
                repo={repo}
                branch={branch}
                onFileSelect={onFileSelect}
              />
            ))}
        </div>
      )}
    </div>
  )
}

// ── Main modal ────────────────────────────────────────────────────────────
interface GitHubImportModalProps {
  onClose:    () => void
  onImport:   (code: string, language: string, filename: string) => void
}

export default function GitHubImportModal({ onClose, onImport }: GitHubImportModalProps) {
  const [repos,       setRepos]       = useState<Repo[]>([])
  const [filteredRepos, setFiltered]  = useState<Repo[]>([])
  const [search,      setSearch]      = useState('')
  const [loadingRepos, setLoadingR]   = useState(true)
  const [repoError,   setRepoError]   = useState<string | null>(null)
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null)
  const [rootTree,    setRootTree]    = useState<TreeNode[]>([])
  const [loadingTree, setLoadingTree] = useState(false)
  const [importing,   setImporting]   = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Flag set when the API tells us GitHub is not linked
  const [githubNotConnected, setGithubNotConnected] = useState(false)

  // Fetch repo list on mount
  useEffect(() => {
    setLoadingR(true)
    fetch('/api/github/repos')
      .then(r => r.json())
      .then(data => {
        if (data.error === 'GITHUB_NOT_CONNECTED') {
          setGithubNotConnected(true)
        } else if (Array.isArray(data)) {
          setRepos(data)
          setFiltered(data)
        } else {
          setRepoError(data.error || data.message || 'Failed to load repositories')
        }
      })
      .catch(() => setRepoError('Network error'))
      .finally(() => setLoadingR(false))
  }, [])

  // Filter repos by search
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(repos.filter(r =>
      r.name.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q)
    ))
  }, [search, repos])

  const selectRepo = async (repo: Repo) => {
    setSelectedRepo(repo)
    setRootTree([])
    setImportError(null)
    setLoadingTree(true)
    try {
      const res  = await fetch(`/api/github/file?owner=${repo.fullName.split('/')[0]}&repo=${repo.name}&path=&branch=${repo.defaultBranch}`)
      const data = await res.json()
      if (Array.isArray(data)) setRootTree(data)
      else setImportError(data.error || 'Failed to load file tree')
    } catch {
      setImportError('Network error loading file tree')
    } finally {
      setLoadingTree(false)
    }
  }

  const importFile = async (path: string, language: string) => {
    if (!selectedRepo) return
    setImporting(true)
    setImportError(null)
    try {
      const owner = selectedRepo.fullName.split('/')[0]
      const res   = await fetch(`/api/github/file?owner=${owner}&repo=${selectedRepo.name}&path=${encodeURIComponent(path)}&branch=${selectedRepo.defaultBranch}`)
      const data  = await res.json()
      if (data.content !== undefined) {
        const filename = path.split('/').pop() || path
        onImport(data.content, language, filename)
        onClose()
      } else {
        setImportError(data.error || 'Failed to read file')
      }
    } catch {
      setImportError('Network error importing file')
    } finally {
      setImporting(false)
    }
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed z-[9999] flex flex-col"
        style={{
          top:          '50%',
          left:         '50%',
          transform:    'translate(-50%, -50%)',
          width:        'min(700px, 95vw)',
          height:       'min(560px, 90vh)',
          background:   '#111111',
          border:       '1px solid #1f2937',
          borderRadius: 12,
          boxShadow:    '0 32px 80px rgba(0,0,0,0.8)',
          overflow:     'hidden',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-[#0d0d0d] border-b border-gray-800 px-5 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <GitBranch size={18} className="text-gray-300" />
            <span className="font-semibold text-white text-sm">GitHub Import</span>
            {selectedRepo && (
              <>
                <ChevronRight size={14} className="text-gray-600" />
                <span className="text-sm text-indigo-400 font-medium">{selectedRepo.name}</span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left — repo list */}
          <div
            className="flex flex-col border-r border-gray-800 shrink-0 overflow-hidden"
            style={{ width: selectedRepo ? 220 : '100%' }}
          >
            {/* Search */}
            <div className="p-3 border-b border-gray-800 shrink-0">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search repositories..."
                  className="w-full bg-gray-900 border border-gray-700 rounded-md pl-8 pr-3 py-1.5 text-xs text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:outline-none"
                  autoFocus={!selectedRepo}
                />
              </div>
            </div>

            {/* Repo list body */}
            <div className="flex-1 overflow-y-auto">
              {loadingRepos && (
                <div className="flex items-center justify-center py-12 gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-400" />
                  <span className="text-xs text-gray-500">Loading repositories...</span>
                </div>
              )}
              {/* ── GitHub not connected ── */}
              {githubNotConnected && (
                <div className="flex flex-col items-center justify-center h-full px-8 py-12 text-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
                    <GitBranch size={28} className="text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">GitHub not connected</p>
                    <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
                      Link your GitHub account to import repositories directly into your workspace.
                    </p>
                  </div>
                  <a
                    href={`/api/auth/signin/github?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/')}`}
                    className="flex items-center gap-2.5 px-6 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-gray-900" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Connect GitHub
                  </a>
                  <p className="text-[10px] text-gray-600">
                    You'll be redirected back to this room after connecting.
                  </p>
                </div>
              )}

              {/* ── Error ── */}
              {!githubNotConnected && repoError && (
                <div className="m-4 p-3 bg-red-900/20 border border-red-800/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-300 leading-relaxed">{repoError}</p>
                </div>
              )}

              {!loadingRepos && !repoError && filteredRepos.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => selectRepo(repo)}
                  className={`w-full flex items-start gap-2.5 px-4 py-3 hover:bg-gray-800/50 transition-colors text-left border-b border-gray-800/40 ${
                    selectedRepo?.id === repo.id ? 'bg-indigo-900/20 border-l-2 border-l-indigo-500' : ''
                  }`}
                >
                  {repo.private
                    ? <Lock size={13} className="text-yellow-600 mt-0.5 shrink-0" />
                    : <Globe size={13} className="text-gray-600 mt-0.5 shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-200 truncate">{repo.name}</p>
                    {repo.language && (
                      <p className="text-[10px] text-gray-500 mt-0.5">{repo.language}</p>
                    )}
                  </div>
                </button>
              ))}
              {!loadingRepos && !repoError && filteredRepos.length === 0 && (
                <p className="text-xs text-gray-600 text-center py-8">No repositories found</p>
              )}
            </div>
          </div>

          {/* Right — file tree (only when repo selected) */}
          {selectedRepo && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Repo header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-[#0a0a0a] border-b border-gray-800 shrink-0">
                <button
                  onClick={() => setSelectedRepo(null)}
                  className="p-1 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded transition-colors"
                >
                  <ArrowLeft size={13} />
                </button>
                <span className="text-xs text-gray-400 font-mono">{selectedRepo.fullName}</span>
                <span className="ml-auto text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                  {selectedRepo.defaultBranch}
                </span>
              </div>

              {/* Instruction */}
              <div className="px-3 py-2 bg-indigo-900/10 border-b border-indigo-900/20 shrink-0">
                <p className="text-[11px] text-indigo-400">Click a file to import its contents into your editor buffer</p>
              </div>

              {/* Tree body */}
              <div className="flex-1 overflow-y-auto py-1">
                {loadingTree && (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                    <span className="text-xs text-gray-500">Loading files...</span>
                  </div>
                )}
                {importing && (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <Loader2 size={14} className="animate-spin text-green-400" />
                    <span className="text-xs text-gray-500">Importing file...</span>
                  </div>
                )}
                {importError && (
                  <div className="m-3 p-2.5 bg-red-900/20 border border-red-800/30 rounded-lg flex items-start gap-2">
                    <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-red-300">{importError}</p>
                  </div>
                )}
                {!loadingTree && !importing && rootTree
                  .sort((a, b) => {
                    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1
                    return a.name.localeCompare(b.name)
                  })
                  .map(node => (
                    <TreeEntry
                      key={node.path}
                      node={node}
                      depth={0}
                      owner={selectedRepo.fullName.split('/')[0]}
                      repo={selectedRepo.name}
                      branch={selectedRepo.defaultBranch}
                      onFileSelect={importFile}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  )
}
