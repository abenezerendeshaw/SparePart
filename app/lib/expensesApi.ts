import api from './api';

export interface Expense {
  id?: number;
  owner_id?: number;
  category: string;
  description?: string;
  amount: number;
  expense_date: string; // YYYY-MM-DD
  created_at?: string;
}

export const listExpenses = async () => {
  const res = await api.get('/expense');
  return res.data?.data || [];
};

export const getExpense = async (id: number) => {
  const res = await api.get(`/expense?id=${id}`);
  return res.data?.data || null;
};

export const createExpense = async (payload: Expense) => {
  const res = await api.post('/expense', payload);
  return res.data;
};

export const updateExpense = async (id: number, payload: Partial<Expense>) => {
  const res = await api.put(`/expense?id=${id}`, payload);
  return res.data;
};

export const deleteExpense = async (id: number) => {
  const res = await api.delete(`/expense?id=${id}`);
  return res.data;
};
