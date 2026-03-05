import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';

export default function SalesScreen() {
  const router = useRouter();

  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <View style={styles.content}>
        <MaterialCommunityIcons name="cart" size={64} color="#f59e0b" />
        <Text style={styles.title}>ሽያጭ</Text>
        <Text style={styles.subtitle}>ይህ ገጽ በሂደት ላይ ነው</Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>0</Text>
            <Text style={styles.statLabel}>የዛሬ ሽያጭ</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#f59e0b' }]}>ETB 0</Text>
            <Text style={styles.statLabel}>አጠቃላይ ገቢ</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 20,
  },
  statBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
  },
});