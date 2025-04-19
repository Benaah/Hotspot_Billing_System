import { create } from 'zustand';

interface Package {
  id: string | number;
  name: string;
  description: string;
  price: number;
  duration_hours: number;
  data_limit_mb: number | null;
  is_active: boolean;
}

interface Subscription {
  id: string;
  end_time: string;
  start_time: string;
  data_used_mb: number;
  created_at: string;
  is_active: boolean;
  package: Package;
}

interface SubscriptionStore {
  subscriptions: Subscription[];
  isLoading: boolean;
  fetchUserSubscriptions: () => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  subscriptions: [],
  isLoading: false,
  fetchUserSubscriptions: async () => {
    set({ isLoading: true });
    try {
      // Replace this with your actual API call
      const response = await fetch('/api/subscriptions');
      const data = await response.json();
      set({ subscriptions: data });
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));