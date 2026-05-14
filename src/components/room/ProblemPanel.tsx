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
      setIsEditing(false)
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
    <div className="flex flex-col h-full w-full bg-[#111111] text-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center bg-[#0d0d0d] px-4 py-2 border-b border-gray-800 shrink-0">
        <div className="flex items-center space-x-2 text-green-500 font-semibold">
          <FileText size={16} />
          <span className="text-sm">Problem Details</span>
        </div>
        <div className="flex items-center space-x-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded transition-colors"
              title="Edit Problem"
            >
              <Edit2 size={14} />
            </button>
          )}
          <button
            onClick={toggleProblem}
            className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-800 hover:text-gray-300 rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isEditing ? (
          <div className="space-y-6">
            {/* Fetch from URL */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fetch from URL</label>
              <form onSubmit={handleFetch} className="flex space-x-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-600">
                    <LinkIcon size={14} />
                  </div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://leetcode.com/problems/..."
                    className="w-full bg-[#0a0a0a] border border-gray-700 rounded-md pl-9 pr-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isFetching || !url}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-3 py-2 rounded-md text-xs font-bold transition-colors flex items-center space-x-1"
                >
                  <DownloadCloud size={14} />
                  <span>{isFetching ? "Parsing..." : "Parse"}</span>
                </button>
              </form>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </div>

            <hr className="border-gray-800" />

            {/* Edit fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  value={localTitle}
                  onChange={(e) => setLocalTitle(e.target.value)}
                  placeholder="Problem Title"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</label>
                <textarea
                  value={localDesc}
                  onChange={(e) => setLocalDesc(e.target.value)}
                  rows={8}
                  placeholder="Paste the problem description here..."
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 focus:border-indigo-500 focus:outline-none resize-y"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Test Cases</label>
                <textarea
                  value={localTests}
                  onChange={(e) => setLocalTests(e.target.value)}
                  rows={4}
                  placeholder="Input:\nOutput:"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-md px-3 py-2 text-sm font-mono text-gray-400 focus:border-indigo-500 focus:outline-none resize-y"
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
            <h1 className="text-2xl font-bold text-gray-100">{problemTitle || "Untitled Problem"}</h1>
            <div className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">
              {problemDesc || "No description provided."}
            </div>
            {(problemTests || "").trim() && (
              <div className="bg-[#0a0a0a] rounded-lg p-4 border border-gray-800">
                <h3 className="text-sm font-bold text-gray-300 mb-2">Test Cases</h3>
                <pre className="text-xs font-mono text-gray-500 whitespace-pre-wrap overflow-x-auto">
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
