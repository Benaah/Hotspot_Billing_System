export interface User {
  id: string;
  email: string;
  full_name?: string;
  created_at: string;
}

export type Package = {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_hours: number;
  data_limit_mb: number | null;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  data_used_mb: number;
  created_at: string;
  package?: Package;
}

export interface Transaction {
  id: string;
  user_id: string;
  subscription_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  payment_method: string;
  created_at: string;
}