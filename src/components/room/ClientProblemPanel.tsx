"use client"

import dynamic from "next/dynamic"

const ProblemPanel = dynamic(() => import("./ProblemPanel"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col bg-[#111111] overflow-hidden items-center justify-center text-gray-500 h-full w-full border-r border-gray-700">
      Loading Problem...
    </div>
  )
})

export default function ClientProblemPanel() {
  return <ProblemPanel />
}
