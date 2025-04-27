import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TransactionType = 'income' | 'expense';
export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TransactionType | 'both';
  color?: string;
}

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: TransactionType;
  category?: string;
  categoryName?: string;
  categoryIcon?: string;
  invoiceImage?: string | null;
  isPaid?: boolean;
  isRecurring?: boolean;
  recurrenceInterval?: 'monthly' | 'weekly' | 'yearly' | null;
  originalTransactionId?: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  categories: Category[];
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
  getBalance: () => number;
  getTotalIncome: () => number;
  getTotalExpenses: () => number;
  getTransactionsByDateRange: (startDate: Date, endDate: Date) => Transaction[];
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  addCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getDefaultCategories: () => Category[];
  isLoading: boolean;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

const STORAGE_KEY = '@transactions';
const RECURRING_KEY = '@recurringTransactions';
const CATEGORIES_KEY = '@categories';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_food', name: 'Food', icon: 'utensils', type: 'expense' },
  { id: 'cat_transport', name: 'Transport', icon: 'bus', type: 'expense' },
  { id: 'cat_shopping', name: 'Shopping', icon: 'shopping-bag', type: 'expense' },
  { id: 'cat_bills', name: 'Bills', icon: 'file-invoice', type: 'expense' },
  { id: 'cat_entertainment', name: 'Entertainment', icon: 'film', type: 'expense' },
  { id: 'cat_health', name: 'Health', icon: 'medkit', type: 'expense' },
  { id: 'cat_salary', name: 'Salary', icon: 'money-bill-wave', type: 'income' },
  { id: 'cat_freelance', name: 'Freelance', icon: 'laptop', type: 'income' },
  { id: 'cat_gifts', name: 'Gifts', icon: 'gift', type: 'income' },
];

export const TransactionProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [storedTransactions, storedRecurring, storedCategories] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(RECURRING_KEY),
          AsyncStorage.getItem(CATEGORIES_KEY)
        ]);

        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions).map((t: any) => ({
            ...t,
            date: new Date(t.date),
          })));
        }

        if (storedRecurring) {
          setRecurringTransactions(JSON.parse(storedRecurring).map((t: any) => ({
            ...t,
            date: new Date(t.date),
          })));
        }

        if (storedCategories) {
          setCategories(JSON.parse(storedCategories));
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      if (!isLoading) {
        try {
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(transactions)),
            AsyncStorage.setItem(RECURRING_KEY, JSON.stringify(recurringTransactions)),
            AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
          ]);
        } catch (error) {
          console.error('Failed to save data:', error);
        }
      }
    };

    saveData();
  }, [transactions, recurringTransactions, categories, isLoading]);

  // Calculate the next occurrence of a recurring transaction
  const getNextOccurrence = (transaction: Transaction): Date => {
    const now = new Date();
    let nextDate = new Date(transaction.date);
    
    if (nextDate >= now) return nextDate;
    
    while (nextDate < now) {
      switch (transaction.recurrenceInterval) {
        case 'weekly':
          nextDate.setDate(nextDate.getDate() + 7);
          break;
        case 'monthly':
          nextDate.setMonth(nextDate.getMonth() + 1);
          break;
        case 'yearly':
          nextDate.setFullYear(nextDate.getFullYear() + 1);
          break;
      }
    }
    
    return nextDate;
  };

  // Process recurring transactions and add the next occurrence to the visible transactions
  useEffect(() => {
    if (isLoading) return;
    
    // Filter out any previous next occurrences
    const filteredTransactions = transactions.filter(t => !t.originalTransactionId);
    
    // Generate next occurrences for each recurring transaction
    const nextOccurrences = recurringTransactions.map(t => {
      const nextDate = getNextOccurrence(t);
      return {
        ...t,
        id: `${t.id}-next`,
        date: nextDate,
        isPaid: false,
        originalTransactionId: t.id
      };
    });
    
    setTransactions([...filteredTransactions, ...nextOccurrences]);
  }, [recurringTransactions, isLoading]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const category = transaction.category ? 
        categories.find(c => c.id === transaction.category) : undefined;

      const newTransaction: Transaction = {
        ...transaction,
        id: Math.random().toString(36).substring(2, 9),
        isPaid: transaction.isPaid ?? true,
        categoryName: category?.name,
        categoryIcon: category?.icon
      };

      if (newTransaction.isRecurring) {
        setRecurringTransactions(prev => [...prev, newTransaction]);
      } else {
        setTransactions(prev => [...prev, newTransaction]);
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
      throw error;
    }
  };


  const deleteTransaction = async (id: string) => {
    try {
      // Check if this is a recurring transaction
      const recurring = recurringTransactions.find(t => t.id === id);
      if (recurring) {
        // Remove from recurring transactions
        setRecurringTransactions(prev => prev.filter(t => t.id !== id));
        // Remove any next occurrences
        setTransactions(prev => prev.filter(t => t.originalTransactionId !== id));
      } else {
        // Check if this is a next occurrence of a recurring transaction
        const transaction = transactions.find(t => t.id === id);
        if (transaction?.originalTransactionId) {
          // Remove the original recurring transaction
          setRecurringTransactions(prev => 
            prev.filter(t => t.id !== transaction.originalTransactionId)
          );
          // Remove this occurrence
          setTransactions(prev => 
            prev.filter(t => t.id !== id && t.originalTransactionId !== transaction.originalTransactionId)
          );
        } else {
          // Just a normal transaction
          setTransactions(prev => prev.filter(t => t.id !== id));
        }
      }
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      throw error;
    }
  };

  const getBalance = () => {
    return parseFloat(transactions.reduce((total, t) => {
      if (t.type === 'income') return total + t.amount;
      // Only subtract paid expenses
      if (t.type === 'expense' && t.isPaid !== false) return total - t.amount;
      return total;
    }, 0).toFixed(2));
  };
  
  const getTotalIncome = () => {
    return parseFloat(transactions
      .filter(t => t.type === 'income')
      .reduce((total, t) => total + t.amount, 0)
      .toFixed(2)
    );
  };

  const getTotalExpenses = () => {
    return parseFloat(transactions
      .filter(t => t.type === 'expense' && t.isPaid !== false) // Only count paid expenses
      .reduce((total, t) => total + t.amount, 0)
      .toFixed(2)
    );
  };
  
  const markAsPaid = async (id: string) => {
    try {
      setTransactions(prev => prev.map(t => {
        if (t.id === id) {
          // If this is a recurring transaction, create the next occurrence
          if (t.originalTransactionId && t.isRecurring) {
            const original = recurringTransactions.find(rt => rt.id === t.originalTransactionId);
            if (original) {
              // Find the next occurrence date based on current date
              let nextDate = new Date(t.date);
              
              switch (original.recurrenceInterval) {
                case 'weekly':
                  nextDate.setDate(nextDate.getDate() + 7);
                  break;
                case 'monthly':
                  nextDate.setMonth(nextDate.getMonth() + 1);
                  break;
                case 'yearly':
                  nextDate.setFullYear(nextDate.getFullYear() + 1);
                  break;
              }
              
              // Add the next occurrence
              setTimeout(() => {
                setTransactions(prevTrans => [
                  ...prevTrans,
                  {
                    ...original,
                    id: `${original.id}-next-${Date.now()}`,
                    date: nextDate,
                    isPaid: false,
                    originalTransactionId: original.id
                  }
                ]);
              }, 0);
            }
          }
          return { ...t, isPaid: true };
        }
        return t;
      }));
    } catch (error) {
      console.error('Failed to mark transaction as paid:', error);
      throw error;
    }
  };

  const getTransactionsByDateRange = (startDate: Date, endDate: Date) => {
    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });
  };

  const getTransactionsByCategory = (categoryId: string) => {
    return transactions.filter(t => t.category === categoryId);
  };

  // Category management
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory: Category = {
        ...category,
        id: `cat_${Math.random().toString(36).substring(2, 9)}`,
      };
      setCategories(prev => [...prev, newCategory]);
      return newCategory;
    } catch (error) {
      console.error('Failed to add category:', error);
      throw error;
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      setCategories(prev => prev.map(c => c.id === category.id ? category : c));
      
      // Update category info in transactions
      setTransactions(prev => prev.map(t => {
        if (t.category === category.id) {
          return {
            ...t,
            categoryName: category.name,
            categoryIcon: category.icon
          };
        }
        return t;
      }));
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      setCategories(prev => prev.filter(c => c.id !== id));
      
      // Remove category from transactions that use it
      setTransactions(prev => prev.map(t => {
        if (t.category === id) {
          const { category, categoryName, categoryIcon, ...rest } = t;
          return rest;
        }
        return t;
      }));
    } catch (error) {
      console.error('Failed to delete category:', error);
      throw error;
    }
  };

  const getDefaultCategories = () => {
    return DEFAULT_CATEGORIES;
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        categories,
        addTransaction,
        deleteTransaction,
        markAsPaid,
        getBalance,
        getTotalIncome,
        getTotalExpenses,
        getTransactionsByDateRange,
        getTransactionsByCategory,
        addCategory,
        updateCategory,
        deleteCategory,
        getDefaultCategories: () => DEFAULT_CATEGORIES,
        isLoading,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
};