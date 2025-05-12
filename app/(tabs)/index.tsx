import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ListRenderItem,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { 
  getFirestore, 
  doc, 
  onSnapshot, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../config/firebaseConfig';
import { fetchExpenses } from '../utils/database';

const { width, height } = Dimensions.get('window');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Define interfaces for type safety
interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: Date;
  type: 'income' | 'expense';
  category?: string;
}

interface CategoryItemProps {
  title: string;
  icon: string;
}

interface FormattedTransaction {
  id: string;
  name: string;
  amount: string;
  date: string;
  icon: any;
  color: string;
}

// Making this interface exported so it can be used in database.ts as well
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

// Improved CategoryItem component with proper type annotation
const CategoryItem: React.FC<CategoryItemProps> = ({ title, icon }) => (
  <View style={styles.categoryItem}>
    <FontAwesome5 name={icon} size={20} color="#343A40" />
    <Text style={styles.categoryText}>{title}</Text>
  </View>
);

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalIncome, setTotalIncome] = useState<number>(0);
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  const [balance, setBalance] = useState<number>(0);

  // Enabling Offline Persistence
  useEffect(() => {
    enableIndexedDbPersistence(db)
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.log('Multiple tabs open. Persistence can only be enabled in one tab.');
        } else if (err.code === 'unimplemented') {
          console.log('The current browser does not support persistence.');
        }
      });
  }, []);

  // Fetch the user data
  useEffect(() => {
    const currentUser = auth.currentUser;
    const uid = currentUser?.uid;
    
    if (!uid) {
      console.error('User not authenticated yet');
      setLoading(false);
      return;
    }
  
    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          
          // Prioritize displayName, then email
          const name = userData?.displayName || 
                       userData?.fullName || 
                       currentUser?.displayName || 
                       currentUser?.email?.split('@')[0] || 
                       'User';
          
          setUserName(name);
        } else {
          // Fallback to email or default name if no Firestore document
          const name = currentUser?.displayName || 
                       currentUser?.email?.split('@')[0] || 
                       'User';
          setUserName(name);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        
        // Fallback to email or default name in case of error
        const name = currentUser?.displayName || 
                     currentUser?.email?.split('@')[0] || 
                     'User';
        setUserName(name);
        setLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, []);

  // Fetch transactions from SQLite
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        // Explicitly type the result of fetchExpenses
        const sqliteTransactions = await fetchExpenses() as SQLiteTransaction[];
        
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
      }
    };
    
    loadTransactions();
  }, []);

  // Format transactions for display with improved error handling
  const formattedTransactions: FormattedTransaction[] = transactions
    .slice() // Create a copy
    .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date (newest first)
    .slice(0, 4) // Take only the 4 most recent
    .map((t) => ({
      id: t.id,
      name: t.name,
      amount: `${t.type === 'income' ? '+ ' : '- '}$${t.amount.toFixed(2)}`,
      date: formatDate(t.date),
      icon: getIconForTransaction(t),
      color: t.type === 'income' ? '#4CAF50' : '#F44336',
    }));

  const renderItem: ListRenderItem<FormattedTransaction> = ({ item }) => (
    <View style={styles.transactionItem}>
      <Image 
        source={item.icon} 
        style={styles.transactionIcon} 
        defaultSource={require('@/assets/profile-avatar.png')} // Add a default icon
      />
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.color }]}>{item.amount}</Text>
    </View>
  );

  // Show loading indicator while fetching user name
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Improves touch handling
      >
        <View style={styles.backgroundContainer}>
          <Image
            source={require('@/assets/Rectangle.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Hello,</Text>
          <Text style={styles.userName}>
            {userName}
          </Text>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.sectionTitle}>Total Balance</Text>
          <Text style={styles.balanceAmount}>
            ${balance.toFixed(2)}
          </Text>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.financeBox}>
              <Text style={styles.financeLabel}>Income</Text>
              <Text style={[styles.financeAmount, styles.incomeText]}>
                ${totalIncome.toFixed(2)}
              </Text>
            </View>
            <View style={styles.financeBox}>
              <Text style={styles.financeLabel}>Expenses</Text>
              <Text style={[styles.financeAmount, styles.expenseText]}>
                ${totalExpenses.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity 
              onPress={() => router.push('/transactions')}
              accessibilityLabel="View all transactions"
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {formattedTransactions.length > 0 ? (
            <FlatList
              data={formattedTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
              ListEmptyComponent={
                <Text style={styles.noTransactionsText}>
                  No transactions yet
                </Text>
              }
            />
          ) : (
            <Text style={styles.noTransactionsText}>
              No transactions yet
            </Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spend Again</Text>
            <TouchableOpacity 
              onPress={() => router.push('/categories')}
              accessibilityLabel="View all categories"
            >
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryRow}>
            <CategoryItem title="Food" icon="utensils" />
            <CategoryItem title="Transport" icon="bus" />
            <CategoryItem title="Shopping" icon="shopping-bag" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// Helper functions with improved type safety
function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}

function getIconForTransaction(transaction: Transaction) {
  const lowerName = transaction.name.toLowerCase();
  
  if (lowerName.includes('upwork')) {
    return require('@/assets/upwork.png');
  } else if (lowerName.includes('paypal')) {
    return require('@/assets/paypal.png');
  } else if (lowerName.includes('youtube')) {
    return require('@/assets/youtube.png');
  } else if (transaction.type === 'income') {
    return require('@/assets/transfer.png');
  } else {
    return require('@/assets/profile-avatar.png');
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: width,
    height: height * 0.35,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greetingContainer: {
    marginTop: height * 0.05,
    marginBottom: 20,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '500',
    color: '#343A40',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
  },
  balanceContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: '#4CAF50',
    marginVertical: 10,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financeBox: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 10,
    width: '48%',
  },
  financeLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  financeAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  sectionContainer: {
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  categoryItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
    elevation: 2,
  },
  categoryText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#343A40',
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  transactionDetails: {
    flex: 1,
    marginLeft: 10,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
  },
  transactionDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6C757D',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

export default HomeScreen;