import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import api from '../lib/api';
import storage from '../lib/storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    loadRememberedEmail();
  }, []);

  const loadRememberedEmail = async () => {
    try {
      const remembered = await storage.getItem('rememberedEmail');
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    } catch (error) {
      console.log('Error loading remembered email:', error);
    } finally {
      setInitializing(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('ስህተት', 'ኢሜይል እና የይለፍ ቃል ያስፈልጋል');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      console.log('Login response:', response.data);

      if (response.data.status === 'success') {
        const token = response.data.data?.token || response.data.token;

        if (!token) {
          Alert.alert('የተሳሳተ መግቢያ', 'ቶከን አልተገኘም');
          setLoading(false);
          return;
        }

        // Save token using storage utility
        const tokenSaved = await storage.setItem('authToken', token);
        
        if (!tokenSaved) {
          console.warn('Token not saved to persistent storage');
        }
        
        // Handle remember me
        if (rememberMe) {
          await storage.setItem('rememberedEmail', email);
        } else {
          await storage.removeItem('rememberedEmail');
        }
        
        // Navigate to tabs dashboard
        router.replace('/(tab)');
      } else {
        Alert.alert('የተሳሳተ መግቢያ', 'እባክዎ ኢሜይል እና የይለፍ ቃልዎን ያረጋግጡ');
      }
    } catch (error: any) {
      console.log('Login error:', error.response || error);
      const message = error.response?.data?.message || error.message || 'እባክዎ እንደገና ይሞክሩ';
      Alert.alert('የተሳሳተ መግቢያ', message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2974ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#0f1623', '#1a2634']}
        style={styles.background}
      >
        {/* Decorative Blur Elements */}
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          {/* Welcome Text */}
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>እንኳን ደህና መጡ</Text>
            <Text style={styles.welcomeSubtitle}>Welcome Back</Text>
            <Text style={styles.description}>
              የእቃ ክምችትዎን ለማስተዳደር ይግቡ
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>ኢሜይል</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons 
                  name="email-outline" 
                  size={20} 
                  color="#64748b" 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="name@company.com"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>የይለፍ ቃል</Text>
                <TouchableOpacity onPress={() => Alert.alert('መለሳ', 'እስካሁን አልተዘጋጀም')}>
                  <Text style={styles.forgotPassword}>ፓስዎርድ ረሳሁ?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons 
                  name="lock-outline" 
                  size={20} 
                  color="#64748b" 
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#64748b" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Remember Me Checkbox */}
            <TouchableOpacity 
              style={styles.rememberContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe && (
                  <MaterialCommunityIcons name="check" size={14} color="#ffffff" />
                )}
              </View>
              <Text style={styles.rememberText}>ይህን መሣሪያ አስታውስ</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity 
              style={styles.signInButton}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.signInButtonText}>ግባ</Text>
                  <MaterialCommunityIcons 
                    name="login" 
                    size={20} 
                    color="#ffffff" 
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ለመጀመሪያ ጊዜ ነው?</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Create Account Button */}
            <TouchableOpacity 
              style={styles.createAccountButton}
              onPress={() => router.push('/auth/register')}
            >
              <Text style={styles.createAccountButtonText}>
                አዲስ መለያ ፍጠር
              </Text>
            </TouchableOpacity>

            {/* Footer Links */}
            <View style={styles.footer}>
              <TouchableOpacity onPress={() => Alert.alert('የግላዊነት', 'እስካሁን አልተዘጋጀም')}>
                <Text style={styles.footerLink}>የግላዊነት መመሪያ</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('አገልግሎት', 'እስካሁን አልተዘጋጀም')}>
                <Text style={styles.footerLink}>የአገልግሎት ውል</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Alert.alert('ድጋፍ', 'እስካሁን አልተዘጋጀም')}>
                <Text style={styles.footerLink}>ድጋፍ</Text>
              </TouchableOpacity>
            </View>

            {/* Version */}
            <Text style={styles.versionText}>ስሪት 2.4.0</Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1623',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  blurCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    transform: [{ scale: 1.5 }],
  },
  blurCircle2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    transform: [{ scale: 1.5 }],
  },
  welcomeContainer: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 24,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  forgotPassword: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2974ff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    padding: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    paddingRight: 12,
    color: '#ffffff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
  },
  rememberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2974ff',
    borderColor: '#2974ff',
  },
  rememberText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  signInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2974ff',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  signInButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  dividerText: {
    color: '#64748b',
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '500',
  },
  createAccountButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 20,
  },
  createAccountButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 16,
  },
  footerLink: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
});