import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLanguage } from '../../context/LanguageContext';
import events from '../lib/events';
import { createExpense, deleteExpense, listExpenses, updateExpense } from '../lib/expensesApi';
import storage from '../lib/storage';

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: string | number;
  expense_date: string;
}

const CATEGORIES = ['Rent', 'Utilities', 'Salaries', 'Marketing', 'Other'];

export default function ExpensesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [category, setCategory] = useState('Rent');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useFocusEffect(
    useCallback(() => {
      fetchExpenses();
    }, [])
  );

  const fetchExpenses = async () => {
    try {
      const token = await storage.getItem('authToken');
      if (!token) {
        router.replace('/auth/login');
        return;
      }

      const data = await listExpenses();
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      let msg = error?.response?.data?.message || error?.message || t('dataLoadFailed', 'common');
      Alert.alert(t('error'), msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpenses();
  };

  const resetForm = () => {
    setCategory('Rent');
    setAmount('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setEditingId(null);
  };

  const handleAddExpense = () => {
    resetForm();
    setModalVisible(true);
  };

  const handleEditExpense = (expense: Expense) => {
    
    // Ensure date is in YYYY-MM-DD format (backend returns DATE string)
    let expenseDate = expense.expense_date;
    // If it includes time, extract only the date part
    if (expenseDate.includes('T')) {
      expenseDate = expenseDate.split('T')[0];
    }
    setEditingId(expense.id);
    setCategory(expense.category);
    setAmount(expense.amount.toString());
    setDescription(expense.description || '');
    setDate(expenseDate);
    setModalVisible(true);
  };

  const validateDate = (dateStr: string): boolean => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleSubmit = async () => {
    // Validation
    if (!amount || isNaN(Number(amount))) {
      Alert.alert(t('error'), t('validSellingPrice', 'addProduct'));
      return;
    }
    if (!validateDate(date)) {
      Alert.alert(t('error'), 'Invalid date format. Use YYYY-MM-DD');
      return;
    }
    if (!category) {
      Alert.alert(t('error'), 'Please select a category');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        category,
        amount: Number(amount),
        description: description.trim() || null,
        expense_date: date,
      };

      console.log(`Saving expense: ${editingId ? 'PUT' : 'POST'}`, editingId, payload);

      if (editingId) {
        await updateExpense(editingId, payload);
        Alert.alert(t('success'), 'Expense updated');
      } else {
        await createExpense(payload as any);
        Alert.alert(t('success'), 'Expense added');
      }
      setModalVisible(false);
      await fetchExpenses();
      events.emit('expensesChanged');
    } catch (error: any) {
      console.error('Error saving expense:', error);
      console.log('Error response:', error?.response?.data);
      let msg = error?.response?.data?.message || error?.message || 'Failed to save expense';
      Alert.alert(t('error'), msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = (id: number) => {
    Alert.alert(
      t('deleteConfirmTitle', 'expenses'),
      t('deleteConfirmMessage', 'expenses'),
      [
        { text: t('cancel', 'common'), style: 'cancel' },
        {
          text: t('delete', 'common'),
          style: 'destructive',
              onPress: async () => {
                try {
                  await deleteExpense(id);
                  await fetchExpenses();
                  events.emit('expensesChanged');
                } catch (error: any) {
                  console.error('Error deleting expense:', error);
                  console.log('Delete error response:', error?.response?.data);
                  let msg = error?.response?.data?.message || error?.message || 'Failed to delete expense';
                  Alert.alert(t('error'), msg);
                }
              },
        },
      ]
    );
  };

  const totalExpenseAmount = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Rent': return 'home-city';
      case 'Utilities': return 'flash';
      case 'Salaries': return 'account-group';
      case 'Marketing': return 'bullhorn';
      default: return 'credit-card-outline';
    }
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseIconContainer}>
        <MaterialCommunityIcons name={getCategoryIcon(item.category)} size={24} color="#10b981" />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseCategory}>{t(item.category.toLowerCase(), 'expenses')}</Text>
        <Text style={styles.expenseDate}>{item.expense_date}</Text>
        {item.description ? <Text style={styles.expenseDesc}>{item.description}</Text> : null}
      </View>
      <View style={styles.expenseAmountContainer}>
        <Text style={styles.expenseAmount}>- {t('currency', 'common')} {Number(item.amount).toLocaleString()}</Text>
        <View style={styles.expenseActions}>
          <TouchableOpacity onPress={() => handleEditExpense(item)} style={styles.actionButton}>
            <MaterialCommunityIcons name="pencil" size={18} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} style={styles.actionButton}>
            <MaterialCommunityIcons name="delete" size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
        <ActivityIndicator size="large" color="#10b981" style={{ flex: 1, justifyContent: 'center' }} />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f1623', '#1a2634']} style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('title', 'expenses')}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
          <MaterialCommunityIcons name="plus-circle" size={28} color="#10b981" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <LinearGradient colors={['#ef4444', '#991b1b']} style={styles.summaryGradient}>
          <Text style={styles.summaryLabel}>{t('totalExpenses', 'expenses')}</Text>
          <Text style={styles.summaryValue}>{t('currency', 'common')} {totalExpenseAmount.toLocaleString()}</Text>
        </LinearGradient>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="cash-remove" size={64} color="#334155" />
            <Text style={styles.emptyText}>No expenses found</Text>
          </View>
        }
      />

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? t('editExpense', 'expenses') : t('addExpense', 'expenses')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>{t('expenseCategory', 'expenses')}</Text>
              <View style={styles.categoryPicker}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.selectedCategoryChip]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.selectedCategoryChipText]}>
                      {t(cat.toLowerCase(), 'expenses')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>{t('amount', 'addProduct')}</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>{t('expenseDate', 'expenses')} (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="2024-03-30"
                placeholderTextColor="#64748b"
              />

              <Text style={styles.label}>{t('expenseDescription', 'expenses')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholder="Details..."
                placeholderTextColor="#64748b"
              />

              <TouchableOpacity
                style={[styles.submitButton, submitting && styles.disabledButton]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('confirm', 'common')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  // ... (keep your existing styles)
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
  disabledButton: {
    opacity: 0.6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  addButton: {
    padding: 4,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  summaryGradient: {
    padding: 24,
    alignItems: 'center',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  summaryValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  expenseCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  expenseDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  expenseDesc: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 4,
  },
  expenseAmountContainer: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '700',
  },
  expenseActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    marginLeft: 12,
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    marginTop: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a2634',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  form: {
    marginBottom: 20,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 16,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  selectedCategoryChip: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  selectedCategoryChipText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#10b981',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});