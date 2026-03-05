import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
} from 'react-native';
import api from '../../lib/api';
import storage from '../../lib/storage';

export default function AddProductScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    product_name: '',
    product_code: '',
    category: '',
    description: '',
    buying_price: '',
    selling_price: '',
    total_stock: '',
    unit: 'pcs',
    reorder_level: '5',
  });

  const handleInputChange = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const validateForm = () => {
    if (!form.product_name.trim()) {
      Alert.alert('ስህተት', 'የምርት ስም ያስፈልጋል');
      return false;
    }
    if (!form.product_code.trim()) {
      Alert.alert('ስህተት', 'የምርት ኮድ ያስፈልጋል');
      return false;
    }
    if (!form.selling_price || Number(form.selling_price) <= 0) {
      Alert.alert('ስህተት', 'ትክክለኛ የሽያጭ ዋጋ ያስገቡ');
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

      const productData = {
        ...form,
        buying_price: Number(form.buying_price) || 0,
        selling_price: Number(form.selling_price),
        total_stock: Number(form.total_stock) || 0,
        reorder_level: Number(form.reorder_level) || 5,
      };

      const response = await api.post('/products', productData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.status === 'success') {
        Alert.alert(
          'ተሳክቷል',
          'ምርት በተሳካ ሁኔታ ተጨምሯል',
          [
            {
              text: 'ወደ ምርቶች ይሂዱ',
              onPress: () => router.push('/(tab)/products'),
            },
            {
              text: 'ሌላ ጨምር',
              onPress: () => {
                setForm({
                  product_name: '',
                  product_code: '',
                  category: '',
                  description: '',
                  buying_price: '',
                  selling_price: '',
                  total_stock: '',
                  unit: 'pcs',
                  reorder_level: '5',
                });
              },
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('ስህተት', response.data.message || 'ምርት መጨመር አልተሳካም');
      }
    } catch (error: any) {
      console.log('Error adding product:', error);
      Alert.alert('ስህተት', error.response?.data?.message || 'እባክዎ እንደገና ይሞክሩ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0f1623" />
        
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>አዲስ ምርት ጨምር</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Product Name */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>የምርት ስም *</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="tag-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ለምሳሌ: ብሬክ ፓድ"
                  placeholderTextColor="#64748b"
                  value={form.product_name}
                  onChangeText={(value) => handleInputChange('product_name', value)}
                />
              </View>
            </View>

            {/* Product Code */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>የምርት ኮድ *</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="barcode" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="BP-001"
                  placeholderTextColor="#64748b"
                  value={form.product_code}
                  onChangeText={(value) => handleInputChange('product_code', value)}
                />
              </View>
            </View>

            {/* Category */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>ምድብ</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="shape-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ለምሳሌ: ብሬክ ሲስተም"
                  placeholderTextColor="#64748b"
                  value={form.category}
                  onChangeText={(value) => handleInputChange('category', value)}
                />
              </View>
            </View>

            {/* Description */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>መግለጫ</Text>
              <View style={[styles.inputContainer, styles.textAreaContainer]}>
                <MaterialCommunityIcons name="text-box-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="ስለ ምርቱ ዝርዝር መረጃ..."
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={form.description}
                  onChangeText={(value) => handleInputChange('description', value)}
                />
              </View>
            </View>

            {/* Price Row */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>የግዢ ዋጋ</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={form.buying_price}
                    onChangeText={(value) => handleInputChange('buying_price', value)}
                  />
                </View>
              </View>

              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>የሽያጭ ዋጋ *</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="currency-usd" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={form.selling_price}
                    onChangeText={(value) => handleInputChange('selling_price', value)}
                  />
                </View>
              </View>
            </View>

            {/* Stock Row */}
            <View style={styles.row}>
              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>የክምችት ብዛት</Text>
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

              <View style={[styles.inputWrapper, styles.halfWidth]}>
                <Text style={styles.label}>መለኪያ</Text>
                <View style={styles.inputContainer}>
                  <MaterialCommunityIcons name="scale" size={20} color="#64748b" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="pcs"
                    placeholderTextColor="#64748b"
                    value={form.unit}
                    onChangeText={(value) => handleInputChange('unit', value)}
                  />
                </View>
              </View>
            </View>

            {/* Reorder Level */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>ዳግም ማዘዣ ደረጃ</Text>
              <View style={styles.inputContainer}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="5"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={form.reorder_level}
                  onChangeText={(value) => handleInputChange('reorder_level', value)}
                />
              </View>
              <Text style={styles.hintText}>ከዚህ በታች ሲደርስ ያሳውቀኛል</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <MaterialCommunityIcons name="check-circle" size={20} color="#ffffff" />
                  <Text style={styles.submitButtonText}>ምርቱን ጨምር</Text>
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
  form: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  hintText: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 24,
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});