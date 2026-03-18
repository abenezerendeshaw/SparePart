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
  TextInput,
} from 'react-native';
import api from '../../lib/api';
import storage from '../../lib/storage';
import { useLanguage } from '../../../context/LanguageContext';

interface Product {
  id: number;
  product_code: string;
  product_name: string;
  description: string;
  category: string;
  brand: string;
  unit: string;
  total_stock: number;
  min_stock: number;
  max_stock: number;
  new_arrival_quantity: number;
  buying_price: number;
  selling_price: number;
  selling_quantity: number;
  profit: number;
  supplier_id: string;
  location: string;
  sync_status: string;
  last_sync_attempt: string;
  marketplace_product_id: string;
  owner_id: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  online_product_id: string;
  status: string;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<{field: string; value: string; label: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (id) {
      fetchProductDetails();
    }
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching product with ID:', id);
      
      // Try ?id= format first since it's working for delete
      try {
        const response = await api.get(`/products?id=${id}`);
        console.log('API Response (?id= format):', response.data);
        
        if (response.data && response.data.status === 'success') {
          setProduct(response.data.data);
          setLoading(false);
          setRefreshing(false);
          return;
        }
      } catch (err) {
        console.log('Failed with ?id= format, trying /:id format');
      }
      
      // Fallback to /id format
      const response = await api.get(`/products/${id}`);
      console.log('API Response (/:id format):', response.data);

      if (response.data && response.data.status === 'success') {
        setProduct(response.data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      
      if (error.response?.status === 404) {
        Alert.alert(
          t('error'), 
          t('notFound', 'productDetail'),
          [
            { 
              text: t('back', 'productDetail'), 
              onPress: () => router.back() 
            }
          ]
        );
      } else if (error.response?.status === 401) {
        Alert.alert(t('error'), t('loginRequired', 'common'));
        router.replace('/auth/login');
      } else {
        Alert.alert(t('error'), error.response?.data?.message || t('error'));
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProductDetails();
  };

  const handleShare = async () => {
    if (!product) return;
    
    try {
      const shareMessage = `
*${product.product_name}* - ${t('title', 'productDetail')}

📋 ${t('categoryBrand', 'productDetail')}:
${t('productCode', 'addProduct')}: ${product.product_code}
${t('category', 'addProduct')}: ${product.category || t('none', 'common')}
${t('brand', 'addProduct')}: ${product.brand || t('none', 'common')}
${t('unit', 'addProduct')}: ${product.unit}

📦 ${t('currentStock', 'productDetail')}:
${t('totalStock', 'addProduct')}: ${product.total_stock} ${product.unit}
${t('minStock', 'addProduct')}: ${product.min_stock} ${product.unit}
${t('maxStock', 'addProduct')}: ${product.max_stock} ${product.unit}
${t('soldQuantity', 'addProduct')}: ${product.selling_quantity} ${product.unit}

💰 ${t('prices', 'productDetail')}:
${t('buyingPrice', 'addProduct')}: ${product.buying_price} ${t('currency', 'common')}
${t('sellingPrice', 'addProduct')}: ${product.selling_price} ${t('currency', 'common')}
${t('profit', 'addProduct')}: ${product.profit} ${t('currency', 'common')}

📍 ${t('location', 'addProduct')}: ${product.location || t('none', 'common')}
${t('supplierId', 'addProduct')}: ${product.supplier_id || t('none', 'common')}

${product.description ? `\n📝 ${t('description', 'addProduct')}:\n${product.description}` : ''}
      `;

      await Share.share({
        message: shareMessage,
        title: product.product_name,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!product) return;
    const isCurrentlyActive = product.status?.toLowerCase() === 'active';
    const newStatus = isCurrentlyActive ? 'inactive' : 'active';
    
    setDeleteLoading(true);
    
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log(`Attempting to ${newStatus} product with ID:`, id);
      
      const response = await api.put(`/products?id=${id}`, { status: newStatus });
      console.log(`${newStatus} response:`, response.data);

      if (response.data && response.data.status === 'success') {
        const successMsg = isCurrentlyActive ? t('inactivateSuccess', 'common') : t('activateSuccess', 'common');
        Alert.alert(
          t('success'), 
          successMsg,
          [
            { 
              text: t('close', 'common'), 
              onPress: () => fetchProductDetails() 
            },
            { 
              text: t('allProducts', 'common'), 
              onPress: () => router.replace('/(tab)/inventory') 
            }
          ]
        );
      } else {
        throw new Error(`${newStatus} failed`);
      }
    } catch (error: any) {
      console.error(`Error ${newStatus}ing product:`, error);
      
      const errorMsg = isCurrentlyActive ? t('inactivateFailed', 'common') : t('activateFailed', 'common');
      let errorMessage = errorMsg;
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('error'), errorMessage);
    } finally {
      setDeleteLoading(false);
      setShowStatusModal(false);
    }
  };

  const handleEdit = (field: string, currentValue: any, label: string) => {
    setEditingField({ field, value: currentValue?.toString() || '', label });
    setEditValue(currentValue?.toString() || '');
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingField || !product) return;

    setShowEditModal(false);
    setLoading(true);

    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      let updatedValue: any = editValue;
      
      // Convert to number for numeric fields
      if (['total_stock', 'min_stock', 'max_stock', 'new_arrival_quantity', 
           'buying_price', 'selling_price', 'selling_quantity', 'profit'].includes(editingField.field)) {
        updatedValue = Number(editValue) || 0;
      }

      const updateData = {
        [editingField.field]: updatedValue
      };

      console.log('Updating product with data:', updateData);
      
      const response = await api.put(`/products?id=${id}`, updateData);
      console.log('Update response:', response.data);

      if (response.data && response.data.status === 'success') {
        await fetchProductDetails();
        Alert.alert(t('success'), `${editingField.label} ${t('updated', 'common')}`);
      } else {
        throw new Error('Update failed');
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      
      let errorMessage = t('updateFailed', 'common');
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert(t('error'), errorMessage);
    } finally {
      setLoading(false);
      setEditingField(null);
    }
  };

  const getStockStatus = () => {
    if (!product) return { color: '#64748b', text: t('none', 'common'), icon: 'help' as const };
    
    if (product.total_stock === 0) {
      return { color: '#ef4444', text: t('outOfStock', 'common'), icon: 'alert-circle' as const };
    } else if (product.total_stock <= product.min_stock) {
      return { color: '#f59e0b', text: t('critical', 'common'), icon: 'alert' as const };
    } else if (product.total_stock <= product.min_stock * 1.5) {
      return { color: '#f59e0b', text: t('low', 'common'), icon: 'alert' as const };
    } else {
      return { color: '#10b981', text: t('normal', 'common'), icon: 'check-circle' as const };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString(t('locale', 'common') || 'en-ET', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>{t('loading', 'common')}</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!product) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={64} color="#ef4444" />
          <Text style={styles.errorText}>{t('notFound', 'productDetail')}</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>{t('back', 'productDetail')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const stockStatus = getStockStatus();

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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.product_name}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleShare}
          >
            <MaterialCommunityIcons name="share" size={22} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerButton, 
              product.status?.toLowerCase() === 'active' ? styles.deleteButton : styles.activateButtonDetail
            ]}
            onPress={() => setShowStatusModal(true)}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator size="small" color={product.status?.toLowerCase() === 'active' ? "#ef4444" : "#10b981"} />
            ) : (
              <MaterialCommunityIcons 
                name={product.status?.toLowerCase() === 'active' ? "archive-arrow-down" : "restore"} 
                size={22} 
                color={product.status?.toLowerCase() === 'active' ? "#ef4444" : "#10b981"} 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Icon */}
      <View style={styles.iconCard}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
          style={styles.iconGradient}
        >
          <MaterialCommunityIcons name="package-variant" size={60} color="#10b981" />
        </LinearGradient>
      </View>

      {/* Basic Info Card */}
      <View style={styles.basicInfoCard}>
        <Text style={styles.productCode}>{product.product_code}</Text>
        <Text style={styles.productName}>{product.product_name}</Text>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${stockStatus.color}20` }]}>
            <MaterialCommunityIcons 
              name={stockStatus.icon} 
              size={16} 
              color={stockStatus.color} 
            />
            <Text style={[styles.statusText, { color: stockStatus.color }]}>
              {stockStatus.text}
            </Text>
          </View>

          <View style={[
            styles.statusBadge, 
            { 
              backgroundColor: product.status?.toLowerCase() === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              borderColor: product.status?.toLowerCase() === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)',
              borderWidth: 1,
              marginLeft: 8 
            }
          ]}>
            <Text style={[
              styles.statusText, 
              { color: product.status?.toLowerCase() === 'active' ? '#10b981' : '#f59e0b' }
            ]}>
              {product.status?.toLowerCase() === 'active' ? t('statusActive', 'common') : t('statusInactive', 'common')}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'details' && styles.activeTab]}
          onPress={() => setActiveTab('details')}
        >
          <MaterialCommunityIcons 
            name="information" 
            size={20} 
            color={activeTab === 'details' ? '#10b981' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'details' && styles.activeTabText]}>
            {t('details', 'addProduct')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'stock' && styles.activeTab]}
          onPress={() => setActiveTab('stock')}
        >
          <MaterialCommunityIcons 
            name="package-variant" 
            size={20} 
            color={activeTab === 'stock' ? '#10b981' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'stock' && styles.activeTabText]}>
            {t('stock', 'addProduct')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pricing' && styles.activeTab]}
          onPress={() => setActiveTab('pricing')}
        >
          <MaterialCommunityIcons 
            name="currency-usd" 
            size={20} 
            color={activeTab === 'pricing' ? '#10b981' : '#64748b'} 
          />
          <Text style={[styles.tabText, activeTab === 'pricing' && styles.activeTabText]}>
            {t('pricing', 'addProduct')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Details Tab */}
        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            {/* Category & Brand */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('category', 'addProduct')} & {t('brand', 'addProduct')}</Text>
              <View style={styles.infoGrid}>
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('category', product.category, t('category', 'addProduct'))}
                >
                  <MaterialCommunityIcons name="shape" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>{t('category', 'addProduct')}</Text>
                  <Text style={styles.infoValue}>{product.category || t('none', 'common')}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('brand', product.brand, t('brand', 'addProduct'))}
                >
                  <MaterialCommunityIcons name="trademark" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>{t('brand', 'addProduct')}</Text>
                  <Text style={styles.infoValue}>{product.brand || t('none', 'common')}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Location & Supplier */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('location', 'addProduct')} & {t('supplierId', 'addProduct')}</Text>
              <View style={styles.infoGrid}>
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('location', product.location, t('location', 'addProduct'))}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>{t('location', 'addProduct')}</Text>
                  <Text style={styles.infoValue}>{product.location || t('none', 'common')}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('supplier_id', product.supplier_id, t('supplierId', 'addProduct'))}
                >
                  <MaterialCommunityIcons name="truck" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>{t('supplierId', 'addProduct')}</Text>
                  <Text style={styles.infoValue}>{product.supplier_id || t('none', 'common')}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Unit */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('unit', 'addProduct')}</Text>
              <TouchableOpacity 
                style={styles.fullWidthCard}
                onPress={() => handleEdit('unit', product.unit, t('unit', 'addProduct'))}
              >
                <MaterialCommunityIcons name="scale" size={20} color="#10b981" />
                <View style={styles.fullWidthContent}>
                  <Text style={styles.fullWidthLabel}>{t('unit', 'addProduct')}</Text>
                  <Text style={styles.fullWidthValue}>{product.unit}</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            {product.description && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('description', 'addProduct')}</Text>
                  <TouchableOpacity onPress={() => handleEdit('description', product.description, t('description', 'addProduct'))}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.description}>{product.description}</Text>
              </View>
            )}
          </View>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <View style={styles.tabContent}>
            {/* Current Stock */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('totalStock', 'addProduct')}</Text>
              <TouchableOpacity 
                style={styles.stockCard}
                onPress={() => handleEdit('total_stock', product.total_stock, t('totalStock', 'addProduct'))}
              >
                <MaterialCommunityIcons name="package-variant" size={24} color="#10b981" />
                <View style={styles.stockCardContent}>
                  <Text style={styles.stockLabel}>{t('totalStock', 'addProduct')}</Text>
                  <Text style={styles.stockValue}>{product.total_stock} {product.unit}</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Stock Limits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('stockLimits', 'common')}</Text>
              <View style={styles.limitsContainer}>
                <TouchableOpacity 
                  style={styles.limitCard}
                  onPress={() => handleEdit('min_stock', product.min_stock, t('minStock', 'addProduct'))}
                >
                  <Text style={styles.limitLabel}>{t('minStock', 'addProduct')}</Text>
                  <Text style={styles.limitValue}>{product.min_stock}</Text>
                  <Text style={styles.limitUnit}>{product.unit}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.limitCard}
                  onPress={() => handleEdit('max_stock', product.max_stock, t('maxStock', 'addProduct'))}
                >
                  <Text style={styles.limitLabel}>{t('maxStock', 'addProduct')}</Text>
                  <Text style={styles.limitValue}>{product.max_stock}</Text>
                  <Text style={styles.limitUnit}>{product.unit}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stock Movement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('stockMovement', 'common')}</Text>
              <View style={styles.movementContainer}>
                <View style={styles.movementCard}>
                  <MaterialCommunityIcons name="package-up" size={20} color="#10b981" />
                  <View>
                    <Text style={styles.movementLabel}>{t('newArrival', 'addProduct')}</Text>
                    <Text style={styles.movementValue}>{product.new_arrival_quantity} {product.unit}</Text>
                  </View>
                </View>
                
                <View style={styles.movementCard}>
                  <MaterialCommunityIcons name="cart" size={20} color="#f59e0b" />
                  <View>
                    <Text style={styles.movementLabel}>{t('soldQuantity', 'addProduct')}</Text>
                    <Text style={styles.movementValue}>{product.selling_quantity} {product.unit}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <View style={styles.tabContent}>
            {/* Prices */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('pricing', 'addProduct')}</Text>
              
              <TouchableOpacity 
                style={styles.priceCard}
                onPress={() => handleEdit('buying_price', product.buying_price, t('buyingPrice', 'addProduct'))}
              >
                <MaterialCommunityIcons name="cash" size={20} color="#64748b" />
                <View style={styles.priceCardContent}>
                  <Text style={styles.priceLabel}>{t('buyingPrice', 'addProduct')}</Text>
                  <Text style={styles.buyingPrice}>{product.buying_price} {t('currency', 'common')}</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.priceCard}
                onPress={() => handleEdit('selling_price', product.selling_price, t('sellingPrice', 'addProduct'))}
              >
                <MaterialCommunityIcons name="cash-multiple" size={20} color="#10b981" />
                <View style={styles.priceCardContent}>
                  <Text style={styles.priceLabel}>{t('sellingPrice', 'addProduct')}</Text>
                  <Text style={styles.sellingPrice}>{product.selling_price} {t('currency', 'common')}</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Profit */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('profit', 'addProduct')}</Text>
              <View style={styles.profitCard}>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>{t('profitPerUnit', 'common')}</Text>
                  <Text style={styles.profitValue}>{product.selling_price - product.buying_price} {t('currency', 'common')}</Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>{t('totalProfit', 'common')}</Text>
                  <Text style={styles.profitTotal}>{product.profit} {t('currency', 'common')}</Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, (product.selling_price / product.buying_price) * 100)}%`,
                        backgroundColor: '#10b981' 
                      }
                    ]} 
                  />
                </View>
                <Text style={styles.marginText}>
                  {((product.selling_price - product.buying_price) / product.buying_price * 100).toFixed(1)}% {t('profitMargin', 'common')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Footer with timestamps */}
        <View style={styles.footer}>
          <Text style={styles.timestamp}>{t('id', 'common')}: {product.id}</Text>
          <Text style={styles.timestamp}>{t('created', 'common')}: {formatDate(product.created_at)}</Text>
          <Text style={styles.timestamp}>{t('updated', 'common')}: {formatDate(product.updated_at)}</Text>
        </View>

        {/* Dynamic Action Button for Active/Inactive Products */}
        <TouchableOpacity
          style={product.status?.toLowerCase() === 'active' ? styles.bigArchiveButton : styles.bigRestoreButton}
          onPress={() => setShowStatusModal(true)}
        >
          <LinearGradient
            colors={product.status?.toLowerCase() === 'active' ? ['#ef4444', '#dc2626'] : ['#10b981', '#059669']}
            style={styles.bigActionGradient}
          >
            <MaterialCommunityIcons 
              name={product.status?.toLowerCase() === 'active' ? "archive-arrow-down-outline" : "restore"} 
              size={24} 
              color="#ffffff" 
            />
            <Text style={styles.bigActionText}>
              {product.status?.toLowerCase() === 'active' ? t('inactivate', 'common') : t('activate', 'common')} {product.product_name}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>

      {/* Status Toggle Confirmation Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.modalContent,
            product.status?.toLowerCase() !== 'active' && { borderColor: '#10b981' }
          ]}>
            <MaterialCommunityIcons 
              name={product.status?.toLowerCase() === 'active' ? "alert" : "information-outline"} 
              size={48} 
              color={product.status?.toLowerCase() === 'active' ? "#ef4444" : "#10b981"} 
            />
            <Text style={styles.modalTitle}>
              {product.status?.toLowerCase() === 'active' ? t('inactivateConfirmTitle', 'common') : t('activateConfirmTitle', 'common')}
            </Text>
            <Text style={styles.modalText}>
              {product.status?.toLowerCase() === 'active' 
                ? t('inactivateConfirmMessage', 'common')
                : t('activateConfirmMessage', 'common')} "{product.product_name}"?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowStatusModal(false)}
                disabled={deleteLoading}
              >
                <Text style={styles.cancelButtonText}>{t('cancel', 'common')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton, 
                  product.status?.toLowerCase() === 'active' ? styles.confirmDeleteButton : styles.saveButton
                ]}
                onPress={handleToggleStatus}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmDeleteText}>
                    {product.status?.toLowerCase() === 'active' ? t('inactivate', 'common') : t('activate', 'common')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Field Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.editModalContent}>
            <Text style={styles.editModalTitle}>
              {t('edit', 'common')} {editingField?.label}
            </Text>
            
            <TextInput
              style={styles.editInput}
              value={editValue}
              onChangeText={setEditValue}
              keyboardType={
                editingField?.field.includes('price') || 
                editingField?.field.includes('stock') || 
                editingField?.field.includes('quantity')
                ? 'numeric' : 'default'
              }
              multiline={editingField?.field === 'description'}
              numberOfLines={editingField?.field === 'description' ? 4 : 1}
              placeholder={`${t('enter', 'common')} ${editingField?.label}`}
              placeholderTextColor="#64748b"
              autoFocus={true}
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowEditModal(false);
                  setEditingField(null);
                }}
              >
                <Text style={styles.cancelButtonText}>{t('cancel', 'common')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={styles.saveButtonText}>{t('save', 'common')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={{ height: 100 }} />
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  activateButtonDetail: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
  iconCard: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  iconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  basicInfoCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#10b981',
    alignItems: 'center',
  },
  productCode: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 4,
  },
  productName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bigRestoreButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bigArchiveButton: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 40,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  bigActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  bigActionText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#10b981',
  },
  tabContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    position: 'relative',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 8,
    marginBottom: 2,
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  editIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  fullWidthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  fullWidthContent: {
    flex: 1,
  },
  fullWidthLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  fullWidthValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#10b981',
    gap: 12,
  },
  stockCardContent: {
    flex: 1,
  },
  stockLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  stockValue: {
    color: '#10b981',
    fontSize: 24,
    fontWeight: 'bold',
  },
  limitsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  limitCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    position: 'relative',
  },
  limitLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 4,
  },
  limitValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  limitUnit: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  movementContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  movementCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  movementLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  movementValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  priceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
    marginBottom: 8,
  },
  priceCardContent: {
    flex: 1,
  },
  priceLabel: {
    color: '#94a3b8',
    fontSize: 12,
    marginBottom: 2,
  },
  buyingPrice: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sellingPrice: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profitCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  profitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profitLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  profitValue: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '600',
  },
  profitTotal: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  marginText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a2634',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  editModalContent: {
    backgroundColor: '#1a2634',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  editModalTitle: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  editInput: {
    backgroundColor: 'rgba(15, 22, 35, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#ffffff',
    fontSize: 16,
    padding: 14,
    marginBottom: 20,
    minHeight: 50,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
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
  saveButton: {
    backgroundColor: '#10b981',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});