import { create } from 'zustand';
import type { Subscription } from 'src/pages/types';

interface SubscriptionState {
  subscriptions: Subscription[];
  activeSubscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  fetchUserSubscriptions: () => Promise<void>;
  fetchActiveSubscription: () => Promise<void>;
  updateDataUsage: (subscriptionId: string, dataUsedMb: number) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  subscriptions: [],
  activeSubscription: null,
  isLoading: false,
  error: null,

  fetchUserSubscriptions: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/user/subscriptions');
      if (!response.ok) throw new Error('Failed to fetch subscriptions');
      const data = await response.json();

      set({ subscriptions: data as Subscription[] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchActiveSubscription: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/user/subscription/active');
      if (!response.ok) throw new Error('Failed to fetch active subscription');
      const data = await response.json();

      set({ activeSubscription: data as Subscription | null });
    } catch (error) {
      set({ error: (error as Error).message });
      set({ activeSubscription: null });
    } finally {
      set({ isLoading: false });
    }
  },

  updateDataUsage: async (subscriptionId, dataUsedMb) => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/subscription/updateDataUsage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId, dataUsedMb }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update data usage');
      }

      // Refresh the active subscription
      await useSubscriptionStore.getState().fetchActiveSubscription();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
