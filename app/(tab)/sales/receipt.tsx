import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Share,
  SafeAreaView,
} from 'react-native';
import { useLanguage } from '../../../context/LanguageContext';

// For debugging - log every render
let renderCount = 0;

export default function SaleDetailScreen() {
  console.log('🔷 SaleDetailScreen rendering, count:', ++renderCount);
  
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();
  console.log('🔷 ID from params:', id);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sale, setSale] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔷 useEffect triggered with id:', id);
    if (id) {
      fetchSaleDetails();
    } else {
      console.log('🔷 No ID provided');
      setError(t('noIdProvided', 'sales'));
      setLoading(false);
    }
  }, [id]);

  const fetchSaleDetails = async () => {
    console.log('🔷 fetchSaleDetails started');
    try {
      // For testing - let's set mock data first to see if UI renders
      console.log('🔷 Setting mock data for testing');
      setSale({
        id: 9,
        sale_code: "SALE-20260306-C6C809",
        customer_name: t('walkInCustomer', 'sales'),
        customer_phone: "",
        customer_email: "",
        total_amount: "38500.00",
        discount: "0.00",
        grand_total: "38500.00",
        paid_amount: "38500.00",
        due_amount: "0.00",
        profit: "2000",
        payment_method: "cash",
        payment_status: "paid",
        sale_date: "2026-03-06",
        sale_time: "17:01:32",
        notes: "",
        cashier_name: "owner",
        items: [
          {
            id: 1,
            product_name: "Test Product 1",
            quantity: 2,
            unit_price: 1000,
            total_price: 2000
          },
          {
            id: 2,
            product_name: "Test Product 2",
            quantity: 1,
            unit_price: 500,
            total_price: 500
          }
        ]
      });
      setLoading(false);
      
      // Comment out the actual API call for now to test UI
      /*
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching sale with ID:', id);
      const response = await api.get(`/sales?id=${id}`);
      console.log('API Response:', response.data);

      if (response.data.status === 'success') {
        setSale(response.data.data);
      }
      */
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      setError(error.message || t('saleFetchFailed', 'sales'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSaleDetails();
  };

  const handleShare = async () => {
    if (!sale) return;
    
    try {
      const shareMessage = `
${t('receipt', 'sales')}
══════════════════════

${t('saleCode', 'sales')}: ${sale.sale_code}
${t('customer', 'sales')}: ${sale.customer_name}
${t('date', 'common')}: ${sale.sale_date} ${sale.sale_time}

${t('items', 'sales')}:
${sale.items?.map((item: any) => 
  `${item.product_name} - ${item.quantity} x ${item.unit_price} ${t('currency', 'common')} = ${item.total_price} ${t('currency', 'common')}`
).join('\n')}

${t('total', 'sales')}: ${sale.total_amount} ${t('currency', 'common')}
${t('discount', 'sales')}: ${sale.discount} ${t('currency', 'common')}
${t('grandTotal', 'sales')}: ${sale.grand_total} ${t('currency', 'common')}
${t('paid', 'common')}: ${sale.paid_amount} ${t('currency', 'common')}
${t('due', 'common')}: ${sale.due_amount} ${t('currency', 'common')}
      `;

      await Share.share({
        message: shareMessage,
        title: t('receipt', 'sales'),
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981';
      case 'partial': return '#f59e0b';
      case 'pending': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return t('paid', 'common');
      case 'partial': return t('partial', 'sales');
      case 'pending': return t('unpaid', 'sales');
      default: return status;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash': return 'cash';
      case 'card': return 'credit-card';
      case 'transfer':
      case 'bank_transfer': return 'bank-transfer';
      default: return 'cash';
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash': return t('cash', 'sales');
      case 'card': return t('card', 'sales');
      case 'transfer':
      case 'bank_transfer': return t('transfer', 'sales');
      default: return method;
    }
  };

  console.log('🔷 Current state - loading:', loading, 'sale:', sale ? 'exists' : 'null', 'error:', error);

  // Loading state
  if (loading) {
    console.log('🔷 Rendering loading state');
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>{t('loading', 'common')}</Text>
        </View>
      </LinearGradient>
    );
  }

  // Error state
  if (error) {
    console.log('🔷 Rendering error state:', error);
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchSaleDetails}>
            <Text style={styles.retryButtonText}>{t('retry', 'common')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('back', 'common')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // No data state
  if (!sale) {
    console.log('🔷 Rendering no data state');
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <View style={styles.centered}>
          <MaterialCommunityIcons name="package" size={64} color="#64748b" />
          <Text style={styles.noDataText}>{t('noData', 'common')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('back', 'common')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  console.log('🔷 Rendering main content with sale:', sale.id);
  
  // Main content
  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('saleDetails', 'sales')}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleShare}
            >
              <MaterialCommunityIcons name="share" size={22} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
          }
          style={styles.scrollView}
        >
          {/* Sale Code Card */}
          <View style={styles.codeCard}>
            <View style={styles.codeHeader}>
              <MaterialCommunityIcons name="barcode" size={24} color="#10b981" />
              <Text style={styles.codeLabel}>{t('saleCode', 'sales')}</Text>
            </View>
            <Text style={styles.codeValue}>{sale.sale_code}</Text>
            <View style={styles.dateTime}>
              <View style={styles.dateTimeItem}>
                <MaterialCommunityIcons name="calendar" size={16} color="#64748b" />
                <Text style={styles.dateTimeText}>{sale.sale_date}</Text>
              </View>
              <View style={styles.dateTimeItem}>
                <MaterialCommunityIcons name="clock" size={16} color="#64748b" />
                <Text style={styles.dateTimeText}>{sale.sale_time}</Text>
              </View>
            </View>
          </View>

          {/* Customer Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>{t('customerInfo', 'sales')}</Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{sale.customer_name || t('none', 'common')}</Text>
              {sale.customer_phone ? (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="phone" size={16} color="#64748b" />
                  <Text style={styles.infoText}>{sale.customer_phone}</Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Cashier Info */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-tie" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>{t('cashier', 'sales')}</Text>
            </View>
            <View style={styles.cashierInfo}>
              <MaterialCommunityIcons name="account-tie" size={20} color="#64748b" />
              <Text style={styles.cashierName}>{sale.cashier_name || t('none', 'common')}</Text>
            </View>
          </View>

          {/* Items */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="package" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>{t('items', 'sales')}</Text>
              <View style={styles.itemCount}>
                <Text style={styles.itemCountText}>{sale.items?.length || 0}</Text>
              </View>
            </View>
            
            {sale.items && sale.items.length > 0 ? (
              sale.items.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.itemCard}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemName}>{item.product_name || t('product', 'common')}</Text>
                    <Text style={styles.itemQuantity}>x{item.quantity || 0}</Text>
                  </View>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemUnitPrice}>{item.unit_price || 0} {t('currency', 'common')} {t('each', 'sales')}</Text>
                    <Text style={styles.itemTotalPrice}>{item.total_price || 0} {t('currency', 'common')}</Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.noItemsText}>{t('noItems', 'sales')}</Text>
            )}
          </View>

          {/* Payment Summary */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="cash" size={20} color="#10b981" />
              <Text style={styles.sectionTitle}>{t('paymentSummary', 'sales')}</Text>
            </View>
            
            <View style={styles.paymentSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('total', 'sales')}</Text>
                <Text style={styles.summaryValue}>{sale.total_amount || 0} {t('currency', 'common')}</Text>
              </View>
              
              {Number(sale.discount) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('discount', 'sales')}</Text>
                  <Text style={styles.summaryDiscount}>-{sale.discount} {t('currency', 'common')}</Text>
                </View>
              )}
              
              <View style={[styles.summaryRow, styles.grandTotalRow]}>
                <Text style={styles.grandTotalLabel}>{t('grandTotal', 'sales')}</Text>
                <Text style={styles.grandTotalValue}>{sale.grand_total || 0} {t('currency', 'common')}</Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('paid', 'common')}</Text>
                <Text style={styles.summaryPaid}>{sale.paid_amount || 0} {t('currency', 'common')}</Text>
              </View>
              
              {Number(sale.due_amount) > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t('due', 'common')}</Text>
                  <Text style={styles.summaryDue}>{sale.due_amount} {t('currency', 'common')}</Text>
                </View>
              )}
              
              <View style={styles.paymentMethod}>
                <MaterialCommunityIcons 
                  name={getPaymentMethodIcon(sale.payment_method)} 
                  size={20} 
                  color="#64748b" 
                />
                <Text style={styles.paymentMethodText}>
                  {getPaymentMethodText(sale.payment_method)}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(sale.payment_status)}20` }]}>
                <MaterialCommunityIcons 
                  name={sale.payment_status === 'paid' ? 'check-circle' : 'clock-outline'} 
                  size={20} 
                  color={getStatusColor(sale.payment_status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(sale.payment_status) }]}>
                  {getStatusText(sale.payment_status)}
                </Text>
              </View>

              {sale.notes ? (
                <View style={styles.notes}>
                  <Text style={styles.notesLabel}>{t('notes', 'sales')}:</Text>
                  <Text style={styles.notesText}>{sale.notes}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.footer} />
        </ScrollView>
      </SafeAreaView>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  noDataText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerButton: {
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
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  backButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  codeCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  codeLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  codeValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  dateTime: {
    flexDirection: 'row',
    gap: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTimeText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  section: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom:80,
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  customerInfo: {
    gap: 8,
  },
  customerName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  cashierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cashierName: {
    color: '#ffffff',
    fontSize: 16,
  },
  itemCount: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  itemCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  itemQuantity: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  itemUnitPrice: {
    color: '#94a3b8',
    fontSize: 14,
  },
  itemTotalPrice: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  noItemsText: {
    color: '#64748b',
    fontSize: 14,
    textAlign: 'center',
    padding: 16,
  },
  paymentSummary: {
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 16,
  },
  summaryDiscount: {
    color: '#ef4444',
    fontSize: 16,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
    paddingTop: 8,
  },
  grandTotalLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryPaid: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryDue: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  paymentMethodText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  notes: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  notesLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  notesText: {
    color: '#ffffff',
    fontSize: 14,
  },
});