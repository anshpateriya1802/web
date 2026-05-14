import { auth } from "@/auth"
import { redirect } from "next/navigation"
import RoomSidebar from "@/components/room/RoomSidebar"
import { prisma } from '@/lib/prisma'
import ClientRoomLayout from "@/components/room/ClientRoomLayout"

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const session = await auth()
  
  if (!session?.user) redirect("/login")

  const { roomId } = await params
  
  const room = await prisma.room.findUnique({ where: { code: roomId } })
  if (!room) redirect("/")

  const participant = await prisma.roomParticipant.findUnique({
    where: { roomId_userId: { roomId: room.id, userId: session.user.id as string } }
  })
  if (!participant) redirect("/")
  
  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white overflow-hidden">
      <RoomSidebar
        roomId={roomId}
        currentUserEmail={session.user.email || ""}
        currentUserId={session.user.id as string}
      />
      <main className="flex-1 flex relative overflow-hidden">
        <ClientRoomLayout
          roomId={roomId}
          roomDbId={room.id}
          userId={session.user.id as string}
          userName={session.user.name || session.user.email || "Anonymous"}
        />
      </main>
    </div>
  )
}
