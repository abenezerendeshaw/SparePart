import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
// import storage from './lib/storage'; // Uncomment if needed

export default function RegisterScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // ... rest of your existing code remains the same

  const validateForm = () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      Alert.alert('ስህተት', 'እባክዎ ሁሉንም መስኮች ይሙሉ');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('ስህተት', 'የይለፍ ቃላት አይዛመዱም');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('ስህተት', 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('ስህተት', 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ');
      return false;
    }

    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      Alert.alert('ስህተት', 'የስልክ ቁጥር ቅርጸት ትክክል አይደለም');
      return false;
    }

    if (!agreeToTerms) {
      Alert.alert('ስህተት', 'ለመቀጠል ውሎችን መቀበል አለብዎት');
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/register', {
        full_name: fullName.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '',
        password: password,
              });

      console.log('Registration response:', response.data);

      if (response.data.status === 'success') {
        Alert.alert(
          'ተሳክቷል',
          'መለያዎ በተሳካ ሁኔታ ተፈጥሯል። እባክዎ ይግቡ',
          [
            {
              text: 'ወደ መግቢያ ይሂዱ',
              onPress: () => router.push('./login')
            }
          ]
        );
      } else {
        Alert.alert('ስህተት', response.data.message || 'ምዝገባ አልተሳካም');
      }
    } catch (error: any) {
      console.log('Registration error:', error.response || error);
      
      let message = 'እባክዎ እንደገና ይሞክሩ';
      if (error.response) {
        message = error.response.data?.message || message;
        
        // Handle duplicate entry errors
        if (error.response.status === 409) {
          if (message.includes('Username')) {
            message = 'ይህ የተጠቃሚ ስም አስቀድሞ ተመዝግቧል';
          } else if (message.includes('Email')) {
            message = 'ይህ ኢሜይል አስቀድሞ ተመዝግቧል';
          }
        }
      } else if (error.request) {
        message = 'ከአገልጋይ ጋር መገናኘት አልተቻለም። ኢንተርኔትዎን ያረጋግጡ';
      }
      
      Alert.alert('ስህተት', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
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
          {/* Header with Back Button */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>መለያ ፍጠር</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Hero Image Section */}
          <View style={styles.heroContainer}>
            <LinearGradient
              colors={['rgba(41, 116, 255, 0.2)', 'rgba(15, 22, 35, 0.95)']}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroTitle}>Join AutoParts Pro</Text>
                <Text style={styles.heroSubtitle}>Scale your automotive business today.</Text>
                <View style={styles.ethiopianBadge}>
                  <Text style={styles.ethiopianBadgeText}>ለኢትዮጵያ ንግድ የተበጀ</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.formDescription}>
              መደብርዎን ለመመዝገብ እና እቃዎችን በብቃት ለማስተዳደር ይጀምሩ
            </Text>

            {/* Full Name Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>ሙሉ ስም</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#64748b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="አበበ በቀለ"
                  placeholderTextColor="#64748b"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Username Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>የተጠቃሚ ስም</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="at"
                  size={20}
                  color="#64748b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="username"
                  placeholderTextColor="#64748b"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={username}
                  onChangeText={setUsername}
                />
              </View>
            </View>

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
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Phone Input (Optional) */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>ስልክ ቁጥር (አማራጭ)</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color="#64748b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="+251 911 234 567"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>የይለፍ ቃል</Text>
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
              <Text style={styles.passwordHint}>ቢያንስ 6 ቁምፊዎች</Text>
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>የይለፍ ቃል ድገም</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="lock-check-outline"
                  size={20}
                  color="#64748b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#64748b"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialCommunityIcons
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Conditions */}
            <TouchableOpacity
              style={styles.termsContainer}
              onPress={() => setAgreeToTerms(!agreeToTerms)}
            >
              <View style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && (
                  <MaterialCommunityIcons name="check" size={14} color="#ffffff" />
                )}
              </View>
              <Text style={styles.termsText}>
                የአገልግሎት ውል እና የግላዊነት መመሪያዎችን ተቀበልኩ
              </Text>
            </TouchableOpacity>

            {/* Register Button */}
            <TouchableOpacity
              style={styles.registerButton}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.registerButtonText}>መለያ ፍጠር</Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={20}
                    color="#ffffff"
                  />
                </>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>ቀድሞውንም መለያ አለዎት? </Text>
              <TouchableOpacity onPress={() => router.push('./login')}>
                <Text style={styles.loginLink}>ወደ መግቢያ ይሂዱ</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Terms */}
            <Text style={styles.footerText}>
              በመመዝገብ፣ የአገልግሎት ውል እና የግላዊነት መመሪያዎችን ተቀብለዋል
            </Text>

            {/* Version */}
           
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
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
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
  headerSpacer: {
    width: 44,
  },
  heroContainer: {
    height: 200,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
  },
  heroContent: {
    gap: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
  },
  ethiopianBadge: {
    backgroundColor: 'rgba(41, 116, 255, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  ethiopianBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  formDescription: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 56,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 16,
    paddingRight: 12,
  },
  eyeIcon: {
    paddingHorizontal: 12,
  },
  passwordHint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2974ff',
    borderColor: '#2974ff',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2974ff',
    height: 56,
    borderRadius: 12,
    gap: 8,
    marginBottom: 20,
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#94a3b8',
    fontSize: 16,
  },
  loginLink: {
    color: '#2974ff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
  },
});