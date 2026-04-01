import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import storage from '../app/lib/storage';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export const SubscriptionGuard: React.FC<SubscriptionGuardProps> = ({ children }) => {
  const subscriptionContext = useSubscription();
  const { isLocked, details, plans = [], loading, refreshStatus, activationInstructions, telegramLink, showSubscriptionBanner } = subscriptionContext || {};
  const { t } = useLanguage();
  const router = useRouter();

  if (!subscriptionContext || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2974ff" />
      </View>
    );
  }

  // Only lock the entire app for completely locked accounts (not just expired subscriptions)
  if (isLocked) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.iconContainer}>
            <View style={styles.lockBackground}>
              <MaterialCommunityIcons name="lock-alert" size={70} color="#ef4444" />
            </View>
          </View>

          <Text style={styles.title}>{t('restrictedTitle', 'subscription')}</Text>
          <Text style={styles.message}>{t('restrictedMessage', 'subscription')}</Text>

          {/* Current Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{t('status', 'subscription')}:</Text>
              <Text style={[styles.statusValue, { color: '#ef4444' }]}>
                {details?.subscription_status === 'expired' ? t('expired', 'subscription') : t('locked', 'subscription')}
              </Text>
            </View>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>{t('plan', 'subscription')}:</Text>
              <Text style={styles.statusValueText}>{details?.subscription_plan || 'N/A'}</Text>
            </View>
          </View>

          {/* Plans Section */}
          <Text style={styles.sectionTitle}>{t('availablePlans', 'subscription')}</Text>
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

          {/* Instructions */}
          <View style={styles.instructionsBox}>
            <MaterialCommunityIcons name="information-outline" size={20} color="#2974ff" />
            <Text style={styles.instructionsText}>{activationInstructions}</Text>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Linking.openURL(telegramLink || 'https://t.me/specificethiopiaInventory')}
          >
            <LinearGradient
              colors={['#2974ff', '#1a4c9e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <MaterialCommunityIcons name="send" size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>{t('contactAdmin', 'subscription')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.refreshButton} onPress={refreshStatus}>
              <MaterialCommunityIcons name="refresh" size={20} color="#2974ff" />
              <Text style={styles.refreshText}>{t('retry', 'common')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={async () => {
                await storage.removeItem('authToken');
                router.replace('/auth/login');
              }}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>{t('logout', 'profile')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    );
  }

  return (
    <>
      {showSubscriptionBanner && (
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.9)', 'rgba(220, 38, 38, 0.9)']}
            style={styles.banner}
          >
            <MaterialCommunityIcons name="alert-circle" size={20} color="#fff" />
            <Text style={styles.bannerText}>
              {details?.subscription_status === 'expired' 
                ? t('subscriptionExpiredBanner', 'subscription') 
                : t('subscriptionTrialBanner', 'subscription')}
            </Text>
            <TouchableOpacity
              style={styles.bannerButton}
              onPress={() => router.push('/subscription-packages')}
            >
              <Text style={styles.bannerButtonText}>{t('upgrade', 'subscription')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}
      {children}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f1623',
  },
  bannerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50, // Account for status bar
  },
  bannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  bannerButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  bannerButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
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
  instructionsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  instructionsText: {
    flex: 1,
    marginLeft: 12,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 24,
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
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  refreshText: {
    color: '#2974ff',
    marginLeft: 8,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  logoutText: {
    color: '#ef4444',
    marginLeft: 8,
    fontWeight: '600',
  },
});
