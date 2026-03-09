import { View, Text, StyleSheet, FlatList, TouchableOpacity, 
  Alert, RefreshControl, TextInput, Dimensions, 
  ActivityIndicator, 
  StatusBar,
ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import storage from '../lib/storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withSpring,
} from 'react-native-reanimated';
import { useLanguage } from '../../context/LanguageContext';

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
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const api = axios.create({
        baseURL: 'https://specificethiopia.com/inventory/api/v1',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      const response = await api.get('/products?limit=100');
      const productsData = response.data?.data?.products || [];
      
      setProducts(productsData);
      
      // Extract unique categories
      const uniqueCategories = ['all', ...new Set(productsData.map((p: Product) => p.category).filter(Boolean))];
      setCategories(uniqueCategories);

    } catch (error) {
      console.error('Error fetching inventory:', error);
      Alert.alert(t('error'), t('dataLoadFailed', 'common'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchInventory();
  };

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.product_code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Calculate inventory stats
  const totalStock = products.reduce((sum, p) => sum + (p.total_stock || 0), 0);
  const lowStockItems = products.filter(p => (p.total_stock || 0) <= 10);
  const outOfStockItems = products.filter(p => (p.total_stock || 0) === 0);
  const totalValue = products.reduce((sum, p) => sum + ((p.total_stock || 0) * Number(p.selling_price)), 0);

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
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </Text>
          </View>
        </View>

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

        <View style={styles.cardFooter}>
          <Text style={styles.stockValue}>
            {t('totalValue', 'inventory')}: {t('currency', 'common')} {(stockLevel * Number(item.selling_price)).toLocaleString()}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#64748b" />
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
        <Text style={styles.headerTitle}>{t('inventoryManagement', 'inventory')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => {
            Alert.alert(
              t('filter', 'common'),
              t('selectCategory', 'inventory'),
              categories.map(cat => ({
                text: cat === 'all' ? t('all', 'common') : cat,
                onPress: () => setSelectedCategory(cat),
              })).concat([{ text: t('cancel', 'common'), style: 'cancel' }])
            );
          }}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color="#10b981" />
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

        {/* Category Filter Chips */}
        <ScrollView 
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
        </ScrollView>

        {/* Inventory List */}
        <View style={styles.inventoryList}>
          <Text style={styles.listTitle}>
            {filteredProducts.length} {t('productsFound', 'inventory')}
          </Text>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#475569" />
              <Text style={styles.emptyText}>{t('noProducts', 'common')}</Text>
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
  listTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
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
    alignItems: 'center',
    marginBottom: 12,
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