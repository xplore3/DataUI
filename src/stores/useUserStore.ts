import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile } from '@/types/auth';

interface UserState {
  taskId: string | null;
  taskIdExpired: number | 0;
  userProfile: UserProfile | null;
  isAuthenticated: boolean;

  login: (userProfile: UserProfile) => void;
  logout: () => void;
  setTaskId: (taskId: string) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;

  getUserId: () => string | null;
  getTaskId: () => string | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      taskId: null,
      taskIdExpired: 0,
      userProfile: null,
      isAuthenticated: false,

      login: userProfile => {
        set({
          taskId: null,
          taskIdExpired: 0,
          userProfile,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          taskId: null,
          taskIdExpired: 0,
          userProfile: null,
          isAuthenticated: false,
        });
      },

      setTaskId: taskId => {
        set({
          taskId: taskId,
          taskIdExpired: Date.now(),
        });
      },

      updateProfile: profile => {
        const currentProfile = get().userProfile;
        if (!currentProfile) {
            set({ userProfile: profile as UserProfile })
        }else{
            set({ userProfile: { ...currentProfile, ...profile } });
        }
      },

      getUserId: () => get().userProfile?.userId || null,
      getTaskId: () => {
        const expired = get().taskIdExpired;
        if (expired > 0 && Date.now() - expired > 1000 * 60 * 10) {
           return null;
        }
        return get().taskId || null;
      }
    }),
    {
      name: 'user-store', // Key used in localStorage
      partialize: (state) => ({
        taskId: state.taskId,
        taskIdExpired: state.taskIdExpired,
        userProfile: state.userProfile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
