import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Participant {
  userId: string;
  name: string;
  color?: string;
}

// V2: File tree
export interface RoomFile {
  id:       string;
  name:     string;
  language: string;
  updatedAt: string;
}

export interface OpenFile extends RoomFile {
  content:  string;
  isDirty:  boolean;  // unsaved changes
}

interface RoomState {
  roomId: string | null
  activeOverlayUserId: string | null
  stagingBufferCode: string | null
  participants: Participant[]
  setRoomId: (id: string) => void
  setOverlayUser: (userId: string | null) => void
  setStagingBuffer: (code: string | null) => void
  setParticipants: (participants: Participant[]) => void

  // Callback registered by WorkspaceEditor to broadcast a sync request via Yjs Awareness
  broadcastSyncAction: ((targetUserId: string) => void) | null
  setBroadcastSyncAction: (fn: (targetUserId: string) => void) => void

  // Whiteboard State
  isWhiteboardOpen: boolean
  toggleWhiteboard: () => void

  // Problem Panel State
  isProblemOpen: boolean
  toggleProblem: () => void

  // AI Assistant Panel State
  isAIPanelOpen: boolean
  toggleAIPanel: () => void
  problemTitle: string
  problemDesc: string
  problemTests: string
  setProblemData: (title: string, desc: string, tests: string) => void

  // ── V2: Multi-file editor ─────────────────────────────────────────────────
  files:       RoomFile[]          // sidebar list (no content)
  openTabs:    OpenFile[]          // open editor tabs (with content)
  activeFileId: string | null      // currently viewed tab
  setFiles:     (files: RoomFile[]) => void
  openFile:     (file: OpenFile)   => void
  closeTab:     (id: string)       => void
  setActiveFile:(id: string)       => void
  updateTabContent: (id: string, content: string) => void
  markTabSaved: (id: string)       => void
  closeAllTabs: ()                 => void
}

export const useRoomStore = create<RoomState>()(persist((set, get) => ({
  roomId: null,
  activeOverlayUserId: null,
  stagingBufferCode: null,
  participants: [],
  setRoomId: (id) => set({ roomId: id }),
  setOverlayUser: (id) => set({ activeOverlayUserId: id }),
  setStagingBuffer: (code) => set({ stagingBufferCode: code }),
  setParticipants: (participants) => set({ participants }),

  broadcastSyncAction: null,
  setBroadcastSyncAction: (fn) => set({ broadcastSyncAction: fn }),

  isWhiteboardOpen: false,
  toggleWhiteboard: () => set((state) => ({ isWhiteboardOpen: !state.isWhiteboardOpen })),

  isProblemOpen: false,
  toggleProblem: () => set((state) => ({ isProblemOpen: !state.isProblemOpen })),

  isAIPanelOpen: false,
  toggleAIPanel: () => set((state) => ({ isAIPanelOpen: !state.isAIPanelOpen })),
  problemTitle: "",
  problemDesc: "",
  problemTests: "",
  setProblemData: (title, desc, tests) => set({ problemTitle: title, problemDesc: desc, problemTests: tests }),

  // ── V2: Multi-file editor ─────────────────────────────────────────────────
  files:        [],
  openTabs:     [],
  activeFileId: null,

  setFiles: (files) => set({ files }),

  openFile: (file) => set((state) => {
    const alreadyOpen = state.openTabs.find(t => t.id === file.id)
    if (alreadyOpen) return { activeFileId: file.id }
    return {
      openTabs:     [...state.openTabs, file],
      activeFileId: file.id,
    }
  }),

  closeTab: (id) => set((state) => {
    const remaining = state.openTabs.filter(t => t.id !== id)
    const newActive = state.activeFileId === id
      ? (remaining[remaining.length - 1]?.id ?? null)
      : state.activeFileId
    return { openTabs: remaining, activeFileId: newActive }
  }),

  setActiveFile: (id) => set({ activeFileId: id }),

  updateTabContent: (id, content) => set((state) => ({
    openTabs: state.openTabs.map(t =>
      t.id === id ? { ...t, content, isDirty: true } : t
    ),
  })),

  markTabSaved: (id) => set((state) => ({
    openTabs: state.openTabs.map(t =>
      t.id === id ? { ...t, isDirty: false } : t
    ),
  })),

  closeAllTabs: () => set({ openTabs: [], activeFileId: null }),
}), {
  name: 'coderealm-room-storage',
  partialize: (state) => ({ 
    openTabs: state.openTabs, 
    activeFileId: state.activeFileId 
  }),
}))
