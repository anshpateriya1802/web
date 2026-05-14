"use client"

import dynamic from "next/dynamic"

const CollaborativeWhiteboard = dynamic(() => import("./CollaborativeWhiteboard"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex flex-col bg-[#1e1e1e] overflow-hidden items-center justify-center text-gray-500 h-full w-full">
      Loading Whiteboard...
    </div>
  )
})

export default function ClientCollaborativeWhiteboard(props: any) {
  return <CollaborativeWhiteboard {...props} />
}
