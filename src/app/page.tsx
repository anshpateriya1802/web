import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from '@/lib/prisma'
import DashboardClient from "@/components/dashboard/DashboardClient"

export default async function HomePage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const userRooms = await prisma.roomParticipant.findMany({
    where:   { userId: session.user.id as string },
    include: { room: true },
    orderBy: { joinedAt: 'desc' },
  })

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0a0a0a] text-white p-8 font-sans">
      <DashboardClient
        userEmail={session.user.email || "Anonymous"}
        userName={session.user.name  || ""}
        rooms={userRooms}
      />
    </main>
  )
}
