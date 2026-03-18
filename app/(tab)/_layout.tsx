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
          bottom: 20,
          left: 10,
          right: 10,
          height: 70,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          borderRadius: 20,
          marginHorizontal: 5,
          shadowColor: '#2974ff',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 10,
          elevation: 10,
          borderWidth: 1,
          borderColor: 'rgba(41, 116, 255, 0.2)',
        },

        tabBarBackground: () => (
          <>
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 20,
                  backgroundColor: 'rgba(41, 116, 255, 0.1)',
                  transform: [{ scale: 1.02 }],
                  opacity: 0.4,
                },
              ]}
            />

            <BlurView
              intensity={90}
              tint="dark"
              style={[StyleSheet.absoluteFill, { borderRadius: 20, overflow: 'hidden' }]}
            >
              <LinearGradient
                colors={['rgba(15, 22, 35, 0.92)', 'rgba(26, 38, 52, 0.95)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              />
            </BlurView>

            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: 'rgba(41, 116, 255, 0.4)',
                  opacity: 0.6,
                },
              ]}
            />
          </>
        ),

        tabBarActiveTintColor: '#2974ff',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarShowLabel: true,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginBottom: 10,
        },
        tabBarIconStyle: {
          marginTop: 6,
        },
        tabBarItemStyle: {
          height: 65,
          paddingVertical: 2,
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