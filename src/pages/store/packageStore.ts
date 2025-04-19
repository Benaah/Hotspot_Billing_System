import { create } from 'zustand';
import type { Package } from '../types';

interface PackageState {
  packages: Package[];
  isLoading: boolean;
  error: string | null;
  fetchPackages: () => Promise<void>;
  purchasePackage: (packageId: string, paymentMethod: string) => Promise<boolean>;
}

export const usePackageStore = create<PackageState>((set) => ({
  packages: [],
  isLoading: false,
  error: null,

  fetchPackages: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await fetch('/api/packages?is_active=true&order=price');
      if (!response.ok) throw new Error('Failed to fetch packages');
      const data = await response.json();

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

      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, paymentMethod }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Purchase failed');
      }

      return true;
    } catch (error) {
      set({ error: (error as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
