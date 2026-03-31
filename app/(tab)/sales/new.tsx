import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SubscriptionGuard } from '../../../components/SubscriptionGuard';
import { useLanguage } from '../../../context/LanguageContext';
import api from '../../lib/api';
import storage from '../../lib/storage';

const { width, height } = Dimensions.get('window');

interface SaleItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  profit: number;
  buying_price?: number;
}

interface Product {
  id: number;
  product_name: string;
  product_code: string;
  selling_price: number;
  buying_price: number;
  total_stock: number;
}

export default function AddSaleScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    customer: false,
    payment: false,
  });

  const [form, setForm] = useState<any>({
    customer_name: t('walkInCustomer', 'sales'),
    customer_phone: '',
    customer_email: '',
    payment_method: 'cash',
    discount: '0',
    notes: '',
    paid_amount: '',
    owner_id: '',
    tax_enabled: false,
    church_donation_enabled: false,
    zekat_enabled: false,
  });

  const [items, setItems] = useState<SaleItem[]>([]);
  const [editingItem, setEditingItem] = useState<Partial<SaleItem> | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);

  const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
  const discount = Number(form.discount) || 0;
  const taxAmount = form.tax_enabled ? totalAmount * 0.15 : 0;
  const donationAmount = form.church_donation_enabled ? totalAmount * 0.10 : 0;
  const zekatAmount = form.zekat_enabled ? totalAmount * 0.025 : 0;
  const grandTotal = Math.max(0, totalAmount - discount + taxAmount + donationAmount + zekatAmount);
  const paidAmount = Number(form.paid_amount) || 0;
  const dueAmount = Math.max(0, grandTotal - paidAmount);
  
  const paymentStatus = paidAmount <= 0 ? 'pending' : (paidAmount >= grandTotal ? 'paid' : 'partial');
  const itemCount = items.length;

  const toggleSection = (section: keyof typeof expandedSections) => {
    const newState = {
      items: false,
      customer: false,
      payment: false,
      [section]: true
    };
    
    setExpandedSections(newState);

    setTimeout(() => {
      const sectionPositions = {
        items: 0,
        customer: 200,
        payment: 400,
      };
      
      scrollViewRef.current?.scrollTo({
        y: sectionPositions[section],
        animated: true,
      });
    }, 100);
  };

  const isCustomerInfoValid = () => {
    const nameChanged = form.customer_name !== t('walkInCustomer', 'sales');
    const phoneValid = !form.customer_phone || form.customer_phone.length >= 10;
    const emailValid = !form.customer_email || form.customer_email.length >= 10;
    return (nameChanged || form.customer_phone.length >= 10 || form.customer_email.length >= 10)
           && phoneValid
           && emailValid;
  };

  useEffect(() => {
    if (expandedSections.items && items.length > 10) {
      toggleSection('customer');
    }
  }, [items.length]);

  useEffect(() => {
    if (expandedSections.customer && isCustomerInfoValid()) {
      toggleSection('payment');
    }
  }, [form.customer_name, form.customer_phone, form.customer_email, expandedSections.customer]);

  const loadProducts = async () => {
    try {
      const token = await storage.getItem('authToken');
      const response = await api.get('/products?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status === 'success') {
        setProducts(response.data.data.products || []);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setForm({ ...form, [field]: value });
  };

  const addItem = (product: Product) => {
    setEditingItem({
      product_id: product.id,
      product_name: product.product_name,
      unit_price: product.selling_price,
      buying_price: product.buying_price,
      quantity: 1,
      total_price: product.selling_price,
      profit: (product.selling_price - (product.buying_price || 0)),
    });
    setShowProductModal(false);
    setShowItemModal(true);
  };

  const saveItem = () => {
    if (!editingItem?.product_id || !editingItem.quantity || editingItem.quantity <= 0) {
      Alert.alert(t('error'), t('validQuantity', 'sales'));
      return;
    }

    const newItem: SaleItem = {
      product_id: editingItem.product_id!,
      product_name: editingItem.product_name!,
      quantity: editingItem.quantity,
      unit_price: editingItem.unit_price || 0,
      total_price: (editingItem.quantity || 0) * (editingItem.unit_price || 0),
      profit: ((editingItem.unit_price || 0) - (editingItem.buying_price || 0)) * (editingItem.quantity || 0),
      buying_price: editingItem.buying_price,
    };

    const existingIndex = items.findIndex(item => item.product_id === newItem.product_id);
    if (existingIndex >= 0) {
      const updatedItems = [...items];
      updatedItems[existingIndex] = newItem;
      setItems(updatedItems);
    } else {
      setItems([...items, newItem]);
    }

    setShowItemModal(false);
    setEditingItem(null);
  };

  const removeItem = (productId: number) => {
    setItems(items.filter(item => item.product_id !== productId));
  };

  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
      return;
    }

    setItems(items.map(item => {
      if (item.product_id === productId) {
        const totalPrice = newQuantity * item.unit_price;
        const profit = (item.unit_price - (item.buying_price || 0)) * newQuantity;
        return {
          ...item,
          quantity: newQuantity,
          total_price: totalPrice,
          profit,
        };
      }
      return item;
    }));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      Alert.alert(t('error'), t('selectProduct', 'sales'));
      return;
    }

    setLoading(true);
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const userStr = await storage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const saleData = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email,
        payment_method: form.payment_method,
        discount: Number(form.discount) || 0,
        notes: form.notes,
        paid_amount: Number(form.paid_amount) || grandTotal,
        owner_id: user?.owner_id || Number(form.owner_id) || undefined,
        tax_enabled: !!form.tax_enabled,
        tax_amount: Number((form.tax_enabled ? (items.reduce((s, i) => s + i.total_price, 0) * 0.15) : 0).toFixed(2)),
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const response = await api.post('/sales', saleData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === 'success') {
        Alert.alert(
          t('success'),
          t('saleSaved', 'sales'),
          [
            {
              text: t('goToSales', 'sales'),
              onPress: () => router.push('/(tab)/sales'),
            },
            {
              text: t('viewReceipt', 'sales'),
              onPress: () => router.push(`/sales/receipt?id=${response.data.data.id}`),
            },
          ]
        );
      } else {
        Alert.alert(t('error'), response.data.message || t('saleSaveFailed', 'sales'));
      }
    } catch (error: any) {
      console.log('Error adding sale:', error);
      Alert.alert(t('error'), error.response?.data?.message || t('tryAgain', 'common'));
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderSectionHeader = (title: string, section: keyof typeof expandedSections, icon: string, rightElement?: React.ReactNode) => (
    <TouchableOpacity 
      style={[
        styles.sectionHeader,
        expandedSections[section] && styles.sectionHeaderActive
      ]}
      onPress={() => toggleSection(section)}
      activeOpacity={0.7}
    >
      <View style={styles.sectionHeaderLeft}>
        <MaterialCommunityIcons 
          name={icon as any} 
          size={20} 
          color={expandedSections[section] ? '#10b981' : '#94a3b8'} 
        />
        <Text style={[
          styles.sectionTitle,
          expandedSections[section] && styles.sectionTitleActive
        ]}>
          {title}
        </Text>
        {section === 'items' && itemCount > 0 && (
          <View style={styles.itemCountBadge}>
            <Text style={styles.itemCountText}>{itemCount}</Text>
          </View>
        )}
      </View>
      <View style={styles.sectionHeaderRight}>
        {rightElement}
        <MaterialCommunityIcons 
          name={expandedSections[section] ? 'chevron-up' : 'chevron-down'} 
          size={24} 
          color={expandedSections[section] ? '#10b981' : '#94a3b8'} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SubscriptionGuard>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
          <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
          
          <ScrollView 
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
          >
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>{t('newSale', 'sales')}</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => {
                  loadProducts();
                  setShowProductModal(true);
                }}
              >
                <MaterialCommunityIcons name="cart-plus" size={24} color="#10b981" />
              </TouchableOpacity>
            </View>

            <View style={styles.progressContainer}>
              <View style={[styles.progressStep, items.length > 0 && styles.progressStepComplete]}>
                <MaterialCommunityIcons 
                  name={items.length > 0 ? "check" : "package-variant"} 
                  size={16} 
                  color={items.length > 0 ? "#10b981" : "#64748b"} 
                />
                <Text style={[styles.progressText, items.length > 0 && styles.progressTextComplete]}>{t('items', 'sales')}</Text>
              </View>
              <View style={[styles.progressLine, items.length > 0 && styles.progressLineComplete]} />
              <View style={[styles.progressStep, (form.customer_name !== t('walkInCustomer', 'sales') || form.customer_phone) && styles.progressStepComplete]}>
                <MaterialCommunityIcons 
                  name={(form.customer_name !== t('walkInCustomer', 'sales') || form.customer_phone) ? "check" : "account"} 
                  size={16} 
                  color={(form.customer_name !== t('walkInCustomer', 'sales') || form.customer_phone) ? "#10b981" : "#64748b"} 
                />
                <Text style={[styles.progressText, (form.customer_name !== t('walkInCustomer', 'sales') || form.customer_phone) && styles.progressTextComplete]}>{t('customer', 'sales')}</Text>
              </View>
              <View style={[styles.progressLine, (form.customer_name !== t('walkInCustomer', 'sales') || form.customer_phone) && styles.progressLineComplete]} />
              <View style={[styles.progressStep, paidAmount > 0 && styles.progressStepComplete]}>
                <MaterialCommunityIcons 
                  name={paidAmount > 0 ? "check" : "cash"} 
                  size={16} 
                  color={paidAmount > 0 ? "#10b981" : "#64748b"} 
                />
                <Text style={[styles.progressText, paidAmount > 0 && styles.progressTextComplete]}>{t('payment', 'sales')}</Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.section}>
                {renderSectionHeader(t('items', 'sales'), 'items', 'package-variant', 
                  items.length > 0 && (
                    <TouchableOpacity 
                      onPress={() => {
                        loadProducts();
                        setShowProductModal(true);
                      }}
                      style={styles.addItemButton}
                    >
                      <MaterialCommunityIcons name="plus-circle" size={20} color="#10b981" />
                    </TouchableOpacity>
                  )
                )}
                
                {expandedSections.items && (
                  <View style={styles.sectionContent}>
                    {items.length === 0 ? (
                      <TouchableOpacity 
                        style={styles.emptyItems}
                        onPress={() => {
                          loadProducts();
                          setShowProductModal(true);
                        }}
                      >
                        <MaterialCommunityIcons name="cart-plus" size={48} color="#64748b" />
                        <Text style={styles.emptyItemsText}>{t('addItems', 'sales')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.itemsList}>
                        {items.map((item) => (
                          <View key={item.product_id} style={styles.itemCard}>
                            <View style={styles.itemHeader}>
                              <Text style={styles.itemName}>{item.product_name}</Text>
                              <TouchableOpacity onPress={() => removeItem(item.product_id)}>
                                <MaterialCommunityIcons name="close" size={20} color="#ef4444" />
                              </TouchableOpacity>
                            </View>
                            <View style={styles.itemDetails}>
                              <Text style={styles.itemPrice}>{item.unit_price} {t('currency', 'common')}</Text>
                              <View style={styles.quantityControl}>
                                <TouchableOpacity onPress={() => updateItemQuantity(item.product_id, item.quantity - 1)}>
                                  <MaterialCommunityIcons name="minus" size={16} color="#ffffff" />
                                </TouchableOpacity>
                                <Text style={styles.quantityText}>{item.quantity}</Text>
                                <TouchableOpacity onPress={() => updateItemQuantity(item.product_id, item.quantity + 1)}>
                                  <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.section}>
                {renderSectionHeader(t('customer', 'sales'), 'customer', 'account')}
                {expandedSections.customer && (
                  <View style={styles.sectionContent}>
                    <TextInput
                      style={styles.input}
                      placeholder={t('customerName', 'sales')}
                      placeholderTextColor="#64748b"
                      value={form.customer_name}
                      onChangeText={(value) => handleInputChange('customer_name', value)}
                    />
                  </View>
                )}
              </View>

              <View style={styles.section}>
                {renderSectionHeader(t('payment', 'sales'), 'payment', 'cash')}
                {expandedSections.payment && (
                  <View style={styles.sectionContent}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.totalLabel}>{t('grandTotal', 'sales')}: {grandTotal.toFixed(2)}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder={t('paid', 'common')}
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={form.paid_amount}
                        onChangeText={(value) => handleInputChange('paid_amount', value)}
                      />
                    </View>
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={[styles.submitButton, items.length === 0 && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={loading || items.length === 0}
              >
                {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitButtonText}>{t('saveSale', 'sales')}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>

          <Modal visible={showProductModal} animationType="slide" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <TextInput
                  style={styles.input}
                  placeholder={t('search', 'common')}
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <FlatList
                  data={filteredProducts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.productItem} onPress={() => addItem(item)}>
                      <Text style={styles.productName}>{item.product_name}</Text>
                      <Text style={styles.productPrice}>{item.selling_price} {t('currency', 'common')}</Text>
                    </TouchableOpacity>
                  )}
                />
                <TouchableOpacity onPress={() => setShowProductModal(false)}>
                  <Text style={styles.closeModalText}>{t('close', 'common')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal visible={showItemModal} animationType="none" transparent>
            <View style={styles.modalContainer}>
              <View style={styles.itemModalContent}>
                <Text style={styles.modalTitle}>{editingItem?.product_name}</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={editingItem?.quantity?.toString()}
                  onChangeText={(val) => setEditingItem({ ...editingItem, quantity: Number(val) })}
                />
                <TouchableOpacity style={styles.saveItemButton} onPress={saveItem}>
                  <Text style={styles.saveItemText}>{t('add', 'common')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SubscriptionGuard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  backButton: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  addButton: { padding: 8 },
  progressContainer: { flexDirection: 'row', padding: 20, alignItems: 'center' },
  progressStep: { alignItems: 'center', flex: 1 },
  progressStepComplete: { opacity: 1 },
  progressLine: { height: 2, flex: 1, backgroundColor: '#64748b' },
  progressLineComplete: { backgroundColor: '#10b981' },
  progressText: { color: '#64748b', fontSize: 10, marginTop: 4 },
  progressTextComplete: { color: '#10b981' },
  form: { padding: 20 },
  section: { marginBottom: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  sectionHeaderActive: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: '#94a3b8', fontSize: 16, fontWeight: 'bold' },
  sectionTitleActive: { color: '#10b981' },
  itemCountBadge: { backgroundColor: '#10b981', borderRadius: 10, paddingHorizontal: 6 },
  itemCountText: { color: '#fff', fontSize: 10 },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center' },
  addItemButton: { marginRight: 10 },
  sectionContent: { padding: 16 },
  emptyItems: { alignItems: 'center', padding: 20 },
  emptyItemsText: { color: '#64748b', marginTop: 10 },
  itemsList: { gap: 12 },
  itemCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 12, borderRadius: 8 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemName: { color: '#fff', fontWeight: 'bold' },
  itemDetails: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, alignItems: 'center' },
  itemPrice: { color: '#94a3b8' },
  quantityControl: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  quantityText: { color: '#fff' },
  input: { backgroundColor: 'rgba(255,255,255,0.05)', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 16 },
  summaryCard: { padding: 16 },
  totalLabel: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  submitButton: { backgroundColor: '#2974ff', padding: 16, borderRadius: 12, alignItems: 'center' },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1a2634', borderRadius: 16, padding: 20, maxHeight: '80%' },
  productItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  productName: { color: '#fff' },
  productPrice: { color: '#10b981' },
  closeModalText: { color: '#ef4444', textAlign: 'center', marginTop: 20 },
  itemModalContent: { backgroundColor: '#1a2634', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  saveItemButton: { backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveItemText: { color: '#fff', fontWeight: 'bold' },
});