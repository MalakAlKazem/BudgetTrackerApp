import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchTransactions } from '../utils/database';

// Define our interfaces
export interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'income' | 'expense' | 'both';
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  category?: string;
}

export interface SQLiteTransaction {
  id: number;
  name: string;
  amount: number;
  date: string;
  type: string;
  category: string;
  invoiceImage: string | null;
  isPaid: number;
  isRecurring: number;
  recurrenceInterval: string | null;
}

// Context interface
interface TransactionContextType {
  transactions: Transaction[];
  categories: Category[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<Transaction>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  isLoading: boolean;
}

// Create the context
const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Default categories
const defaultCategories: Category[] = [
  { id: '1', name: 'Food', icon: 'utensils', type: 'expense' },
  { id: '2', name: 'Transport', icon: 'bus', type: 'expense' },
  { id: '3', name: 'Shopping', icon: 'shopping-bag', type: 'expense' },
  { id: '4', name: 'Housing', icon: 'home', type: 'expense' },
  { id: '5', name: 'Entertainment', icon: 'gamepad', type: 'expense' },
  { id: '6', name: 'Healthcare', icon: 'medkit', type: 'expense' },
  { id: '7', name: 'Salary', icon: 'money-bill-wave', type: 'income' },
  { id: '8', name: 'Freelance', icon: 'laptop', type: 'income' },
  { id: '9', name: 'Investments', icon: 'piggy-bank', type: 'income' },
  { id: '10', name: 'Gifts', icon: 'gift', type: 'income' }
];

// Provider component
export const TransactionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load transactions initially
  useEffect(() => {
    refreshTransactions();
  }, []);

  // Function to refresh transactions
  const refreshTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch transactions from SQLite
      const sqliteTransactions = await fetchTransactions() as SQLiteTransaction[];
      
      let incomeTotal = 0;
      let expenseTotal = 0;
      
      // Transform SQLite transactions to our app format
      const transformedTransactions = sqliteTransactions.map((t: SQLiteTransaction) => {
        // Calculate totals
        if (t.type === 'income') {
          incomeTotal += t.amount;
        } else {
          expenseTotal += t.amount;
        }
        
        return {
          id: t.id.toString(),
          name: t.name,
          amount: t.amount,
          date: new Date(t.date),
          type: t.type as 'income' | 'expense',
          category: t.category
        };
      });
      
      // Update state
      setTotalIncome(incomeTotal);
      setTotalExpenses(expenseTotal);
      setBalance(incomeTotal - expenseTotal);
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transactions from SQLite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new transaction
  const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    // In a real app, you'd add to SQLite here
    // For now, let's assume it's done and refresh
    await refreshTransactions();
    
    // Return a dummy transaction with a random ID
    return {
      ...transaction,
      id: Math.random().toString(36).substring(2, 9)
    };
  };

  // Add a new category
  const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    const newCategory = {
      ...category,
      id: (categories.length + 1).toString()
    };
    
    setCategories([...categories, newCategory]);
    return newCategory;
  };

  const value = {
    transactions,
    categories,
    totalIncome,
    totalExpenses,
    balance,
    refreshTransactions,
    addTransaction,
    addCategory,
    isLoading
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

// Custom hook to use the context
export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};