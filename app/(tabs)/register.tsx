import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import api from './lib/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      if (response.data.status === 'success') {
        await AsyncStorage.setItem('authToken', response.data.token);
        router.replace('/dashboard'); // 👈 updated route
      } else {
        Alert.alert('Login Failed', response.data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Network error. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#2563eb',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});