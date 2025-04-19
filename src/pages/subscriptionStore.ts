import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Subscription } from 'src\\pages\\types';

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
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          package:packages(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
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
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('subscriptions')
        .select(`
          *,
          package:packages(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .gte('end_time', now)
        .order('end_time', { ascending: true })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "No rows returned" error
        throw error;
      }
      
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
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ data_used_mb: dataUsedMb })
        .eq('id', subscriptionId);

      if (error) throw error;
      
      // Refresh the active subscription
      await useSubscriptionStore.getState().fetchActiveSubscription();
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },
}));