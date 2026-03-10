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
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import publicApi from '../lib/public-api';
import { useLanguage } from '../../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [step, setStep] = useState<'email' | 'verify' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleRequestOTP = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      console.log('Sending OTP request to:', '/forgot-password.php?action=request-otp');
      console.log('With email:', email);
      
      const response = await publicApi.post('/forgot-password.php?action=request-otp', { 
        email: email 
      });

      console.log('Full response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.success) {
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
        
        await AsyncStorage.setItem('reset_email', email);
        
        Alert.alert(
          'Success', 
          response.data.message || 'OTP sent successfully to your email'
        );
      } else {
        Alert.alert('Error', response.data?.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      console.log('Error details:', {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
      });
      
      if (error.code === 'ECONNABORTED') {
        Alert.alert('Error', 'Request timeout. Please check your internet connection.');
      } else if (error.response?.status === 404) {
        Alert.alert(
          'Email Not Found!', 
          'If your email is registered in our system, you will receive a password reset code.'
        );
      } else if (error.response?.status === 500) {
        Alert.alert('Error', 'Server error. Please try again later.');
      } else if (error.message === 'Network Error') {
        Alert.alert(
          'Error', 
          'Network error. Please check your internet connection.'
        );
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to send OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const response = await publicApi.post('/forgot-password.php?action=verify-otp', {
        email: email,
        otp: fullOtp
      });

      console.log('Verify OTP response:', response.data);

      if (response.data.success) {
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
        
        if (response.data.data && response.data.data.reset_token) {
          setResetToken(response.data.data.reset_token);
          await AsyncStorage.setItem('reset_token', response.data.data.reset_token);
        }
        
        setStep('reset');
      } else {
        Alert.alert('Error', response.data.message || 'Invalid verification code');
      }
    } catch (error: any) {
      console.log('Error verifying OTP:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Invalid verification code'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const token = resetToken || await AsyncStorage.getItem('reset_token');
      const fullOtp = otp.join('');

      const response = await publicApi.post('/forgot-password.php?action=reset-password', {
        email: email,
        new_password: newPassword,
        confirm_password: confirmPassword,
        reset_token: token
      });

      console.log('Reset password response:', response.data);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Password reset successfully! You can now login with your new password.',
          [
            {
              text: 'Go to Login',
              onPress: () => {
                AsyncStorage.removeItem('reset_email');
                AsyncStorage.removeItem('reset_token');
                router.push('./login');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Failed to reset password');
      }
    } catch (error: any) {
      console.log('Error resetting password:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.message || 'Failed to reset password'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendDisabled) return;
    await handleRequestOTP();
  };

  const handleCodeChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input
    if (text && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    // Handle backspace to go to previous input
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  const renderEmailStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['rgba(41, 116, 255, 0.2)', 'rgba(41, 116, 255, 0.05)']}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name="email-lock" size={60} color="#2974ff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Forgot Password?</Text>
      <Text style={styles.subtitle}>
        Enter your email address and we'll send you a 6-digit code to reset your password.
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Email Address</Text>
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
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleRequestOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Send Code</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('./login')}
        disabled={loading}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
        <Text style={styles.secondaryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderVerifyStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['rgba(41, 116, 255, 0.2)', 'rgba(41, 116, 255, 0.05)']}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name="shield-lock" size={60} color="#2974ff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Verify Code</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to {'\n'}
        <Text style={styles.emailText}>{email}</Text>
      </Text>

      <View style={styles.codeContainer}>
        {otp.map((digit, index) => (
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

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Verify Code</Text>
        )}
      </TouchableOpacity>

      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive code? </Text>
        <TouchableOpacity onPress={handleResendCode} disabled={resendDisabled || loading}>
          <Text style={[styles.resendLink, resendDisabled && styles.resendLinkDisabled]}>
            {resendDisabled ? `Resend in ${formatTime(timer)}` : 'Resend'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('email')}
        disabled={loading}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
        <Text style={styles.secondaryButtonText}>Change Email</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const renderResetStep = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={['rgba(41, 116, 255, 0.2)', 'rgba(41, 116, 255, 0.05)']}
          style={styles.iconCircle}
        >
          <MaterialCommunityIcons name="lock-reset" size={60} color="#2974ff" />
        </LinearGradient>
      </View>

      <Text style={styles.title}>Create New Password</Text>
      <Text style={styles.subtitle}>
        Your new password must be different from previous used passwords.
      </Text>

      <View style={styles.inputWrapper}>
        <Text style={styles.label}>New Password</Text>
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
        <Text style={styles.hint}>Minimum 6 characters</Text>
      </View>

      <View style={styles.inputWrapper}>
        <Text style={styles.label}>Confirm Password</Text>
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
        style={[styles.primaryButton, loading && styles.buttonDisabled]}
        onPress={handleResetPassword}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.primaryButtonText}>Reset Password</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => router.push('./login')}
        disabled={loading}
      >
        <MaterialCommunityIcons name="arrow-left" size={20} color="#94a3b8" />
        <Text style={styles.secondaryButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.background}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {step === 'email' && renderEmailStep()}
            {step === 'verify' && renderVerifyStep()}
            {step === 'reset' && renderResetStep()}
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(41, 116, 255, 0.3)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  emailText: {
    color: '#2974ff',
    fontWeight: '600',
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
  hint: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
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
  primaryButton: {
    backgroundColor: '#2974ff',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flexDirection: 'row',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  resendText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  resendLink: {
    color: '#2974ff',
    fontSize: 14,
    fontWeight: '600',
  },
  resendLinkDisabled: {
    color: '#64748b',
  },
});