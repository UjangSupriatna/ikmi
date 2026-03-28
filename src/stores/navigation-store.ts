import { create } from 'zustand'

export type NavigationTarget = 
  | { type: 'feed' }
  | { type: 'profile'; userId?: string }
  | { type: 'friends'; tab?: 'friends' | 'requests' | 'suggestions' }
  | { type: 'groups'; groupId?: string }
  | { type: 'post'; postId: string }
  | { type: 'messages'; conversationId?: string }

interface NavigationState {
  // The current navigation target to process
  pendingNavigation: NavigationTarget | null
  
  // Actions
  navigate: (target: NavigationTarget) => void
  clearNavigation: () => void
}

export const useNavigationStore = create<NavigationState>((set) => ({
  pendingNavigation: null,
  
  navigate: (target) => {
    set({ pendingNavigation: target })
  },
  
  clearNavigation: () => {
    set({ pendingNavigation: null })
  },
}))
