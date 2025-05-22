//
import { useUserStore } from '@/stores/useUserStore';
import api from '@/services/axios';

export const authService = {

    /**
     * Update the user profile
     * @param userId
     * @param profile the user detail fields
     * @returns Updated profile
     * @throws Update Exception
     */
    async updateProfile(userId: string, profile: string): Promise<any> {
      try {
        const response = await api.post(`/profile_upd`, {
          userId,
          profile,
        });
        if (response.data) {
          useUserStore.getState().updateProfile(response.data.profile);
        }
        return response.data;
      } catch (error) {
        console.error('Profile update error:', error);
        throw error;
      }
    },
};
