import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';

interface FeatureGuardProps {
  children: React.ReactNode;
  feature: 'sales' | 'inventory' | 'products';
  featureName: string;
}

export const FeatureGuard: React.FC<FeatureGuardProps> = ({ children, feature, featureName }) => {
  const subscriptionContext = useSubscription();
  const { isFeatureLocked, details, plans = [], telegramLink } = subscriptionContext || {};
  const { t } = useLanguage();
  const router = useRouter();

  if (!subscriptionContext || !isFeatureLocked || !isFeatureLocked(feature)) {
    return <>{children}</>;
  }

  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.iconContainer}>
          <View style={styles.lockBackground}>
            <MaterialCommunityIcons name="lock-alert" size={70} color="#ef4444" />
          </View>
        </View>

        <Text style={styles.title}>{t('featureLocked', 'subscription')}</Text>
        <Text style={styles.message}>
          {t('featureLockedMessage', 'subscription', { feature: featureName })}
        </Text>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('status', 'subscription')}:</Text>
            <Text style={[styles.statusValue, { color: '#ef4444' }]}>
              {details?.subscription_status === 'expired' ? t('expired', 'subscription') : t('trialEnded', 'subscription')}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>{t('plan', 'subscription')}:</Text>
            <Text style={styles.statusValueText}>{details?.subscription_plan || 'Free Plan'}</Text>
          </View>
        </View>

        {/* Upgrade Options */}
        <Text style={styles.sectionTitle}>{t('upgradeOptions', 'subscription')}</Text>
        {Array.isArray(plans) && plans.map((plan) => (
          <View key={plan.id} style={[styles.planCard, plan.popular && styles.popularPlan]}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularText}>POPULAR</Text>
                </View>
              )}
            </View>
            <Text style={styles.planDuration}>{plan.duration}</Text>
            <Text style={styles.planPrice}>{plan.price === 'Contact Admin' ? t('priceOnRequest', 'subscription') : plan.price}</Text>
          </View>
        ))}

        {/* Actions */}
        <TouchableOpacity
          style={styles.upgradeButton}
          onPress={() => router.push('/subscription-packages')}
        >
          <LinearGradient
            colors={['#2974ff', '#1a4c9e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <MaterialCommunityIcons name="crown" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>{t('upgradeNow', 'subscription')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            const message = `Hello! I want to upgrade my subscription. Current plan: ${details?.subscription_plan || 'Free'}. Please send payment details and available plans.`;
            const telegramUrl = `${telegramLink || 'https://t.me/xesser'}?text=${encodeURIComponent(message)}`;
            Linking.openURL(telegramUrl);
          }}
        >
          <MaterialCommunityIcons name="send" size={20} color="#2974ff" style={{ marginRight: 8 }} />
          <Text style={styles.contactText}>{t('contactForPayment', 'subscription')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  lockBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  statusCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  statusValue: {
    fontWeight: '700',
    fontSize: 14,
  },
  statusValueText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    width: '100%',
    marginBottom: 16,
  },
  planCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  popularPlan: {
    borderColor: 'rgba(41, 116, 255, 0.4)',
    backgroundColor: 'rgba(41, 116, 255, 0.05)',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  popularBadge: {
    backgroundColor: '#2974ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  popularText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
  },
  planDuration: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2974ff',
  },
  upgradeButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 16,
  },
  gradientButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  contactText: {
    color: '#2974ff',
    marginLeft: 8,
    fontWeight: '600',
  },
});