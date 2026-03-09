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
  View,
  Dimensions
} from 'react-native';
import api from '../lib/api';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function RegisterScreen() {
  const router = useRouter();
  const { t } = useLanguage();
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

  const validateForm = () => {
    if (!fullName || !username || !email || !password || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields', 'auth'));
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('passwordMismatch', 'auth'));
      return false;
    }

    if (password.length < 6) {
      Alert.alert(t('error'), t('passwordLength', 'auth'));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), t('validEmail', 'auth'));
      return false;
    }

    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
      Alert.alert(t('error'), t('validPhone', 'auth'));
      return false;
    }

    if (!agreeToTerms) {
      Alert.alert(t('error'), t('agreeTermsRequired', 'auth'));
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
          t('success'),
          t('registrationSuccess', 'auth'),
          [
            {
              text: t('goToLogin', 'auth'),
              onPress: () => router.push('./login')
            }
          ]
        );
      } else {
        Alert.alert(t('error'), response.data.message || t('registrationFailed', 'auth'));
      }
    } catch (error: any) {
      console.log('Registration error:', error.response || error);
      
      let message = t('tryAgain', 'common');
      if (error.response) {
        message = error.response.data?.message || message;
        
        // Handle duplicate entry errors
        if (error.response.status === 409) {
          if (message.toLowerCase().includes('username')) {
            message = t('usernameExists', 'auth');
          } else if (message.toLowerCase().includes('email')) {
            message = t('emailExists', 'auth');
          }
        }
      } else if (error.request) {
        message = t('connectionError', 'common');
      }
      
      Alert.alert(t('error'), message);
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
            <Text style={styles.headerTitle}>{t('createAccount', 'auth')}</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Simple Hero */}
          <View style={styles.simpleHero}>
            <Text style={styles.simpleHeroTitle}>AutoParts Pro</Text>
            <Text style={styles.simpleHeroSubtitle}>{t('ethiopianBadge', 'auth')}</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <Text style={styles.formDescription}>
              {t('formDescription', 'auth')}
            </Text>

            {/* Row 1: Full Name & Username */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>{t('fullName', 'auth')}</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="account-outline"
                    size={20}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t('fullNamePlaceholder', 'auth')}
                    placeholderTextColor="#64748b"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>{t('username', 'auth')}</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons
                    name="at"
                    size={20}
                    color="#64748b"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder={t('usernamePlaceholder', 'auth')}
                    placeholderTextColor="#64748b"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={username}
                    onChangeText={setUsername}
                  />
                </View>
              </View>
            </View>

            {/* Email Input - Full Width */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>{t('email', 'common')}</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={20}
                  color="#64748b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('emailPlaceholder', 'auth')}
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Phone Input - Full Width */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>{t('phone', 'auth')}</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons
                  name="phone-outline"
                  size={20}
                  color="#64748b"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('phonePlaceholder', 'auth')}
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Row 3: Password & Confirm Password */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>{t('password', 'common')}</Text>
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
                <Text style={styles.passwordHint}>{t('passwordHint', 'auth')}</Text>
              </View>

              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>{t('confirmPassword', 'auth')}</Text>
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
                {t('agreeTerms', 'auth')}
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
                  <Text style={styles.registerButtonText}>{t('createAccount', 'auth')}</Text>
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
              <Text style={styles.loginText}>{t('haveAccount', 'auth')} </Text>
              <TouchableOpacity onPress={() => router.push('./login')}>
                <Text style={styles.loginLink}>{t('goToLogin', 'auth')}</Text>
              </TouchableOpacity>
            </View>

            {/* Footer Terms */}
            <Text style={styles.footerText}>
              {t('footerTerms', 'auth')}
            </Text>
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
  simpleHero: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  simpleHeroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  simpleHeroSubtitle: {
    fontSize: 14,
    color: '#2974ff',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  halfWidth: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    height: 48,
  },
  inputIcon: {
    paddingHorizontal: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 14,
    paddingRight: 10,
  },
  eyeIcon: {
    paddingHorizontal: 10,
  },
  passwordHint: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 4,
    marginLeft: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
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
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  registerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2974ff',
    height: 50,
    borderRadius: 10,
    gap: 8,
    marginBottom: 16,
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loginText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  loginLink: {
    color: '#2974ff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
});