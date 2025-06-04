import { openDatabaseSync } from 'expo-sqlite';
import { auth, db } from '../config/firebaseConfig';
import { collection, doc, setDoc, getDocs, query, where, getDoc, onSnapshot, Query, DocumentData,deleteDoc } from 'firebase/firestore';

const sqliteDb = openDatabaseSync('expenses.db');

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

// Helper function to normalize category names (same as in TransactionContext)
const normalizeCategoryName = (category: string): string => {
  // Check if it's a numeric ID
  if (/^\d+$/.test(category)) {
    const categoryEntry = Object.values(DEFAULT_CATEGORIES).find(cat => cat.id === category);
    return categoryEntry ? categoryEntry.name : 'Other';
  }
  
  // Check if it's a valid category name
  const validCategory = Object.values(DEFAULT_CATEGORIES).find(cat => 
    cat.name.toLowerCase() === category.toLowerCase()
  );
  
  return validCategory ? validCategory.name : 'Other';
};

interface Transaction {
  id: number;
  user_id?: string;
  title: string;
  amount: number;
  date: string;
  type: string;
  category: string;
  isScheduled: number;
  invoice: string | null;
  isPaid: number;
}

// Add timeout utility
const withTimeout = async (promise: Promise<any>, timeoutMs: number = 10000) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]);
};

// Add connection check utility with retries
const checkFirestoreConnection = async (retries: number = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user found');
        return false;
      }

      console.log(`Checking Firestore connection (attempt ${attempt}/${retries})...`);
      
      // Try a simple read operation to check connection
      const testRef = doc(collection(db, 'connection_test'), user.uid);
      await withTimeout(
        setDoc(testRef, { 
          timestamp: new Date().toISOString(),
          attempt: attempt
        }, { merge: true }),
        5000
      );
      
      console.log('Firestore connection successful');
      return true;
    } catch (error) {
      console.error(`Firestore connection check failed (attempt ${attempt}/${retries}):`, error);
      
      // If this was the last attempt, return false
      if (attempt === retries) {
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      console.log(`Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Initialize Firestore connection
const initializeFirestore = async () => {
  try {
    console.log('Initializing Firestore connection...');
    const isConnected = await checkFirestoreConnection();
    
    if (isConnected) {
      console.log('Firestore connection established successfully');
      return true;
    } else {
      console.log('Failed to establish Firestore connection after retries');
      return false;
    }
  } catch (error) {
    console.error('Error initializing Firestore:', error);
    return false;
  }
};

// Sync transactions to Firestore
const syncToFirestore = async (transaction: Transaction) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user found for sync');
      return;
    }

    console.log('Starting Firestore sync for transaction:', transaction.id);
    console.log('User ID:', user.uid);
    
    const transactionRef = doc(collection(db, 'transactions'), `${user.uid}_${transaction.id}`);
    
    // Normalize category before syncing
    const normalizedCategory = normalizeCategoryName(transaction.category);
    
    const syncData = {
      ...(transaction as Record<string, any>),
      category: normalizedCategory, // Ensure normalized category is synced
      user_id: user.uid,
      lastSynced: new Date().toISOString()
    };
    
    console.log('Attempting to write to Firestore:', syncData);
    
    // Write to Firestore
    await setDoc(transactionRef, syncData, { merge: true });
    
    // Verify the write was successful
    const docSnap = await getDoc(transactionRef);
    if (!docSnap.exists()) {
      throw new Error('Failed to verify Firestore write');
    }
    
    console.log('Successfully synced transaction to Firestore:', transaction.id);
    console.log('Verified Firestore data:', docSnap.data());
  } catch (error) {
    console.error('Error syncing to Firestore:', error);
    // Store failed sync for retry later
    await storeFailedSync(transaction);
  }
};

// Store failed sync for retry
const storeFailedSync = async (transaction: Transaction) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User must be authenticated to store failed sync');

    // Normalize category before storing failed sync
    const normalizedTransaction = {
      ...(transaction as Record<string, any>),
      category: normalizeCategoryName(transaction.category)
    };

    await sqliteDb.runAsync(
      `INSERT OR REPLACE INTO failed_syncs 
       (transaction_id, user_id, sync_data, last_attempt)
       VALUES (?, ?, ?, ?)`,
      [
        transaction.id,
        user.uid,
        JSON.stringify(normalizedTransaction),
        new Date().toISOString()
      ]
    );
    console.log('Stored failed sync for retry later');
  } catch (error) {
    console.error('Error storing failed sync:', error);
  }
};

// Retry failed syncs
const retryFailedSyncs = async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Check connection before attempting retries
    const isConnected = await checkFirestoreConnection();
    if (!isConnected) {
      console.log('No Firestore connection available, skipping retry');
      return;
    }

    interface FailedSync {
      transaction_id: number;
      user_id: string;
      sync_data: string;
      last_attempt: string;
    }

    const failedSyncs = await sqliteDb.getAllAsync<FailedSync>(
      'SELECT * FROM failed_syncs WHERE user_id = ?',
      [user.uid]
    );

    if (failedSyncs.length === 0) return;

    console.log(`Found ${failedSyncs.length} failed syncs to retry`);

    for (const failedSync of failedSyncs) {
      try {
        const transaction = JSON.parse(failedSync.sync_data) as Transaction;
        
        // Check connection before each retry
        const isStillConnected = await checkFirestoreConnection();
        if (!isStillConnected) {
          console.log('Lost connection during retry, stopping');
          break;
        }

        await syncToFirestore(transaction);
        
        // If sync successful, remove from failed_syncs
        await sqliteDb.runAsync(
          'DELETE FROM failed_syncs WHERE transaction_id = ?',
          [failedSync.transaction_id]
        );
      } catch (error) {
        console.error('Error retrying sync:', error);
      }
    }
  } catch (error) {
    console.error('Error in retryFailedSyncs:', error);
  }
};

// Restore transactions from Firestore
const restoreFromFirestore = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user found for restore');
      return;
    }

    console.log('Starting Firestore restore for user:', user.uid);
    
    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('user_id', '==', user.uid));
    
    console.log('Querying Firestore for transactions...');
    const querySnapshot = await getDocs(q);
    
    console.log(`Found ${querySnapshot.docs.length} transactions in Firestore`);

    if (querySnapshot.docs.length === 0) {
      console.log('No transactions found in Firestore for user:', user.uid);
      return;
    }

    // Log all found transactions
    querySnapshot.docs.forEach(doc => {
      console.log('Found transaction in Firestore:', doc.id, doc.data());
    });

    // Use Promise.all for parallel processing
    const restorePromises = querySnapshot.docs.map(async (doc) => {
      const transaction = doc.data() as Transaction;
      console.log('Processing transaction from Firestore:', transaction.id);
      
      try {
        // First check if transaction already exists
        const existingTransaction = await sqliteDb.getFirstAsync(
          'SELECT * FROM transactions WHERE id = ?',
          [transaction.id]
        );

        if (existingTransaction) {
          console.log('Transaction already exists locally:', transaction.id);
          return;
        }

        // Normalize category before restoring
        const normalizedCategory = normalizeCategoryName(transaction.category || 'Other');

        await sqliteDb.runAsync(
          `INSERT OR REPLACE INTO transactions 
           (id, user_id, title, amount, date, type, category, isScheduled, invoice, isPaid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction.id || 0,
            transaction.user_id || user.uid,
            transaction.title || '',
            transaction.amount || 0,
            transaction.date || new Date().toISOString(),
            transaction.type || 'expense',
            normalizedCategory, // Use normalized category
            transaction.isScheduled || 0,
            transaction.invoice || null,
            transaction.isPaid || 0
          ]
        );
        console.log('Successfully restored transaction:', transaction.id);
      } catch (error) {
        console.error('Error restoring individual transaction:', error);
      }
    });

    await Promise.all(restorePromises);
    console.log('Firestore restore completed');
  } catch (error) {
    console.error('Error restoring from Firestore:', error);
  }
};

export const initDatabase = async () => {
  try {
    console.log('Initializing database...');
    await sqliteDb.execAsync(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        title TEXT,
        amount REAL,
        date TEXT,
        type TEXT,
        category TEXT,
        isScheduled INTEGER,
        invoice TEXT,
        isPaid INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS failed_syncs (
        transaction_id INTEGER PRIMARY KEY,
        user_id TEXT NOT NULL,
        sync_data TEXT NOT NULL,
        last_attempt TEXT NOT NULL
      );
    `);
    console.log('Database schema initialized successfully');
    
    // Only proceed with Firestore operations if user is authenticated
    const user = auth.currentUser;
    if (user) {
      console.log('User authenticated, initializing Firestore connection...');
      const isConnected = await initializeFirestore();
      
      if (isConnected) {
        console.log('Starting Firestore restore process...');
        await restoreFromFirestore();
        await retryFailedSyncs();
      } else {
        console.log('Proceeding with local database only - Firestore sync will be attempted when connection is available');
      }
    } else {
      console.log('User not authenticated - proceeding with local database only');
    }
    
    console.log('Database initialization completed');
  } catch (error) {
    console.error('Error during database initialization:', error);
    console.log('Continuing with local database only');
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
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to add transactions');
    }

    console.log('Starting transaction insertion...');
    
    // Normalize category before insertion
    const normalizedCategory = normalizeCategoryName(category);
    console.log('Original category:', category, '-> Normalized:', normalizedCategory);
    
    const query = `
      INSERT INTO transactions
      (user_id, title, amount, date, type, category, isScheduled, isPaid, invoice)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      user.uid,
      title,
      amount,
      date,
      type,
      normalizedCategory, // Use normalized category
      isScheduled ? 1 : 0,
      isScheduled ? 0 : 1,
      invoice
    ];

    const result = await sqliteDb.runAsync(query, params);
    const transactionId = result.lastInsertRowId;
    console.log('Transaction inserted locally with ID:', transactionId);

    // Create transaction object with normalized category
    const newTransaction: Transaction = {
      id: transactionId,
      user_id: user.uid,
      title,
      amount,
      date,
      type,
      category: normalizedCategory, // Use normalized category
      isScheduled: isScheduled ? 1 : 0,
      invoice,
      isPaid: isScheduled ? 0 : 1
    };
    
    // Sync to Firestore and wait for completion
    console.log('Syncing new transaction to Firestore...');
    await syncToFirestore(newTransaction);
    console.log('Firestore sync completed for new transaction');

    return transactionId;
  } catch (error) {
    console.error('Error in insertTransaction:', error);
    throw error;
  }
};

export const fetchTransactions = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('No authenticated user found for fetch');
      return [];
    }

    console.log('Fetching transactions for user:', user.uid);
    
    // First try to get from Firestore
    const transactionsRef = collection(db, 'transactions');
    const firestoreQuery = query(transactionsRef, where('user_id', '==', user.uid));
    
    console.log('Querying Firestore for transactions...');
    const querySnapshot = await getDocs(firestoreQuery);
    
    console.log(`Found ${querySnapshot.docs.length} transactions in Firestore`);
    
    // Log all Firestore documents for debugging
    querySnapshot.docs.forEach(doc => {
      console.log('Firestore document:', doc.id, doc.data());
    });

    // Process Firestore transactions
    const firestoreTransactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      const transactionId = parseInt(doc.id.split('_')[1]);
      console.log('Processing Firestore transaction:', transactionId, data);
      
      // Normalize category when processing Firestore data
      const normalizedCategory = normalizeCategoryName(data.category || 'Other');
      
      return {
        id: transactionId,
        user_id: data.user_id || user.uid,
        title: data.title || '',
        amount: data.amount || 0,
        date: data.date || new Date().toISOString(),
        type: data.type || 'expense',
        category: normalizedCategory, // Use normalized category
        isPaid: data.isPaid || 0,
        isScheduled: data.isScheduled || 0,
        invoice: data.invoice || null
      };
    });
    
    console.log(`Processed ${firestoreTransactions.length} Firestore transactions`);
    
    // Update SQLite with Firestore data
    for (const transaction of firestoreTransactions) {
      console.log('Updating SQLite with transaction:', transaction.id);
      await sqliteDb.runAsync(
        `INSERT OR REPLACE INTO transactions 
         (id, user_id, title, amount, date, type, category, isScheduled, invoice, isPaid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          transaction.id,
          transaction.user_id,
          transaction.title,
          transaction.amount,
          transaction.date,
          transaction.type,
          transaction.category, // Already normalized
          transaction.isScheduled,
          transaction.invoice,
          transaction.isPaid
        ]
      );
      console.log('Successfully updated SQLite with transaction:', transaction.id);
    }

    // Then get from SQLite
    const sqliteQuery = `
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY date DESC
    `;

    const result = await sqliteDb.getAllAsync(sqliteQuery, [user.uid]);
    console.log('Transactions fetched from SQLite:', result.length);
    
    // Log all SQLite transactions for verification and normalize categories
    const normalizedResult = result.map(transaction => {
      const normalizedCategory = normalizeCategoryName((transaction as any).category || 'Other');
      console.log('SQLite transaction category normalization:', (transaction as any).category, '->', normalizedCategory);
      
      return {
        ...(transaction as Record<string, any>),
        category: normalizedCategory
      };
    });
    
    return normalizedResult;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};
// 1. Remove row from local SQLite
export const deleteTransactionFromSQLite = async (id: number) => {
  return sqliteDb.runAsync("DELETE FROM transactions WHERE id = ?", [id]);
};

// 2. “Delete” in Firestore (either soft‐delete or hard‐delete)
export const deleteTransactionFromFirestore = async (id: number) => {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

 const transactionRef = doc(
    collection(db, 'transactions'),
    `${user.uid}_${id}`
  );
  // Option 1: Actually delete the document
  await deleteDoc(transactionRef);
}

export const updateTransactionPaidStatus = async (id: number, isPaid: boolean) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to update transactions');
    }

    const query = `
      UPDATE transactions 
      SET isPaid = ? 
      WHERE id = ? AND user_id = ?
    `;

    await sqliteDb.runAsync(query, [isPaid ? 1 : 0, id, user.uid]);
    
    // Sync the update to Firestore
    const transaction = await sqliteDb.getFirstAsync(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [id, user.uid]
    ) as Transaction;
    
    if (transaction) {
      // Normalize category before syncing
      transaction.category = normalizeCategoryName(transaction.category);
      await syncToFirestore(transaction);
    }
    
    console.log('Transaction status updated and synced successfully');
  } catch (error) {
    console.error('Error updating transaction status:', error);
    throw error;
  }
};

export const deleteTransaction = async (id: number) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User must be authenticated to delete transactions');
    }

    const query = `
      DELETE FROM transactions 
      WHERE id = ? AND user_id = ?
    `;

    await sqliteDb.runAsync(query, [id, user.uid]);
    
    // Delete from Firestore
    const transactionRef = doc(collection(db, 'transactions'), `${user.uid}_${id}`);
    await setDoc(transactionRef, { deleted: true });
    
    console.log('Transaction deleted and synced successfully');
  } catch (error) {
    console.error('Error deleting transaction:', error);
    throw error;
  }
};

export const migrateCategoryData = async () => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.log('User not authenticated - skipping data migration');
      return;
    }

    console.log('Starting category data migration...');

    // Check if user_id column exists
    const tableInfo = await sqliteDb.getAllAsync("PRAGMA table_info(transactions)");
    const hasUserIdColumn = tableInfo.some((col: any) => col.name === 'user_id');

    if (!hasUserIdColumn) {
      console.log('Adding user_id column to transactions table...');
      await sqliteDb.execAsync(`ALTER TABLE transactions ADD COLUMN user_id TEXT`);
      
      // Get all existing transactions
      const existingTransactions = await sqliteDb.getAllAsync('SELECT * FROM transactions') as Transaction[];
      console.log(`Found ${existingTransactions.length} existing transactions to migrate`);
      
      // Update all existing transactions with the current user's ID and normalize categories
      for (const transaction of existingTransactions) {
        const normalizedCategory = normalizeCategoryName(transaction.category);
        console.log(`Migrating transaction ${transaction.id}: ${transaction.category} -> ${normalizedCategory}`);
        
        await sqliteDb.runAsync(
          `UPDATE transactions SET user_id = ?, category = ? WHERE id = ?`,
          [user.uid, normalizedCategory, transaction.id]
        );
      }
      console.log('Successfully migrated existing transactions to user:', user.uid);
    } else {
      // If column exists but some records might be missing user_id or need category normalization
      const nullUserTransactions = await sqliteDb.getAllAsync(
        'SELECT COUNT(*) as count FROM transactions WHERE user_id IS NULL'
      ) as { count: number }[];
      
      if (nullUserTransactions[0].count > 0) {
        console.log(`Found ${nullUserTransactions[0].count} transactions without user_id, updating...`);
        await sqliteDb.runAsync(
          `UPDATE transactions SET user_id = ? WHERE user_id IS NULL`,
          [user.uid]
        );
        console.log('Successfully updated transactions without user_id');
      }

      // Also normalize all existing categories for this user
      const userTransactions = await sqliteDb.getAllAsync(
        'SELECT id, category FROM transactions WHERE user_id = ?',
        [user.uid]
      ) as { id: number; category: string }[];

      console.log(`Normalizing categories for ${userTransactions.length} existing transactions...`);
      
      for (const transaction of userTransactions) {
        const normalizedCategory = normalizeCategoryName(transaction.category);
        if (normalizedCategory !== transaction.category) {
          console.log(`Normalizing category for transaction ${transaction.id}: ${transaction.category} -> ${normalizedCategory}`);
          await sqliteDb.runAsync(
            `UPDATE transactions SET category = ? WHERE id = ?`,
            [normalizedCategory, transaction.id]
          );
        }
      }
      
      console.log('Category normalization completed');
    }
  } catch (error) {
    console.error('Error during database migration:', error);
    // Don't throw error, just log it
    console.log('Continuing with existing database state');
  }
};

// Add a function to set up real-time listeners
export const setupTransactionListeners = (onUpdate: (transactions: Transaction[]) => void) => {
  const user = auth.currentUser;
  if (!user) {
    console.log('No authenticated user found for listener setup');
    return () => {};
  }

  console.log('Setting up transaction listeners for user:', user.uid);
  
  const transactionsRef = collection(db, 'transactions');
  const firestoreQuery = query(transactionsRef, where('user_id', '==', user.uid));
  
  const unsubscribe = onSnapshot(firestoreQuery, async (snapshot) => {
    console.log('Firestore update received');
    
    // Process the changes
    const changes = snapshot.docChanges();
    for (const change of changes) {
      const data = change.doc.data() as Transaction;
      console.log('Processing change:', change.type, data);
      
      if (change.type === 'added' || change.type === 'modified') {
        // Normalize category before updating SQLite
        const normalizedCategory = normalizeCategoryName(data.category || 'Other');
        
        // Update SQLite
        await sqliteDb.runAsync(
          `INSERT OR REPLACE INTO transactions 
           (id, user_id, title, amount, date, type, category, isScheduled, invoice, isPaid)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            parseInt(change.doc.id.split('_')[1]),
            data.user_id || user.uid,
            data.title || '',
            data.amount || 0,
            data.date || new Date().toISOString(),
            data.type || 'expense',
            normalizedCategory, // Use normalized category
            data.isScheduled || 0,
            data.invoice || null,
            data.isPaid || 0
          ]
        );
      } else if (change.type === 'removed') {
        // Remove from SQLite
        await sqliteDb.runAsync(
          'DELETE FROM transactions WHERE id = ?',
          [parseInt(change.doc.id.split('_')[1])]
        );
      }
    }
    
    // Fetch updated data from SQLite
    const updatedTransactions = await fetchTransactions();
    onUpdate(updatedTransactions as Transaction[]);
  }, (error) => {
    console.error('Error in transaction listener:', error);
  });
  
  return unsubscribe;
};