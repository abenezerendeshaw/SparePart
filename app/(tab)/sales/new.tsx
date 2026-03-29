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
  
  // Collapsible sections state with controlled expansion
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

  // Calculations
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

  // Toggle section expansion with auto-scroll and sequential activation
  const toggleSection = (section: keyof typeof expandedSections) => {
    const newState = {
      items: false,
      customer: false,
      payment: false,
      [section]: true
    };
    
    setExpandedSections(newState);

    // Scroll to the expanded section after a brief delay
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



  // Add this right after your useState declarations
const isCustomerInfoValid = () => {
  const nameChanged = form.customer_name !== t('walkInCustomer', 'sales');
  const phoneValid = !form.customer_phone || form.customer_phone.length >= 10;
  const emailValid = !form.customer_email || form.customer_email.length >= 10;

  // Auto-advance if name is changed, OR phone/email meet length requirement
  return (nameChanged || form.customer_phone.length >= 10 || form.customer_email.length >= 10)
         && phoneValid
         && emailValid;
};





  // Auto-advance to next section when current section is "completed"
  useEffect(() => {
    if (expandedSections.items && items.length > 10) {
      // After adding items, automatically expand customer section
      toggleSection('customer');
    }
  }, [items.length]);

useEffect(() => {
  if (expandedSections.customer && isCustomerInfoValid()) {
    toggleSection('payment');
  }
}, [form.customer_name, form.customer_phone, form.customer_email, expandedSections.customer]);

  

  // Load products when modal opens
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
    // Show centered modal immediately
    setShowItemModal(true);
  };

  const saveItem = () => {
    if (!editingItem?.product_id || !editingItem.quantity || editingItem.quantity <= 0) {
      Alert.alert(t('error'), t('validQuantity', 'sales'));
      return;
    }

    const quantity = editingItem.quantity;
    const unitPrice = editingItem.unit_price || 0;
    const totalPrice = quantity * unitPrice;
    const profit = (unitPrice - (editingItem.buying_price || 0)) * quantity;

    const newItem: SaleItem = {
      product_id: editingItem.product_id!,
      product_name: editingItem.product_name!,
      quantity,
      unit_price: unitPrice,
      total_price: totalPrice,
      profit,
      buying_price: editingItem.buying_price,
    };

    // Check if item already exists
    const existingIndex = items.findIndex(item => item.product_id === newItem.product_id);
    if (existingIndex >= 0) {
      // Update existing item
      const updatedItems = [...items];
      updatedItems[existingIndex] = newItem;
      setItems(updatedItems);
    } else {
      // Add new item
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

  const validateForm = () => {
    if (items.length === 0) {
      Alert.alert(t('error'), t('selectProduct', 'sales'));
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      // Get current user info
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

  // Render section header with expand/collapse
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

  // Mini summary view when section is collapsed
  const renderItemsMiniSummary = () => {
    if (items.length === 0) return null;
    return (
      <View style={styles.miniSummary}>
        <Text style={styles.miniSummaryText}>
          {items.length} {t('products', 'common')} · {t('total', 'sales')} {totalAmount.toFixed(0)} {t('currency', 'common')}
        </Text>
      </View>
    );
  };

  const renderCustomerMiniSummary = () => {
    if (form.customer_name === t('walkInCustomer', 'sales') && !form.customer_phone) return null;
    return (
      <View style={styles.miniSummary}>
        <Text style={styles.miniSummaryText} numberOfLines={1}>
          {form.customer_name} {form.customer_phone ? `· ${form.customer_phone}` : ''}
        </Text>
      </View>
    );
  };

  const renderPaymentMiniSummary = () => {
    return (
      <View style={styles.miniSummary}>
        <Text style={styles.miniSummaryText}>
          {grandTotal.toFixed(0)} {t('currency', 'common')} · {paidAmount > 0 ? `${t('paid', 'common')} ${paidAmount.toFixed(0)}` : t('unpaid', 'sales')}
        </Text>
      </View>
    );
  };

  return (
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
          {/* Header */}
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

          {/* Progress Indicator */}
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

          {/* Quick Summary Bar - Always visible */}
          {items.length > 0 && (
            <TouchableOpacity 
              style={styles.quickSummaryBar}
              onPress={() => toggleSection('payment')}
              activeOpacity={0.7}
            >
              <View style={styles.quickSummaryLeft}>
                <MaterialCommunityIcons name="cart" size={20} color="#10b981" />
                <Text style={styles.quickSummaryText}>
                  {items.length} {t('products', 'common')} · {t('total', 'sales')} {totalAmount.toFixed(0)} {t('currency', 'common')}
                </Text>
              </View>
              <View style={styles.quickSummaryRight}>
                <Text style={styles.quickSummaryTotal}>
                  {grandTotal.toFixed(0)} {t('currency', 'common')}
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#94a3b8" />
              </View>
            </TouchableOpacity>
          )}

          {/* Form */}
          <View style={styles.form}>
            {/* Items Section */}
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
              
              {!expandedSections.items && renderItemsMiniSummary()}
              
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
                      <Text style={styles.emptyItemsSubText}>{t('pressButton', 'sales')}</Text>
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
                            <Text style={styles.itemPrice}>{t('price', 'sales')}: {item.unit_price} {t('currency', 'common')}</Text>
                            <View style={styles.quantityControl}>
                              <TouchableOpacity 
                                style={styles.quantityButton}
                                onPress={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                              >
                                <MaterialCommunityIcons name="minus" size={16} color="#ffffff" />
                              </TouchableOpacity>
                              <Text style={styles.quantityText}>{item.quantity}</Text>
                              <TouchableOpacity 
                                style={styles.quantityButton}
                                onPress={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                              >
                                <MaterialCommunityIcons name="plus" size={16} color="#ffffff" />
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.itemTotal}>{t('total', 'sales')}: {item.total_price} {t('currency', 'common')}</Text>
                          </View>
                        </View>
                      ))}
                      
                      <TouchableOpacity 
                        style={styles.addMoreButton}
                        onPress={() => {
                          loadProducts();
                          setShowProductModal(true);
                        }}
                      >
                        <MaterialCommunityIcons name="plus-circle" size={20} color="#10b981" />
                        <Text style={styles.addMoreText}>{t('addMore', 'sales')}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Customer Section */}
            <View style={styles.section}>
              {renderSectionHeader(t('customer', 'sales'), 'customer', 'account')}
              
              {!expandedSections.customer && renderCustomerMiniSummary()}
              
              {expandedSections.customer && (
                <View style={styles.sectionContent}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>{t('customerName', 'sales')}</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="account" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder={t('walkInCustomer', 'sales')}
                        placeholderTextColor="#64748b"
                        value={form.customer_name}
                        onChangeText={(value) => handleInputChange('customer_name', value)}
                      />
                    </View>
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputWrapper, styles.halfWidth]}>
                      <Text style={styles.label}>{t('phone', 'sales')}</Text>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="phone" size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="0912345678"
                          placeholderTextColor="#64748b"
                          keyboardType="phone-pad"
                          value={form.customer_phone}
                          onChangeText={(value) => handleInputChange('customer_phone', value)}
                        />
                      </View>
                    </View>

                    <View style={[styles.inputWrapper, styles.halfWidth]}>
                      <Text style={styles.label}>{t('email', 'common')}</Text>
                      <View style={styles.inputContainer}>
                        <MaterialCommunityIcons name="email" size={20} color="#64748b" style={styles.inputIcon} />
                        <TextInput
                          style={styles.input}
                          placeholder="email@example.com"
                          placeholderTextColor="#64748b"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          value={form.customer_email}
                          onChangeText={(value) => handleInputChange('customer_email', value)}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Payment Section */}
            <View style={styles.section}>
              {renderSectionHeader(t('payment', 'sales'), 'payment', 'cash')}
              
              {!expandedSections.payment && renderPaymentMiniSummary()}
              
              {expandedSections.payment && (
                <View style={styles.sectionContent}>
                  {/* Summary */}
                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('subtotal', 'sales')}:</Text>
                      <Text style={styles.summaryValue}>{totalAmount.toFixed(2)} {t('currency', 'common')}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('discount', 'sales')}:</Text>
                      <TextInput
                        style={styles.summaryInput}
                        value={form.discount}
                        onChangeText={(value) => handleInputChange('discount', value)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#64748b"
                      />
                    </View>

                    {/* Tax Toggle */}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('governmentTax', 'sales')} (15%):</Text>
                      <TouchableOpacity
                        style={[styles.taxToggle, form.tax_enabled && styles.taxToggleActive]}
                        onPress={() => handleInputChange('tax_enabled', !form.tax_enabled)}
                        hitSlop={{ top: 10, left: 10, right: 10, bottom: 10 }}
                      >
                        <MaterialCommunityIcons
                          name={form.tax_enabled ? 'toggle-switch' : 'toggle-switch-off'}
                          size={32}
                          color={form.tax_enabled ? '#10b981' : '#94a3b8'}
                        />
                        <Text style={[styles.taxToggleText, form.tax_enabled && styles.taxToggleTextActive]}>
                          {form.tax_enabled ? t('on', 'common') : t('off', 'common')}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.summaryRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>{t('grandTotal', 'sales')}:</Text>
                      <Text style={styles.totalValue}>{grandTotal.toFixed(2)} {t('currency', 'common')}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>{t('paid', 'common')}:</Text>
                      <TextInput
                        style={styles.summaryInput}
                        value={form.paid_amount}
                        onChangeText={(value) => handleInputChange('paid_amount', value)}
                        keyboardType="numeric"
                        placeholder={grandTotal.toString()}
                        placeholderTextColor="#64748b"
                      />
                    </View>

                    <View style={[styles.summaryRow, styles.dueRow]}>
                      <Text style={styles.dueLabel}>{t('due', 'common')}:</Text>
                      <Text style={[styles.dueValue, dueAmount > 0 ? styles.dueNegative : styles.dueZero]}>
                        {dueAmount.toFixed(2)} {t('currency', 'common')}
                      </Text>
                    </View>

                    <View style={styles.statusBadge}>
                      <MaterialCommunityIcons 
                        name={
                          paymentStatus === 'paid' ? 'check-circle' :
                          paymentStatus === 'partial' ? 'clock' : 'clock-outline'
                        } 
                        size={20} 
                        color={
                          paymentStatus === 'paid' ? '#10b981' :
                          paymentStatus === 'partial' ? '#f59e0b' : '#ef4444'
                        } 
                      />
                      <Text style={[
                        styles.statusText,
                        paymentStatus === 'paid' && styles.statusPaid,
                        paymentStatus === 'partial' && styles.statusPartial,
                        paymentStatus === 'pending' && styles.statusPending,
                      ]}>
                        {paymentStatus === 'paid' && t('paid', 'common')}
                        {paymentStatus === 'partial' && t('partial', 'sales')}
                        {paymentStatus === 'pending' && t('unpaid', 'sales')}
                      </Text>
                    </View>
                  </View>

                  {/* Payment Method */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>{t('paymentMethod', 'sales')}</Text>
                    <View style={styles.paymentMethodContainer}>
                      {[
                        { value: 'cash', label: t('cash', 'sales'), icon: 'cash' },
                        { value: 'card', label: t('card', 'sales'), icon: 'credit-card' },
                        { value: 'bank_transfer', label: t('transfer', 'sales'), icon: 'bank-transfer' },
                        { value: 'other', label: t('other', 'common'), icon: 'dots-horizontal' },
                      ].map((method) => (
                        <TouchableOpacity
                          key={method.value}
                          style={[
                            styles.paymentMethodButton,
                            form.payment_method === method.value && styles.paymentMethodButtonActive,
                          ]}
                          onPress={() => handleInputChange('payment_method', method.value)}
                        >
                          <MaterialCommunityIcons 
                            name={method.icon as any} 
                            size={20} 
                            color={form.payment_method === method.value ? '#ffffff' : '#94a3b8'} 
                          />
                          <Text
                            style={[
                              styles.paymentMethodText,
                              form.payment_method === method.value && styles.paymentMethodTextActive,
                            ]}
                          >
                            {method.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Notes */}
                  <View style={styles.inputWrapper}>
                    <Text style={styles.label}>{t('notes', 'sales')}</Text>
                    <View style={[styles.inputContainer, styles.textAreaContainer]}>
                      <MaterialCommunityIcons name="note-text" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder={t('notesPlaceholder', 'sales')}
                        placeholderTextColor="#64748b"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        value={form.notes}
                        onChangeText={(value) => handleInputChange('notes', value)}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Submit Button - Always visible */}
            <TouchableOpacity
              style={[styles.submitButton, items.length === 0 && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading || items.length === 0}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>{t('saveSale', 'sales')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Product Selection Modal */}
        <Modal
          visible={showProductModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowProductModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('selectProduct', 'sales')}</Text>
                <TouchableOpacity onPress={() => setShowProductModal(false)}>
                  <MaterialCommunityIcons name="close" size={24} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.searchContainer}>
                <MaterialCommunityIcons name="magnify" size={20} color="#64748b" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('searchProduct', 'sales')}
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <FlatList
                data={filteredProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.productItem}
                    onPress={() => addItem(item)}
                  >
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{item.product_name}</Text>
                      <Text style={styles.productCode}>{item.product_code}</Text>
                    </View>
                    <View style={styles.productPrice}>
                      <Text style={styles.priceText}>{item.selling_price} {t('currency', 'common')}</Text>
                      <Text style={styles.stockText}>{t('stock', 'common')}: {item.total_stock}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyListText}>{t('noProducts', 'common')}</Text>
                  </View>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Centered Quantity Modal */}
        <Modal
          visible={showItemModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowItemModal(false)}
        >
          <View style={styles.centeredModalContainer}>
            <View style={styles.centeredQuantityModal}>
              <View style={styles.centeredModalHeader}>
                <MaterialCommunityIcons name="package-variant" size={32} color="#10b981" />
                <Text style={styles.centeredModalTitle}>
                  {editingItem?.product_name}
                </Text>
              </View>
              
              <View style={styles.centeredQuantityControls}>
                <TouchableOpacity 
                  style={styles.centeredQuantityButton}
                  onPress={() => setEditingItem({
                    ...editingItem,
                    quantity: Math.max(1, (editingItem?.quantity || 1) - 1)
                  })}
                >
                  <MaterialCommunityIcons name="minus" size={32} color="#ffffff" />
                </TouchableOpacity>
                
                <View style={styles.centeredQuantityDisplay}>
                  <Text style={styles.centeredQuantityText}>
                    {editingItem?.quantity || 1}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.centeredQuantityButton}
                  onPress={() => setEditingItem({
                    ...editingItem,
                    quantity: (editingItem?.quantity || 1) + 1
                  })}
                >
                  <MaterialCommunityIcons name="plus" size={32} color="#ffffff" />
                </TouchableOpacity>
              </View>

              <View style={styles.centeredPriceInfo}>
                <Text style={styles.centeredUnitPrice}>
                  {t('each', 'sales')} {editingItem?.unit_price} {t('currency', 'common')}
                </Text>
                <Text style={styles.centeredTotalPrice}>
                  {t('total', 'sales')}: {(editingItem?.unit_price || 0) * (editingItem?.quantity || 1)} {t('currency', 'common')}
                </Text>
              </View>

              <View style={styles.centeredModalActions}>
                <TouchableOpacity 
                  style={[styles.centeredModalAction, styles.centeredCancelAction]}
                  onPress={() => {
                    setShowItemModal(false);
                    setEditingItem(null);
                  }}
                >
                  <Text style={styles.centeredCancelActionText}>{t('cancel', 'common')}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.centeredModalAction, styles.centeredSaveAction]}
                  onPress={saveItem}
                >
                  <MaterialCommunityIcons name="check" size={20} color="#ffffff" />
                  <Text style={styles.centeredSaveActionText}>{t('save', 'common')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  progressStepComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  progressText: {
    color: '#64748b',
    fontSize: 12,
  },
  progressTextComplete: {
    color: '#10b981',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  progressLineComplete: {
    backgroundColor: '#10b981',
  },
  quickSummaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  quickSummaryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickSummaryText: {
    color: '#ffffff',
    fontSize: 14,
  },
  quickSummaryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickSummaryTotal: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sectionHeaderActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#10b981',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sectionTitleActive: {
    color: '#10b981',
  },
  sectionContent: {
    padding: 16,
  },
  itemCountBadge: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  itemCountText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  miniSummary: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  miniSummaryText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  addItemButton: {
    padding: 4,
  },
  emptyItems: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
  },
  emptyItemsText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 12,
  },
  emptyItemsSubText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 4,
  },
  itemsList: {
    gap: 12,
  },
  itemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    color: '#94a3b8',
    fontSize: 14,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  addMoreText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minHeight: 56,
  },
  textAreaContainer: {
    minHeight: 100,
  },
  inputIcon: {
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 14,
    paddingRight: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  summaryCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 16,
  },
  summaryInput: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'right',
    minWidth: 80,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 4,
    paddingTop: 12,
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#10b981',
    fontSize: 20,
    fontWeight: 'bold',
  },
  taxToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  taxToggleActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  taxToggleText: {
    color: '#94a3b8',
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '600',
  },
  taxToggleTextActive: {
    color: '#0f5132',
    fontWeight: '800',
  },
  dueRow: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  dueLabel: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  dueValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  dueNegative: {
    color: '#ef4444',
  },
  dueZero: {
    color: '#10b981',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusPaid: {
    color: '#10b981',
  },
  statusPartial: {
    color: '#f59e0b',
  },
  statusPending: {
    color: '#ef4444',
  },
  paymentMethodContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentMethodButton: {
    flex: 1,
    minWidth: 80,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodButtonActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  paymentMethodText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  paymentMethodTextActive: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    marginTop: 5,
    marginBottom: 80,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#4b5563',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a2634',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  searchIcon: {
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 16,
    paddingVertical: 14,
    paddingRight: 12,
  },
  productItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  productCode: {
    color: '#94a3b8',
    fontSize: 14,
  },
  productPrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stockText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  emptyList: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    color: '#64748b',
    fontSize: 16,
  },
  // Centered Modal Styles
  centeredModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centeredQuantityModal: {
    backgroundColor: '#1a2634',
    borderRadius: 24,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  centeredModalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  centeredModalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 12,
  },
  centeredQuantityControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 20,
  },
  centeredQuantityButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
  },
  centeredQuantityDisplay: {
    minWidth: 80,
    alignItems: 'center',
  },
  centeredQuantityText: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  centeredPriceInfo: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  centeredUnitPrice: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  centeredTotalPrice: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  centeredModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  centeredModalAction: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  centeredCancelAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  centeredCancelActionText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '600',
  },
  centeredSaveAction: {
    backgroundColor: '#10b981',
  },
  centeredSaveActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});