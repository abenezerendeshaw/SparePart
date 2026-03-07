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
} from 'react-native';
import api from '../../lib/api';
import storage from '../../lib/storage';

interface SaleItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  profit: number;
}

interface Sale {
  id: number;
  sale_code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  total_amount: number;
  discount: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  profit: number;
  payment_method: string;
  payment_status: string;
  sale_date: string;
  sale_time: string;
  notes: string;
  cashier_name: string;
  items: SaleItem[];
}

export default function SaleDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sale, setSale] = useState<Sale | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchSaleDetails();
  }, [id]);

  const fetchSaleDetails = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching sale with ID:', id);
      
      // FIXED: Use query parameter format: ?id=51 instead of /51
      const response = await api.get(`/sales?id=${id}`);

      console.log('API Response:', response.data);

      if (response.data.status === 'success') {
        setSale(response.data.data);
      } else {
        Alert.alert('ስህተት', 'የሽያጭ ዝርዝሮችን ማምጣት አልተሳካም');
      }
    } catch (error: any) {
      console.error('Error fetching sale:', error);
      
      if (error.response?.status === 404) {
        Alert.alert('ስህተት', 'ሽያጭ አልተገኘም');
      } else if (error.response?.status === 401) {
        Alert.alert('ስህተት', 'እባክዎ እንደገና ይግቡ');
        router.replace('/auth/login');
      } else {
        Alert.alert('ስህተት', error.response?.data?.message || 'የሽያጭ ዝርዝሮችን ማምጣት አልተሳካም');
      }
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
ሽያጭ ደረሰኝ
ሽያጭ ኮድ: ${sale.sale_code}
ደንበኛ: ${sale.customer_name}
ቀን: ${sale.sale_date} ${sale.sale_time}

ምርቶች:
${sale.items.map(item => 
  `${item.product_name} - ${item.quantity} x ${item.unit_price} = ${item.total_price} ብር`
).join('\n')}

አጠቃላይ: ${sale.total_amount} ብር
ቅናሽ: ${sale.discount} ብር
ድምር ደምር: ${sale.grand_total} ብር
የተከፈለ: ${sale.paid_amount} ብር
የቀረ: ${sale.due_amount} ብር
ክፍያ ሁኔታ: ${sale.payment_status === 'paid' ? 'ተከፍሏል' : sale.payment_status === 'partial' ? 'በከፊል ተከፍሏል' : 'አልተከፈለም'}
      `;

      await Share.share({
        message: shareMessage,
        title: 'ሽያጭ ደረሰኝ',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // FIXED: Use query parameter format
      const response = await api.delete(`/sales?id=${id}`);

      if (response.data.status === 'success') {
        Alert.alert('ተሳክቷል', 'ሽያጭ በተሳካ ሁኔታ ተሰርዟል');
        router.back();
      }
    } catch (error: any) {
      console.error('Error deleting sale:', error);
      Alert.alert('ስህተት', error.response?.data?.message || 'ሽያጭ መሰረዝ አልተሳካም');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#10b981';
      case 'partial':
        return '#f59e0b';
      case 'pending':
        return '#ef4444';
      default:
        return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'ተከፍሏል';
      case 'partial':
        return 'በከፊል ተከፍሏል';
      case 'pending':
        return 'አልተከፈለም';
      default:
        return status;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash':
        return 'ጥሬ ገንዘብ';
      case 'card':
        return 'ካርድ';
      case 'transfer':
        return 'ዝውውር';
      case 'other':
        return 'ሌላ';
      default:
        return method;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return 'cash';
      case 'card':
        return 'credit-card';
      case 'transfer':
        return 'bank-transfer';
      case 'other':
        return 'dots-horizontal';
      default:
        return 'cash';
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>በመጫን ላይ...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!sale) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>ሽያጭ አልተገኘም</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>ተመለስ</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>የሽያጭ ዝርዝሮች</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share" size={22} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, styles.deleteButton]}
            onPress={() => setShowDeleteModal(true)}
          >
            <MaterialCommunityIcons name="delete" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Sale Code Card */}
        <View style={styles.codeCard}>
          <View style={styles.codeHeader}>
            <MaterialCommunityIcons name="barcode" size={24} color="#10b981" />
            <Text style={styles.codeLabel}>ሽያጭ ኮድ</Text>
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
            <Text style={styles.sectionTitle}>የደንበኛ መረጃ</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>{sale.customer_name}</Text>
            {sale.customer_phone ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="phone" size={16} color="#64748b" />
                <Text style={styles.infoText}>{sale.customer_phone}</Text>
              </View>
            ) : null}
            {sale.customer_email ? (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="email" size={16} color="#64748b" />
                <Text style={styles.infoText}>{sale.customer_email}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Cashier Info */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cashier" size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>የሸጠው ሰው</Text>
          </View>
          <View style={styles.cashierInfo}>
            <MaterialCommunityIcons name="account-tie" size={20} color="#64748b" />
            <Text style={styles.cashierName}>{sale.cashier_name || 'Unknown'}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="package-variant" size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>ምርቶች</Text>
            <View style={styles.itemCount}>
              <Text style={styles.itemCountText}>{sale.items.length}</Text>
            </View>
          </View>
          
          {sale.items.map((item, index) => (
            <View key={item.id || index} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemUnitPrice}>{item.unit_price} ብር እያንዳንዱ</Text>
                <Text style={styles.itemTotalPrice}>{item.total_price} ብር</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="cash" size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>የክፍያ ማጠቃለያ</Text>
          </View>
          
          <View style={styles.paymentSummary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>አጠቃላይ መጠን</Text>
              <Text style={styles.summaryValue}>{sale.total_amount} ብር</Text>
            </View>
            
            {sale.discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>ቅናሽ</Text>
                <Text style={styles.summaryDiscount}>-{sale.discount} ብር</Text>
              </View>
            )}
            
            <View style={[styles.summaryRow, styles.grandTotalRow]}>
              <Text style={styles.grandTotalLabel}>ድምር ደምር</Text>
              <Text style={styles.grandTotalValue}>{sale.grand_total} ብር</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>የተከፈለ</Text>
              <Text style={styles.summaryPaid}>{sale.paid_amount} ብር</Text>
            </View>
            
            {sale.due_amount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>የቀረ</Text>
                <Text style={styles.summaryDue}>{sale.due_amount} ብር</Text>
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
                name={
                  sale.payment_status === 'paid' ? 'check-circle' :
                  sale.payment_status === 'partial' ? 'clock' : 'clock-outline'
                } 
                size={20} 
                color={getStatusColor(sale.payment_status)} 
              />
              <Text style={[styles.statusText, { color: getStatusColor(sale.payment_status) }]}>
                {getStatusText(sale.payment_status)}
              </Text>
            </View>

            {sale.notes ? (
              <View style={styles.notes}>
                <Text style={styles.notesLabel}>ማስታወሻ:</Text>
                <Text style={styles.notesText}>{sale.notes}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Profit Info (Optional - maybe hide for customers) */}
        <View style={[styles.section, styles.profitSection]}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="trending-up" size={20} color="#10b981" />
            <Text style={styles.sectionTitle}>ትርፍ</Text>
          </View>
          <Text style={styles.profitValue}>{sale.profit} ብር</Text>
        </View>

        {/* Action Buttons */}

{/* Action Buttons */}
<View style={styles.actionButtons}>
  <TouchableOpacity 
    style={[styles.actionButton, styles.printButton]}
    onPress={() => router.push(`/sales/receipt?id=${sale.id}`)} // Fixed: use query param
  >
    <MaterialCommunityIcons name="file-document-outline" size={20} color="#ffffff" />
    <Text style={styles.actionButtonText}>ደረሰኝ አትም</Text>
  </TouchableOpacity>
  
  {sale.due_amount > 0 && (
    <TouchableOpacity 
      style={[styles.actionButton, styles.paymentButton]}
      onPress={() => router.push(`/sales/payment/${sale.id}`)}
    >
      <MaterialCommunityIcons name="cash-plus" size={20} color="#ffffff" />
      <Text style={styles.actionButtonText}>ክፍያ መዝግብ</Text>
    </TouchableOpacity>
  )}
</View>

      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <MaterialCommunityIcons name="alert" size={48} color="#ef4444" />
            <Text style={styles.modalTitle}>ሽያጭ ሰርዝ?</Text>
            <Text style={styles.modalText}>
              ይህን ሽያጭ መሰረዝ ይፈልጋሉ? ይህ ድርጊት ሊቀለበስ አይችልም።
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={styles.cancelButtonText}>አይ, ይቅር</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={handleDelete}
              >
                <Text style={styles.confirmDeleteText}>አዎ, ሰርዝ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    color: '#ffffff',
    fontSize: 16,
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    fontSize: 24,
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
  profitSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
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
    justifyContent: 'center',
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
  profitValue: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 20,
    marginBottom: 80,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  printButton: {
    backgroundColor: '#3b82f6',
  },
  paymentButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1a2634',
    borderRadius: 24,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  modalText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmDeleteButton: {
    backgroundColor: '#ef4444',
  },
  confirmDeleteText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});