import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import { useSubscription } from '../../context/SubscriptionContext';
import storage from '../lib/storage';

interface UserData {
  id: number;
  username: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  owner_id: number;
  last_login: string;
  created_at: string;
  updated_at: string;
  online_user_id: number | null;
  sync_status: string;
  last_sync_attempt: string | null;
}

interface ApiResponse {
  status: string;
  data: UserData;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useLanguage();
  const { details, plans, refreshStatus, telegramLink } = useSubscription();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: '',
    phone: '',
    email: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
    showCurrent: false,
    showNew: false,
    showConfirm: false,
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        console.log('No token found, redirecting to login');
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching user profile with token:', token.substring(0, 20) + '...');
      
      const api = axios.create({
        baseURL: 'https://specificethiopian.com/inventory/api/v1',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const response = await api.get<ApiResponse>('/user');
      
      console.log('User API Response Status:', response.status);
      
      if (response.data.status === 'success') {
        const userData = response.data.data;
        console.log('User Data loaded successfully');
        
        setUser(userData);
        
        setEditForm({
          full_name: userData.full_name,
          phone: userData.phone || '',
          email: userData.email,
        });
      }
    } catch (error: any) {
      console.log('Error loading user profile:');
      if (error.response) {
        console.log('Error Status:', error.response.status);
        
        if (error.response.status === 401) {
          Alert.alert(t('error'), t('loginRequired', 'common'));
          router.replace('/auth/login');
        } else {
          Alert.alert(t('error'), t('profileLoadFailed', 'profile'));
        }
      } else if (error.request) {
        console.log('No response received');
        Alert.alert(t('error'), t('connectionError', 'common'));
      } else {
        console.log('Error Message:', error.message);
        Alert.alert(t('error'), t('unexpectedError', 'common'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    refreshStatus();
    loadUserProfile();
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      const token = await storage.getItem('authToken');
      if (!token) return;

      const api = axios.create({
        baseURL: 'https://specificethiopian.com/inventory/api/v1',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const updateData: any = {};
      if (editForm.full_name !== user?.full_name) updateData.full_name = editForm.full_name;
      if (editForm.phone !== user?.phone) updateData.phone = editForm.phone;
      if (editForm.email !== user?.email) updateData.email = editForm.email;
      
      if (Object.keys(updateData).length === 0) {
        setEditModalVisible(false);
        return;
      }

      const response = await api.put('/user', updateData);
      
      if (response.data.status === 'success') {
        Alert.alert(t('success'), t('profileUpdated', 'profile'));
        await loadUserProfile();
        setEditModalVisible(false);
      }
    } catch (error: any) {
      console.log('Update error:', error.response?.data || error.message);
      Alert.alert(t('error'), error.response?.data?.message || t('profileUpdateFailed', 'profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password.length < 6) {
      Alert.alert(t('error'), t('passwordLength', 'profile'));
      return;
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      Alert.alert(t('error'), t('passwordMismatch', 'profile'));
      return;
    }

    try {
      setLoading(true);
      
      const token = await storage.getItem('authToken');
      if (!token) return;

      const api = axios.create({
        baseURL: 'https://specificethiopian.com/inventory/api/v1',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      
      const response = await api.post('/user?action=change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      
      if (response.data.status === 'success') {
        Alert.alert(t('success'), t('passwordChanged', 'profile'));
        setPasswordModalVisible(false);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
          showCurrent: false,
          showNew: false,
          showConfirm: false,
        });
      }
    } catch (error: any) {
      console.log('Password change error:', error.response?.data || error.message);
      Alert.alert(t('error'), error.response?.data?.message || t('passwordChangeFailed', 'profile'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      t('logout', 'profile'),
      t('logoutConfirm', 'profile'),
      [
        { text: t('cancel', 'common'), style: 'cancel' },
        {
          text: t('logout', 'profile'),
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await storage.removeItem('authToken');
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert(t('error'), t('logoutFailed', 'profile'));
            } finally {
              setLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const handleContactUs = () => {
    Alert.alert(
      t('contactUs', 'profile'),
      t('contactMessage', 'profile'),
      [
        { text: t('call', 'common'), onPress: () => Linking.openURL('tel:+251972989963') },
        { text: t('email', 'common'), onPress: () => Linking.openURL('mailto:envairnoha@gmail.com') },
        { text: t('cancel', 'common'), style: 'cancel' }
      ]
    );
  };

  const handleShareApp = () => {
    Share.share({
      message: t('shareMessage', 'profile'),
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return t('unknown', 'common');
    return new Date(dateString).toLocaleDateString(language === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return t('unknown', 'common');
    return new Date(dateString).toLocaleString(language === 'am' ? 'am-ET' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const MenuItem = ({ icon, title, onPress, color = '#2974ff', rightIcon = 'chevron-right' }: any) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIconContainer, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <MaterialCommunityIcons name={rightIcon} size={20} color="#64748b" />
    </TouchableOpacity>
  );

  const InfoRow = ({ icon, label, value, color = '#64748b' }: any) => (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon} size={18} color={color} />
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  // Language Switcher Component
  const LanguageSwitcher = () => (
    <View style={styles.languageSwitcher}>
      <View style={styles.languageLabelContainer}>
        <MaterialCommunityIcons name="translate" size={20} color="#94a3b8" />
        <Text style={styles.languageLabel}>{t('language', 'settings')}</Text>
      </View>
      <View style={styles.languageButtons}>
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === 'am' && styles.languageButtonActive
          ]}
          onPress={() => setLanguage('am')}
        >
          <Text style={[
            styles.languageButtonText,
            language === 'am' && styles.languageButtonTextActive
          ]}>
            {t('amharic', 'settings')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.languageButton,
            language === 'en' && styles.languageButtonActive
          ]}
          onPress={() => setLanguage('en')}
        >
          <Text style={[
            styles.languageButtonText,
            language === 'en' && styles.languageButtonTextActive
          ]}>
            {t('english', 'settings')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2974ff" />
          <Text style={styles.loadingText}>{t('loading', 'common')}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('userNotFound', 'profile')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>{t('retry', 'common')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#2974ff"
            colors={['#2974ff']}
          />
        }
      >
        {/* Header with Edit Icon */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile', 'navigation')}</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <MaterialCommunityIcons name="pencil" size={24} color="#2974ff" />
          </TouchableOpacity>
        </View>

        {/* Profile Header Card */}
        <LinearGradient
          colors={['#2974ff', '#1a4c9e']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileHeader}
        >
          <View style={styles.profileImageWrapper}>
            <LinearGradient
              colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
              style={styles.profileImage}
            >
              <Text style={styles.profileInitial}>
                {user.full_name.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileFullName}>{user.full_name}</Text>
            <Text style={styles.profileUsername}>{user.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('personalInfo', 'profile')}</Text>
          
          <View style={styles.infoCard}>
            <InfoRow 
              icon="account" 
              label={t('fullName', 'profile')} 
              value={user.full_name} 
              color="#2974ff"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="account-circle" 
              label={t('username', 'profile')} 
              value={user.username} 
              color="#f59e0b"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="email" 
              label={t('email', 'common')} 
              value={user.email} 
              color="#10b981"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="phone" 
              label={t('phone', 'common')} 
              value={user.phone || t('notRegistered', 'profile')} 
              color="#8b5cf6"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="calendar" 
              label={t('joinedDate', 'profile')} 
              value={formatDate(user.created_at)} 
              color="#64748b"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="clock-outline" 
              label={t('lastLogin', 'profile')} 
              value={formatDateTime(user.last_login)} 
              color="#64748b"
            />
          </View>
        </View>

        {/* Subscription Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('status', 'subscription')}</Text>
          <View style={styles.infoCard}>
            <View style={styles.subscriptionHeader}>
              <View>
                <Text style={styles.planLabel}>Your current plan is</Text>
                <Text style={[styles.planNameText, { color: '#10b981' }]}>
                  {details?.subscription_plan
                    ? details.subscription_plan.charAt(0).toUpperCase() + details.subscription_plan.slice(1)
                    : 'Quarterly'}
                </Text>
                {(() => {
                  // Pick the relevant expiry date
                  const expiryStr = details?.subscription_status === 'active'
                    ? details?.subscription_expires_at
                    : details?.trial_ends_at;
                  if (!expiryStr) return null;
                  const diff = Math.ceil((new Date(expiryStr).getTime() - Date.now()) / 86400000);
                  if (diff <= 0) return (
                    <Text style={styles.countdownExpired}>Expired</Text>
                  );
                  return (
                    <Text style={styles.countdownText}>
                      {diff} day{diff !== 1 ? 's' : ''} remaining
                    </Text>
                  );
                })()}
              </View>
              <View style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    details?.subscription_status === 'active' ? 'rgba(16, 185, 129, 0.2)' :
                    details?.subscription_status === 'trial'  ? 'rgba(99, 102, 241, 0.2)' :
                    'rgba(239, 68, 68, 0.2)'
                }
              ]}>
                <Text style={[
                  styles.statusBadgeText,
                  {
                    color:
                      details?.subscription_status === 'active' ? '#10b981' :
                      details?.subscription_status === 'trial'  ? '#818cf8' :
                      '#ef4444'
                  }
                ]}>
                  {details?.subscription_status
                    ? details.subscription_status.charAt(0).toUpperCase() + details.subscription_status.slice(1)
                    : 'Trial'}
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <MenuItem
              icon="ticket-percent"
              title={t('availablePlans', 'subscription')}
              color="#f59e0b"
              onPress={() => router.push('/subscription-packages')}
            />

            {/* Upgrade Button - only show if not active */}
            {details?.subscription_status !== 'active' && (
              <>
                <View style={styles.divider} />
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={() => router.push('/subscription-packages')}
                >
                  <LinearGradient
                    colors={['#2974ff', '#1a4c9e']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.upgradeGradient}
                  >
                    <MaterialCommunityIcons name="crown" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.upgradeButtonText}>{t('upgradeNow', 'subscription')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>


        {/* About Us Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('aboutUs', 'profile')}</Text>
          
          <LinearGradient
            colors={['rgba(41, 116, 255, 0.1)', 'rgba(15, 22, 35, 0.9)']}
            style={styles.aboutCard}
          >
            <Text style={styles.aboutText}>
              {t('aboutText', 'profile')}
            </Text>
            <Text style={styles.versionText}>{t('version', 'profile')} 1.0.0</Text>
          </LinearGradient>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('accountSettings', 'profile')}</Text>
          
          <MenuItem
            icon="lock"
            title={t('changePassword', 'profile')}
            color="#10b981"
            onPress={() => setPasswordModalVisible(true)}
          />
          
          <MenuItem
            icon="wallet"
            title={t('expenses', 'navigation')}
            color="#ef4444"
            onPress={() => router.push('/(tab)/expenses')}
          />
          
          {/* Language Switcher - Added here below change password */}
          <LanguageSwitcher />
        </View>

        {/* Contact & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('contactSupport', 'profile')}</Text>
          
          <MenuItem
            icon="phone"
            title={t('call', 'common')}
            color="#10b981"
            onPress={() => Linking.openURL('tel:+251972989963')}
          />
          
          <MenuItem
            icon="email"
            title={t('email', 'common')}
            color="#f59e0b"
            onPress={() => Linking.openURL('mailto:envairnoha@gmail.com')}
          />
          
          <MenuItem
            icon="web"
            title={t('website', 'common')}
            color="#8b5cf6"
            onPress={() => Linking.openURL('https://specificethiopian.com/inventory/')}
          />


          <MenuItem
            icon="web"
            title={t('app', 'common')}
            color="#8b5cf6"
            onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.abenu.Mobile_latest&pcampaignid=web_share')}
          />


        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
              <Text style={styles.logoutText}>{t('logout', 'profile')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a2634', '#0f1623']}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>{t('editInfo', 'profile')}</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('fullName', 'profile')}
              placeholderTextColor="#64748b"
              value={editForm.full_name}
              onChangeText={(text) => setEditForm({...editForm, full_name: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('phone', 'common')}
              placeholderTextColor="#64748b"
              value={editForm.phone}
              onChangeText={(text) => setEditForm({...editForm, phone: text})}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder={t('email', 'common')}
              placeholderTextColor="#64748b"
              value={editForm.email}
              onChangeText={(text) => setEditForm({...editForm, email: text})}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>{t('cancel', 'common')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.saveButtonText}>{t('save', 'common')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a2634', '#0f1623']}
            style={styles.modalContent}
          >
            <Text style={styles.modalTitle}>{t('changePassword', 'profile')}</Text>
            
            {/* Current Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('currentPassword', 'profile')}
                placeholderTextColor="#64748b"
                secureTextEntry={!passwordForm.showCurrent}
                value={passwordForm.current_password}
                onChangeText={(text) => setPasswordForm({...passwordForm, current_password: text})}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setPasswordForm({...passwordForm, showCurrent: !passwordForm.showCurrent})}
              >
                <MaterialCommunityIcons 
                  name={passwordForm.showCurrent ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            </View>
            
            {/* New Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('newPassword', 'profile')}
                placeholderTextColor="#64748b"
                secureTextEntry={!passwordForm.showNew}
                value={passwordForm.new_password}
                onChangeText={(text) => setPasswordForm({...passwordForm, new_password: text})}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setPasswordForm({...passwordForm, showNew: !passwordForm.showNew})}
              >
                <MaterialCommunityIcons 
                  name={passwordForm.showNew ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            </View>
            
            {/* Confirm Password */}
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder={t('confirmPassword', 'profile')}
                placeholderTextColor="#64748b"
                secureTextEntry={!passwordForm.showConfirm}
                value={passwordForm.confirm_password}
                onChangeText={(text) => setPasswordForm({...passwordForm, confirm_password: text})}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setPasswordForm({...passwordForm, showConfirm: !passwordForm.showConfirm})}
              >
                <MaterialCommunityIcons 
                  name={passwordForm.showConfirm ? 'eye-off' : 'eye'} 
                  size={20} 
                  color="#64748b" 
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordForm({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                    showCurrent: false,
                    showNew: false,
                    showConfirm: false,
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel', 'common')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>{t('save', 'common')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#2974ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },
  profileImageWrapper: {
    marginRight: 16,
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  profileInitial: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    color: '#ffffff',
  },
  eyeIcon: {
    padding: 12,
  },
  profileFullName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  roleText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 8,
    width: 100,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  syncStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  syncStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  aboutCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(41, 116, 255, 0.3)',
  },
  aboutText: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  versionText: {
    color: '#2974ff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'right',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuTitle: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(41, 116, 255, 0.3)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  saveButton: {
    backgroundColor: '#2974ff',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  languageSwitcher: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
    marginBottom: 8,
  },
  languageLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  languageLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  languageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  languageButtonActive: {
    backgroundColor: 'rgba(41, 116, 255, 0.2)',
    borderColor: '#2974ff',
  },
  languageButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  languageButtonTextActive: {
    color: '#2974ff',
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  countdownText: {
    fontSize: 11,
    color: '#10b981',
    marginTop: 4,
    fontWeight: '600',
  },
  countdownExpired: {
    fontSize: 11,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '600',
  },
  planNameText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  expiryText: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  upgradeButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginTop: 8,
  },
  upgradeGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});