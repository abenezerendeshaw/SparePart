import { StatusBar,View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput, Dimensions, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useEffect, useState, useCallback } from 'react';
import api from '../lib/api';
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
  item_count: number | string; // Can be number or string
}

interface SalesStats {
  totalSales: number;
  todaySales: number;
  totalRevenue: number;
  todayRevenue: number;
  totalProfit: number;
  averageSaleValue: number;
  cashSales: number;
  creditSales: number;
}

export default function SalesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month' | 'paid' | 'due'>('all');
  const [selectedPayment, setSelectedPayment] = useState<'all' | 'cash' | 'card' | 'transfer' | 'bank_transfer'>('all');
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    todaySales: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    totalProfit: 0,
    averageSaleValue: 0,
    cashSales: 0,
    creditSales: 0,
  });

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
    fetchSales();
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchSales();
    }, [])
  );

  const fetchSales = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const response = await api.get('/sales?limit=100');
      const salesData = response.data?.data?.sales || [];
      
      setSales(salesData);
      calculateStats(salesData);

    } catch (error) {
      console.error('Error fetching sales:', error);
      Alert.alert(t('error'), t('dataLoadFailed', 'common'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSales();
  };

  const calculateStats = (salesData: Sale[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = salesData.filter(s => s.sale_date === today);
    const cashSales = salesData.filter(s => s.payment_method === 'cash');
    const creditSales = salesData.filter(s => s.payment_status === 'due');
    
    const totalRevenue = salesData.reduce((sum, s) => sum + Number(s.grand_total), 0);
    const totalProfit = salesData.reduce((sum, s) => sum + Number(s.profit), 0);

    setStats({
      totalSales: salesData.length,
      todaySales: todaySales.length,
      totalRevenue,
      todayRevenue: todaySales.reduce((sum, s) => sum + Number(s.grand_total), 0),
      totalProfit,
      averageSaleValue: salesData.length > 0 ? totalRevenue / salesData.length : 0,
      cashSales: salesData.filter(s => s.payment_method === 'cash').length,
      creditSales: salesData.filter(s => s.payment_method === 'card').length + 
                   salesData.filter(s => s.payment_method === 'transfer' || s.payment_method === 'bank_transfer').length,
    });
  };

  // Filter sales based on search and filters
  const filteredSales = sales.filter(sale => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
      sale.sale_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customer_phone.includes(searchQuery);

    // Date filter
    const saleDate = new Date(sale.sale_date);
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    let matchesDate = true;
    switch(selectedFilter) {
      case 'today':
        matchesDate = sale.sale_date === today.toISOString().split('T')[0];
        break;
      case 'week':
        matchesDate = saleDate >= weekAgo;
        break;
      case 'month':
        matchesDate = saleDate >= monthAgo;
        break;
      case 'paid':
        matchesDate = sale.payment_status === 'paid';
        break;
      case 'due':
        matchesDate = sale.payment_status === 'due';
        break;
    }

    // Payment method filter
    const matchesPayment = selectedPayment === 'all' || sale.payment_method === selectedPayment;

    return matchesSearch && matchesDate && matchesPayment;
  });

    // Profit/tax/donation/zakat/net profit summary for filtered sales
    const filteredProfits = React.useMemo(() => {
      let totalProfit = 0;
      let totalTax = 0;
      let totalProfitAfterTax = 0;
      filteredSales.forEach(sale => {
        const profit = Number(sale.profit) || 0;
        const taxEnabled = Number(sale.tax) > 0;
        const taxAmount = taxEnabled ? profit * 0.15 : 0;
        const profitAfterTax = profit - taxAmount;
        totalProfit += profit;
        totalTax += taxAmount;
        totalProfitAfterTax += profitAfterTax;
      });
      // Donations:
      const churchDonation = totalProfit * 0.10; // Asrat / church donation (10%)
      const zakat = totalProfit * 0.025; // Zakat (2.5%)
      return {
        totalProfit,
        totalTax,
        totalProfitAfterTax,
        donation: churchDonation,
        zakat,
        netProfit: totalProfit - totalTax - churchDonation - zakat,
      };
    }, [filteredSales]);

    // Calculate asrat donation (10% of total profit) and update on every sale change
    const asratDonation = React.useMemo(() => {
      let totalProfit = 0;
      filteredSales.forEach(sale => {
        totalProfit += Number(sale.profit) || 0;
      });
      return totalProfit * 0.10;
    }, [filteredSales]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return 'cash';
      case 'card': return 'credit-card';
      case 'transfer':
      case 'bank_transfer': return 'bank-transfer';
      default: return 'cash-multiple';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method?.toLowerCase()) {
      case 'cash': return t('cash', 'sales');
      case 'card': return t('card', 'sales');
      case 'transfer':
      case 'bank_transfer': return t('transfer', 'sales');
      default: return method || t('other', 'common');
    }
  };

  const SaleCard = ({ item }: { item: Sale }) => {
    const isToday = item.sale_date === new Date().toISOString().split('T')[0];
    const isDue = item.payment_status === 'due';
    const isPaid = item.payment_status === 'paid';

    // Ensure item_count is treated as a number
    const itemCount = Number(item.item_count) || 0;

    return (
      <TouchableOpacity 
        style={styles.saleCard}
        onPress={() => router.push(`/(tab)/sales/${item.id}`)}
      >
        <LinearGradient
          colors={['rgba(245, 158, 11, 0.1)', 'rgba(15, 22, 35, 0.9)']}
          style={styles.cardGradient}
        >
          <View style={styles.cardHeader}>
            <View style={styles.saleInfo}>
              <Text style={styles.saleCode}>{item.sale_code}</Text>
              <View style={styles.dateTime}>
                <MaterialCommunityIcons name="calendar" size={12} color="#64748b" />
                <Text style={styles.dateText}>{item.sale_date}</Text>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#64748b" />
                <Text style={styles.timeText}>{item.sale_time}</Text>
              </View>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: isDue ? '#ef444420' : isPaid ? '#10b98120' : '#f59e0b20' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: isDue ? '#ef4444' : isPaid ? '#10b981' : '#f59e0b' }
              ]}>
                {isDue ? t('due', 'common') : isPaid ? t('paid', 'common') : t('pending', 'sales')}
              </Text>
            </View>
          </View>

          <View style={styles.customerSection}>
            <MaterialCommunityIcons name="account" size={16} color="#f59e0b" />
            <Text style={styles.customerName}>{item.customer_name}</Text>
            {item.customer_phone ? (
              <>
                <MaterialCommunityIcons name="phone" size={14} color="#64748b" />
                <Text style={styles.customerPhone}>{item.customer_phone}</Text>
              </>
            ) : null}
          </View>

          <View style={styles.saleDetails}>
            <View style={styles.detailItem}>
              <MaterialCommunityIcons name="package-variant" size={14} color="#64748b" />
              <Text style={styles.detailText}>
                {itemCount} {itemCount === 1 ? t('item', 'sales') : t('items', 'sales')}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MaterialCommunityIcons 
                name={getPaymentMethodIcon(item.payment_method)} 
                size={14} 
                color="#10b981" 
              />
              <Text style={styles.detailText}>
                {getPaymentMethodText(item.payment_method)}
              </Text>
            </View>

            {Number(item.due_amount) > 0 && (
              <View style={styles.detailItem}>
                <MaterialCommunityIcons name="alert" size={14} color="#ef4444" />
                <Text style={[styles.detailText, { color: '#ef4444' }]}> 
                  {t('due', 'common')}: {t('currency', 'common')} {Number(item.due_amount).toLocaleString()}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.totalLabel}>{t('total', 'sales')}</Text>
              <Text style={styles.totalAmount}>{t('currency', 'common')} {Number(item.grand_total).toLocaleString()}</Text>
            </View>
            <View style={styles.profitBadge}>
              <Text style={styles.profitText}>{t('profit', 'sales')}: {t('currency', 'common')} {Number(item.profit).toLocaleString()}</Text>
            </View>
          </View>

          {isToday && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayBadgeText}>{t('today', 'common')}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const handlePrintReceipt = (sale: Sale) => {
    Alert.alert(t('receipt', 'sales'), t('receiptComingSoon', 'sales'));
  };

  const handleNewSale = () => {
    router.push('/(tab)/sales/new');
  };

  const FilterChip = ({ label, value, onPress, isActive }: any) => (
    <TouchableOpacity
      style={[styles.filterChip, isActive && styles.activeFilterChip]}
      onPress={onPress}
    >
      <Text style={[styles.filterChipText, isActive && styles.activeFilterChipText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f59e0b" />
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
        <Text style={styles.headerTitle}>{t('sales', 'navigation')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleNewSale}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#f59e0b" />
        </TouchableOpacity>
      </Animated.View>

      {/* Stats Cards (include Profit After Tax, Net Profit, Donation) */}


      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#f59e0b"
            colors={['#f59e0b']}
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
              placeholder={t('searchSale', 'sales')}
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
            colors={['#f59e0b', '#d97706']}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{stats.todaySales}</Text>
            <Text style={styles.statLabel}>{t('todaySales', 'dashboard')}</Text>
            <Text style={styles.statSubValue}>{t('currency', 'common')} {stats.todayRevenue.toLocaleString()}</Text>
          </LinearGradient>

          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.statCard}
          >
            <Text style={styles.statValue}>{stats.totalSales}</Text>
            <Text style={styles.statLabel}>{t('totalSales', 'sales')}</Text>
            <Text style={styles.statSubValue}>{t('currency', 'common')} {stats.totalRevenue.toLocaleString()}</Text>
          </LinearGradient>

            <LinearGradient
              colors={['#8b5cf6', '#6d28d9']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{t('currency', 'common')} {stats.totalProfit.toLocaleString()}</Text>
              <Text style={styles.statLabel}>{t('totalProfit', 'sales')}</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#2974ff', '#1a4c9e']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{t('currency', 'common')} {Math.round(stats.averageSaleValue).toLocaleString()}</Text>
              <Text style={styles.statLabel}>{t('averageSale', 'sales')}</Text>
            </LinearGradient>


            <LinearGradient
              colors={['#514b4b', '#1796a18e']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{filteredProfits.donation.toFixed(2)} {t('currency', 'common')}</Text>
              <Text style={styles.statLabel}>{t('churchDonation', 'sales') || 'Donation (10%)'}</Text>
            </LinearGradient>

            <LinearGradient
              colors={['#352a22ab', '#6ad787d3']}
              style={styles.statCard}
            >
              <Text style={styles.statValue}>{filteredProfits.zakat.toFixed(2)} {t('currency', 'common')}</Text>
              <Text style={styles.statLabel}>{t('zakat', 'sales') || 'Zakat (2.5%)'}</Text>
            </LinearGradient>
        </View>

        {/* Payment Stats */}
        <View style={styles.paymentStats}>
          <View style={styles.paymentStatItem}>
            <MaterialCommunityIcons name="cash" size={20} color="#10b981" />
            <Text style={styles.paymentStatLabel}>{t('cash', 'sales')}</Text>
            <Text style={styles.paymentStatValue}>{stats.cashSales}</Text>
          </View>
          <View style={styles.paymentStatDivider} />
          <View style={styles.paymentStatItem}>
            <MaterialCommunityIcons name="credit-card" size={20} color="#f59e0b" />
            <Text style={styles.paymentStatLabel}>{t('card', 'sales')}</Text>
            <Text style={styles.paymentStatValue}>{stats.creditSales}</Text>
          </View>
          <View style={styles.paymentStatDivider} />
          <View style={styles.paymentStatItem}>
            <MaterialCommunityIcons name="alert-circle" size={20} color="#ef4444" />
            <Text style={styles.paymentStatLabel}>{t('due', 'common')}</Text>
            <Text style={styles.paymentStatValue}>
              {sales.filter(s => s.payment_status === 'due').length}
            </Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <FilterChip
              label={t('all', 'common')}
              isActive={selectedFilter === 'all'}
              onPress={() => setSelectedFilter('all')}
            />
            <FilterChip
              label={t('today', 'common')}
              isActive={selectedFilter === 'today'}
              onPress={() => setSelectedFilter('today')}
            />
            <FilterChip
              label={t('week', 'common')}
              isActive={selectedFilter === 'week'}
              onPress={() => setSelectedFilter('week')}
            />
            <FilterChip
              label={t('month', 'common')}
              isActive={selectedFilter === 'month'}
              onPress={() => setSelectedFilter('month')}
            />
            <FilterChip
              label={t('paid', 'common')}
              isActive={selectedFilter === 'paid'}
              onPress={() => setSelectedFilter('paid')}
            />
            <FilterChip
              label={t('due', 'common')}
              isActive={selectedFilter === 'due'}
              onPress={() => setSelectedFilter('due')}
            />
          </ScrollView>

          <View style={styles.paymentFilter}>
            <TouchableOpacity
              style={[styles.paymentFilterButton, selectedPayment === 'all' && styles.activePaymentFilter]}
              onPress={() => setSelectedPayment('all')}
            >
              <Text style={[styles.paymentFilterText, selectedPayment === 'all' && styles.activePaymentFilterText]}>
                {t('all', 'common')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentFilterButton, selectedPayment === 'cash' && styles.activePaymentFilter]}
              onPress={() => setSelectedPayment('cash')}
            >
              <MaterialCommunityIcons name="cash" size={14} color={selectedPayment === 'cash' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.paymentFilterText, selectedPayment === 'cash' && styles.activePaymentFilterText]}>
                {t('cash', 'sales')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentFilterButton, selectedPayment === 'card' && styles.activePaymentFilter]}
              onPress={() => setSelectedPayment(selectedPayment === 'card' ? 'all' : 'card')}
            >
              <MaterialCommunityIcons name="credit-card" size={14} color={selectedPayment === 'card' ? '#ffffff' : '#64748b'} />
              <Text style={[styles.paymentFilterText, selectedPayment === 'card' && styles.activePaymentFilterText]}>
                {t('card', 'sales')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.paymentFilterButton, (selectedPayment === 'transfer' || selectedPayment === 'bank_transfer') && styles.activePaymentFilter]}
              onPress={() => setSelectedPayment(selectedPayment === 'bank_transfer' ? 'all' : 'bank_transfer')}
            >
              <MaterialCommunityIcons name="bank-transfer" size={14} color={(selectedPayment === 'transfer' || selectedPayment === 'bank_transfer') ? '#ffffff' : '#64748b'} />
              <Text style={[styles.paymentFilterText, (selectedPayment === 'transfer' || selectedPayment === 'bank_transfer') && styles.activePaymentFilterText]}>
                {t('transfer', 'sales')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sales List */}
        <View style={styles.salesList}>
          <Text style={styles.listTitle}>
            {filteredSales.length} {t('salesFound', 'sales')}
          </Text>

          {filteredSales.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="cart-off" size={48} color="#475569" />
              <Text style={styles.emptyText}>{t('noSales', 'sales')}</Text>
              <TouchableOpacity 
                style={styles.emptyAddButton}
                onPress={handleNewSale}
              >
                <Text style={styles.emptyAddButtonText}>{t('newSale', 'sales')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredSales.map((item) => (
              <SaleCard key={item.id} item={item} />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleNewSale}
      >
        <LinearGradient
          colors={['#f59e0b', '#d97706']}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
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
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
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
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
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
    marginBottom: 12,
  },
  statCard: {
    width: (width - 40) / 2,
    padding: 16,
    borderRadius: 12,
  },
    statCards: {
    width: width - 32,
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
    marginBottom: 2,
  },
  statSubValue: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
  },
  paymentStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  paymentStatLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  paymentStatValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterSection: {
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
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  activeFilterChipText: {
    color: '#ffffff',
  },
  paymentFilter: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  paymentFilterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activePaymentFilter: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  paymentFilterText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  activePaymentFilterText: {
    color: '#ffffff',
  },
  salesList: {
    paddingHorizontal: 20,
  },
  listTitle: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 12,
  },
  saleCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
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
  saleInfo: {
    flex: 1,
  },
  saleCode: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: '#64748b',
    fontSize: 11,
    marginRight: 8,
  },
  timeText: {
    color: '#64748b',
    fontSize: 11,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  customerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  customerName: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  customerPhone: {
    color: '#94a3b8',
    fontSize: 12,
  },
  saleDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
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
  totalLabel: {
    color: '#94a3b8',
    fontSize: 11,
    marginBottom: 2,
  },
  totalAmount: {
    color: '#f59e0b',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  profitText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '600',
  },
  todayBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop:25,
  },
  todayBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
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
    backgroundColor: '#f59e0b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyAddButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});