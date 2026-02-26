import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from './lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/login', { email, password });
      console.log('Login response:', response.data);

      if (response.data.status === 'success') {
        const token = response.data.data?.token || response.data.token;

        if (!token) {
          Alert.alert('Login Failed', 'Token not found in response');
          setLoading(false);
          return;
        }

        await AsyncStorage.setItem('authToken', token); // await is crucial
        router.replace('/dashboard'); // navigate only after token saved
      } else {
        Alert.alert('Login Failed', 'Invalid credentials');
      }
    } catch (error: any) {
      console.log('Login error:', error.response || error);
      const message = error.response?.data?.message || error.message || 'Something went wrong';
      Alert.alert('Login Failed', message);
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
      />

      <TextInput
        placeholder="Password"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign In</Text>}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, marginBottom: 15 },
  button: { backgroundColor: '#2563eb', padding: 15, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});