import { create } from 'zustand';
import { supabase } from 'src\\lib\\supabase';
import type { Package } from 'src\\pages\\types';

interface PackageState {
  packages: Package[];
  isLoading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
  purchasePackage: (packageId: string, paymentMethod: string) => Promise<boolean>;
}

export const usePackageStore = create<PackageState>((set, get) => ({
  packages: [],
  isLoading: false,
  error: null,

  fetchPackages: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('price');

      if (error) throw error;
      
      set({ packages: data as Package[] });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  purchasePackage: async (packageId, paymentMethod) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get the user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('User not authenticated');

      // Get the package details
      const { data: packageData, error: packageError } = await supabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single();
      
      if (packageError) throw packageError;
      if (!packageData) throw new Error('Package not found');

      const now = new Date();
      const endTime = new Date(now.getTime() + packageData.duration_hours * 60 * 60 * 1000);

      // Create a subscription
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: user.id,
          package_id: packageId,
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          is_active: true,
          data_used_mb: 0,
        })
        .select()
        .single();

      if (subscriptionError) throw subscriptionError;

      // Create a transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          subscription_id: subscription.id,
          amount: packageData.price,
          status: 'completed', // In a real app, this would be 'pending' until payment is confirmed
          payment_method: paymentMethod,
        });

      if (transactionError) throw transactionError;
      
      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));