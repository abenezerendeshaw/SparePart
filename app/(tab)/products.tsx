import { StatusBar, ScrollView, View, Text, StyleSheet, TouchableOpacity, Alert, RefreshControl, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
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

const { width } = Dimensions.get('window');

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

export default function ProductsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [deletedProducts, setDeletedProducts] = useState<Set<number>>(new Set());

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  const HEADER_MAX_HEIGHT = 120;
  const HEADER_MIN_HEIGHT = 70;
  const SCROLL_RANGE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Products screen focused - refreshing...');
      fetchProducts();
    }, [])
  );

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
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching products...');
      
      const api = axios.create({
        baseURL: 'https://specificethiopia.com/inventory/api/v1',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      // Only fetch active products (not deleted)
      const response = await api.get('/products?limit=100&status=active');
      console.log('Products response:', response.data);
      
      const productsData = response.data?.data?.products || [];
      
      // Filter out any products with status 'deleted' or 'inactive'
      const activeProducts = productsData.filter((p: Product) => 
        p.status === 'active' || p.status === 'Active'
      );
      
      setProducts(activeProducts);
      
      // Extract unique categories from active products only
      const uniqueCategories = ['all', ...new Set(
        activeProducts
          .map((p: Product) => p.category)
          .filter(Boolean)
      )];
      setCategories(uniqueCategories);

      // Clear deleted products set when fetching new data
      setDeletedProducts(new Set());

    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('ስህተት', 'ዳታ መጫን አልተቻለም');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      // Don't show products that are marked as deleted in our local state
      if (deletedProducts.has(product.id)) {
        return false;
      }
      
      const matchesSearch = searchQuery === '' || 
        product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch(sortBy) {
        case 'name':
          comparison = a.product_name.localeCompare(b.product_name);
          break;
        case 'price':
          comparison = Number(a.selling_price) - Number(b.selling_price);
          break;
        case 'stock':
          comparison = (a.total_stock || 0) - (b.total_stock || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  // Calculate stats from active products only
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + (p.total_stock || 0), 0);
  const activeProducts = products.filter(p => p.status === 'active').length;
  const totalValue = products.reduce((sum, p) => sum + ((p.total_stock || 0) * Number(p.selling_price)), 0);

  const ProductCard = ({ item }: { item: Product }) => {
    const isLowStock = (item.total_stock || 0) <= 10;
    const isOutOfStock = (item.total_stock || 0) === 0;
    const isDeleting = deleteLoading === item.id;

    return (
      <TouchableOpacity 
        style={[styles.productCard, isDeleting && styles.deletingCard]}
        onPress={() => router.push(`/(tab)/products/${item.id}`)}
        onLongPress={() => {
          Alert.alert(
            'የምርት አማራጮች',
            item.product_name,
            [
              { text: 'አርትዕ', onPress: () => router.push(`/(tab)/products/${item.id}/edit`) },
              { text: 'ቅዳ', onPress: () => router.push(`/(tab)/products/add?copy=${item.id}`) },
              { text: 'ሰርዝ', style: 'destructive', onPress: () => confirmDelete(item.id) },
              { text: 'ተይ', style: 'cancel' }
            ]
          );
        }}
        disabled={isDeleting}
      >
        <LinearGradient
          colors={['rgba(41, 116, 255, 0.1)', 'rgba(15, 22, 35, 0.9)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.productInfo}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text style={styles.productCode}>{item.product_code}</Text>
            </View>
            <View style={[
              styles.statusBadge,
              { backgroundColor: isOutOfStock ? '#ef444420' : isLowStock ? '#f59e0b20' : '#10b98120' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isOutOfStock ? '#ef4444' : isLowStock ? '#f59e0b' : '#10b981' }
              ]}>
                {isOutOfStock ? 'የለም' : isLowStock ? 'ጥቂት' : 'አለ'}
              </Text>
            </View>
          </View>

          <View style={styles.cardDetails}>
            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="package-variant" size={16} color="#64748b" />
              <Text style={styles.detailText}>
                ክምችት: {item.total_stock || 0}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="currency-usd" size={16} color="#64748b" />
              <Text style={styles.detailText}>
                ዋጋ: ETB {Number(item.selling_price).toLocaleString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialCommunityIcons name="tag" size={16} color="#64748b" />
              <Text style={styles.detailText}>
                {item.category || 'ሌሎች'}
              </Text>
            </View>

            {item.brand && (
              <View style={styles.detailRow}>
                <MaterialCommunityIcons name="trademark" size={16} color="#64748b" />
                <Text style={styles.detailText}>
                  {item.brand}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.stockValue}>
              ድምር: ETB {((item.total_stock || 0) * Number(item.selling_price)).toLocaleString()}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#2974ff" />
          </View>
          
          {isDeleting && (
            <View style={styles.deleteOverlay}>
              <ActivityIndicator size="large" color="#ef4444" />
              <Text style={styles.deleteOverlayText}>እየሰረዘ ነው...</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const confirmDelete = (id: number) => {
    Alert.alert(
      'ምርት ሰርዝ',
      'ይህን ምርት መሰረዝ እንደምትፈልግ እርግጠኛ ነህ? ይህ ድርጊት ሊቀለበስ አይችልም።',
      [
        { text: 'ተይ', style: 'cancel' },
        { 
          text: 'ሰርዝ', 
          style: 'destructive',
          onPress: () => deleteProduct(id)
        }
      ]
    );
  };

  const deleteProduct = async (id: number) => {
    setDeleteLoading(id);
    
    try {
      const token = await storage.getItem('authToken');
      const api = axios.create({
        baseURL: 'https://specificethiopia.com/inventory/api/v1',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Deleting product with ID:', id);
      
      // Try both formats
      let response;
      try {
        // First try /:id format
        response = await api.delete(`/products/${id}`);
        console.log('Delete response (/:id):', response.data);
      } catch (err) {
        // If /:id fails, try ?id= format
        console.log('Trying ?id= format...');
        response = await api.delete(`/products?id=${id}`);
        console.log('Delete response (?id=):', response.data);
      }
      
      if (response.data && response.data.status === 'success') {
        // Mark as deleted in local state immediately
        setDeletedProducts(prev => new Set([...prev, id]));
        
        // Also filter it out from the products array
        setProducts(prevProducts => prevProducts.filter(p => p.id !== id));
        
        Alert.alert('ተሳክቷል', 'ምርት በተሳካ ሁኔታ ተሰርዟል');
        
        // Refresh from server after a short delay to ensure sync
        setTimeout(() => {
          fetchProducts();
        }, 500);
      } else {
        throw new Error('Delete failed');
      }
    } catch (error: any) {
      console.error('Delete error:', error);
      
      let errorMessage = 'ምርት መሰረዝ አልተሳካም';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('ስህተት', errorMessage);
      
      // Remove loading state
      setDeleteLoading(null);
    } finally {
      setDeleteLoading(null);
    }
  };

  const toggleSort = (type: 'name' | 'price' | 'stock') => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2974ff" />
          <Text style={styles.loadingText}>ምርቶች በመጫን ላይ...</Text>
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
        <Text style={styles.headerTitle}>ምርቶች</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(tab)/products/add')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#2974ff" />
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
            tintColor="#2974ff"
            colors={['#2974ff']}
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
              placeholder="ምርት ፈልግ..."
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
            colors={['#2974ff', '#1a4c9e']}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{totalProducts}</Text>
            <Text style={styles.statLabel}>አጠቃላይ ምርቶች</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{totalStock}</Text>
            <Text style={styles.statLabel}>አጠቃላይ ክምችት</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#f59e0b', '#d97706']}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{activeProducts}</Text>
            <Text style={styles.statLabel}>ንቁ ምርቶች</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#8b5cf6', '#6d28d9']}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>ETB {totalValue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>አጠቃላይ ዋጋ</Text>
          </LinearGradient>
        </View>

        {/* Filter and Sort Bar */}
        <View style={styles.filterBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterChip, selectedCategory === 'all' && styles.activeFilterChip]}
              onPress={() => setSelectedCategory('all')}
            >
              <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.activeFilterChipText]}>
                ሁሉም
              </Text>
            </TouchableOpacity>
            
            {categories.filter(c => c !== 'all').map((category) => (
              <TouchableOpacity
                key={category}
                style={[styles.filterChip, selectedCategory === category && styles.activeFilterChip]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[styles.filterChipText, selectedCategory === category && styles.activeFilterChipText]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.sortButtons}>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'name' && styles.activeSortButton]}
              onPress={() => toggleSort('name')}
            >
              <MaterialCommunityIcons 
                name="sort-alphabetical-ascending" 
                size={20} 
                color={sortBy === 'name' ? '#2974ff' : '#64748b'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'price' && styles.activeSortButton]}
              onPress={() => toggleSort('price')}
            >
              <MaterialCommunityIcons 
                name="currency-usd" 
                size={20} 
                color={sortBy === 'price' ? '#2974ff' : '#64748b'} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'stock' && styles.activeSortButton]}
              onPress={() => toggleSort('stock')}
            >
              <MaterialCommunityIcons 
                name="package-variant" 
                size={20} 
                color={sortBy === 'stock' ? '#2974ff' : '#64748b'} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Products List */}
        <View style={styles.productsList}>
          <Text style={styles.listTitle}>
            {filteredProducts.length} ምርቶች ተገኝተዋል
          </Text>

          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="package-variant" size={48} color="#475569" />
              <Text style={styles.emptyText}>ምንም ምርቶች አልተገኙም</Text>
              <TouchableOpacity 
                style={styles.emptyAddButton}
                onPress={() => router.push('/(tab)/products/add')}
              >
                <Text style={styles.emptyAddButtonText}>ምርት ጨምር</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredProducts.map((item) => (
              <ProductCard key={item.id} item={item} />
            ))
          )}
        </View>

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
    borderBottomColor: 'rgba(41, 116, 255, 0.3)',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
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
  statValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeFilterChip: {
    backgroundColor: '#2974ff',
    borderColor: '#2974ff',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeSortButton: {
    backgroundColor: 'rgba(41, 116, 255, 0.1)',
    borderColor: '#2974ff',
  },
  productsList: {
    paddingHorizontal: 20,
  },
  listTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
  },
  productCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  deletingCard: {
    opacity: 0.7,
  },
  cardGradient: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  detailText: {
    color: '#94a3b8',
    fontSize: 13,
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
    color: '#2974ff',
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
    marginBottom: 16,
  },
  emptyAddButton: {
    backgroundColor: '#2974ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteOverlayText: {
    color: '#ef4444',
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});