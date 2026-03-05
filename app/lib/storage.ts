import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class SecureStorage {
  private static instance: SecureStorage;
  private isStorageAvailable: boolean = true;

  private constructor() {
    this.checkStorageAvailability();
  }

  static getInstance(): SecureStorage {
    if (!SecureStorage.instance) {
      SecureStorage.instance = new SecureStorage();
    }
    return SecureStorage.instance;
  }

  private async checkStorageAvailability() {
    try {
      await AsyncStorage.setItem('__test__', 'test');
      await AsyncStorage.removeItem('__test__');
      this.isStorageAvailable = true;
    } catch (error) {
      console.warn('AsyncStorage is not available:', error);
      this.isStorageAvailable = false;
    }
  }

  async setItem(key: string, value: string): Promise<boolean> {
    try {
      if (!this.isStorageAvailable) {
        // Fallback to memory storage or sessionStorage for web
        if (Platform.OS === 'web') {
          sessionStorage.setItem(key, value);
          return true;
        }
        return false;
      }
      await AsyncStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`Error saving ${key}:`, error);
      return false;
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (!this.isStorageAvailable) {
        // Fallback to memory storage or sessionStorage for web
        if (Platform.OS === 'web') {
          return sessionStorage.getItem(key);
        }
        return null;
      }
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      if (!this.isStorageAvailable) {
        if (Platform.OS === 'web') {
          sessionStorage.removeItem(key);
          return true;
        }
        return false;
      }
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  }

  async clear(): Promise<boolean> {
    try {
      if (!this.isStorageAvailable) {
        if (Platform.OS === 'web') {
          sessionStorage.clear();
          return true;
        }
        return false;
      }
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

export default SecureStorage.getInstance();