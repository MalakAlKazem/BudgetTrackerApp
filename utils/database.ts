import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('expenses.db');

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
  await db.runAsync(
    `INSERT INTO transactions
     (title, amount, date, type, category, isScheduled, isPaid, invoice)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
[title, amount, date, type, category, isScheduled ? 1 : 0, isScheduled ? 0 : 1, invoice]
  );
};

export const fetchTransactions = async () => {
  const result = await db.getAllAsync(`SELECT * FROM transactions`);
  return result;
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
