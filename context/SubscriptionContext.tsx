import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../app/lib/api';
import storage from '../app/lib/storage';

interface Plan {
  id: string;
  name: string;
  duration: string;
  price: string;
  period?: string;
  popular?: boolean;
  badge?: string | null;
  saving?: string | null;
  duration_text?: string;
  message_suffix?: string;
  features?: string[];
}

interface SubscriptionDetails {
  is_locked: boolean;
  subscription_status: string;
  subscription_plan: string;
  trial_ends_at: string | null;
  subscription_expires_at: string | null;
  message: string;
  username?: string;
  email?: string;
}

interface SubscriptionContextType {
  isLocked: boolean;
  details: SubscriptionDetails | null;
  plans: Plan[];
  loading: boolean;
  refreshStatus: () => Promise<void>;
  activationInstructions: string;
  telegramLink: string;
  isFeatureLocked: (feature: 'sales' | 'inventory' | 'products') => boolean;
  showSubscriptionBanner: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activationInstructions, setActivationInstructions] = useState('');
  const [telegramLink, setTelegramLink] = useState('');

  const isFeatureLocked = (feature: 'sales' | 'inventory' | 'products'): boolean => {
    if (!details) return false;

    // If subscription is active, no features are locked
    if (details.subscription_status === 'active') return false;

    // If subscription is expired or trial ended, lock premium features
    if (details.subscription_status === 'expired' || details.subscription_status === 'trial_ended') {
      return ['sales', 'inventory'].includes(feature);
    }

    return false;
  };

  const showSubscriptionBanner = details ? details.subscription_status !== 'active' : false;

  const checkSubscription = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        setIsLocked(false);
        setLoading(false);
        return;
      }

      // Fetch status
      const statusRes = await api.get('/subscription?action=check');
      if (statusRes.data.status === 'success') {
        const data = statusRes.data.data;
        setDetails(data);
        setIsLocked(data.is_locked);
      }

      // Fetch plans (only once or if needed)
      if (plans.length === 0) {
        try {
          const plansRes = await api.get('/subscription?action=plans');
          if (plansRes.data.status === 'success' && plansRes.data.data?.plans && Array.isArray(plansRes.data.data.plans)) {
            // Fallback prices
            const fallbackPrices: Record<string, string> = {
              'monthly': '200',
              'quarterly': '400',
              'yearly': '850'
            };
            // Ensure each plan has features array and price is string
            const processedPlans = plansRes.data.data.plans.map((plan: any) => ({
              ...plan,
              price: plan.price ? String(plan.price) : fallbackPrices[plan.id] || '0',
              features: Array.isArray(plan.features) ? plan.features : [
                'Full access to Inventory Management',
                'Sales & Purchase tracking',
                'Product & Expense modules',
                'Advanced Reports & Analytics',
                'Mobile-optimized interface',
                '24/7 Priority Support'
              ]
            }));
            setPlans(processedPlans);
            setActivationInstructions(plansRes.data.data.activation_instructions || '');
            setTelegramLink(plansRes.data.data.telegram_link || '');
          } else {
            // Fallback plans if API fails
            console.warn('API did not return plans, using fallback data');
            setPlans([
              {
                id: 'monthly',
                name: 'Monthly',
                duration: '30 days',
                price: '200',
                period: 'Monthly',
                popular: false,
                badge: null,
                saving: null,
                duration_text: 'billed monthly',
                message_suffix: 'Monthly Plan (200 ETB)',
                features: [
                  'Full access to Inventory Management',
                  'Sales & Purchase tracking',
                  'Product & Expense modules',
                  'Advanced Reports & Analytics',
                  'Mobile-optimized interface',
                  '24/7 Priority Support'
                ]
              },
              {
                id: 'quarterly',
                name: 'Quarterly',
                duration: '90 days',
                price: '400',
                period: 'Quarterly',
                popular: true,
                badge: 'MOST POPULAR',
                saving: 'Save 200 ETB',
                duration_text: 'every 3 months',
                message_suffix: 'Quarterly Plan (400 ETB)',
                features: [
                  'Full access to Inventory Management',
                  'Sales & Purchase tracking',
                  'Product & Expense modules',
                  'Advanced Reports & Analytics',
                  'Mobile-optimized interface',
                  '24/7 Priority Support'
                ]
              },
              {
                id: 'yearly',
                name: 'Yearly',
                duration: '365 days',
                price: '850',
                period: 'Yearly',
                popular: false,
                badge: 'BEST VALUE',
                saving: 'Save 1550 ETB/year',
                duration_text: 'billed annually',
                message_suffix: 'Yearly Plan (850 ETB)',
                features: [
                  'Full access to Inventory Management',
                  'Sales & Purchase tracking',
                  'Product & Expense modules',
                  'Advanced Reports & Analytics',
                  'Mobile-optimized interface',
                  '24/7 Priority Support'
                ]
              }
            ]);
            setActivationInstructions('Please contact admin for activation instructions.');
            setTelegramLink('https://t.me/specificethiopiaInventory');
          }
        } catch (error) {
          console.error('Error fetching plans:', error);
          // Use fallback plans on error
          setPlans([
            {
              id: 'monthly',
              name: 'Monthly',
              duration: '30 days',
              price: '200',
              period: 'Monthly',
              popular: false,
              badge: null,
              saving: null,
              duration_text: 'billed monthly',
              message_suffix: 'Monthly Plan (200 ETB)',
              features: [
                'Full access to Inventory Management',
                'Sales & Purchase tracking',
                'Product & Expense modules',
                'Advanced Reports & Analytics',
                'Mobile-optimized interface',
                '24/7 Priority Support'
              ]
            },
            {
              id: 'quarterly',
              name: 'Quarterly',
              duration: '90 days',
              price: '400',
              period: 'Quarterly',
              popular: true,
              badge: 'MOST POPULAR',
              saving: 'Save 200 ETB',
              duration_text: 'every 3 months',
              message_suffix: 'Quarterly Plan (400 ETB)',
              features: [
                'Full access to Inventory Management',
                'Sales & Purchase tracking',
                'Product & Expense modules',
                'Advanced Reports & Analytics',
                'Mobile-optimized interface',
                '24/7 Priority Support'
              ]
            },
            {
              id: 'yearly',
              name: 'Yearly',
              duration: '365 days',
              price: '850',
              period: 'Yearly',
              popular: false,
              badge: 'BEST VALUE',
              saving: 'Save 1550 ETB/year',
              duration_text: 'billed annually',
              message_suffix: 'Yearly Plan (850 ETB)',
              features: [
                'Full access to Inventory Management',
                'Sales & Purchase tracking',
                'Product & Expense modules',
                'Advanced Reports & Analytics',
                'Mobile-optimized interface',
                '24/7 Priority Support'
              ]
            }
          ]);
          setActivationInstructions('Please contact admin for activation instructions.');
          setTelegramLink('https://t.me/specificethiopiaInventory');
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, []);

  return (
    <SubscriptionContext.Provider
      value={{
        isLocked,
        details,
        plans,
        loading,
        refreshStatus: checkSubscription,
        activationInstructions,
        telegramLink,
        isFeatureLocked,
        showSubscriptionBanner,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
