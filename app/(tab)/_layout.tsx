import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import storage from './../lib/storage';
import React from 'react';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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
          bottom: 30, // Moved up 30px from bottom (was 0, then 20, now 30)
          left: 16,
          right: 16,
          height: 65,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          borderRadius: 10, // Changed to 6
          marginHorizontal: 10,
          // Glowing effect shadow
          shadowColor: '#2974ff',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.5,
          shadowRadius: 15,
          elevation: 15, // For Android
          // Additional glow layers
          borderWidth: 1,
          borderColor: 'rgba(41, 116, 255, 0.3)',
        },
        tabBarBackground: () => (
          <>
            {/* Outer glow layer */}
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
            {/* Inner background with blur */}
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
            {/* Inner border glow */}
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
          title: 'ዋና',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons 
                name={focused ? "view-dashboard" : "view-dashboard-outline"} 
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
          title: 'ምርቶች',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons 
                name={focused ? "package" : "package-outline"} 
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
          title: 'ሽያጭ',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons 
                name={focused ? "cart" : "cart-outline"} 
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
          title: 'ክምችት',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons 
                name={focused ? "warehouse" : "warehouse"} 
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
          title: 'መገለጫ',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconContainer]}>
              <MaterialCommunityIcons 
                name={focused ? "account-circle" : "account-circle-outline"} 
                size={22} 
                color={color} 
              />
            </View>
          ),
        }}
      />


       <Tabs.Screen name="products/add" options={{ headerShown: false, href: null }} />
       <Tabs.Screen name="sales/new" options={{ headerShown: false, href: null }} />
       <Tabs.Screen name="sales/[id]" options={{ headerShown: false, href: null }} />
       <Tabs.Screen name="products/[id]" options={{ headerShown: false, href: null }} />


    </Tabs>
    
  );
}



const styles = StyleSheet.create({
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 6, // Changed to 6 to match tab bar
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  activeIconContainer: {
    backgroundColor: 'rgba(41, 116, 255, 0.15)',
    // Inner glow for active icon
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
});