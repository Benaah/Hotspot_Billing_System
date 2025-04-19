export interface Package {
    id: string;
    name: string;
    description: string;
    price: number;
    duration_hours: number;
    data_limit_mb: number | null;
  }