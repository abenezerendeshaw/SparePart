import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Linking,
  Share,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
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
      
      // Create axios instance with token (just like in Products screen)
      const api = axios.create({
        baseURL: 'https://specificethiopia.com/inventory/api/v1',
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
          Alert.alert('ስህተት', 'እባክዎ እንደገና ይግቡ');
          router.replace('/auth/login');
        } else {
          Alert.alert('ስህተት', 'የተጠቃሚ መረጃ መጫን አልተቻለም');
        }
      } else if (error.request) {
        console.log('No response received');
        Alert.alert('ስህተት', 'ከአገልጋይ ጋር መገናኘት አልተቻለም');
      } else {
        console.log('Error Message:', error.message);
        Alert.alert('ስህተት', 'ያልተጠበቀ ስህተት ተከስቷል');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserProfile();
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      const token = await storage.getItem('authToken');
      if (!token) return;

      const api = axios.create({
        baseURL: 'https://specificethiopia.com/inventory/api/v1',
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
        Alert.alert('ተሳክቷል', 'መረጃዎ ተሻሽሏል');
        await loadUserProfile();
        setEditModalVisible(false);
      }
    } catch (error: any) {
      console.log('Update error:', error.response?.data || error.message);
      Alert.alert('ስህተት', error.response?.data?.message || 'መረጃ ማሻሻል አልተቻለም');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password.length < 6) {
      Alert.alert('ስህተት', 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት');
      return;
    }
    
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      Alert.alert('ስህተት', 'የይለፍ ቃላት አይዛመዱም');
      return;
    }

    try {
      setLoading(true);
      
      const token = await storage.getItem('authToken');
      if (!token) return;

      const api = axios.create({
        baseURL: 'https://specificethiopia.com/inventory/api/v1',
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
        Alert.alert('ተሳክቷል', 'የይለፍ ቃልዎ ተቀይሯል');
        setPasswordModalVisible(false);
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: '',
        });
      }
    } catch (error: any) {
      console.log('Password change error:', error.response?.data || error.message);
      Alert.alert('ስህተት', error.response?.data?.message || 'የይለፍ ቃል መቀየር አልተቻለም');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'ዘግተህ መውጣት',
      'መውጣት እንደምትፈልግ እርግጠኛ ነህ?',
      [
        { text: 'ተይ', style: 'cancel' },
        {
          text: 'ውጣ',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await storage.removeItem('authToken');
              router.replace('/auth/login');
            } catch (error) {
              Alert.alert('ስህተት', 'ዘግተህ መውጣት አልተሳካም');
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
      'ያግኙን',
      'እንዴት ልንረዳዎ እንችላለን?',
      [
        { text: 'ስልክ ደውል', onPress: () => Linking.openURL('tel:+251911234567') },
        { text: 'ኢሜይል ላክ', onPress: () => Linking.openURL('mailto:info@autopartspro.com') },
        { text: 'ተይ', style: 'cancel' }
      ]
    );
  };

  const handleShareApp = () => {
    Share.share({
      message: 'አውቶፓርትስ ፕሮ - የእቃ ክምችት አስተዳደር አፕሊኬሽን\nአሁኑኑ ያውርዱ!',
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'አይታወቅም';
    return new Date(dateString).toLocaleDateString('am-ET', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'አይታወቅም';
    return new Date(dateString).toLocaleString('am-ET', {
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

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2974ff" />
          <Text style={styles.loadingText}>በመጫን ላይ...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!user) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>የተጠቃሚ መረጃ አልተገኘም</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadUserProfile}>
            <Text style={styles.retryButtonText}>እንደገና ሞክር</Text>
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
          <Text style={styles.headerTitle}>መገለጫ</Text>
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
            <Text style={styles.profileUsername}>@{user.username}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>የግል መረጃ</Text>
          
          <View style={styles.infoCard}>
            <InfoRow 
              icon="account" 
              label="ሙሉ ስም" 
              value={user.full_name} 
              color="#2974ff"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="account-circle" 
              label="የተጠቃሚ ስም" 
              value={user.username} 
              color="#f59e0b"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="email" 
              label="ኢሜይል" 
              value={user.email} 
              color="#10b981"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="phone" 
              label="ስልክ ቁጥር" 
              value={user.phone || 'አልተመዘገበም'} 
              color="#8b5cf6"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="shield-account" 
              label="ሚና" 
              value={user.role} 
              color="#64748b"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="calendar" 
              label="የተቀላቀሉበት ቀን" 
              value={formatDate(user.created_at)} 
              color="#64748b"
            />
            <View style={styles.divider} />
            <InfoRow 
              icon="clock-outline" 
              label="መጨረሻ ግባት" 
              value={formatDateTime(user.last_login)} 
              color="#64748b"
            />
          </View>
        </View>

        {/* Sync Status */}
        {user.sync_status && (
          <View style={styles.syncStatusContainer}>
            <MaterialCommunityIcons 
              name={user.sync_status === 'synced' ? 'check-circle' : 'sync'} 
              size={16} 
              color={user.sync_status === 'synced' ? '#10b981' : '#f59e0b'} 
            />
            <Text style={[
              styles.syncStatusText,
              { color: user.sync_status === 'synced' ? '#10b981' : '#f59e0b' }
            ]}>
              {user.sync_status === 'synced' ? 'የተመሳሰለ' : 'በማመሳሰል ላይ'}
            </Text>
          </View>
        )}

        {/* About Us Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ስለ እኛ</Text>
          
          <LinearGradient
            colors={['rgba(41, 116, 255, 0.1)', 'rgba(15, 22, 35, 0.9)']}
            style={styles.aboutCard}
          >
            <Text style={styles.aboutText}>
              አውቶፓርትስ ፕሮ የእቃ ክምችት አስተዳደር ሲስተም ነው። 
              ንግድዎን በቀላሉ ለማስተዳደር፣ ምርቶችን ለመቆጣጠር እና 
              ሽያጮችን ለመከታተል የተዘጋጀ ነው።
            </Text>
            <Text style={styles.versionText}>ስሪት 2.4.0</Text>
          </LinearGradient>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>የመለያ ቅንብሮች</Text>
          
          <MenuItem
            icon="lock"
            title="የይለፍ ቃል ቀይር"
            color="#10b981"
            onPress={() => setPasswordModalVisible(true)}
          />
        </View>

        {/* Contact & Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ያግኙን</Text>
          
          <MenuItem
            icon="phone"
            title="ስልክ ደውል"
            color="#10b981"
            onPress={() => Linking.openURL('tel:+251911234567')}
          />
          
          <MenuItem
            icon="email"
            title="ኢሜይል ላክ"
            color="#f59e0b"
            onPress={() => Linking.openURL('mailto:info@autopartspro.com')}
          />
          
          <MenuItem
            icon="web"
            title="ድረ-ገጽ"
            color="#8b5cf6"
            onPress={() => Linking.openURL('https://autopartspro.com')}
          />
          
          <MenuItem
            icon="share-variant"
            title="አጋራ"
            color="#2974ff"
            onPress={handleShareApp}
          />
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ህጋዊ መረጃ</Text>
          
          <MenuItem
            icon="shield-account"
            title="የግላዊነት ፖሊሲ"
            color="#10b981"
            onPress={() => Alert.alert('የግላዊነት ፖሊሲ', 'በሂደት ላይ')}
          />
          
          <MenuItem
            icon="file-document"
            title="የአገልግሎት ውል"
            color="#f59e0b"
            onPress={() => Alert.alert('የአገልግሎት ውል', 'በሂደት ላይ')}
          />
          
          <MenuItem
            icon="information"
            title="ስለ አፕሊኬሽኑ"
            color="#8b5cf6"
            onPress={() => Alert.alert('ስሪት 2.4.0', 'አውቶፓርትስ ፕሮ')}
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
              <Text style={styles.logoutText}>ዘግተህ ውጣ</Text>
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
            <Text style={styles.modalTitle}>መረጃ አርትዕ</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="ሙሉ ስም"
              placeholderTextColor="#64748b"
              value={editForm.full_name}
              onChangeText={(text) => setEditForm({...editForm, full_name: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="ስልክ ቁጥር"
              placeholderTextColor="#64748b"
              value={editForm.phone}
              onChangeText={(text) => setEditForm({...editForm, phone: text})}
              keyboardType="phone-pad"
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="ኢሜይል"
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
                <Text style={styles.cancelButtonText}>ተይ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateProfile}
              >
                <Text style={styles.saveButtonText}>አስቀምጥ</Text>
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
            <Text style={styles.modalTitle}>የይለፍ ቃል ቀይር</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="የአሁኑ የይለፍ ቃል"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={passwordForm.current_password}
              onChangeText={(text) => setPasswordForm({...passwordForm, current_password: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="አዲስ የይለፍ ቃል"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={passwordForm.new_password}
              onChangeText={(text) => setPasswordForm({...passwordForm, new_password: text})}
            />
            
            <TextInput
              style={styles.modalInput}
              placeholder="አዲስ የይለፍ ቃል ድገም"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={passwordForm.confirm_password}
              onChangeText={(text) => setPasswordForm({...passwordForm, confirm_password: text})}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setPasswordForm({
                    current_password: '',
                    new_password: '',
                    confirm_password: '',
                  });
                }}
              >
                <Text style={styles.cancelButtonText}>ተይ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleChangePassword}
              >
                <Text style={styles.saveButtonText}>ቀይር</Text>
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
});