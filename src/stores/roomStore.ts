import { create } from 'zustand'

export interface Participant {
  userId: string;
  name: string;
  color?: string;
}

export type Theme = 'dark' | 'light'

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

  // V2: Whiteboard State
  isWhiteboardOpen: boolean
  toggleWhiteboard: () => void

  // V3: Problem Panel State
  isProblemOpen: boolean
  toggleProblem: () => void
  problemTitle: string
  problemDesc: string
  problemTests: string
  setProblemData: (title: string, desc: string, tests: string) => void

  // V4: Global Theme
  theme: Theme
  toggleTheme: () => void
}

export const useRoomStore = create<RoomState>((set) => ({
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
  problemTitle: "",
  problemDesc: "",
  problemTests: "",
  setProblemData: (title, desc, tests) => set({ problemTitle: title, problemDesc: desc, problemTests: tests }),

  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
}))
