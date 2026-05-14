"use client"

import dynamic from "next/dynamic"

const WorkspaceEditor = dynamic(() => import("./WorkspaceEditor"), {
  ssr: false,
  loading: () => <div className="flex-1 flex items-center justify-center bg-[#1e1e1e] text-gray-500">Loading Editor...</div>
})

export default function ClientWorkspaceEditor(props: any) {
  return <WorkspaceEditor {...props} />
}
