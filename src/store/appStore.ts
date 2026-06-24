import { create } from 'zustand';
import { UserProfile, Match, Message } from '../types';

interface AppStore {
  discoveryProfiles: UserProfile[];
  matches: Match[];
  filters: {
    minAge: number;
    maxAge: number;
    distance: number;
    gender: 'Homme' | 'Femme' | 'Les deux';
    onlyVerified: boolean;
    onlyPremium: boolean;
  };
  isOffline: boolean;
  activeCall: {
    inCall: boolean;
    callerId?: string;
    callerName?: string;
    isVideo: boolean;
    status?: 'incoming' | 'outgoing' | 'connected' | 'ended';
  } | null;
  
  setDiscoveryProfiles: (profiles: UserProfile[]) => void;
  setMatches: (matches: Match[]) => void;
  setFilters: (filters: Partial<AppStore['filters']>) => void;
  setIsOffline: (offline: boolean) => void;
  startCall: (callerId: string, callerName: string, isVideo: boolean, isIncoming?: boolean) => void;
  endCall: () => void;
  acceptCall: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  discoveryProfiles: [],
  matches: [],
  filters: {
    minAge: 18,
    maxAge: 60,
    distance: 50,
    gender: 'Les deux',
    onlyVerified: false,
    onlyPremium: false,
  },
  isOffline: !navigator.onLine,
  activeCall: null,

  setDiscoveryProfiles: (profiles) => set({ discoveryProfiles: profiles }),
  setMatches: (matches) => set({ matches }),
  setFilters: (filters) => set((state) => ({ filters: { ...state.filters, ...filters } })),
  setIsOffline: (offline) => set({ isOffline: offline }),
  startCall: (callerId, callerName, isVideo, isIncoming = false) => set({
    activeCall: {
      inCall: true,
      callerId,
      callerName,
      isVideo,
      status: isIncoming ? 'incoming' : 'outgoing'
    }
  }),
  endCall: () => set({ activeCall: null }),
  acceptCall: () => set((state) => ({
    activeCall: state.activeCall ? { ...state.activeCall, status: 'connected' } : null
  }))
}));
