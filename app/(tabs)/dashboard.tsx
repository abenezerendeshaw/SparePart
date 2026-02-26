import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from './lib/api';

export default function Dashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/login');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${token}` } };

      const productsRes = await api.get('/products', config);
      const salesRes = await api.get('/sales', config);

      console.log('Products Response:', productsRes.data);
      console.log('Sales Response:', salesRes.data);

      setProducts(productsRes.data.data?.products || []);
      setSales(salesRes.data.data?.sales || []);
    } catch (error: any) {
      console.log('Fetch Error:', error.response || error);
      Alert.alert('Error', 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, item) => sum + Number(item.total_stock), 0);
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.grand_total), 0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Products</Text>
          <Text style={styles.cardValue}>{totalProducts}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Total Stock</Text>
          <Text style={styles.cardValue}>{totalStock}</Text>
        </View>
      </View>

      <View style={styles.cardRow}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sales</Text>
          <Text style={styles.cardValue}>{totalSales}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Revenue</Text>
          <Text style={styles.cardValue}>ETB {totalRevenue}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Products</Text>

      {products.length === 0 ? (
        <Text style={styles.emptyText}>No products found.</Text>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              <Text style={styles.productName}>{item.product_name}</Text>
              <Text>Code: {item.product_code}</Text>
              <Text>Category: {item.category}</Text>
              <Text>Stock: {item.total_stock}</Text>
              <Text>Price: ETB {item.selling_price}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        style={styles.logout}
        onPress={async () => {
          await AsyncStorage.removeItem('authToken');
          router.replace('/login');
        }}
      >
        <Text style={{ color: '#fff' }}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  card: { flex: 1, backgroundColor: '#2563eb', padding: 15, borderRadius: 10, marginHorizontal: 5 },
  cardTitle: { color: '#fff', fontSize: 14 },
  cardValue: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 5 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginVertical: 15 },
  productCard: { backgroundColor: '#f1f5f9', padding: 15, borderRadius: 8, marginBottom: 10 },
  productName: { fontWeight: 'bold', fontSize: 16, marginBottom: 5 },
  emptyText: { textAlign: 'center', marginTop: 20, color: '#777' },
  logout: { backgroundColor: '#dc2626', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
});