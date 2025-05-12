// database.ts
import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('expenses.db');

export const initDatabase = async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        amount REAL,
        date TEXT,
        type TEXT,
        category TEXT,
        invoiceImage TEXT,
        isPaid INTEGER,
        isRecurring INTEGER,
        recurrenceInterval TEXT
      );
    `);
  };
  

export const insertExpense = async (
  name: string,
  amount: number,
  date: string,
  type: string,
  category: string,
  invoiceImage: string | null,
  isPaid: boolean,
  isRecurring: boolean,
  recurrenceInterval: string | null
) => {
  await db.runAsync(
    `INSERT INTO expenses 
    (name, amount, date, type, category, invoiceImage, isPaid, isRecurring, recurrenceInterval) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, amount, date, type, category, invoiceImage, isPaid ? 1 : 0, isRecurring ? 1 : 0, recurrenceInterval]
  );
};

export const fetchExpenses = async () => {
  const result = await db.getAllAsync(`SELECT * FROM expenses`);
  return result;
};

export const deleteExpense = async (id: number) => {
  await db.runAsync(`DELETE FROM expenses WHERE id = ?`, [id]);
};
