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
     (title, amount, date, type, category, isScheduled, invoice)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, amount, date, type, category, isScheduled ? 1 : 0, invoice]
  );
};

export const fetchTransactions = async () => {
  const result = await db.getAllAsync(`SELECT * FROM transactions`);
  return result;
};

export const deleteTransaction = async (id: number) => {
  await db.runAsync(`DELETE FROM transactions WHERE id = ?`, [id]);
};