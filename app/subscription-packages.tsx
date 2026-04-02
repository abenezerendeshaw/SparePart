import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';
import storage from './lib/storage';

const { width, height } = Dimensions.get('window');

// Generate or reuse a persisted transaction reference for a given plan + user pair
async function getOrCreateTransactionRef(planId: string, userId: string): Promise<string> {
  const key = `pending_txn_${planId}_${userId}`;
  const existing = await storage.getItem(key);
  if (existing) return existing;
  const random4 = Math.random().toString(36).substring(2, 6).toUpperCase();
  const ref = `TXN-${userId.toUpperCase()}-${Date.now()}-${random4}`;
  await storage.setItem(key, ref);
  return ref;
}

// Build Telegram deep link with pre-filled message including transaction ref
function buildTelegramPaymentLink(
  telegramHandle: string,
  username: string,
  planName: string,
  amount: number,
  period: string,
  transactionRef: string,
  email?: string,
  telegramUsername?: string
): string {
  const handle = telegramHandle.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
  const baseUrl = `https://t.me/${handle}`;
  let text =
    `✅ PAYMENT REQUEST - ${planName}\n\n` +
    `🔖 Transaction Ref: ${transactionRef}\n` +
    `💰 Amount: ${amount} ETB\n` +
    `👤 Username: @${username}\n` +
    `📦 Plan: ${period}\n\n` +
    `📌 I have made the payment via Telebirr/Bank. Attached is the payment receipt screenshot.\n` +
    `Please activate my subscription. Thank you!`;
  if (email) text += `\n\n📧 Email: ${email}`;
  if (telegramUsername) text += `\n💬 Telegram: @${telegramUsername}`;
  return `${baseUrl}?text=${encodeURIComponent(text)}`;
}

export default function SubscriptionPackagesScreen() {
  const { plans, loading, details, telegramLink, refreshStatus, showCongrats, dismissCongrats } = useSubscription();
  const { t } = useLanguage();

  const handlePackageSelect = async (plan: any) => {
    const period = plan.period || plan.duration || 'Monthly';
    const amount = parseFloat(plan.price) || 0;
    const userId = details?.username || 'user';
    const transactionRef = await getOrCreateTransactionRef(plan.id, userId);
    const url = buildTelegramPaymentLink(
      telegramLink,
      userId,
      `${plan.name} (${period})`,
      amount,
      period,
      transactionRef,
      details?.email,
      details?.telegram_username,
    );
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>{t('loadingPlans', 'subscription')}</Text>
      </View>
    );
  }

  if (!plans || plans.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="package-variant" size={48} color="#6b7280" />
        <Text style={styles.emptyText}>{t('noPlans', 'subscription')}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshStatus}>
          <Text style={styles.retryButtonText}>{t('refresh', 'subscription')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const PackageCard = ({ plan }: { plan: any }) => {
    if (!plan) return null;
    const period = plan.period || plan.duration || 'Monthly';
    const isFeatured = plan.popular === true || plan.badge === 'MOST POPULAR';
    const price = parseFloat(plan.price) || 0;

    return (
      <View style={[styles.pricingCard, isFeatured && styles.featuredCard]}>
        <View style={styles.badgeContainer}>
          {plan.badge && (
            <View style={[styles.badge, isFeatured && styles.featuredBadge]}>
              <Text style={styles.badgeText}>{plan.badge}</Text>
            </View>
          )}
          {plan.saving && (
            <View style={styles.savingBadge}>
              <MaterialCommunityIcons name="tag" size={10} color="#10b981" />
              <Text style={styles.savingText}>{plan.saving}</Text>
            </View>
          )}
        </View>

        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPeriod}>{period} {t('subscription', 'subscription')}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>{price}</Text>
            <Text style={styles.priceCurrency}>ETB</Text>
            <Text style={styles.pricePeriod}>/ {period.toLowerCase()}</Text>
          </View>
          <Text style={styles.priceNote}>{plan.duration_text || t('billedAccordingly', 'subscription')}</Text>
        </View>

        {Array.isArray(plan.features) && plan.features.length > 0 && (
          <View style={styles.featuresList}>
            {plan.features.map((feature: string, idx: number) => (
              <View key={idx} style={styles.featureItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.ctaButton, isFeatured && styles.featuredButton]}
          onPress={() => handlePackageSelect({ ...plan, period, price })}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isFeatured ? ['#10b981', '#059669'] : ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.buttonGradient}
          >
            <MaterialCommunityIcons name="send" size={18} color={isFeatured ? '#fff' : '#10b981'} />
            <Text style={[styles.ctaButtonText, isFeatured && styles.featuredButtonText]}>
              {t('payAndSendReceipt', 'subscription')}
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color={isFeatured ? '#fff' : '#10b981'} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.buttonNote}>{t('telegramMessageNote', 'subscription')}</Text>
      </View>
    );
  };

  const isLockedMode = details?.subscription_status === 'locked' || details?.subscription_status === 'expired';
  const isTrialExpired = details?.subscription_status === 'expired' && details?.trial_ends_at;
  const isSubExpired = details?.subscription_status === 'expired' && details?.subscription_expires_at;
  const allPrices = plans.map((p) => parseFloat(p.price) || 0).join(' / ');
  const telegramHandle = telegramLink.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') || 'SpecificethiopiaSolution';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0c15" />
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      {/* Congratulations Modal */}
      <Modal visible={showCongrats} transparent animationType="fade" onRequestClose={dismissCongrats}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LinearGradient colors={['#064e3b', '#065f46']} style={styles.modalGradient}>
              <Text style={styles.modalEmoji}>🎉</Text>
              <Text style={styles.modalTitle}>Subscription Activated!</Text>
              <Text style={styles.modalSubtitle}>
                Welcome, {details?.username || 'there'}! Your subscription is now active. Enjoy full access to all features.
              </Text>
              <TouchableOpacity style={styles.modalButton} onPress={dismissCongrats}>
                <Text style={styles.modalButtonText}>Let's Go!</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.glassPanel}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={isLockedMode ? 'lock' : 'rocket-launch'}
                size={48}
                color={isLockedMode ? '#f43f5e' : '#10b981'}
              />
            </View>
            <Text style={styles.title}>
              {isLockedMode ? t('accessRestricted', 'subscription') : t('upgradeEnterprise', 'subscription')}
            </Text>
            <Text style={styles.subtitle}>
              {isTrialExpired
                ? t('trialEnded', 'subscription')
                : isSubExpired
                ? t('subscriptionExpired', 'subscription')
                : details?.subscription_status === 'locked'
                ? t('accountLocked', 'subscription')
                : t('accountActive', 'subscription')}
            </Text>
          </View>

          <View style={styles.pricingGrid}>
            {plans.map((plan, index) => (
              <PackageCard key={plan.id || index} plan={plan} />
            ))}
          </View>

          <View style={styles.instructionsSection}>
            <View style={styles.instructionsHeader}>
              <View style={styles.telegramIcon}>
                <MaterialCommunityIcons name="information" size={28} color="#10b981" />
              </View>
              <View style={styles.instructionsContent}>
                <Text style={styles.instructionsTitle}>{t('paymentActivation', 'subscription')}</Text>
                <View style={styles.stepsGrid}>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
                    <Text style={styles.stepText}>{t('choosePlan', 'subscription').replace('{prices}', allPrices)}</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
                    <Text style={styles.stepText}>{t('makePayment', 'subscription')}</Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
                    <Text style={styles.stepText}>
                      {t('sendReceipt', 'subscription')
                        .replace('{username}', details?.username || 'user')
                        .replace('{telegram}', telegramHandle)}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.contactButton} onPress={() => Linking.openURL(telegramLink)}>
                <MaterialCommunityIcons name="send" size={16} color="#fff" />
                <Text style={styles.contactButtonText}>
                  {t('contactTelegram', 'subscription').replace('{telegram}', telegramHandle)}
                </Text>
                <MaterialCommunityIcons name="open-in-new" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.reminderSection}>
            <View style={styles.reminderContent}>
              <MaterialCommunityIcons name="cellphone" size={32} color="#6366f1" />
              <View style={styles.reminderText}>
                <Text style={styles.reminderTitle}>
                  {t('paymentReminder', 'subscription').replace('{username}', details?.username || 'user')}
                </Text>
                <Text style={styles.reminderSubtitle}>{t('manualVerification', 'subscription')}</Text>
              </View>
            </View>
            <View style={styles.reminderActions}>
              <TouchableOpacity
                style={styles.telegramButton}
                onPress={() => Linking.openURL('https://t.me/SpecificethiopiaSolution')}
              >
                <MaterialCommunityIcons name="send" size={14} color="#fff" />
                <Text style={styles.telegramButtonText}>{t('openTelegramChat', 'subscription')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('footerText', 'subscription').replace('{year}', new Date().getFullYear().toString())}
            </Text>
            <Text style={styles.footerSubtext}>
              {t('needHelp', 'subscription').replace('{telegram}', telegramHandle)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0c15' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c15' },
  loadingText: { color: '#9ca3af', marginTop: 12, fontSize: 16, fontFamily: 'System' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0c15', padding: 20 },
  emptyText: { color: '#9ca3af', marginTop: 16, marginBottom: 20, fontSize: 16, textAlign: 'center', fontFamily: 'System' },
  retryButton: { backgroundColor: '#10b981', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 },
  retryButtonText: { color: '#fff', fontWeight: '600', fontFamily: 'System' },
  orb1: {
    position: 'absolute', top: -height * 0.1, right: -width * 0.25,
    width: width * 0.8, height: width * 0.8, borderRadius: width * 0.4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)', opacity: 0.6,
  },
  orb2: {
    position: 'absolute', bottom: -height * 0.08, left: -width * 0.3,
    width: width * 0.85, height: width * 0.85, borderRadius: width * 0.425,
    backgroundColor: 'rgba(139, 92, 246, 0.15)', opacity: 0.6,
  },
  // Congratulations modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: { width: '100%', borderRadius: 24, overflow: 'hidden' },
  modalGradient: { padding: 32, alignItems: 'center' },
  modalEmoji: { fontSize: 56, marginBottom: 16 },
  modalTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'center', fontFamily: 'System' },
  modalSubtitle: { fontSize: 15, color: '#a7f3d0', textAlign: 'center', lineHeight: 22, marginBottom: 28, fontFamily: 'System' },
  modalButton: {
    backgroundColor: '#10b981', paddingVertical: 14, paddingHorizontal: 40,
    borderRadius: 14, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 6,
  },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: 'System' },
  scrollContent: { flexGrow: 1, paddingHorizontal: 16, paddingVertical: 20 },
  glassPanel: {
    backgroundColor: 'rgba(15, 20, 30, 0.68)', borderRadius: 24, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.3, shadowRadius: 25, elevation: 10,
  },
  header: { alignItems: 'center', marginBottom: 48 },
  iconContainer: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 32, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16, lineHeight: 40, fontFamily: 'System' },
  subtitle: { fontSize: 16, color: '#d1d5db', textAlign: 'center', lineHeight: 24, paddingHorizontal: 20, marginBottom: 20, fontFamily: 'System' },
  pricingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 32 },
  pricingCard: {
    flex: 1, minWidth: width > 768 ? (width - 80) / 3 : width - 72,
    backgroundColor: 'rgba(10, 14, 23, 0.75)', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 15, elevation: 5,
  },
  featuredCard: { borderColor: 'rgba(16, 185, 129, 0.5)', shadowColor: '#10b981', shadowOpacity: 0.1 },
  badgeContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#059669' },
  featuredBadge: { backgroundColor: '#0bdaa6' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase', fontFamily: 'System' },
  savingBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  savingText: { color: '#10b981', fontSize: 10, fontWeight: '600', marginLeft: 4, fontFamily: 'System' },
  planHeader: { marginBottom: 20 },
  planName: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4, fontFamily: 'System' },
  planPeriod: { fontSize: 14, color: '#9ca3af', marginBottom: 12, fontFamily: 'System' },
  priceContainer: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  priceAmount: { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -0.5, fontFamily: 'System' },
  priceCurrency: { fontSize: 18, fontWeight: '600', color: '#d1d5db', marginLeft: 4, fontFamily: 'System' },
  pricePeriod: { fontSize: 14, color: '#9ca3af', marginLeft: 4, fontFamily: 'System' },
  priceNote: { fontSize: 12, color: '#6b7280', fontFamily: 'System' },
  featuresList: { marginBottom: 24 },
  featureItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  featureText: { color: '#d1d5db', fontSize: 14, marginLeft: 8, flex: 1, fontFamily: 'System' },
  ctaButton: { borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
  featuredButton: { shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  buttonGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  ctaButtonText: { color: '#10b981', fontSize: 14, fontWeight: '600', marginHorizontal: 8, fontFamily: 'System' },
  featuredButtonText: { color: '#fff' },
  buttonNote: { fontSize: 11, color: '#6b7280', textAlign: 'center', lineHeight: 16, fontFamily: 'System' },
  instructionsSection: {
    backgroundColor: 'rgba(55, 65, 81, 0.3)', borderRadius: 16, padding: 20, marginBottom: 24,
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  instructionsHeader: { flexDirection: width > 768 ? 'row' : 'column', alignItems: width > 768 ? 'flex-start' : 'stretch', gap: 16 },
  telegramIcon: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  instructionsContent: { flex: 1 },
  instructionsTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 16, fontFamily: 'System' },
  stepsGrid: { gap: 12 },
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  stepNumber: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0,
  },
  stepNumberText: { color: '#10b981', fontSize: 12, fontWeight: '800', fontFamily: 'System' },
  stepText: { color: '#d1d5db', fontSize: 14, flex: 1, lineHeight: 20, fontFamily: 'System' },
  contactButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, alignSelf: width > 768 ? 'flex-start' : 'stretch',
  },
  contactButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginHorizontal: 8, fontFamily: 'System' },
  reminderSection: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.2)', padding: 20, marginBottom: 32,
  },
  reminderContent: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  reminderText: { flex: 1, marginLeft: 16 },
  reminderTitle: { color: '#c7d2fe', fontSize: 14, fontWeight: '600', marginBottom: 8, lineHeight: 20, fontFamily: 'System' },
  reminderSubtitle: { color: '#9ca3af', fontSize: 12, lineHeight: 18, fontFamily: 'System' },
  reminderActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  telegramButton: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
    shadowColor: '#6366f1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  telegramButtonText: { color: '#fff', fontSize: 14, fontWeight: '600', marginLeft: 6, fontFamily: 'System' },
  footer: { alignItems: 'center', paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)' },
  footerText: { color: '#6b7280', fontSize: 12, textAlign: 'center', marginBottom: 4, fontFamily: 'System' },
  footerSubtext: { color: '#9ca3af', fontSize: 11, textAlign: 'center', fontFamily: 'System' },
});
