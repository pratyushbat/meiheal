export interface USubscriptionPlan {
  _id: string;
  slug: string;
  description: string;
  name: string;
  price: number;
  currency: string;
  billingInterval: 'weekly' | 'monthly' | 'quarterly';
  durationInCycles?: number; // omit = runs until cancelled
  features?: string[];
  thumbnail: string;
  isActive: boolean;
}