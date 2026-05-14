"use client"

import { motion } from "framer-motion"
import { createRoomAction, joinRoomAction, deleteRoomAction, updateRoomAction, leaveRoomAction } from "@/app/actions"
import { Clock, Plus, LogIn, Code, ArrowRight, Trash2, Edit2, LogOut, MoreVertical } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface RoomData {
  id: string;
  code: string;
  name: string;
  createdAt: Date;
  maxParticipants: number;
}

interface ParticipantData {
  role: string;
  joinedAt: Date;
  room: RoomData;
}

interface DashboardClientProps {
  userEmail: string;
  rooms: ParticipantData[];
}

export default function DashboardClient({ userEmail, rooms }: DashboardClientProps) {
  const router = useRouter()
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  }

  const handleCardClick = (code: string, e: React.MouseEvent) => {
    // Only navigate if we didn't click a button or input inside the card
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) return;
    router.push(`/room/${code}`)
  }

  const submitEdit = async (roomId: string) => {
    await updateRoomAction(roomId, editName)
    setEditingRoomId(null)
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-12">
      <header className="flex justify-between items-center border-b border-gray-800 pb-6">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-xl font-black text-white">CR</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">CodeRealm</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1.5 bg-gray-900 rounded-full border border-gray-800 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-gray-300 text-xs font-medium">{userEmail}</span>
          </div>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="rounded-md bg-gray-800 px-4 py-2 text-xs font-bold text-gray-300 hover:text-white hover:bg-gray-700 transition-colors uppercase tracking-wider"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <motion.section 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible" 
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Create Room Card */}
        <motion.div variants={itemVariants} className="relative group rounded-2xl border border-gray-800 bg-[#111111] p-8 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
              <Plus size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">New Workspace</h2>
          </div>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed min-h-[40px]">
            Create a private buffer. You control exactly what gets synced with your collaborators.
          </p>
          <form action={createRoomAction}>
            <div className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Workspace Name (Optional)"
                className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder-gray-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm transition-all shadow-inner"
              />
              <button 
                type="submit"
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 transition-colors shadow-[0_0_20px_-5px_rgba(79,70,229,0.5)]"
              >
                Create Workspace
              </button>
            </div>
          </form>
        </motion.div>

        {/* Join Room Card */}
        <motion.div variants={itemVariants} className="relative group rounded-2xl border border-gray-800 bg-[#111111] p-8 shadow-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <LogIn size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Join Workspace</h2>
          </div>
          <p className="text-gray-400 mb-8 text-sm leading-relaxed min-h-[40px]">
            Have an invite code? Enter it below to join an existing session.
          </p>
          <form action={joinRoomAction}>
            <div className="flex space-x-3 pt-[52px]">
              <input
                type="text"
                name="code"
                placeholder="e.g. X7F9P2"
                required
                className="w-full appearance-none rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white placeholder-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:text-sm transition-all font-mono uppercase tracking-widest shadow-inner"
              />
              <button 
                type="submit"
                className="rounded-lg bg-blue-600 px-8 py-3 text-sm font-bold text-white hover:bg-blue-500 transition-colors shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]"
              >
                Join
              </button>
            </div>
          </form>
        </motion.div>
      </motion.section>

      {/* Room History Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="pt-8"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white flex items-center">
            <Clock className="mr-2 text-gray-400" size={20} />
            Recent Workspaces
          </h3>
          <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-900 rounded-md border border-gray-800">
            {rooms.length} Total
          </span>
        </div>

        {rooms.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-gray-800 rounded-2xl bg-[#0a0a0a]">
            <Code className="mx-auto h-8 w-8 text-gray-700 mb-3" />
            <p className="text-gray-500 text-sm">No recent workspaces.</p>
            <p className="text-gray-600 text-xs mt-1">Create or join one above to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rooms.map((participant) => {
              const isOwner = participant.role === 'owner';
              const isEditing = editingRoomId === participant.room.id;

              return (
                <motion.div 
                  key={participant.room.id}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: isEditing ? 1 : 0.98 }}
                  onClick={(e) => handleCardClick(participant.room.code, e as any)}
                  className="p-5 rounded-xl border border-gray-800 bg-[#111111] hover:border-gray-600 transition-colors cursor-pointer group relative flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-2">
                      {isEditing ? (
                        <div className="flex space-x-2">
                          <input 
                            autoFocus
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitEdit(participant.room.id);
                              if (e.key === 'Escape') setEditingRoomId(null);
                            }}
                            className="w-full bg-gray-900 border border-indigo-500 rounded px-2 py-1 text-sm text-white focus:outline-none"
                          />
                          <button onClick={() => submitEdit(participant.room.id)} className="bg-indigo-600 px-2 py-1 rounded text-xs text-white">Save</button>
                        </div>
                      ) : (
                        <h4 className="font-semibold text-white truncate max-w-[180px]">
                          {participant.room.name || "Untitled Workspace"}
                        </h4>
                      )}
                      <p className="text-xs text-gray-500 mt-1 font-mono">{participant.room.code}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <div className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded bg-gray-900 text-gray-400 border border-gray-800">
                        {participant.role}
                      </div>
                      
                      {/* Room Actions */}
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {isOwner ? (
                          <>
                            <button 
                              onClick={(e) => { e.stopPropagation(); setEditName(participant.room.name); setEditingRoomId(participant.room.id); }}
                              className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-900/20 rounded"
                              title="Rename Workspace"
                            >
                              <Edit2 size={14} />
                            </button>
                            <form action={() => deleteRoomAction(participant.room.id)}>
                              <button 
                                type="submit"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                                title="Delete Workspace"
                              >
                                <Trash2 size={14} />
                              </button>
                            </form>
                          </>
                        ) : (
                          <form action={() => leaveRoomAction(participant.room.id)}>
                            <button 
                              type="submit"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded"
                              title="Leave Workspace"
                            >
                              <LogOut size={14} />
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800/50">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock size={12} className="mr-1" />
                      {formatDistanceToNow(new Date(participant.joinedAt), { addSuffix: true })}
                    </div>
                    <ArrowRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </motion.section>
    </div>
  )
}
