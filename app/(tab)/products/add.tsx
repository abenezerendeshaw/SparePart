import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
} from 'react-native';
import api from '../../lib/api';
import storage from '../../lib/storage';
import { useLanguage } from '../../../context/LanguageContext';
import LanguageSwitcher from '../../../components/LanguageSwitcher';

export default function AddProductScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    details: false,
    pricing: false,
    stock: false,
    additional: false,
  });

  const [form, setForm] = useState({
    product_name: '',
    product_code: '',
    description: '',
    category: '',
    brand: '',
    unit: 'pcs',
    total_stock: '',
    min_stock: '',
    max_stock: '',
    new_arrival_quantity: '0',
    buying_price: '',
    selling_price: '',
    selling_quantity: '0',
    profit: '0',
    status: 'active',
  });

  // Track which fields have been filled
  const [filledSections, setFilledSections] = useState({
    basic: false,
    details: false,
    pricing: false,
    stock: false,
    additional: false,
  });

  // Check if basic section is complete
  useEffect(() => {
    if (form.product_name && form.product_code) {
      setFilledSections(prev => ({ ...prev, basic: true }));
      if (expandedSections.basic) {
        setTimeout(() => {
          setExpandedSections(prev => ({ ...prev, basic: false, details: true }));
          scrollToSection('details');
        }, 1000);
      }
    }
  }, [form.product_name, form.product_code]);

  // Check if details section has any input
  useEffect(() => {
    if (form.category || form.brand || form.description || form.unit !== 'pcs') {
      setFilledSections(prev => ({ ...prev, details: true }));
    }
  }, [form.category, form.brand, form.description, form.unit]);

  // Check if pricing section is complete
  useEffect(() => {
    if (form.selling_price && Number(form.selling_price) > 0) {
      setFilledSections(prev => ({ ...prev, pricing: true }));
      if (expandedSections.pricing) {
        setTimeout(() => {
          setExpandedSections(prev => ({ ...prev, pricing: false, stock: true }));
          scrollToSection('stock');
        }, 1000);
      }
    }
  }, [form.selling_price]);

  // Check if stock section has any input
  useEffect(() => {
    if (form.total_stock || form.min_stock || form.max_stock) {
      setFilledSections(prev => ({ ...prev, stock: true }));
    }
  }, [form.total_stock, form.min_stock, form.max_stock]);

  const scrollToSection = (section: string) => {
    setTimeout(() => {
      const sectionPositions: { [key: string]: number } = {
        basic: 0,
        details: 280,
        pricing: 560,
        stock: 840,
        additional: 1120,
      };
      
      scrollViewRef.current?.scrollTo({
        y: sectionPositions[section] || 0,
        animated: true,
      });
    }, 100);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const validateForm = () => {
    if (!form.product_name.trim()) {
      Alert.alert(t('error'), t('productNameRequired', 'addProduct'));
      return false;
    }
    if (!form.product_code.trim()) {
      Alert.alert(t('error'), t('productCodeRequired', 'addProduct'));
      return false;
    }
    if (!form.category.trim()) {
      Alert.alert('ስህተት', 'ምድብ ያስፈልጋል');
      return false;
    }
    if (!form.selling_price || Number(form.selling_price) <= 0) {
      Alert.alert('ስህተት', 'ትክክለኛ የሽያጭ ዋጋ ያስገቡ');
      return false;
    }
    if (!form.buying_price || Number(form.buying_price) <= 0) {
      Alert.alert('ስህተት', 'ትክክለኛ የግዢ ዋጋ ያስገቡ');
      return false;
    }
    return true;
  };

  const calculateProfit = () => {
    const buying = Number(form.buying_price) || 0;
    const selling = Number(form.selling_price) || 0;
    return (selling - buying).toFixed(2);
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

      const profit = calculateProfit();

      const productData = {
        product_name: form.product_name.trim(),
        product_code: form.product_code.trim(),
        category: form.category.trim(),
        brand: form.brand?.trim() || '',
        description: form.description?.trim() || '',
        unit: form.unit || 'pcs',
        total_stock: Number(form.total_stock) || 0,
        min_stock: Number(form.min_stock) || 0,
        max_stock: Number(form.max_stock) || 0,
        new_arrival_quantity: Number(form.new_arrival_quantity) || 0,
        buying_price: Number(form.buying_price) || 0,
        selling_price: Number(form.selling_price),
        selling_quantity: Number(form.selling_quantity) || 0,
        profit: Number(profit) || 0,
        status: form.status || 'active',
      };

      console.log('Sending product data:', productData);

      const response = await api.post('/products', productData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === 'success') {
        Alert.alert(
          t('success'),
          t('successMessage', 'addProduct'),
          [
            {
              text: t('goToProducts', 'addProduct'),
              onPress: () => router.push('/(tab)/products'),
            },
            {
              text: t('addAnother', 'addProduct'),
              onPress: () => {
                setForm({
                  product_name: '',
                  product_code: '',
                  description: '',
                  category: '',
                  brand: '',
                  unit: 'pcs',
                  total_stock: '',
                  min_stock: '',
                  max_stock: '',
                  new_arrival_quantity: '0',
                  buying_price: '',
                  selling_price: '',
                  selling_quantity: '0',
                  profit: '0',
                  status: 'active',
                });
              },
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert(t('error'), response.data.message || t('error'));
      }
    } catch (error: any) {
      console.log('Error adding product:', error);
      
      let errorMessage = t('error');
      
      if (error.response) {
        console.log('Error response:', error.response.data);
        
        if (error.response.status === 400) {
          if (error.response.data.message?.includes('category')) {
            errorMessage = 'ምድብ ያስፈልጋል';
          } else if (error.response.data.message?.includes('buying_price') || 
                     error.response.data.message?.includes('selling_price')) {
            errorMessage = 'ዋጋዎች ከዜሮ በላይ መሆን አለባቸው';
          } else {
            errorMessage = error.response.data.message || 'ያልተሟላ መረጃ';
          }
        } else if (error.response.status === 401) {
          errorMessage = 'እባክዎ እንደገና ይግቡ';
          router.replace('/auth/login');
        } else if (error.response.status === 500) {
          errorMessage = 'የአገልጋይ ስህተት';
        } else {
          errorMessage = error.response.data?.message || `ስህተት ተከስቷል (${error.response.status})`;
        }
      } else if (error.request) {
        errorMessage = 'ከአገልጋይ ጋር መገናኘት አልተቻለም';
      } else {
        errorMessage = error.message;
      }
      
      Alert.alert(t('error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (
    section: keyof typeof expandedSections,
    title: string,
    icon: string,
    children: React.ReactNode,
    isRequired: boolean = false
  ) => {
    const isExpanded = expandedSections[section];
    const isFilled = filledSections[section];

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={[
            styles.sectionHeader, 
            isExpanded && styles.sectionHeaderExpanded,
            isFilled && !isExpanded && styles.sectionHeaderFilled
          ]}
          onPress={() => toggleSection(section)}
          activeOpacity={0.7}
        >
          <View style={styles.sectionHeaderLeft}>
            <View style={[
              styles.sectionIcon, 
              isExpanded && styles.sectionIconExpanded,
              isFilled && !isExpanded && styles.sectionIconFilled
            ]}>
              <MaterialCommunityIcons 
                name={isFilled && !isExpanded ? "check" : icon} 
                size={20} 
                color={isExpanded ? '#10b981' : (isFilled ? '#10b981' : '#64748b')} 
              />
            </View>
            <Text style={[
              styles.sectionTitle, 
              isExpanded && styles.sectionTitleExpanded,
              isFilled && !isExpanded && styles.sectionTitleFilled
            ]}>
              {title}
              {isRequired && <Text style={styles.requiredStar}> *</Text>}
            </Text>
          </View>
          <View style={styles.sectionHeaderRight}>
            {isFilled && !isExpanded && (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>✓</Text>
              </View>
            )}
            <MaterialCommunityIcons 
              name={isExpanded ? 'chevron-up' : 'chevron-down'} 
              size={24} 
              color={isExpanded ? '#10b981' : (isFilled ? '#10b981' : '#64748b')} 
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <Animated.View style={styles.sectionContent}>
            {children}
          </Animated.View>
        )}
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
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('title', 'addProduct')}</Text>
            <LanguageSwitcher />
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressStep, form.product_name && styles.progressStepComplete]}>
              <MaterialCommunityIcons 
                name={form.product_name ? "check" : "tag"} 
                size={14} 
                color={form.product_name ? "#10b981" : "#64748b"} 
              />
            </View>
            <View style={[styles.progressLine, form.product_name && styles.progressLineComplete]} />
            <View style={[styles.progressStep, form.selling_price && styles.progressStepComplete]}>
              <MaterialCommunityIcons 
                name={form.selling_price ? "check" : "currency-usd"} 
                size={14} 
                color={form.selling_price ? "#10b981" : "#64748b"} 
              />
            </View>
            <View style={[styles.progressLine, form.selling_price && styles.progressLineComplete]} />
            <View style={[styles.progressStep, form.total_stock && styles.progressStepComplete]}>
              <MaterialCommunityIcons 
                name={form.total_stock ? "check" : "package-variant"} 
                size={14} 
                color={form.total_stock ? "#10b981" : "#64748b"} 
              />
            </View>
          </View>

          {/* Quick Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons 
                name={form.product_name ? "check-circle" : "circle-outline"} 
                size={16} 
                color={form.product_name ? "#10b981" : "#64748b"} 
              />
              <Text style={[styles.summaryText, form.product_name && styles.summaryTextComplete]}>
                {t('basicInfo', 'addProduct')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons 
                name={form.selling_price ? "check-circle" : "circle-outline"} 
                size={16} 
                color={form.selling_price ? "#10b981" : "#64748b"} 
              />
              <Text style={[styles.summaryText, form.selling_price && styles.summaryTextComplete]}>
                {t('pricing', 'addProduct')}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <MaterialCommunityIcons 
                name={form.total_stock ? "check-circle" : "circle-outline"} 
                size={16} 
                color={form.total_stock ? "#10b981" : "#64748b"} 
              />
              <Text style={[styles.summaryText, form.total_stock && styles.summaryTextComplete]}>
                {t('stock', 'addProduct')}
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Basic Information Section */}
            {renderSection('basic', t('basicInfo', 'addProduct'), 'information', (
              <>
                {/* Product Name */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{t('productName', 'addProduct')} *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="tag-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('productNamePlaceholder', 'addProduct')}
                      placeholderTextColor="#64748b"
                      value={form.product_name}
                      onChangeText={(value) => handleInputChange('product_name', value)}
                    />
                  </View>
                </View>

                {/* Product Code */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{t('productCode', 'addProduct')} *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="barcode" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('productCodePlaceholder', 'addProduct')}
                      placeholderTextColor="#64748b"
                      value={form.product_code}
                      onChangeText={(value) => handleInputChange('product_code', value)}
                    />
                  </View>
                </View>
              </>
            ), true)}

            {/* Details Section */}
            {renderSection('details', t('details', 'addProduct'), 'text-box', (
              <>
                {/* Category */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{t('category', 'addProduct')} *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="shape-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('categoryPlaceholder', 'addProduct')}
                      placeholderTextColor="#64748b"
                      value={form.category}
                      onChangeText={(value) => handleInputChange('category', value)}
                    />
                  </View>
                </View>

                {/* Brand */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{t('brand', 'addProduct')}</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="trademark" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('brandPlaceholder', 'addProduct')}
                      placeholderTextColor="#64748b"
                      value={form.brand}
                      onChangeText={(value) => handleInputChange('brand', value)}
                    />
                  </View>
                </View>

                {/* Unit */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{t('unit', 'addProduct')}</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="scale" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t('unitPlaceholder', 'addProduct')}
                      placeholderTextColor="#64748b"
                      value={form.unit}
                      onChangeText={(value) => handleInputChange('unit', value)}
                    />
                  </View>
                </View>

                {/* Description */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{t('description', 'addProduct')}</Text>
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <MaterialCommunityIcons name="text-box-outline" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder={t('descriptionPlaceholder', 'addProduct')}
                      placeholderTextColor="#64748b"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={form.description}
                      onChangeText={(value) => handleInputChange('description', value)}
                    />
                  </View>
                </View>
              </>
            ))}

            {/* Pricing Section */}
            {renderSection('pricing', t('pricing', 'addProduct'), 'currency-usd', (
              <>
                {/* Price Row */}
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, styles.halfWidth]}>
                    <Text style={styles.label}>{t('buyingPrice', 'addProduct')} *</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="cash-minus" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={form.buying_price}
                        onChangeText={(value) => {
                          setForm(prev => ({
                            ...prev,
                            buying_price: value,
                            profit: ((Number(prev.selling_price) || 0) - (Number(value) || 0)).toString()
                          }));
                        }}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputWrapper, styles.halfWidth]}>
                    <Text style={styles.label}>{t('sellingPrice', 'addProduct')} *</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="cash-plus" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={form.selling_price}
                        onChangeText={(value) => {
                          setForm(prev => ({
                            ...prev,
                            selling_price: value,
                            profit: ((Number(value) || 0) - (Number(prev.buying_price) || 0)).toString()
                          }));
                        }}
                      />
                    </View>
                  </View>
                </View>

                {/* Profit Display */}
                {(form.buying_price || form.selling_price) && (
                  <View style={styles.profitContainer}>
                    <MaterialCommunityIcons name="trending-up" size={20} color="#10b981" />
                    <Text style={styles.profitText}>
                      {t('profit', 'addProduct')}: {calculateProfit()} {t('currency', 'common')}
                    </Text>
                    <Text style={styles.profitPercent}>
                      ({Number(form.buying_price) > 0 
                        ? ((Number(form.selling_price || 0) - Number(form.buying_price)) / Number(form.buying_price) * 100).toFixed(1)
                        : '0.0'}%)
                    </Text>
                  </View>
                )}
              </>
            ), true)}

            {/* Stock Management Section */}
            {renderSection('stock', t('stock', 'addProduct'), 'package-variant', (
              <>
                {/* Total Stock */}
                <View style={styles.inputWrapper}>
                  <Text style={styles.label}>{t('totalStock', 'addProduct')}</Text>
                  <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="package-variant" size={20} color="#64748b" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={form.total_stock}
                      onChangeText={(value) => handleInputChange('total_stock', value)}
                    />
                  </View>
                </View>

                {/* Min and Max Stock */}
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, styles.halfWidth]}>
                    <Text style={styles.label}>{t('minStock', 'addProduct')}</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="arrow-down-circle" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={form.min_stock}
                        onChangeText={(value) => handleInputChange('min_stock', value)}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputWrapper, styles.halfWidth]}>
                    <Text style={styles.label}>{t('maxStock', 'addProduct')}</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="arrow-up-circle" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={form.max_stock}
                        onChangeText={(value) => handleInputChange('max_stock', value)}
                      />
                    </View>
                  </View>
                </View>

                {/* Stock Movement */}
                <View style={styles.row}>
                  <View style={[styles.inputWrapper, styles.halfWidth]}>
                    <Text style={styles.label}>{t('newArrival', 'addProduct')}</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="package-up" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={form.new_arrival_quantity}
                        onChangeText={(value) => handleInputChange('new_arrival_quantity', value)}
                      />
                    </View>
                  </View>

                  <View style={[styles.inputWrapper, styles.halfWidth]}>
                    <Text style={styles.label}>{t('soldQuantity', 'addProduct')}</Text>
                    <View style={styles.inputContainer}>
                      <MaterialCommunityIcons name="cart" size={20} color="#64748b" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="0"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={form.selling_quantity}
                        onChangeText={(value) => handleInputChange('selling_quantity', value)}
                      />
                    </View>
                  </View>
                </View>
              </>
            ))}

            {/* Additional Section - Status */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIcon}>
                    <MaterialCommunityIcons name="toggle-switch" size={20} color="#64748b" />
                  </View>
                  <Text style={styles.sectionTitle}>{t('status', 'addProduct')}</Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                <View style={styles.statusContainer}>
                  <TouchableOpacity
                    style={[styles.statusOption, form.status === 'active' && styles.statusOptionActive]}
                    onPress={() => handleInputChange('status', 'active')}
                  >
                    <MaterialCommunityIcons 
                      name="check-circle" 
                      size={16} 
                      color={form.status === 'active' ? '#10b981' : '#64748b'} 
                    />
                    <Text style={[styles.statusOptionText, form.status === 'active' && styles.statusOptionTextActive]}>
                      {t('active', 'addProduct')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.statusOption,   form.status === 'inactive' && styles.statusOptionInactive]}
                    onPress={() => handleInputChange('status', 'inactive')}
                  >
                    <MaterialCommunityIcons 
                      name="close-circle" 
                      size={16} 
                      color={form.status === 'inactive' ? '#ef4444' : '#64748b'} 
                    />
                    <Text style={[styles.statusOptionText, form.status === 'inactive' && styles.statusOptionTextInactive]}>
                      {t('inactive', 'addProduct')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitButton, styles.MBUTON, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>{t('addProduct', 'addProduct')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressStepComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  progressLine: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 5,
  },
  progressLineComplete: {
    backgroundColor: '#10b981',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  summaryText: {
    color: '#64748b',
    fontSize: 12,
  },
  summaryTextComplete: {
    color: '#10b981',
  },
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 12,
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
  sectionHeaderExpanded: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderBottomWidth: 1,
    borderBottomColor: '#10b981',
  },
  sectionHeaderFilled: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIconExpanded: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  sectionIconFilled: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sectionTitleExpanded: {
    color: '#10b981',
  },
  sectionTitleFilled: {
    color: '#10b981',
  },
  sectionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionContent: {
    padding: 16,
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
  requiredStar: {
    color: '#ef4444',
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
  profitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  },
  profitText: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  profitPercent: {
    color: '#94a3b8',
    fontSize: 14,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 8,
  },

  MBUTON:{
    marginBottom: 80,
  },

  statusOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10b981',
  },
  statusOptionInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
  },
  statusOptionText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  statusOptionTextActive: {
    color: '#10b981',
  },
  statusOptionTextInactive: {
    color: '#ef4444',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 18,
    borderRadius: 16,
    gap: 8,
    marginTop: 24,
    marginBottom: 20,
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
});