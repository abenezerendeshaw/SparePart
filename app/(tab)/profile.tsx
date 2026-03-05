import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import storage from './../lib/storage';
import api from './../lib/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({
    fullName: '',
    email: '',
    phone: '',
    storeName: '',
    role: '',
  });
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await api.get('/user');
      if (response.data.data) {
        setUser({
          fullName: response.data.data.full_name || 'ነጋዴ',
          email: response.data.data.email || 'user@example.com',
          phone: response.data.data.phone || 'አልተመዘገበም',
          storeName: response.data.data.store_name || 'መደብሬ',
          role: response.data.data.role || 'ነጋዴ',
        });
      }
    } catch (error) {
      console.log('Error loading user:', error);
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
              // Optional: Call logout API if you have one
              // await api.post('/logout');
              router.replace('/auth/login');
            } catch (error) {
              console.log('Logout error:', error);
              Alert.alert('ስህተት', 'ዘግተህ መውጣት አልተሳካም');
            } finally {
              setLoggingOut(false);
            }
          }
        }
      ]
    );
  };

  const MenuItem = ({ icon, title, value, onPress, color = '#2974ff', badge, danger = false }: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, danger && styles.dangerMenuItem]} 
      onPress={onPress}
      disabled={loggingOut}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: danger ? 'rgba(239, 68, 68, 0.1)' : `${color}20` }]}>
        <MaterialCommunityIcons 
          name={icon} 
          size={22} 
          color={danger ? '#ef4444' : color} 
        />
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, danger && styles.dangerText]}>{title}</Text>
        {value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      {!danger && <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />}
      {danger && loggingOut ? (
        <ActivityIndicator size="small" color="#ef4444" />
      ) : (
        danger && <MaterialCommunityIcons name="logout" size={20} color="#ef4444" />
      )}
    </TouchableOpacity>
  );

  const SwitchItem = ({ icon, title, value, onToggle, color = '#8b5cf6' }: any) => (
    <View style={styles.menuItem}>
      <View style={[styles.menuIconContainer, { backgroundColor: `${color}20` }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.menuTitle}>{title}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#475569', true: '#2974ff' }}
        thumbColor={value ? '#ffffff' : '#94a3b8'}
        ios_backgroundColor="#475569"
      />
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

  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>መገለጫ</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={['rgba(41, 116, 255, 0.2)', 'rgba(15, 22, 35, 0.9)']}
          style={styles.profileCard}
        >
          <View style={styles.profileImageContainer}>
            <LinearGradient
              colors={['#2974ff', '#1a4c9e']}
              style={styles.profileImage}
            >
              <Text style={styles.profileInitial}>
                {user.fullName.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
            <TouchableOpacity style={styles.editImageButton}>
              <MaterialCommunityIcons name="camera" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.profileName}>{user.fullName}</Text>
          <Text style={styles.profileRole}>{user.role}</Text>
          
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>ሽያጮች</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>ምርቶች</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>ደንበኞች</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Account Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>የመለያ መረጃ</Text>
          
          <MenuItem
            icon="store-outline"
            title="የመደብር ስም"
            value={user.storeName}
            color="#2974ff"
            onPress={() => Alert.alert('መረጃ', 'ማስተካከያ በሂደት ላይ')}
          />
          
          <MenuItem
            icon="email-outline"
            title="ኢሜይል"
            value={user.email}
            color="#f59e0b"
            onPress={() => Alert.alert('መረጃ', 'ማስተካከያ በሂደት ላይ')}
          />
          
          <MenuItem
            icon="phone-outline"
            title="ስልክ ቁጥር"
            value={user.phone}
            color="#10b981"
            onPress={() => Alert.alert('መረጃ', 'ማስተካከያ በሂደት ላይ')}
          />
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ቅንብሮች</Text>
          
          <SwitchItem
            icon="bell-outline"
            title="ማሳወቂያዎች"
            value={notifications}
            onToggle={setNotifications}
            color="#8b5cf6"
          />
          
          <SwitchItem
            icon="theme-light-dark"
            title="ጨለማ ሞድ"
            value={darkMode}
            onToggle={setDarkMode}
            color="#2974ff"
          />
          
          <MenuItem
            icon="translate"
            title="ቋንቋ"
            value="አማርኛ"
            color="#f59e0b"
            onPress={() => Alert.alert('ቋንቋ', 'እስካሁን አልተዘጋጀም')}
          />
          
          <MenuItem
            icon="currency-usd"
            title="ምንዛሬ"
            value="ETB"
            color="#10b981"
            onPress={() => Alert.alert('ምንዛሬ', 'እስካሁን አልተዘጋጀም')}
          />
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ድጋፍ</Text>
          
          <MenuItem
            icon="help-circle-outline"
            title="እገዛ"
            color="#8b5cf6"
            onPress={() => Alert.alert('እገዛ', 'በሂደት ላይ')}
          />
          
          <MenuItem
            icon="file-document-outline"
            title="ውሎች እና ቅድመ ሁኔታዎች"
            color="#64748b"
            onPress={() => Alert.alert('ውሎች', 'እስካሁን አልተዘጋጀም')}
          />
          
          <MenuItem
            icon="shield-check-outline"
            title="የግላዊነት ፖሊሲ"
            color="#64748b"
            onPress={() => Alert.alert('ግላዊነት', 'እስካሁን አልተዘጋጀም')}
          />
          
          <MenuItem
            icon="information-outline"
            title="ስለ አፕሊኬሽኑ"
            value="ስሪት 2.4.0"
            color="#94a3b8"
            onPress={() => Alert.alert('ስሪት 2.4.0', 'AutoParts Pro')}
          />
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>መለያ</Text>
          
          <MenuItem
            icon="logout"
            title="ዘግተህ ውጣ"
            danger={true}
            onPress={handleLogout}
          />
        </View>

        {/* Bottom padding for tab bar */}
        <View style={{ height: 90 }} />
      </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileCard: {
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(41, 116, 255, 0.3)',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#2974ff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f1623',
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  profileRole: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 20,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2974ff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dangerMenuItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  dangerText: {
    color: '#ef4444',
  },
  menuValue: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});