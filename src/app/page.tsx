import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import DashboardClient from "@/components/dashboard/DashboardClient"

const prisma = new PrismaClient()

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Fetch user's room history
  const userRooms = await prisma.roomParticipant.findMany({
    where: {
      userId: session.user.id as string
    },
    include: {
      room: true
    },
    orderBy: {
      joinedAt: 'desc'
    }
  })

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0a0a0a] text-white p-8 font-sans">
      <DashboardClient 
        userEmail={session.user.email || "Anonymous"} 
        rooms={userRooms} 
      />
    </main>
  )
}
