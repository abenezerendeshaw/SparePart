import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome 👋</Text>
      <Text style={styles.subtitle}>Your App Name</Text>

      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={() => router.push('/register')}
      >
        <Text style={styles.secondaryText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    width: '100%',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 12,
  },
  secondaryText: {
    color: '#2563eb',
    fontWeight: '600',
  },
});