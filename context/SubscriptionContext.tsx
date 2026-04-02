import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
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
  telegram_username?: string;
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
  showCongrats: boolean;
  dismissCongrats: () => void;
}

const FALLBACK_PLANS: Plan[] = [
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
      '24/7 Priority Support',
    ],
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
      '24/7 Priority Support',
    ],
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
      '24/7 Priority Support',
    ],
  },
];

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [details, setDetails] = useState<SubscriptionDetails | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activationInstructions, setActivationInstructions] = useState('');
  const [telegramLink, setTelegramLink] = useState('');
  const [showCongrats, setShowCongrats] = useState(false);

  // Track previous status to detect activation transitions
  const previousStatusRef = useRef<string | null>(null);
  const plansLoadedRef = useRef(false);

  const isFeatureLocked = (feature: 'sales' | 'inventory' | 'products'): boolean => {
    if (!details) return false;
    if (details.subscription_status === 'active') return false;
    if (details.subscription_status === 'expired' || details.subscription_status === 'trial_ended') {
      return ['sales', 'inventory'].includes(feature);
    }
    return false;
  };

  const showSubscriptionBanner = details ? details.subscription_status !== 'active' : false;

  const dismissCongrats = useCallback(() => setShowCongrats(false), []);

  const checkSubscription = useCallback(async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        setIsLocked(false);
        setLoading(false);
        return;
      }

      const statusRes = await api.get('/subscription?action=check');
      if (statusRes.data.status === 'success') {
        const data: SubscriptionDetails = statusRes.data.data;

        // Detect activation: previous status was non-active, new status is active
        const prev = previousStatusRef.current;
        if (
          prev !== null &&
          prev !== 'active' &&
          data.subscription_status === 'active'
        ) {
          setShowCongrats(true);
          // Clear any pending transaction refs for all plans on activation
          const planIds = ['monthly', 'quarterly', 'yearly'];
          const userId = data.username || 'user';
          await Promise.all(
            planIds.map((pid) => storage.removeItem(`pending_txn_${pid}_${userId}`))
          );
        }

        previousStatusRef.current = data.subscription_status;
        setDetails(data);
        setIsLocked(data.is_locked);
      }

      // Fetch plans only once
      if (!plansLoadedRef.current) {
        try {
          const plansRes = await api.get('/subscription?action=plans');
          if (
            plansRes.data.status === 'success' &&
            plansRes.data.data?.plans &&
            Array.isArray(plansRes.data.data.plans)
          ) {
            const fallbackPrices: Record<string, string> = {
              monthly: '200',
              quarterly: '400',
              yearly: '850',
            };
            const processedPlans = plansRes.data.data.plans.map((plan: any) => ({
              ...plan,
              price: plan.price ? String(plan.price) : fallbackPrices[plan.id] || '0',
              features: Array.isArray(plan.features)
                ? plan.features
                : [
                    'Full access to Inventory Management',
                    'Sales & Purchase tracking',
                    'Product & Expense modules',
                    'Advanced Reports & Analytics',
                    'Mobile-optimized interface',
                    '24/7 Priority Support',
                  ],
            }));
            setPlans(processedPlans);
            setActivationInstructions(plansRes.data.data.activation_instructions || '');
            setTelegramLink(plansRes.data.data.telegram_link || '');
            plansLoadedRef.current = true;
          } else {
            setPlans(FALLBACK_PLANS);
            setActivationInstructions('Please contact admin for activation instructions.');
            setTelegramLink('https://t.me/SpecificethiopiaSolution');
          }
        } catch {
          setPlans(FALLBACK_PLANS);
          setActivationInstructions('Please contact admin for activation instructions.');
          setTelegramLink('https://t.me/SpecificethiopiaSolution');
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Re-fetch when app comes back to foreground (clears stale cache)
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkSubscription();
      }
    };
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [checkSubscription]);

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
        showCongrats,
        dismissCongrats,
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
