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
  status: string;
  sync_status: string;
  last_sync_attempt: string;
  marketplace_product_id: string;
  owner_id: number;
  created_by: number;
  updated_by: number;
  created_at: string;
  updated_at: string;
  online_product_id: string;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingField, setEditingField] = useState<{field: string; value: string; label: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'stock', 'pricing'

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      console.log('Fetching product with ID:', id);
      
      // FIXED: Use query parameter format: ?id=51 instead of /51
      const response = await api.get(`/products?id=${id}`);

      console.log('API Response:', response.data);

      // Check the response structure from your API
      if (response.data.status === 'success') {
        setProduct(response.data.data);
      } else {
        Alert.alert('ስህተት', 'የምርት ዝርዝሮችን ማምጣት አልተሳካም');
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      
      if (error.response?.status === 404) {
        Alert.alert('ስህተት', 'ምርት አልተገኘም');
      } else if (error.response?.status === 401) {
        Alert.alert('ስህተት', 'እባክዎ እንደገና ይግቡ');
        router.replace('/auth/login');
      } else {
        Alert.alert('ስህተት', error.response?.data?.message || 'የምርት ዝርዝሮችን ማምጣት አልተሳካም');
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
*${product.product_name}* - የምርት ዝርዝሮች

📋 መረጃ:
ኮድ: ${product.product_code}
ምድብ: ${product.category || 'የለም'}
ብራንድ: ${product.brand || 'የለም'}
መለኪያ: ${product.unit}

📦 ክምችት:
አጠቃላይ: ${product.total_stock} ${product.unit}
ዝቅተኛ: ${product.min_stock} ${product.unit}
ከፍተኛ: ${product.max_stock} ${product.unit}
የተሸጠ: ${product.selling_quantity} ${product.unit}

💰 ዋጋ:
የግዢ: ${product.buying_price} ብር
የሽያጭ: ${product.selling_price} ብር
ትርፍ: ${product.profit} ብር

📍 መገኛ: ${product.location || 'ያልተመዘገበ'}
አቅራቢ: ${product.supplier_id || 'የለም'}
ሁኔታ: ${product.status === 'active' ? 'ንቁ' : 'የተቋረጠ'}

${product.description ? `\n📝 መግለጫ:\n${product.description}` : ''}
      `;

      await Share.share({
        message: shareMessage,
        title: product.product_name,
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
      const response = await api.delete(`/products?id=${id}`);

      if (response.data.status === 'success') {
        Alert.alert('ተሳክቷል', 'ምርት በተሳካ ሁኔታ ተሰርዟል');
        router.back();
      }
    } catch (error: any) {
      console.error('Error deleting product:', error);
      Alert.alert('ስህተት', error.response?.data?.message || 'ምርት መሰረዝ አልተሳካም');
    } finally {
      setLoading(false);
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
        [editingField.field]: updatedValue,
        updated_at: new Date().toISOString(),
      };

      // FIXED: Use query parameter format
      const response = await api.put(`/products?id=${id}`, updateData);

      if (response.data.status === 'success') {
        // Refresh product details
        await fetchProductDetails();
        Alert.alert('ተሳክቷል', `${editingField.label} በተሳካ ሁኔታ ተሻሽሏል`);
      }
    } catch (error: any) {
      console.error('Error updating product:', error);
      Alert.alert('ስህተት', error.response?.data?.message || 'ምርት ማሻሻል አልተሳካም');
    } finally {
      setLoading(false);
      setEditingField(null);
    }
  };

  const getStockStatus = () => {
    if (!product) return { color: '#64748b', text: 'የለም', icon: 'help' };
    
    if (product.total_stock === 0) {
      return { color: '#ef4444', text: 'ያለቀበት', icon: 'alert-circle' };
    } else if (product.total_stock <= product.min_stock) {
      return { color: '#f59e0b', text: 'አጣዳፊ', icon: 'alert' };
    } else if (product.total_stock <= product.min_stock * 1.5) {
      return { color: '#f59e0b', text: 'ዝቅተኛ', icon: 'alert' };
    } else {
      return { color: '#10b981', text: 'መደበኛ', icon: 'check-circle' };
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ET', {
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
          <Text style={styles.loadingText}>በመጫን ላይ...</Text>
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
          <Text style={styles.errorText}>ምርት አልተገኘም</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>ተመለስ</Text>
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
            style={[styles.headerButton, styles.deleteButton]}
            onPress={() => setShowDeleteModal(true)}
          >
            <MaterialCommunityIcons name="delete" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Image/Icon */}
      <View style={styles.imageContainer}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.2)', 'rgba(16, 185, 129, 0.05)']}
          style={styles.imageGradient}
        >
          <MaterialCommunityIcons name="package-variant" size={80} color="#10b981" />
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
          
          <View style={[styles.statusBadge, { 
            backgroundColor: product.status === 'active' ? '#10b98120' : '#ef444420' 
          }]}>
            <MaterialCommunityIcons 
              name={product.status === 'active' ? 'check-circle' : 'close-circle'} 
              size={16} 
              color={product.status === 'active' ? '#10b981' : '#ef4444'} 
            />
            <Text style={[styles.statusText, { 
              color: product.status === 'active' ? '#10b981' : '#ef4444' 
            }]}>
              {product.status === 'active' ? 'ንቁ' : 'የተቋረጠ'}
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
            ዝርዝሮች
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
            ክምችት
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
            ዋጋ
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
      >
        {/* Details Tab */}
        {activeTab === 'details' && (
          <View style={styles.tabContent}>
            {/* Category & Brand */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ምድብ እና ብራንድ</Text>
              <View style={styles.infoGrid}>
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('category', product.category, 'ምድብ')}
                >
                  <MaterialCommunityIcons name="shape" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>ምድብ</Text>
                  <Text style={styles.infoValue}>{product.category || 'የለም'}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('brand', product.brand, 'ብራንድ')}
                >
                  <MaterialCommunityIcons name="trademark" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>ብራንድ</Text>
                  <Text style={styles.infoValue}>{product.brand || 'የለም'}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Location & Supplier */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>መገኛ እና አቅራቢ</Text>
              <View style={styles.infoGrid}>
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('location', product.location, 'መገኛ')}
                >
                  <MaterialCommunityIcons name="map-marker" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>መገኛ</Text>
                  <Text style={styles.infoValue}>{product.location || 'የለም'}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.infoCard}
                  onPress={() => handleEdit('supplier_id', product.supplier_id, 'አቅራቢ')}
                >
                  <MaterialCommunityIcons name="truck" size={20} color="#10b981" />
                  <Text style={styles.infoLabel}>አቅራቢ</Text>
                  <Text style={styles.infoValue}>{product.supplier_id || 'የለም'}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Unit */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>መለኪያ</Text>
              <TouchableOpacity 
                style={styles.fullWidthCard}
                onPress={() => handleEdit('unit', product.unit, 'መለኪያ')}
              >
                <MaterialCommunityIcons name="scale" size={20} color="#10b981" />
                <View style={styles.fullWidthContent}>
                  <Text style={styles.fullWidthLabel}>መለኪያ</Text>
                  <Text style={styles.fullWidthValue}>{product.unit}</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Description */}
            {product.description && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>መግለጫ</Text>
                  <TouchableOpacity onPress={() => handleEdit('description', product.description, 'መግለጫ')}>
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
              <Text style={styles.sectionTitle}>አሁን ያለ ክምችት</Text>
              <TouchableOpacity 
                style={styles.stockCard}
                onPress={() => handleEdit('total_stock', product.total_stock, 'አጠቃላይ ክምችት')}
              >
                <MaterialCommunityIcons name="package-variant" size={24} color="#10b981" />
                <View style={styles.stockCardContent}>
                  <Text style={styles.stockLabel}>አጠቃላይ ክምችት</Text>
                  <Text style={styles.stockValue}>{product.total_stock} {product.unit}</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Stock Limits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>የክምችት ገደቦች</Text>
              <View style={styles.limitsContainer}>
                <TouchableOpacity 
                  style={styles.limitCard}
                  onPress={() => handleEdit('min_stock', product.min_stock, 'ዝቅተኛ ክምችት')}
                >
                  <Text style={styles.limitLabel}>ዝቅተኛ</Text>
                  <Text style={styles.limitValue}>{product.min_stock}</Text>
                  <Text style={styles.limitUnit}>{product.unit}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.limitCard}
                  onPress={() => handleEdit('max_stock', product.max_stock, 'ከፍተኛ ክምችት')}
                >
                  <Text style={styles.limitLabel}>ከፍተኛ</Text>
                  <Text style={styles.limitValue}>{product.max_stock}</Text>
                  <Text style={styles.limitUnit}>{product.unit}</Text>
                  <MaterialCommunityIcons name="pencil" size={14} color="#64748b" style={styles.editIcon} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Stock Movement */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>የክምችት እንቅስቃሴ</Text>
              <View style={styles.movementContainer}>
                <View style={styles.movementCard}>
                  <MaterialCommunityIcons name="package-up" size={20} color="#10b981" />
                  <View>
                    <Text style={styles.movementLabel}>አዲስ የደረሰ</Text>
                    <Text style={styles.movementValue}>{product.new_arrival_quantity} {product.unit}</Text>
                  </View>
                </View>
                
                <View style={styles.movementCard}>
                  <MaterialCommunityIcons name="cart" size={20} color="#f59e0b" />
                  <View>
                    <Text style={styles.movementLabel}>የተሸጠ</Text>
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
              <Text style={styles.sectionTitle}>ዋጋዎች</Text>
              
              <TouchableOpacity 
                style={styles.priceCard}
                onPress={() => handleEdit('buying_price', product.buying_price, 'የግዢ ዋጋ')}
              >
                <MaterialCommunityIcons name="cash" size={20} color="#64748b" />
                <View style={styles.priceCardContent}>
                  <Text style={styles.priceLabel}>የግዢ ዋጋ</Text>
                  <Text style={styles.buyingPrice}>{product.buying_price} ብር</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.priceCard}
                onPress={() => handleEdit('selling_price', product.selling_price, 'የሽያጭ ዋጋ')}
              >
                <MaterialCommunityIcons name="cash-multiple" size={20} color="#10b981" />
                <View style={styles.priceCardContent}>
                  <Text style={styles.priceLabel}>የሽያጭ ዋጋ</Text>
                  <Text style={styles.sellingPrice}>{product.selling_price} ብር</Text>
                </View>
                <MaterialCommunityIcons name="pencil" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Profit */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ትርፍ</Text>
              <View style={styles.profitCard}>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>ትርፍ በአንዱ</Text>
                  <Text style={styles.profitValue}>{product.selling_price - product.buying_price} ብር</Text>
                </View>
                <View style={styles.profitRow}>
                  <Text style={styles.profitLabel}>ጠቅላላ ትርፍ</Text>
                  <Text style={styles.profitTotal}>{product.profit} ብር</Text>
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
                  {((product.selling_price - product.buying_price) / product.buying_price * 100).toFixed(1)}% ትርፍ
                </Text>
              </View>
            </View>
          </View>
        )}




                {/* Footer with timestamps */}
        <View style={styles.footer}>
  
          <Text style={styles.timestamp}>መለያ ቁጥር: {product.id}</Text>
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
            <Text style={styles.modalTitle}>ምርት ሰርዝ?</Text>
            <Text style={styles.modalText}>
              "{product.product_name}" የሚል ምርት መሰረዝ ይፈልጋሉ? ይህ ድርጊት ሊቀለበስ አይችልም።
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
              {editingField?.label} አርትዕ
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
              placeholder={`አዲስ ዋጋ ያስገቡ`}
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
                <Text style={styles.cancelButtonText}>ሰርዝ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEdit}
              >
                <Text style={styles.saveButtonText}>አስቀምጥ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Styles remain exactly the same as your original
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
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#10b981',
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
    marginBottom:100,
    alignItems: 'center',
  },
  timestamp: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 4,
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
    paddingVertical: 14,
    borderRadius: 12,
  },
  editButton: {
    backgroundColor: '#3b82f6',
  },
  stockButton: {
    backgroundColor: '#f59e0b',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
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