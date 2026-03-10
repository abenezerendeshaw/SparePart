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
  Modal,
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
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalIcon, setModalIcon] = useState<'emoticon-sad' | 'emoticon-happy' | 'emoticon-neutral' | 'email-check' | 'email-alert' | 'timer-sand' | 'wifi-off' | 'check-circle' | 'close-circle' | 'alert-circle'>('emoticon-neutral');
  const [modalIconColor, setModalIconColor] = useState('#94a3b8');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  
  const codeInputs = useRef<Array<TextInput | null>>([]);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Animation refs for modal
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

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

  // Custom modal animation
  const showCustomModal = (type: 'success' | 'error' | 'not-found' | 'checking' | 'timeout' | 'network', customMessage?: string) => {
    // Reset animations
    scaleAnim.setValue(0);
    rotateAnim.setValue(0);
    bounceAnim.setValue(0);
    
    // Configure based on type
    switch(type) {
      case 'success':
        setModalIcon('emoticon-happy');
        setModalIconColor('#10b981');
        setModalTitle('✅ Email Found!');
        setModalMessage(customMessage || 'verification code sent to your Email.');
        break;
      case 'not-found':
        setModalIcon('emoticon-sad');
        setModalIconColor('#f59e0b');
        setModalTitle('🔍 Email Not Found');
        setModalMessage(customMessage || 'We couldn\'t find this email in our system. Please check and try again.');
        break;
      case 'error':
        setModalIcon('emoticon-neutral');
        setModalIconColor('#ef4444');
        setModalTitle('😕 Something Went Wrong');
        setModalMessage(customMessage || 'An unexpected error occurred. Please try again.');
        break;
      case 'checking':
        setModalIcon('timer-sand');
        setModalIconColor('#3b82f6');
        setModalTitle('⏳ Checking Database');
        setModalMessage(customMessage || 'Searching our records... If your email exists, you\'ll receive a reset code.');
        break;
      case 'timeout':
        setModalIcon('timer-sand');
        setModalIconColor('#f59e0b');
        setModalTitle('⏰ Request Timeout');
        setModalMessage(customMessage || 'The request took too long. Please check your connection.');
        break;
      case 'network':
        setModalIcon('wifi-off');
        setModalIconColor('#ef4444');
        setModalTitle('📡 No Connection');
        setModalMessage(customMessage || 'Unable to reach our servers. Please check your internet.');
        break;
    }
    
    setModalVisible(true);
    
    // Animate modal entrance
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };

  const closeModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const handleRequestOTP = async () => {
    if (!email) {
      showCustomModal('error', 'Please enter your email address');
      setTimeout(() => closeModal(), 2000);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showCustomModal('error', 'Please enter a valid email address');
      setTimeout(() => closeModal(), 2000);
      return;
    }

    setLoading(true);
    
    // Show checking animation
    showCustomModal('checking', 'Checking if your email is registered...');
    
    // Close modal after 1 second
    setTimeout(() => closeModal(), 1000);

    try {
      const response = await publicApi.post('/forgot-password.php?action=request-otp', { 
        email: email 
      });

      if (response.data && response.data.success) {
        // Success animation
        setTimeout(() => {
          showCustomModal('success');
        }, 500);
        
        setTimeout(() => {
          closeModal();
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
          AsyncStorage.setItem('reset_email', email);
        }, 2000);
      }
    } catch (error: any) {
      setTimeout(() => closeModal(), 500);
      
      setTimeout(() => {
        if (error.code === 'ECONNABORTED') {
          showCustomModal('timeout');
        } else if (error.response?.status === 404) {
          showCustomModal('not-found');
        } else if (error.response?.status === 500) {
          showCustomModal('error', 'Our servers are having issues. Please try again later.');
        } else if (error.message === 'Network Error') {
          showCustomModal('network');
        } else {
          showCustomModal('error');
        }
        
        // Auto close after 3 seconds
        setTimeout(() => closeModal(), 3000);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      showCustomModal('error', 'Please enter the 6-digit code');
      setTimeout(() => closeModal(), 2000);
      return;
    }

    setLoading(true);
    try {
      const response = await publicApi.post('/forgot-password.php?action=verify-otp', {
        email: email,
        otp: fullOtp
      });

      if (response.data.success) {
        showCustomModal('success', 'OTP Verified Successfully! ✅');
        
        setTimeout(() => {
          closeModal();
          
          if (response.data.data && response.data.data.reset_token) {
            setResetToken(response.data.data.reset_token);
            AsyncStorage.setItem('reset_token', response.data.data.reset_token);
          }
          
          setStep('reset');
        }, 1500);
      } else {
        showCustomModal('error', response.data.message || 'Invalid verification code');
        setTimeout(() => closeModal(), 2000);
      }
    } catch (error: any) {
      showCustomModal('error', 'Invalid or expired code');
      setTimeout(() => closeModal(), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      showCustomModal('error', 'Please fill all fields');
      setTimeout(() => closeModal(), 2000);
      return;
    }

    if (newPassword !== confirmPassword) {
      showCustomModal('error', 'Passwords do not match');
      setTimeout(() => closeModal(), 2000);
      return;
    }

    if (newPassword.length < 6) {
      showCustomModal('error', 'Password must be at least 6 characters');
      setTimeout(() => closeModal(), 2000);
      return;
    }

    setLoading(true);
    try {
      const token = resetToken || await AsyncStorage.getItem('reset_token');

      const response = await publicApi.post('/forgot-password.php?action=reset-password', {
        email: email,
        new_password: newPassword,
        confirm_password: confirmPassword,
        reset_token: token
      });

      if (response.data.success) {
        showCustomModal('success', 'Password Reset Successfully! 🎉');
        
        setTimeout(() => {
          closeModal();
          Alert.alert(
            'Success',
            'You can now login with your new password.',
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
        }, 1500);
      } else {
        showCustomModal('error', response.data.message);
        setTimeout(() => closeModal(), 2000);
      }
    } catch (error: any) {
      showCustomModal('error', 'Failed to reset password');
      setTimeout(() => closeModal(), 2000);
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

    if (text && index < 5) {
      codeInputs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      codeInputs.current[index - 1]?.focus();
    }
  };

  // Custom Modal Component
  const CustomAlertModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [
                { scale: scaleAnim },
                {
                  rotate: rotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '5deg']
                  })
                },
                {
                  translateY: bounceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -15]
                  })
                }
              ]
            }
          ]}
        >
          <View style={[styles.modalIconContainer, { backgroundColor: `${modalIconColor}20` }]}>
            <MaterialCommunityIcons 
              name={modalIcon} 
              size={70} 
              color={modalIconColor} 
            />
          </View>
          
          <Text style={styles.modalTitle}>{modalTitle}</Text>
          <Text style={styles.modalMessage}>{modalMessage}</Text>
          
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: modalIconColor }]}
            onPress={closeModal}
          >
            <Text style={styles.modalButtonText}>Got it</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );

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
      
      <CustomAlertModal />
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
    minWidth: 120,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
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