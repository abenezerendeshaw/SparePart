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
  View
} from 'react-native';
import api from '../lib/api';
import storage from '../lib/storage';

const { width } = Dimensions.get('window');

// Types
interface Product {
  id: string | number;
  product_name: string;
  product_code: string;
  category: string;
  total_stock: number;
  selling_price: number;
  unit?: string;
  reorder_level?: number;
}

interface Sale {
  id: string | number;
  grand_total: number;
  sale_date?: string;
  created_at?: string;
  invoice_number?: string;
}

interface DashboardStats {
  totalProducts: number;
  totalStock: number;
  totalSales: number;
  totalRevenue: number;
  lowStockCount: number;
  todaySales: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('ነጋዴ');
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
      [1, 0.8],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, 20],
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

  const fetchData = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        } 
      };

      // Fetch products and sales in parallel
      const [productsRes, salesRes] = await Promise.all([
        api.get('/products', config),
        api.get('/sales', config).catch(() => ({ data: { data: { sales: [] } } }))
      ]);

      console.log('Products fetched:', productsRes.data);

      // Handle different response structures
      const productsData = productsRes.data.data?.products || 
                          productsRes.data.products || 
                          productsRes.data || [];
      
      const salesData = salesRes.data.data?.sales || 
                       salesRes.data.sales || 
                       salesRes.data || [];

      setProducts(Array.isArray(productsData) ? productsData : []);
      setSales(Array.isArray(salesData) ? salesData : []);

      // Try to get user info if available
      try {
        const userRes = await api.get('/user', config);
        if (userRes.data.data?.full_name) {
          setUserName(userRes.data.data.full_name.split(' ')[0]);
        }
      } catch (error) {
        // Ignore user fetch error
      }

    } catch (error: any) {
      console.log('Fetch Error:', error.response || error);
      
      if (error.response?.status === 401) {
        // Token expired
        await storage.removeItem('authToken');
        router.replace('/auth/login');
      } else {
        Alert.alert('ስህተት', 'ዳታ መጫን አልተቻለም');
      }
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

 
  // Calculate statistics
  const stats: DashboardStats = {
    totalProducts: products.length,
    totalStock: products.reduce((sum, item) => sum + (Number(item.total_stock) || 0), 0),
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, sale) => sum + (Number(sale.grand_total) || 0), 0),
    lowStockCount: products.filter(p => (p.total_stock || 0) <= (p.reorder_level || 5)).length,
    todaySales: sales.filter(sale => {
      const today = new Date().toDateString();
      const saleDate = sale.sale_date || sale.created_at || '';
      return new Date(saleDate).toDateString() === today;
    }).length
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

  const ProductItem = ({ item }: { item: Product }) => {
    const stockLevel = item.total_stock || 0;
    const reorderLevel = item.reorder_level || 5;
    const isLowStock = stockLevel <= reorderLevel;

    return (
      <TouchableOpacity 
        style={styles.productItem}
        onPress={() => Alert.alert('ዝርዝሮች', `የ${item.product_name} ዝርዝሮች`)}
      >
        <View style={styles.productHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={styles.productCode}>{item.product_code}</Text>
          </View>
          <View style={[styles.stockBadge, isLowStock && styles.lowStockBadge]}>
            <Text style={[styles.stockText, isLowStock && styles.lowStockText]}>
              {stockLevel} {item.unit || 'pcs'}
            </Text>
          </View>
        </View>
        
        <View style={styles.productFooter}>
          <Text style={styles.productCategory}>{item.category}</Text>
          <Text style={styles.productPrice}>ETB {item.selling_price?.toLocaleString()}</Text>
        </View>

        {isLowStock && (
          <View style={styles.warningBadge}>
            <MaterialCommunityIcons name="alert" size={14} color="#ff9800" />
            <Text style={styles.warningText}>ክምችት አነስተኛ ነው</Text>
          </View>
        )}
      </TouchableOpacity>
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
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View>
          <Text style={styles.greeting}>እንኳን ደህና መጡ፣</Text>
          <Text style={styles.userName}>{userName}!</Text>
          <Animated.Text style={[styles.date, { opacity: headerOpacity }]}>
            {formatDate(currentTime)}
          </Animated.Text>
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
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tab)/profile')}
          >
            <MaterialCommunityIcons name="account-circle" size={32} color="#ffffff" />
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
            colors={['#f59e0b', '#d97706']}
          />
          <StatCard
            title="አጠቃላይ ገቢ"
            value={`ETB ${stats.totalRevenue.toLocaleString()}`}
            icon="currency-usd"
            colors={['#8b5cf6', '#6d28d9']}
          />
        </View>

        {/* Low Stock Warning */}
        {stats.lowStockCount > 0 && (
          <TouchableOpacity 
            style={styles.warningContainer}
            onPress={() => {
              const lowStockProducts = products.filter(p => (p.total_stock || 0) <= (p.reorder_level || 5));
              Alert.alert(
                'ዝቅተኛ ክምችት ያላቸው ምርቶች',
                lowStockProducts.map(p => `• ${p.product_name}: ${p.total_stock} ቀርቷል`).join('\n')
              );
            }}
          >
            <MaterialCommunityIcons name="alert-circle" size={24} color="#ff9800" />
            <View style={styles.warningContent}>
              <Text style={styles.warningTitle}>ዝቅተኛ ክምችት ማስጠንቀቂያ</Text>
              <Text style={styles.warningDesc}>
                {stats.lowStockCount} ምርቶች ክምችት ማዘዝ ያስፈልጋቸዋል
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ff9800" />
          </TouchableOpacity>
        )}

        {/* Recent Products Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>የቅርብ ጊዜ ምርቶች</Text>
            <TouchableOpacity onPress={() => router.push('/(tab)/products')}>
              <Text style={styles.seeAllLink}>ሁሉንም ተመልከት</Text>
            </TouchableOpacity>
          </View>

          {products.length === 0 ? (
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
            <FlatList
              data={products.slice(0, 5)}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => <ProductItem item={item} />}
            />
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
              onPress={() => router.push('/(tab)/reports')}
            >
              <LinearGradient
                colors={['#8b5cf6', '#6d28d9']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="chart-bar" size={24} color="#ffffff" />
                <Text style={styles.actionText}>ሪፖርቶች</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => router.push('/(tab)/inventory')}
            >
              <LinearGradient
                colors={['#f59e0b', '#d97706']}
                style={styles.actionGradient}
              >
                <MaterialCommunityIcons name="clipboard-list" size={24} color="#ffffff" />
                <Text style={styles.actionText}>ክምችት</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>


          <View style={{ height: 150 }} />

       

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
                { text: 'ተይ', style: 'cancel' }
              ]
            );
          }}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
        </TouchableOpacity>
         <View style={{ height: 100 }} />
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
  greeting: {
    color: '#94a3b8',
    fontSize: 14,
  },
  userName: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    color: '#64748b',
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
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
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningContent: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    color: '#ff9800',
    fontSize: 14,
    fontWeight: 'bold',
  },
  warningDesc: {
    color: '#ffb74d',
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
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
  productItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productCode: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  stockBadge: {
    backgroundColor: 'rgba(41, 116, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
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
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategory: {
    color: '#64748b',
    fontSize: 12,
  },
  productPrice: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  warningText: {
    color: '#ff9800',
    fontSize: 12,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
    padding: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  versionText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 90,
    letterSpacing: 1,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
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
  },
});