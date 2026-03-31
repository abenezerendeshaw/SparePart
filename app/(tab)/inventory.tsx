import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import Animated, {
    Extrapolate,
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { useLanguage } from '../../context/LanguageContext';
import api from '../lib/api';
import storage from '../lib/storage';
import { FeatureGuard } from '@/components/FeatureGuard';

const { width } = Dimensions.get('window');
interface Product {
  id: number;
  product_code: string;
  product_name: string;
  category: string;
  total_stock: number;
  selling_price: string | number;
  status: string;
  unit?: string;
}

export default function InventoryScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const params = useLocalSearchParams();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);

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

    return {
      height: withSpring(headerHeight, {
        damping: 15,
        stiffness: 100,
      }),
      opacity: headerOpacity.value,
    };
  });

  // fetchInventory is now handled by useFocusEffect

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchInventory();
    }, [])
  );

  const fetchInventory = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log(`Fetching all products for unified inventory`);
      const response = await api.get(`/products?limit=200`);
      const productsData = response.data?.data?.products || [];
      
      setProducts(productsData);
      
      // Extract unique categories from products
      const uniqueCategories = ['all', ...new Set(productsData.map((p: Product) => p.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert(t('error'), t('dataLoadFailed', 'common'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Re-fetch when selectedStatus changes
  useEffect(() => {
    fetchInventory();
  }, []);



  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const isCurrentlyActive = currentStatus?.toLowerCase() === 'active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    
    Alert.alert(
      isCurrentlyActive ? t('inactivateConfirmTitle', 'common') : t('activateConfirmTitle', 'common'),
      `${isCurrentlyActive ? t('inactivateConfirmMessage', 'common') : t('activateConfirmMessage', 'common')}`,
      [
        { text: t('cancel', 'common'), style: 'cancel' },
        { 
          text: isCurrentlyActive ? t('inactivate', 'common') : t('activate', 'common'), 
          style: isCurrentlyActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setLoading(true);
              // When deactivating, set stock to 0
              const updateData = { status: newStatus };
              if (isCurrentlyActive) {
                updateData.total_stock = 0;
              }
              
              const response = await api.put(`/products?id=${id}`, updateData);
              
              if (response.data && response.data.status === 'success') {
                Alert.alert(
                  t('success'), 
                  isCurrentlyActive ? t('inactivateSuccess', 'common') : t('activateSuccess', 'common')
                );
                fetchInventory();
              } else {
                throw new Error('Status update failed');
              }
            } catch (error: any) {
              console.error('Error toggling status:', error);
              Alert.alert(
                t('error'), 
                isCurrentlyActive ? t('inactivateFailed', 'common') : t('activateFailed', 'common')
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(item => {
    const matchesSearch = 
      item.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    const matchesStatus = selectedStatus === 'all' || item.status?.toLowerCase() === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Calculate inventory stats (only active products)
  const activeProducts = products.filter(p => p.status?.toLowerCase() === 'active');
  const totalStock = activeProducts.reduce((sum, p) => sum + (p.total_stock || 0), 0);
  const lowStockItems = activeProducts.filter(p => (p.total_stock || 0) <= 10);
  const outOfStockItems = activeProducts.filter(p => (p.total_stock || 0) === 0);
  const totalValue = activeProducts.reduce((sum, p) => sum + ((p.total_stock || 0) * Number(p.selling_price)), 0);

  const InventoryCard = ({ item }: { item: Product }) => {
    const stockLevel = item.total_stock || 0;
    const stockStatus = stockLevel === 0 ? 'out' : stockLevel <= 10 ? 'low' : 'normal';
    
    const getStatusColor = () => {
      switch(stockStatus) {
        case 'out': return '#ef4444';
        case 'low': return '#f59e0b';
        default: return '#10b981';
      }
    };

    const getStatusText = () => {
      switch(stockStatus) {
        case 'out': return t('outOfStock', 'common');
        case 'low': return t('low', 'common');
        default: return t('sufficient', 'inventory');
      }
    };


    return (
      <TouchableOpacity 
        style={styles.inventoryCard}
        onPress={() => router.push(`/(tab)/products/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.productInfo}>
            <Text style={styles.productName}>{item.product_name}</Text>
            <Text style={styles.productCode}>{item.product_code}</Text>
          </View>
          <View style={[
            styles.cardStatusBadge,
            item.status?.toLowerCase() === 'active' ? styles.cardStatusActive : styles.cardStatusInactive
          ]}>
            <MaterialCommunityIcons 
              name={item.status?.toLowerCase() === 'active' ? "check-circle-outline" : "archive-outline"} 
              size={12} 
              color={item.status?.toLowerCase() === 'active' ? "#10b981" : "#f59e0b"} 
            />
            <Text style={[
              styles.cardStatusText,
              { color: item.status?.toLowerCase() === 'active' ? "#10b981" : "#f59e0b" }
            ]}>
              {item.status?.toLowerCase() === 'active' ? t('statusActive', 'common') : t('statusInactive', 'common')}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardBody}>
          <View style={styles.activityContainer}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityLabel}>{t('status', 'common')}</Text>
              <Text style={[
                styles.activityStatus,
                { color: item.status?.toLowerCase() === 'active' ? '#10b981' : '#f59e0b' }
              ]}>
                {item.status?.toLowerCase() === 'active' ? t('statusActive', 'common') : t('statusInactive', 'common')}
              </Text>
            </View>
            <View style={styles.activityBar}>
              <View style={[
                styles.activityFill,
                { 
                  width: item.status?.toLowerCase() === 'active' ? '100%' : '15%',
                  backgroundColor: item.status?.toLowerCase() === 'active' ? '#10b981' : '#f59e0b' 
                }
              ]} />
            </View>
          </View>
        </View>

        {/* Only show stock info for active products */}
        {item.status?.toLowerCase() === 'active' && (
          <View style={styles.stockInfo}>
            <View style={styles.stockBar}>
              <View style={[styles.stockFill, { 
                width: `${Math.min((stockLevel / 50) * 100, 100)}%`,
                backgroundColor: getStatusColor() 
              }]} />
            </View>
            <View style={styles.stockDetails}>
              <View style={styles.stockDetailItem}>
                <MaterialCommunityIcons name="package-variant" size={16} color="#94a3b8" />
                <Text style={styles.stockDetailText}>
                  {stockLevel} {item.unit || 'pcs'}
                </Text>
              </View>
              <View style={styles.stockDetailItem}>
                <MaterialCommunityIcons name="currency-usd" size={16} color="#94a3b8" />
                <Text style={styles.stockDetailText}>
                  {t('currency', 'common')} {Number(item.selling_price).toLocaleString()}
                </Text>
              </View>
              <View style={styles.stockDetailItem}>
                <MaterialCommunityIcons name="tag" size={16} color="#94a3b8" />
                <Text style={styles.stockDetailText}>
                  {item.category || t('other', 'common')}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.stockValue}>
            {t('totalValue', 'inventory')}: {t('currency', 'common')} {(stockLevel * Number(item.selling_price)).toLocaleString()}
          </Text>
          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.actionIconButtonContainer} 
              onPress={() => handleToggleStatus(item.id, item.status)}
            >
              <MaterialCommunityIcons 
                name={item.status?.toLowerCase() === 'active' ? "archive-arrow-down-outline" : "restore"} 
                size={22} 
                color={item.status?.toLowerCase() === 'active' ? "#f59e0b" : "#10b981"} 
              />
              <Text style={[
                styles.actionIconLabel,
                { color: item.status?.toLowerCase() === 'active' ? "#f59e0b" : "#10b981" }
              ]}>
                {item.status?.toLowerCase() === 'active' ? t('inactivate', 'common') : t('activate', 'common')}
              </Text>
            </TouchableOpacity>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>{t('loading', 'common')}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <FeatureGuard feature="inventory" featureName={t('inventory', 'navigation')}>
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />

      {/* Animated Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('inventoryManagement', 'inventory')}
        </Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            Alert.alert(
              t('filter', 'common'),
              t('selectCategory', 'inventory'),
              ([
                ...categories.map(cat => ({
                  text: cat === 'all' ? t('all', 'common') : cat,
                  onPress: () => setSelectedCategory(cat),
                })),
                { text: t('cancel', 'common'), style: 'cancel' }
              ] as any[])
            );
          }}
        >
          <MaterialCommunityIcons 
            name="filter-variant" 
            size={24} 
            color="#10b981" 
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder={t('searchProduct', 'inventory')}
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statCard}
          >
            <Text style={styles.statCardValue}>{totalStock}</Text>
            <Text style={styles.statCardLabel}>{t('totalStock', 'inventory')}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.statCard}
          >
            <Text style={styles.statCardValue}>{lowStockItems.length}</Text>
            <Text style={styles.statCardLabel}>{t('lowStock', 'inventory')}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#ef4444', '#dc2626']}
            style={styles.statCard}
          >
            <Text style={styles.statCardValue}>{outOfStockItems.length}</Text>
            <Text style={styles.statCardLabel}>{t('outOfStock', 'inventory')}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#8b5cf6', '#6d28d9']}
            style={styles.statCard}
          >
            <Text style={styles.statCardValue}>{t('currency', 'common')} {totalValue.toLocaleString()}</Text>
            <Text style={styles.statCardLabel}>{t('totalValue', 'inventory')}</Text>
          </LinearGradient>
        </View>

        {/* Status Filter Chips */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilterContainer}
          contentContainerStyle={{ paddingRight: 20, marginBottom : 20 }}
        >
          {['all', 'active', 'inactive'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.categoryChip,
                selectedStatus === status && styles.selectedCategoryChip,
                selectedStatus === status && status === 'active' && { backgroundColor: '#10b981', borderColor: '#10b981' },
                selectedStatus === status && status === 'inactive' && { backgroundColor: '#f59e0b', borderColor: '#f59e0b' }
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                {status !== 'all' && (
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: status === 'active' ? '#10b981' : '#f59e0b' },
                    selectedStatus === status && { backgroundColor: '#ffffff' }
                  ]} />
                )}
                <Text style={[
                  styles.categoryChipText,
                  selectedStatus === status && styles.selectedCategoryChipText
                ]}>
                  {status === 'all' ? t('all', 'common') : 
                   status === 'active' ? t('statusActive', 'common') : 
                   t('statusInactive', 'common')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Filter Chips */}
        {/* <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.selectedCategoryChipText
              ]}>
                {category === 'all' ? t('all', 'common') : category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView> */}

        {/* Inventory List */}
        <View style={styles.inventoryList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {filteredProducts.length} {t('productsFound', 'inventory')}
            </Text>
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: '#10b981' }
              ]} />
              <Text style={styles.statusIndicatorText}>
                {t('allProducts', 'common')}
              </Text>
            </View>
          </View>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons 
                name="package-variant" 
                size={48} 
                color="#475569" 
              />
              <Text style={styles.emptyText}>
                {t('noProducts', 'common')}
              </Text>
            </View>
          ) : (
            filteredProducts.map((item) => (
              <InventoryCard key={item.id} item={item} />
            ))
          )}
        </View>

        {/* Add Product Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/(tab)/products/add')}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.addButtonGradient}
          >
            <MaterialCommunityIcons name="plus" size={20} color="#ffffff" />
            <Text style={styles.addButtonText}>{t('addProduct', 'addProduct')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>
    </LinearGradient>
    </FeatureGuard>
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
  statusTabBarSticky: {
    display: 'none',
  },
  activityContainer: {
    marginBottom: 8,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  activityLabel: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  activityStatus: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  activityBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  activityFill: {
    height: '100%',
    borderRadius: 2,
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
    borderBottomColor: 'rgba(16, 185, 129, 0.3)',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 100,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    color: '#ffffff',
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 40) / 2,
    padding: 16,
    borderRadius: 12,
  },
  statCardValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statCardLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  statusFilterContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedCategoryChip: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#ffffff',
  },
  inventoryList: {
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listTitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statusIndicatorActive: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusIndicatorInactive: {
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  inventoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  cardStatusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardStatusInactive: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  cardStatusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productCode: {
    color: '#94a3b8',
    fontSize: 12,
  },
  cardBody: {
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  stockInfo: {
    marginBottom: 12,
  },
  stockBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    marginBottom: 8,
  },
  stockFill: {
    height: 6,
    borderRadius: 3,
  },
  stockDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  stockDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockDetailText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  stockValue: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionIconButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  actionIconLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 16,
    marginTop: 12,
  },
  addButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});