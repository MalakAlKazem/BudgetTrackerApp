import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { fetchTransactions, updateTransactionPaidStatus, migrateCategoryData } from '../utils/database';

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
  isPaid: boolean;
  isRecurring?: boolean;
  recurrenceInterval?: string | null;
  invoiceImage?: string | null;
}

export interface SQLiteTransaction {
  id: number;
  title: string;
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
  markTransactionAsPaid: (id: string) => Promise<void>;
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
  { id: '10', name: 'Gifts', icon: 'gift', type: 'income' },
  { id: '11', name: 'Other', icon: 'ellipsis', type: 'both' }
];

// Helper function to ensure category name is valid
const validateCategoryName = (categoryName: string | undefined): string => {
  if (!categoryName) return 'Other';
  
  // Check if it's a valid category name
  const validCategory = defaultCategories.find(cat => cat.name === categoryName);
  return validCategory ? categoryName : 'Other';
};

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
    initializeData();
  }, []);

  // Calculate totals whenever transactions change
  useEffect(() => {
    calculateTotals();
  }, [transactions]);

  const initializeData = async () => {
    try {
      // Run migration to ensure categories are stored as names
      await migrateCategoryData();
      // Then refresh transactions
      await refreshTransactions();
    } catch (error) {
      console.error('Error initializing data:', error);
      setIsLoading(false);
    }
  };

  const calculateTotals = () => {
    let incomeTotal = 0;
    let expenseTotal = 0;
    
    transactions.forEach((transaction) => {
      // Only count paid transactions for totals
      if (transaction.isPaid) {
        if (transaction.type === 'income') {
          incomeTotal += transaction.amount;
        } else if (transaction.type === 'expense') {
          expenseTotal += transaction.amount;
        }
      }
    });
    
    setTotalIncome(incomeTotal);
    setTotalExpenses(expenseTotal);
    setBalance(incomeTotal - expenseTotal);
  };

  // Function to refresh transactions
  const refreshTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch transactions from SQLite
      const sqliteTransactions = await fetchTransactions() as SQLiteTransaction[];
      
      // Transform SQLite transactions to our app format
      const transformedTransactions = sqliteTransactions.map((t: SQLiteTransaction) => {
        return {
          id: t.id.toString(),
          name: t.title,
          amount: t.amount,
          date: new Date(t.date),
          type: t.type as 'income' | 'expense',
          category: validateCategoryName(t.category), // Ensure valid category name
          isPaid: !!t.isPaid,
          isRecurring: !!t.isRecurring,
          recurrenceInterval: t.recurrenceInterval,
          invoiceImage: t.invoiceImage
        };
      });
      
      // Update state
      setTransactions(transformedTransactions);
    } catch (error) {
      console.error('Error fetching transactions from SQLite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new transaction
  const addTransaction = async (transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
    // Generate a temporary ID for immediate UI update
    const tempId = Date.now().toString();
    
    const newTransaction: Transaction = {
      ...transaction,
      id: tempId,
      category: validateCategoryName(transaction.category) // Ensure valid category
    };
    
    // Update local state immediately for better UX
    setTransactions(prev => [...prev, newTransaction]);
    
    // Return the new transaction
    return Promise.resolve(newTransaction);
  };

  // Add a new category
  const addCategory = async (category: Omit<Category, 'id'>): Promise<Category> => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString() // Use timestamp for unique ID
    };
    
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const markTransactionAsPaid = async (id: string) => {
    try {
      // Update database
      await updateTransactionPaidStatus(parseInt(id), true);
      
      // Update local state immediately
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id 
            ? { ...transaction, isPaid: true }
            : transaction
        )
      );
    } catch (err) {
      console.error('Failed to mark transaction as paid:', err);
      // Revert local state if database update failed
      await refreshTransactions();
    }
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
    isLoading,
    markTransactionAsPaid
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