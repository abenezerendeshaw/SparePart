import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import storage from './../lib/storage';
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const { t } = useLanguage(); // Get translation function

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await storage.getItem('authToken');
    setIsAuthenticated(!!token);
  };

  if (isAuthenticated === null) {
    return null;
  }

  if (!isAuthenticated) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 30,
          left: 16,
          right: 16,
          height: 65,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          borderRadius: 10,
          marginHorizontal: 10,
          shadowColor: '#2974ff',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 15,
          elevation: 15,
          borderWidth: 1,
          borderColor: 'rgba(41, 116, 255, 0.3)',
        },

        tabBarBackground: () => (
          <>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 6,
                  backgroundColor: 'rgba(41, 116, 255, 0.2)',
                  transform: [{ scale: 1.05 }],
                  opacity: 0.6,
                },
              ]}
            />

            <BlurView
              intensity={95}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 6, overflow: 'hidden' }]}
            >
              <LinearGradient
                colors={['rgba(15, 22, 35, 0.95)', 'rgba(26, 38, 52, 0.98)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 6 }]}
              />
            </BlurView>

            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: 'rgba(41, 116, 255, 0.5)',
                  opacity: 0.8,
                },
              ]}
            />
          </>
        ),

        tabBarActiveTintColor: '#2974ff',
        tabBarInactiveTintColor: '#64748b',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 8,
        },
        tabBarIconStyle: {
          marginTop: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('home', 'navigation'),
          tabBarLabel: t('home', 'navigation'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons
                name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          title: t('products', 'navigation'),
          tabBarLabel: t('products', 'navigation'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons
                name={focused ? 'package-variant-closed' : 'package-variant-closed'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="sales"
        options={{
          title: t('sales', 'navigation'),
          tabBarLabel: t('sales', 'navigation'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons
                name={focused ? 'cash-register' : 'cash-register'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: t('inventory', 'navigation'),
          tabBarLabel: t('inventory', 'navigation'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons
                name="warehouse"
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('profile', 'navigation'),
          tabBarLabel: t('profile', 'navigation'),
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons
                name={focused ? 'account-circle' : 'account-circle-outline'}
                size={22}
                color={color}
              />
            </View>
          ),
        }}
      />

      {/* Hidden screens - these won't show in tab bar */}
      <Tabs.Screen name="products/add" options={{ href: null }} />
      <Tabs.Screen name="sales/new" options={{ href: null }} />
      <Tabs.Screen name="sales/[id]" options={{ href: null }} />
      <Tabs.Screen name="sales/receipt" options={{ href: null }} />
      <Tabs.Screen name="products/[id]" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(41, 116, 255, 0.15)',
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});