import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('expenses.db');

// Default categories mapping - this should match your TransactionContext categories
export const DEFAULT_CATEGORIES = {
  'Food': { id: '1', name: 'Food', icon: 'utensils', type: 'expense' },
  'Transport': { id: '2', name: 'Transport', icon: 'bus', type: 'expense' },
  'Shopping': { id: '3', name: 'Shopping', icon: 'shopping-bag', type: 'expense' },
  'Housing': { id: '4', name: 'Housing', icon: 'home', type: 'expense' },
  'Entertainment': { id: '5', name: 'Entertainment', icon: 'gamepad', type: 'expense' },
  'Healthcare': { id: '6', name: 'Healthcare', icon: 'medkit', type: 'expense' },
  'Salary': { id: '7', name: 'Salary', icon: 'money-bill-wave', type: 'income' },
  'Freelance': { id: '8', name: 'Freelance', icon: 'laptop', type: 'income' },
  'Investments': { id: '9', name: 'Investments', icon: 'piggy-bank', type: 'income' },
  'Gifts': { id: '10', name: 'Gifts', icon: 'gift', type: 'income' },
  'Other': { id: '11', name: 'Other', icon: 'ellipsis', type: 'both' }
} as const;

// Helper function to get category name from ID or return the name if it's already a name
export const getCategoryName = (categoryIdOrName: string): string => {
  // If it's a number (ID), find the corresponding category name
  const categoryById = Object.values(DEFAULT_CATEGORIES).find(cat => cat.id === categoryIdOrName);
  if (categoryById) {
    return categoryById.name;
  }
  
  // If it's already a name and exists in our categories, return it
  if (DEFAULT_CATEGORIES[categoryIdOrName as keyof typeof DEFAULT_CATEGORIES]) {
    return categoryIdOrName;
  }
  
  // Default to 'Other' if category not found
  return 'Other';
};

// Helper function to get category ID from name
export const getCategoryId = (categoryName: string): string => {
  const category = DEFAULT_CATEGORIES[categoryName as keyof typeof DEFAULT_CATEGORIES];
  return category ? category.id : '11'; // Default to 'Other' ID
};

export const initDatabase = async () => {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      amount REAL,
      date TEXT,
      type TEXT,
      category TEXT,
      isScheduled INTEGER,
      invoice TEXT
    );
  `);
  
  // Add missing columns if they don't exist
  try {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN isPaid INTEGER DEFAULT 0`);
  } catch (err: any) {
    if (!err.message.includes('duplicate column name')) {
      console.error('Failed to add isPaid column:', err);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN notificationId TEXT`);
  } catch (err: any) {
    if (!err.message.includes('duplicate column name')) {
      console.error('Failed to add notificationId column:', err);
    }
  }
  
  try {
    await db.execAsync(`ALTER TABLE transactions ADD COLUMN reminderScheduled INTEGER DEFAULT 0`);
  } catch (err: any) {
    if (!err.message.includes('duplicate column name')) {
      console.error('Failed to add reminderScheduled column:', err);
    }
  }
};

export const insertTransaction = async (
  title: string,
  amount: number,
  date: string,
  type: string,
  category: string,
  isScheduled: boolean,
  invoice: string | null
) => {
  // Ensure we're storing the category name, not ID
  const categoryName = getCategoryName(category);
  
  await db.runAsync(
    `INSERT INTO transactions
     (title, amount, date, type, category, isScheduled, isPaid, invoice)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
[title, amount, date, type, categoryName, isScheduled ? 1 : 0, isScheduled ? 0 : 1, invoice]
  );
};

export const fetchTransactions = async () => {
  const result = await db.getAllAsync(`SELECT * FROM transactions`);
  
  // Transform the results to ensure category names are properly handled
  return result.map((transaction: any) => ({
    ...transaction,
    // Ensure category is always a valid category name
    category: getCategoryName(transaction.category || 'Other')
  }));
};

export const deleteTransaction = async (id: number) => {
  await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
};

export const updateTransactionPaidStatus = async (id: number, isPaid: boolean) => {
  await db.runAsync(
    `UPDATE transactions SET isPaid = ? WHERE id = ?`,
    [isPaid ? 1 : 0, id]
  );
};

// Helper function to migrate existing transactions if needed
export const migrateCategoryData = async () => {
  try {
    // Get all transactions
    const transactions = await db.getAllAsync(`SELECT id, category FROM transactions`);
    
    // Update any transactions that have category IDs instead of names
    for (const transaction of transactions as any[]) {
      const categoryName = getCategoryName(transaction.category);
      if (categoryName !== transaction.category) {
        await db.runAsync(
          `UPDATE transactions SET category = ? WHERE id = ?`,
          [categoryName, transaction.id]
        );
      }
    }
    
    console.log('Category migration completed successfully');
  } catch (error) {
    console.error('Error during category migration:', error);
  }
};