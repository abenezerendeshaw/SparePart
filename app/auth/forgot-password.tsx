import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useRef, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { authApi } from '../lib/api';
import { useLanguage } from '../../context/LanguageContext';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  const codeInputs = useRef<Array<TextInput | null>>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const startTimer = () => {
    setTimer(60);
    setResendDisabled(true);
  };

  const handleRequestCode = async () => {
    if (!email) {
      Alert.alert(t('error'), t('emailRequired', 'auth'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t('error'), t('validEmail', 'auth'));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.post('/forgot-password', { 
        email,
        action: 'request'
      });

      if (response.data.status === 'success' || response.data.success) {
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setStep('verify');
        startTimer();
        
        if (__DEV__ && response.data.debug_code) {
          Alert.alert('Debug Code', `Your verification code is: ${response.data.debug_code}`);
        }
      } else {
        Alert.alert(t('error'), response.data.message || t('error'));
      }
    } catch (error: any) {
      console.log('Error requesting reset:', error);
      Alert.alert(
        t('error'), 
        error.response?.data?.message || error.response?.data?.errors?.email?.[0] || t('tryAgain', 'common')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      Alert.alert(t('error'), t('validCodeRequired', 'auth'));
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.post('/forgot-password', {
        email,
        code: fullCode,
        action: 'verify'
      });

      if (response.data.status === 'success' || response.data.success) {
        if (response.data.token) {
          setResetToken(response.data.token);
        }
        
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
        
        setStep('reset');
      } else {
        Alert.alert(t('error'), response.data.message || t('invalidCode', 'auth'));
      }
    } catch (error: any) {
      console.log('Error verifying code:', error);
      Alert.alert(
        t('error'), 
        error.response?.data?.message || error.response?.data?.errors?.code?.[0] || t('invalidCode', 'auth')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('fillAllFields', 'auth'));
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('passwordMismatch', 'auth'));
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert(t('error'), t('passwordLength', 'auth'));
      return;
    }

    const fullCode = code.join('');

    setLoading(true);
    try {
      const response = await authApi.post('/forgot-password', {
        email,
        code: fullCode,
        new_password: newPassword,
        action: 'reset'
      });

      if (response.data.status === 'success' || response.data.success) {
        Alert.alert(
          t('success'),
          response.data.message || t('passwordResetSuccess', 'auth'),
          [
            {
              text: t('goToLogin', 'auth'),
              onPress: () => router.push('./login')
            }
          ]
        );
      } else {
        Alert.alert(t('error'), response.data.message || t('error'));
      }
    } catch (error: any) {
      console.log('Error resetting password:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstError = Object.values(errors)[0]?.[0];
        Alert.alert(t('error'), firstError || t('error'));
      } else {
        Alert.alert(t('error'), error.response?.data?.message || t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = () => {
    if (resendDisabled) return;
    handleRequestCode();
  };

  const handleCodeChange = (text: string, index: number) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    if (text && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const renderEmailStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>{t('forgotPassword', 'auth')}</Text>
        <Text style={styles.description}>
          {t('enterEmailInstructions', 'auth')}
        </Text>
      </View>

      <View style={styles.formContainer}>
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
              placeholder="name@company.com"
              placeholderTextColor="#64748b"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleRequestCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.signInButtonText}>{t('sendCode', 'auth')}</Text>
              <MaterialCommunityIcons name="send" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => router.push('./login')}
          disabled={loading}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#cbd5e1" />
          <Text style={styles.createAccountButtonText}>{t('backToLogin', 'auth')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderVerifyStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>{t('verifyCode', 'auth')}</Text>
        <Text style={styles.description}>
          {t('enterCodeInstructions', 'auth').replace('{email}', email)}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>{t('verificationCode', 'auth')}</Text>
          <View style={styles.codeContainer}>
            {code.map((digit, index) => (
              <TextInput
                key={index}
                ref={ref => codeInputs.current[index] = ref}
                style={styles.codeInput}
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleCodeChange(text, index)}
                onKeyPress={(e) => handleCodeKeyPress(e, index)}
                selectTextOnFocus
                editable={!loading}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleVerifyCode}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.signInButtonText}>{t('verify', 'auth')}</Text>
              <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.rememberText}>{t('didntReceiveCode', 'auth')}</Text>
          <TouchableOpacity onPress={handleResendCode} disabled={resendDisabled || loading}>
            <Text style={[styles.forgotPassword, resendDisabled && styles.resendLinkDisabled]}>
              {resendDisabled ? t('resendIn', 'auth').replace('{timer}', timer.toString()) : t('resend', 'auth')}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => setStep('email')}
          disabled={loading}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#cbd5e1" />
          <Text style={styles.createAccountButtonText}>{t('changeEmail', 'auth')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderResetStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.welcomeContainer}>
        <Text style={styles.welcomeTitle}>{t('resetPassword', 'auth')}</Text>
        <Text style={styles.description}>
          {t('enterNewPasswordInstructions', 'auth')}
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>{t('newPassword', 'auth')}</Text>
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
              value={newPassword}
              onChangeText={setNewPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>{t('passwordHint', 'auth')}</Text>
        </View>

        <View style={styles.inputWrapper}>
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
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
              disabled={loading}
            >
              <MaterialCommunityIcons
                name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.signInButtonText}>{t('resetPassword', 'auth')}</Text>
              <MaterialCommunityIcons name="lock-reset" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => router.push('./login')}
          disabled={loading}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color="#cbd5e1" />
          <Text style={styles.createAccountButtonText}>{t('backToLogin', 'auth')}</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0f1623', '#1a2634']}
        style={styles.background}
      >
        <View style={styles.blurCircle1} />
        <View style={styles.blurCircle2} />
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={{ width: 44 }} />
          </View>

          <View style={styles.content}>
            {step === 'email' && renderEmailStep()}
            {step === 'verify' && renderVerifyStep()}
            {step === 'reset' && renderResetStep()}
          </View>

          <Text style={styles.versionText}>Version 1.0.0</Text>
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
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
  hint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeInput: {
    width: 48,
    height: 56,
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  createAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  createAccountButtonText: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 4,
  },
  rememberText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2974ff',
  },
  resendLinkDisabled: {
    color: '#64748b',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
    letterSpacing: 1,
  },
});