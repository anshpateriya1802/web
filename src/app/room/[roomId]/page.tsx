import { auth } from "@/auth"
import { redirect } from "next/navigation"
import RoomSidebar from "@/components/room/RoomSidebar"
import { PrismaClient } from "@prisma/client"
import ClientRoomLayout from "@/components/room/ClientRoomLayout"

const prisma = new PrismaClient()

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const { roomId } = await params
  
  // Verify room exists and user is a participant
  const room = await prisma.room.findUnique({
    where: { code: roomId }
  })

  if (!room) {
    redirect("/") // Room not found
  }

  const participant = await prisma.roomParticipant.findUnique({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId: session.user.id as string
      }
    }
  })

  if (!participant) {
    // Optionally auto-join or redirect to dashboard
    redirect("/")
  }
  
  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
      {/* Sidebar / Participants */}
      <RoomSidebar roomId={roomId} currentUserEmail={session.user.email || ""} currentUserId={session.user.id as string} />

      {/* Main Area: Problem + Editor + Whiteboard with Resizable Panels */}
      <main className="flex-1 flex relative overflow-hidden">
        <ClientRoomLayout 
          roomId={roomId}
          userId={session.user.id as string}
          userName={session.user.name || session.user.email || "Anonymous"}
        />
      </main>
    </div>
  )
}
