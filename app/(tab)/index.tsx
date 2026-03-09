import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
} from 'react-native-reanimated';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  ScrollView
} from 'react-native';
import api from '../lib/api';
import storage from '../lib/storage';
import axios from 'axios';

const { width } = Dimensions.get('window');

// Types based on actual API response
interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category: string;
  brand: string | null;
  total_stock: number;
  selling_price: string | number;
  status: string;
}

interface Sale {
  id: number;
  sale_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: string;
  discount: string;
  tax: string;
  grand_total: string;
  paid_amount: string;
  due_amount: string;
  profit: string;
  payment_method: string;
  payment_status: string;
  sale_date: string;
  sale_time: string;
  sold_by: number;
  owner_id: number;
  notes: string;
  created_at: string;
  cashier_name: string;
  item_count: number;
}

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  totalRevenue: number;
  lowStockCount: number;
  todaySales: number;
  todayRevenue: number;
  recentProducts: Product[];
  recentSales: Sale[];
}

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userFullName, setUserFullName] = useState('ነጋዴ');
  const [userRole, setUserRole] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  const HEADER_MAX_HEIGHT = 120;
  const HEADER_MIN_HEIGHT = 70;
  const SCROLL_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      headerOpacity.value = interpolate(
        event.contentOffset.y,
        [0, 100],
        [1, 0.9],
        Extrapolate.CLAMP
      );
    },
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const headerHeight = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolate.CLAMP
    );

    const headerTranslateY = interpolate(
      scrollY.value,
      [0, SCROLL_RANGE],
      [0, -10],
      Extrapolate.CLAMP
    );

    return {
      height: withSpring(headerHeight, {
        damping: 15,
        stiffness: 100,
      }),
      transform: [{ translateY: headerTranslateY }],
      opacity: headerOpacity.value,
    };
  });

  const fabAnimatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, 200],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, 10],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity: headerOpacity.value,
    };
  });

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('am-ET', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const fetchUserData = async () => {
    try {
      // Try to get user info from token or API
      const token = await storage.getItem('authToken');
      if (token) {
        // You can decode the JWT token to get user info
        // This is a simple example - you might have a /user endpoint
        const base64Url = token.split('.')[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          if (payload.full_name) {
            setUserFullName(payload.full_name);
          }
          if (payload.role) {
            setUserRole(payload.role);
          }
        }
      }
    } catch (error) {
      console.log('Error fetching user data:', error);
    }
  };

  const fetchData = async () => {
    try {
      const token = await storage.getItem('authToken');
      
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // Fetch user data first
      await fetchUserData();

      const api = axios.create({
        baseURL: 'https://specificethiopia.com/inventory/api/v1',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      // Fetch products
      const productsResponse = await api.get('/products?limit=100');
      
      // Fetch sales
      let salesResponse = { data: { data: { sales: [] } } };
      try {
        salesResponse = await api.get('/sales?limit=50');
        console.log('Sales fetched:', salesResponse.data?.data?.sales?.length || 0);
      } catch (salesError) {
        console.log('Sales fetch failed:', salesError.message);
      }

      // Extract data
      const productsData = productsResponse.data?.data?.products || [];
      const salesData = salesResponse.data?.data?.sales || [];

      setProducts(productsData);
      setSales(salesData);

      // If we have sales data and user name not set, use cashier name
      if (salesData.length > 0 && salesData[0].cashier_name && userFullName === 'ነጋዴ') {
        setUserFullName(salesData[0].cashier_name);
      }

    } catch (error: any) {
      console.error('Fetch error:', error.message);
      Alert.alert('ስህተት', 'ዳታ መጫን አልተቻለም');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Calculate today's revenue
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter(sale => sale.sale_date === todayStr);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + Number(sale.grand_total), 0);

  // Calculate statistics
  const stats: DashboardStats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, item) => sum + (Number(item.total_stock) || 0), 0),
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + (Number(sale.grand_total) || 0), 0),
    lowStockCount: products.filter(p => (p.total_stock || 0) <= 10).length,
    todaySales: todaySales.length,
    todayRevenue: todayRevenue,
    recentProducts: products.slice(0, 10),
    recentSales: sales.slice(0, 5)
  };

  const StatCard = ({ title, value, icon, colors, subtitle }: any) => (
    <LinearGradient
      colors={colors || ['#2974ff', '#1a4c9e']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.statCard}
    >
      <View style={styles.statIconContainer}>
        <MaterialCommunityIcons name={icon} size={24} color="#ffffff" />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </LinearGradient>
  );

  const ProductCard = ({ item }: { item: Product }) => {
    const stockLevel = item.total_stock || 0;
    const isLowStock = stockLevel <= 10;

    return (
      <TouchableOpacity 
        style={styles.productCard}
        onPress={() => router.push(`/(tab)/products/${item.id}`)}
      >
        <LinearGradient
          colors={isLowStock ? ['rgba(239, 68, 68, 0.1)', 'rgba(185, 28, 28, 0.05)'] : ['rgba(41, 116, 255, 0.1)', 'rgba(26, 76, 158, 0.05)']}
          style={styles.productCardGradient}
        >
          <View style={styles.productIconContainer}>
            <MaterialCommunityIcons 
              name={item.category?.toLowerCase().includes('brake') ? 'car-brake-parking' : 
                    item.category?.toLowerCase().includes('engine') ? 'engine' : 
                    item.category?.toLowerCase().includes('battery') ? 'car-battery' : 
                    item.category?.toLowerCase().includes('tire') ? 'tire' : 
                    'package-variant'} 
              size={32} 
              color={isLowStock ? '#ef4444' : '#2974ff'} 
            />
          </View>
          
          <View style={styles.productCardContent}>
            <Text style={styles.productCardName} numberOfLines={2}>
              {item.product_name}
            </Text>
            <Text style={styles.productCardCode}>{item.product_code}</Text>
            
            <View style={styles.productCardFooter}>
              <View style={[styles.stockBadge, isLowStock && styles.lowStockBadge]}>
                <MaterialCommunityIcons 
                  name={isLowStock ? 'alert' : 'package-variant'} 
                  size={12} 
                  color={isLowStock ? '#ef4444' : '#2974ff'} 
                />
                <Text style={[styles.stockText, isLowStock && styles.lowStockText]}>
                  {stockLevel}
                </Text>
              </View>
              <Text style={styles.productCardPrice}>
                ETB {Number(item.selling_price).toLocaleString()}
              </Text>
            </View>
          </View>
          
          {isLowStock && (
            <View style={styles.lowStockOverlay}>
              <MaterialCommunityIcons name="alert-circle" size={16} color="#ef4444" />
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const SaleItem = ({ item }: { item: Sale }) => {
    const isToday = item.sale_date === todayStr;
    
    return (
      <TouchableOpacity 
        style={[styles.saleItem, isToday && styles.todaySaleItem]}
        onPress={() => router.push(`/(tab)/sales/${item.id}`)}
      >
        <View style={styles.saleHeader}>
          <View style={styles.saleHeaderLeft}>
            <MaterialCommunityIcons name="receipt" size={20} color="#f59e0b" />
            <Text style={styles.saleInvoice}>{item.sale_code}</Text>
          </View>
          <View style={[styles.paymentStatusBadge, 
            { backgroundColor: item.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)' }
          ]}>
            <Text style={[
              styles.paymentStatusText,
              { color: item.payment_status === 'paid' ? '#10b981' : '#f59e0b' }
            ]}>
              {item.payment_status === 'paid' ? 'ተከፍሏል' : 'ዕዳ'}
            </Text>
          </View>
        </View>
        
        <View style={styles.saleBody}>
          <View>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.saleTime}>{item.sale_time}</Text>
          </View>
          <View style={styles.paymentBadge}>
            <MaterialCommunityIcons 
              name={item.payment_method === 'cash' ? 'cash' : 'credit-card'} 
              size={12} 
              color="#10b981" 
            />
            <Text style={styles.paymentText}>{item.payment_method}</Text>
          </View>
        </View>
        
        <View style={styles.saleFooter}>
          <Text style={styles.saleItems}>{item.item_count} እቃዎች</Text>
          <Text style={styles.saleAmount}>ETB {Number(item.grand_total).toLocaleString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleContactSupport = () => {
    Alert.alert(
      'እገዛ እና ድጋፍ',
      'እንዴት ልንረዳዎ እንችላለን?',
      [
        { text: 'ስልክ ደውል', onPress: () => Linking.openURL('tel:+251972989963') },
        { text: 'ኢሜይል ላክ', onPress: () => Linking.openURL('mailto:envairnoha@gmail.com') },
        { text: 'ውጣ', style: 'cancel' }
      ]
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <ActivityIndicator size="large" color="#2974ff" />
        <Text style={styles.loadingText}>ዳታ በመጫን ላይ...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
      {/* Animated Header with User Full Name */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.userInfoContainer}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {userFullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userFullName}>{userFullName}</Text>
            <Text style={styles.userRole}>{userRole || 'እርሶ ነጋዴ ነዎት'}</Text>
            <Animated.Text style={[styles.date, { opacity: headerOpacity }]}>
              {formatDate(currentTime)}
            </Animated.Text>
          </View>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => Alert.alert('ማሳወቂያዎች', 'አዲስ ማሳወቂያ የለም')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color="#ffffff" />
            {stats.lowStockCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{stats.lowStockCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#2974ff"
            colors={['#2974ff']}
            progressViewOffset={HEADER_MAX_HEIGHT}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Add top padding to account for fixed header */}
        <View style={{ height: HEADER_MAX_HEIGHT }} />
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="አጠቃላይ ምርቶች"
            value={stats.totalProducts}
            icon="package-variant"
            colors={['#2974ff', '#1a4c9e']}
          />
          <StatCard
            title="አጠቃላይ ክምችት"
            value={stats.totalStock.toLocaleString()}
            icon="warehouse"
            colors={['#10b981', '#059669']}
          />
          <StatCard
            title="የዛሬ ሽያጮች"
            value={stats.todaySales}
            icon="cart-outline"
            subtitle={`ETB ${stats.todayRevenue.toLocaleString()}`}
            colors={['#f59e0b', '#d97706']}
          />
          <StatCard
            title="አጠቃላይ ገቢ"
            value={`ETB ${stats.totalRevenue.toLocaleString()}`}
            icon="currency-usd"
            subtitle={`ከ${stats.totalSales} ሽያጮች`}
            colors={['#8b5cf6', '#6d28d9']}
          />
        </View>

{/* Low Stock Warning */}
{stats.lowStockCount > 0 && (
  <TouchableOpacity 
    style={styles.warningContainer}
    onPress={() => {
      const lowStockProducts = products.filter(p => (p.total_stock || 0) <= (p.min_stock || 10));
      
      if (lowStockProducts.length > 0) {
        // Create a more detailed alert
        const alertMessage = lowStockProducts.map(p => 
          `• ${p.product_name}\n  ቀሪ: ${p.total_stock} ${p.unit || 'pcs'}\n  ዝቅተኛ: ${p.min_stock || 10}`
        ).join('\n\n');
        
        Alert.alert(
          '⚠️ ዝቅተኛ ክምችት ያላቸው ምርቶች',
          alertMessage,
          [
            { 
              text: 'ዝርዝር ለማየት', 
              onPress: () => {
                // Navigate to low stock filter view
                router.push('/products?filter=low_stock');
              } 
            },
            { text: 'ዝጋ', style: 'cancel' }
          ]
        );
      }
    }}
  >
    <View style={styles.warningIconContainer}>
      <MaterialCommunityIcons name="alert" size={28} color="#ff9800" />
      <View style={styles.warningBadge}>
        <Text style={styles.warningBadgeText}>{stats.lowStockCount}</Text>
      </View>
    </View>
    
    <View style={styles.warningContent}>
      <Text style={styles.warningTitle}>ዝቅተኛ ክምችት ማስጠንቀቂያ</Text>
      <Text style={styles.warningDesc}>
        {stats.lowStockCount} ምርቶች {stats.lowStockCount === 1 ? 'ክምችት ማዘዝ ያስፈልገዋል' : 'ክምችት ማዘዝ ያስፈልጋቸዋል'}
      </Text>
      
      {/* Progress bar for low stock */}
      <View style={styles.warningProgressContainer}>
        <View style={styles.warningProgressBg}>
          <View 
            style={[
              styles.warningProgressFill, 
              { 
                width: `${Math.min(100, (stats.lowStockCount / products.length) * 100)}%`,
                backgroundColor: stats.lowStockCount > 10 ? '#ff9800' : 
                                stats.lowStockCount > 5 ? '#f57c00' : '#ef4444'
              }
            ]} 
          />
        </View>
        <Text style={styles.warningProgressText}>
          {stats.lowStockCount} / {products.length} ምርቶች
        </Text>
      </View>
    </View>
    
    <MaterialCommunityIcons name="chevron-right" size={28} color="#ff9800" />
  </TouchableOpacity>
)}

        {/* Recent Sales Section */}
        {stats.recentSales.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>የቅርብ ጊዜ ሽያጮች</Text>
              <TouchableOpacity onPress={() => router.push('/(tab)/sales')}>
                <Text style={styles.seeAllLink}>ሁሉንም ተመልከት</Text>
              </TouchableOpacity>
            </View>

            {stats.recentSales.map((item) => (
              <SaleItem key={item.id} item={item} />
            ))}
          </View>
        )}

        {/* Recent Products Section - Horizontal Scroll */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>የቅርብ ጊዜ ምርቶች</Text>
            <TouchableOpacity onPress={() => router.push('/(tab)/products')}>
              <Text style={styles.seeAllLink}>ሁሉንም ተመልከት</Text>
            </TouchableOpacity>
          </View>

          {stats.recentProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#475569" />
              <Text style={styles.emptyText}>ምንም ምርቶች አልተገኙም</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => router.push('/(tab)/products/add')}
              >
                <Text style={styles.addButtonText}>ምርት ጨምር</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsHorizontalScroll}
            >
              {stats.recentProducts.map((item) => (
                <ProductCard key={item.id} item={item} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>ፈጣን እርምጃዎች</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tab)/products/add')}
            >
              <LinearGradient
                colors={['#2974ff', '#1a4c9e']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
                <Text style={styles.actionText}>ምርት ጨምር</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tab)/sales/new')}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="cash-register" size={24} color="#ffffff" />
                <Text style={styles.actionText}>አዲስ ሽያጭ</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tab)/products')}
            >
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="format-list-bulleted" size={24} color="#ffffff" />
                <Text style={styles.actionText}>ሁሉም ምርቶች</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tab)/sales')}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="history" size={24} color="#ffffff" />
                <Text style={styles.actionText}>ሽያጭ ታሪክ</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Support Button */}
        <TouchableOpacity style={styles.supportButton} onPress={handleContactSupport}>
          <MaterialCommunityIcons name="headset" size={20} color="#2974ff" />
          <Text style={styles.supportText}>እገዛ እና ድጋፍ</Text>
        </TouchableOpacity>

       
        
        {/* Extra bottom padding for better scrolling */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Animated Floating Action Button */}
      <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => {
            Alert.alert(
              'ፈጣን እርምጃ',
              'ምን ማድረግ ይፈልጋሉ?',
              [
                { text: 'ምርት ጨምር', onPress: () => router.push('/(tab)/products/add') },
                { text: 'አዲስ ሽያጭ', onPress: () => router.push('/(tab)/sales/new') },
                { text: 'እገዛ', onPress: handleContactSupport },
                { text: 'ውጣ', style: 'cancel' }
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: 'rgba(15, 22, 35, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(41, 116, 255, 0.3)',
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2974ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  userAvatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userFullName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userRole: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  date: {
    color: '#64748b',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  notificationButton: {
    position: 'relative',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f1623',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: (width - 44) / 2,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statSubtitle: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    marginTop: 2,
  },


  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllLink: {
    color: '#2974ff',
    fontSize: 14,
  },
  productsHorizontalScroll: {
    paddingRight: 20,
    gap: 12,
  },
  productCard: {
    width: 180,
    marginRight: 12,
  },
  productCardGradient: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  productCardContent: {
    flex: 1,
  },
  productCardName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCardCode: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 8,
  },
  productCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41, 116, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  lowStockBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  stockText: {
    color: '#2974ff',
    fontSize: 12,
    fontWeight: '600',
  },
  lowStockText: {
    color: '#ef4444',
  },
  productCardPrice: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lowStockOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  saleItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  todaySaleItem: {
    borderColor: '#f59e0b',
    borderWidth: 1,
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  saleHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saleInvoice: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  saleBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  saleTime: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentText: {
    color: '#10b981',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  saleItems: {
    color: '#94a3b8',
    fontSize: 12,
  },
  saleAmount: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: '#2974ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  quickActionsTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (width - 52) / 2,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  actionText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(41, 116, 255, 0.3)',
  },
  supportText: {
    color: '#2974ff',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2974ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#2974ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },


  warningContainer: {
  backgroundColor: 'rgba(255, 152, 0, 0.1)',
  borderRadius: 16,
  padding: 16,
  marginHorizontal: 20,
  marginBottom: 16,
  flexDirection: 'row',
  alignItems: 'center',
  borderWidth: 1,
  borderColor: '#ff9800',
  shadowColor: '#ff9800',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
},
warningIconContainer: {
  position: 'relative',
  marginRight: 12,
},
warningBadge: {
  position: 'absolute',
  top: -8,
  right: -8,
  backgroundColor: '#ef4444',
  borderRadius: 12,
  minWidth: 20,
  height: 20,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 4,
  borderWidth: 2,
  borderColor: '#0f1623',
},
warningBadgeText: {
  color: '#ffffff',
  fontSize: 10,
  fontWeight: 'bold',
},
warningContent: {
  flex: 1,
},
warningTitle: {
  color: '#ff9800',
  fontSize: 16,
  fontWeight: 'bold',
  marginBottom: 4,
},
warningDesc: {
  color: '#94a3b8',
  fontSize: 13,
  marginBottom: 8,
},
warningProgressContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
},
warningProgressBg: {
  flex: 1,
  height: 6,
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: 3,
  overflow: 'hidden',
},
warningProgressFill: {
  height: '100%',
  borderRadius: 3,
},
warningProgressText: {
  color: '#94a3b8',
  fontSize: 11,
  fontWeight: '500',
},
});