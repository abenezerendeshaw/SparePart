import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    ActivityIndicator,
    Dimensions,
    Linking,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { useSubscription } from '../context/SubscriptionContext';

const { width, height } = Dimensions.get('window');

export default function SubscriptionPackagesScreen() {
  const router = useRouter();
  const subscriptionContext = useSubscription();
  const { plans = [], telegramLink, details, loading: isLoading } = subscriptionContext || {};
  const { t } = useLanguage();

  // Build Telegram deep link with pre‑filled message
  const buildTelegramPaymentLink = (
    telegramHandle: string,
    username: string,
    planName: string,
    amount: number,
    period: string
  ) => {
    const handle = telegramHandle.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '');
    const baseUrl = `https://t.me/${handle}`;
    const text = `✅ PAYMENT REQUEST - ${planName}\n\n` +
      `💰 Amount: ${amount} ETB\n` +
      `👤 Username: @${username}\n` +
      `📦 Plan: ${period}\n\n` +
      `📌 I have made the payment via Telebirr/Bank. Attached is the payment receipt screenshot.\n` +
      `Please activate my subscription. Thank you!`;
    return `${baseUrl}?text=${encodeURIComponent(text)}`;
  };

  const handlePackageSelect = (plan: any) => {
    const period = plan.period || plan.duration || 'Monthly';
    const priceValue = plan.price ? String(plan.price).trim() : '0';
    const amount = priceValue && !isNaN(Number(priceValue)) ? Number(priceValue) : 0;
    const url = buildTelegramPaymentLink(
      telegramLink || 'xesser',
      details?.username || 'user',
      `${plan.name} (${period})`,
      amount,
      period
    );
    Linking.openURL(url);
  };

  // Loading state – show spinner while data is being fetched
  if (!subscriptionContext || isLoading || !Array.isArray(plans) || plans.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading subscription plans...</Text>
      </View>
    );
  }

  const PackageCard = ({ plan, index }: { plan: any; index: number }) => {
    if (!plan) return null;

    const period = plan.period || plan.duration || 'Monthly';
    const isFeatured = plan.popular === true || plan.badge === 'MOST POPULAR';
    const priceValue = plan.price ? String(plan.price).trim() : '0';
    const price = priceValue && !isNaN(Number(priceValue)) ? Number(priceValue) : 0;

    return (
      <View style={[styles.pricingCard, isFeatured && styles.featuredCard]}>
        {/* Badge and saving */}
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

        {/* Plan title and price */}
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planPeriod}>{period} subscription</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>{price}</Text>
            <Text style={styles.priceCurrency}>ETB</Text>
            <Text style={styles.pricePeriod}>/ {period.toLowerCase()}</Text>
          </View>
          <Text style={styles.priceNote}>{plan.duration_text || 'billed accordingly'}</Text>
        </View>

        {/* Features list */}
        <View style={styles.featuresList}>
          {Array.isArray(plan.features) && plan.features.map((feature: string, idx: number) => (
            <View key={idx} style={styles.featureItem}>
              <MaterialCommunityIcons name="check-circle" size={16} color="#10b981" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* CTA Button */}
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
              Pay {price} ETB & Send Receipt
            </Text>
            <MaterialCommunityIcons name="arrow-right" size={14} color={isFeatured ? '#fff' : '#10b981'} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.buttonNote}>
          Click → Telegram opens with pre‑filled message. Attach screenshot after payment.
        </Text>
      </View>
    );
  };

  const isLockedMode = details?.subscription_status === 'locked' || details?.subscription_status === 'expired';
  const isTrialExpired = details?.subscription_status === 'expired' && details?.trial_ends_at;
  const isSubExpired = details?.subscription_status === 'expired' && details?.subscription_expires_at;

  // Get all prices for display
  const allPrices = Array.isArray(plans) 
    ? plans.map(p => {
        const priceValue = p.price ? String(p.price).trim() : '0';
        return priceValue && !isNaN(Number(priceValue)) ? Number(priceValue) : 0;
      }).join(' / ')
    : '200 / 400 / 850';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0c15" />

      {/* Animated Background Orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.glassPanel}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons
                name={isLockedMode ? 'lock' : 'rocket-launch'}
                size={48}
                color={isLockedMode ? '#f43f5e' : '#10b981'}
              />
            </View>
            <Text style={styles.title}>
              {isLockedMode ? 'Access Restricted' : 'Upgrade Your Enterprise'}
            </Text>
            <Text style={styles.subtitle}>
              {isTrialExpired
                ? 'Your free trial has ended. Unlock powerful inventory features with a subscription.'
                : isSubExpired
                ? 'Your previous subscription expired. Renew now to continue seamless management.'
                : details?.subscription_status === 'locked'
                ? 'Account is currently locked. Choose a plan below to regain full access.'
                : 'Your account is active, but you can upgrade early to secure your business growth and unlock premium tools.'}
            </Text>
            <View style={styles.userInfo}>
              <MaterialCommunityIcons name="account-circle" size={16} color="#10b981" />
              <Text style={styles.userInfoText}>Logged as: </Text>
              <Text style={styles.usernameText}>@{details?.username || 'user'}</Text>
              <Text style={styles.userInfoText}> • </Text>
              <Text style={styles.userInfoText}>{details?.email}</Text>
            </View>
          </View>

          {/* Pricing Cards Grid */}
          <View style={styles.pricingGrid}>
            {plans.map((plan, index) => (
              <PackageCard key={plan.id} plan={plan} index={index} />
            ))}
          </View>

          {/* Payment Instructions */}
          <View style={styles.instructionsSection}>
            <View style={styles.instructionsHeader}>
              <View style={styles.telegramIcon}>
                <MaterialCommunityIcons name="send" size={28} color="#10b981" />
              </View>
              <View style={styles.instructionsContent}>
                <Text style={styles.instructionsTitle}>
                  How to complete payment & get activated
                </Text>
                <View style={styles.stepsGrid}>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>1</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Choose your plan ({allPrices} ETB) and click "Pay & Send Receipt".
                    </Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Make payment via Telebirr or bank transfer (details provided by admin in Telegram).
                    </Text>
                  </View>
                  <View style={styles.step}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>3</Text>
                    </View>
                    <Text style={styles.stepText}>
                      Send payment screenshot + your username @{details?.username || 'user'} to @{telegramLink?.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') || 'xesser'}. Account activated within minutes.
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => Linking.openURL(telegramLink || 'https://t.me/xesser')}
              >
                <MaterialCommunityIcons name="send" size={16} color="#fff" />
                <Text style={styles.contactButtonText}>
                  Contact @{telegramLink?.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') || 'xesser'}
                </Text>
                <MaterialCommunityIcons name="open-in-new" size={12} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Receipt Reminder */}
          <View style={styles.reminderSection}>
            <View style={styles.reminderContent}>
              <MaterialCommunityIcons name="cellphone" size={32} color="#6366f1" />
              <View style={styles.reminderText}>
                <Text style={styles.reminderTitle}>
                  After payment, don't forget to attach receipt and include your Telegram username or the exact username @{details?.username || 'user'} in the message.
                </Text>
                <Text style={styles.reminderSubtitle}>
                  Manual verification is fast. Our support team will upgrade your subscription instantly once receipt is confirmed.
                </Text>
              </View>
            </View>
            <View style={styles.reminderActions}>
              <TouchableOpacity
                style={styles.telegramButton}
                onPress={() => Linking.openURL(telegramLink || 'https://t.me/xesser')}
              >
                <MaterialCommunityIcons name="send" size={14} color="#fff" />
                <Text style={styles.telegramButtonText}>Open Telegram Chat</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Specific Ethiopia — Inventory Management System. All rights reserved.
            </Text>
            <Text style={styles.footerSubtext}>
              Need help? Direct message on Telegram: @{telegramLink?.replace(/^https?:\/\/t\.me\//, '').replace(/^@/, '') || 'xesser'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0c15',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0c15',
  },
  loadingText: {
    color: '#9ca3af',
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'System',
  },
  orb1: {
    position: 'absolute',
    top: -height * 0.1,
    right: -width * 0.25,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    opacity: 0.6,
  },
  orb2: {
    position: 'absolute',
    bottom: -height * 0.08,
    left: -width * 0.3,
    width: width * 0.85,
    height: width * 0.85,
    borderRadius: width * 0.425,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    opacity: 0.6,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  glassPanel: {
    backgroundColor: 'rgba(15, 20, 30, 0.68)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
    fontFamily: 'System',
  },
  subtitle: {
    fontSize: 16,
    color: '#d1d5db',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
    fontFamily: 'System',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  userInfoText: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'System',
  },
  usernameText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
    marginLeft: 4,
  },
  pricingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 32,
  },
  pricingCard: {
    flex: 1,
    minWidth: width > 768 ? (width - 80) / 3 : width - 72,
    backgroundColor: 'rgba(10, 14, 23, 0.75)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  featuredCard: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
    shadowColor: '#10b981',
    shadowOpacity: 0.1,
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  featuredBadge: {
    backgroundColor: '#0bdaa6',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontFamily: 'System',
  },
  savingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingText: {
    color: '#10b981',
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'System',
  },
  planHeader: {
    marginBottom: 20,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    fontFamily: 'System',
  },
  planPeriod: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 12,
    fontFamily: 'System',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
    fontFamily: 'System',
  },
  priceCurrency: {
    fontSize: 18,
    fontWeight: '600',
    color: '#d1d5db',
    marginLeft: 4,
    fontFamily: 'System',
  },
  pricePeriod: {
    fontSize: 14,
    color: '#9ca3af',
    marginLeft: 4,
    fontFamily: 'System',
  },
  priceNote: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'System',
  },
  featuresList: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  featureText: {
    color: '#d1d5db',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    fontFamily: 'System',
  },
  ctaButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  featuredButton: {
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  ctaButtonText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    fontFamily: 'System',
  },
  featuredButtonText: {
    color: '#fff',
  },
  buttonNote: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 16,
    fontFamily: 'System',
  },
  instructionsSection: {
    backgroundColor: 'rgba(55, 65, 81, 0.3)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  instructionsHeader: {
    flexDirection: width > 768 ? 'row' : 'column',
    alignItems: width > 768 ? 'flex-start' : 'stretch',
    gap: 16,
  },
  telegramIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'System',
  },
  stepsGrid: {
    gap: 12,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  stepNumberText: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '800',
    fontFamily: 'System',
  },
  stepText: {
    color: '#d1d5db',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
    fontFamily: 'System',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignSelf: width > 768 ? 'flex-start' : 'stretch',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginHorizontal: 8,
    fontFamily: 'System',
  },
  reminderSection: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    padding: 20,
    marginBottom: 32,
  },
  reminderContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  reminderText: {
    flex: 1,
    marginLeft: 16,
  },
  reminderTitle: {
    color: '#c7d2fe',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 20,
    fontFamily: 'System',
  },
  reminderSubtitle: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'System',
  },
  reminderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  telegramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.8)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  telegramButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'System',
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerText: {
    color: '#6b7280',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'System',
  },
  footerSubtext: {
    color: '#9ca3af',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'System',
  },
});