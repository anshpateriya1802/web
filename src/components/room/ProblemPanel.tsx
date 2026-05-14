"use client"

import { useRoomStore } from '@/stores/roomStore'
import { useState } from 'react'
import { Link as LinkIcon, DownloadCloud, FileText, Edit2 } from 'lucide-react'

export default function ProblemPanel() {
  const { 
    isProblemOpen, 
    toggleProblem,
    problemTitle,
    problemDesc,
    problemTests,
    setProblemData
  } = useRoomStore()

  const [url, setUrl] = useState("")
  const [isFetching, setIsFetching] = useState(false)
  const [error, setError] = useState("")

  const [isEditing, setIsEditing] = useState(!problemTitle || !problemDesc)
  
  const [localTitle, setLocalTitle] = useState(problemTitle)
  const [localDesc, setLocalDesc] = useState(problemDesc)
  const [localTests, setLocalTests] = useState(problemTests)

  if (!isProblemOpen) return null

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setIsFetching(true)
    setError("")
    
    try {
      const res = await fetch(`${window.location.protocol}//${window.location.hostname}:3002/api/parse-problem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || "Failed to fetch problem")
      
      setLocalTitle(data.title)
      setLocalDesc(data.description)
      setLocalTests(data.testCases)
      setProblemData(data.title, data.description, data.testCases)
      setUrl("")
      setIsEditing(false) // Switch to view mode after fetching
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsFetching(false)
    }
  }

  const saveChanges = () => {
    setProblemData(localTitle, localDesc, localTests)
    setIsEditing(false)
  }

  return (
    <div
      style={{ background: 'var(--cr-bg-surface)', color: 'var(--cr-text-primary)' }}
      className="flex flex-col h-full w-full overflow-hidden relative"
    >
      <div
        style={{ background: 'var(--cr-bg-elevated)', borderColor: 'var(--cr-border)' }}
        className="flex justify-between items-center px-4 py-2 border-b shrink-0"
      >
        <div className="flex items-center space-x-2 text-green-600 font-semibold">
          <FileText size={16} />
          <span style={{ color: 'var(--cr-text-primary)' }} className="text-sm">Problem Details</span>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              style={{ color: 'var(--cr-text-muted)' }}
              className="p-1.5 hover:text-indigo-500 hover:bg-gray-200/20 rounded transition-colors"
              title="Edit Problem"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={toggleProblem}
            style={{ color: 'var(--cr-text-muted)' }}
            className="px-2 py-1 text-xs hover:bg-gray-200/20 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isEditing ? (
          <div className="space-y-6">
            {/* Fetch Section */}
            <div className="space-y-2">
              <label style={{ color: 'var(--cr-text-muted)' }} className="text-xs font-semibold uppercase tracking-wider">Fetch from URL</label>
              <form onSubmit={handleFetch} className="flex space-x-2">
                <div className="relative flex-1">
                  <div style={{ color: 'var(--cr-text-muted)' }} className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://leetcode.com/problems/..."
                    style={{ background: 'var(--cr-bg-input)', color: 'var(--cr-text-primary)', borderColor: 'var(--cr-border)' }}
                    className="w-full border rounded-md pl-9 pr-3 py-2 text-xs placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isFetching || !url}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 text-white px-3 py-2 rounded-md text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <DownloadCloud size={14} />
                  <span>{isFetching ? "Parsing..." : "Parse"}</span>
                </button>
              </form>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>

            <hr className="border-gray-200" />

            {/* Edit Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label style={{ color: 'var(--cr-text-muted)' }} className="text-xs font-semibold uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Problem Title"
                  style={{ background: 'var(--cr-bg-input)', color: 'var(--cr-text-primary)', borderColor: 'var(--cr-border)' }}
                  className="w-full border rounded-md px-3 py-2 text-sm font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <label style={{ color: 'var(--cr-text-muted)' }} className="text-xs font-semibold uppercase tracking-wider">Description</label>
                <textarea
                  value={localDesc}
                  onChange={(e) => setLocalDesc(e.target.value)}
                  rows={8}
                  placeholder="Paste the problem description here..."
                  style={{ background: 'var(--cr-bg-input)', color: 'var(--cr-text-primary)', borderColor: 'var(--cr-border)' }}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none resize-y"
                />
              </div>

              <div className="space-y-2 flex-1 flex flex-col">
                <label style={{ color: 'var(--cr-text-muted)' }} className="text-xs font-semibold uppercase tracking-wider">Test Cases</label>
                <textarea
                  value={localTests}
                  onChange={(e) => setLocalTests(e.target.value)}
                  rows={4}
                  placeholder="Input:\nOutput:"
                  style={{ background: 'var(--cr-bg-input)', color: 'var(--cr-text-secondary)', borderColor: 'var(--cr-border)' }}
                  className="w-full border rounded-md px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none resize-y"
                />
              </div>

              <button 
                onClick={saveChanges}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-md transition-colors"
              >
                Save Problem
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 style={{ color: 'var(--cr-text-primary)' }} className="text-2xl font-bold">
              {problemTitle || "Untitled Problem"}
            </h1>
            <div style={{ color: 'var(--cr-text-secondary)' }} className="prose prose-sm max-w-none whitespace-pre-wrap">
              {problemDesc || "No description provided."}
            </div>
            {(problemTests || "").trim() && (
              <div
                style={{ background: 'var(--cr-bg-elevated)', borderColor: 'var(--cr-border)' }}
                className="rounded-lg p-4 border"
              >
                <h3 style={{ color: 'var(--cr-text-primary)' }} className="text-sm font-bold mb-2">Test Cases</h3>
                <pre style={{ color: 'var(--cr-text-secondary)' }} className="text-xs font-mono whitespace-pre-wrap overflow-x-auto">
                  {problemTests}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
