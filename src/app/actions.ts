"use server"

import { auth } from "@/auth"
import { prisma } from '@/lib/prisma'
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

// Helper to generate a 6-character random room code
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export async function createRoomAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const roomName = formData.get("name") as string || "Untitled Room"
  const roomCode = generateRoomCode()

  const room = await prisma.room.create({
    data: {
      name: roomName,
      code: roomCode,
      ownerId: session.user.id,
      participants: {
        create: {
          userId: session.user.id,
          role: "owner"
        }
      }
    }
  })

  redirect(`/room/${room.code}`)
}

export async function joinRoomAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const code = formData.get("code") as string
  if (!code) {
    throw new Error("Room code is required")
  }

  const roomCode = code.trim().toUpperCase()

  const room = await prisma.room.findUnique({
    where: { code: roomCode }
  })

  if (!room) {
    throw new Error("Room not found")
  }

  // Add user to room if not already a participant
  const existingParticipant = await prisma.roomParticipant.findUnique({
    where: {
      roomId_userId: {
        roomId: room.id,
        userId: session.user.id
      }
    }
  })

  if (!existingParticipant) {
    await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: session.user.id,
        role: "editor"
      }
    })
  }

  redirect(`/room/${room.code}`)
}

export async function deleteRoomAction(roomId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  // Ensure user is owner
  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (room?.ownerId === session.user.id) {
    await prisma.room.delete({ where: { id: roomId } })
    revalidatePath("/")
  }
}

export async function updateRoomAction(roomId: string, newName: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const room = await prisma.room.findUnique({ where: { id: roomId } })
  if (room?.ownerId === session.user.id) {
    await prisma.room.update({
      where: { id: roomId },
      data: { name: newName }
    })
    revalidatePath("/")
  }
}

export async function leaveRoomAction(roomId: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  await prisma.roomParticipant.delete({
    where: {
      roomId_userId: {
        roomId: roomId,
        userId: session.user.id
      }
    }
  })
  revalidatePath("/")
}
