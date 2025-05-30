import React, { useEffect } from 'react';
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
  RefreshControl,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../config/firebaseConfig';
import { useTransactions, Transaction } from '../../context/TransactionContext';

const { width, height } = Dimensions.get('window');

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

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

const CategoryItem: React.FC<CategoryItemProps> = ({ title, icon }) => (
  <View style={styles.categoryItem}>
    <FontAwesome5 name={icon} size={20} color="#343A40" />
    <Text style={styles.categoryText}>{title}</Text>
  </View>
);

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  
  const { 
    transactions, 
    totalIncome, 
    totalExpenses, 
    balance, 
    refreshTransactions,
    isLoading: transactionsLoading
  } = useTransactions();

  useEffect(() => {
    const currentUser  = auth.currentUser ;
    const uid = currentUser ?.uid;
    
    if (!uid) {
      console.error('User  not authenticated yet');
      setLoading(false);
      return;
    }
  
    const unsubscribe = onSnapshot(
      doc(db, 'users', uid),
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const name = userData?.displayName || 
                       userData?.fullName || 
                       currentUser ?.displayName || 
                       currentUser ?.email?.split('@')[0] || 
                       'User ';
          setUserName(name);
        } else {
          const name = currentUser ?.displayName || 
                       currentUser ?.email?.split('@')[0] || 
                       'User ';
          setUserName(name);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        const name = currentUser ?.displayName || 
                     currentUser ?.email?.split('@')[0] || 
                     'User ';
        setUserName(name);
        setLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshTransactions();
    setRefreshing(false);
  };

  const formattedTransactions: FormattedTransaction[] = transactions
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 4)
    .map((t) => ({
      id: t.id,
      name: t.name || 'Unnamed Transaction', // Fallback for undefined name
      amount: `${t.type === 'income' ? '+ ' : '- '}$${t.amount?.toFixed(2) || '0.00'}`, // Fallback for undefined amount
      date: formatDate(t.date),
      icon: getIconForTransaction(t),
      color: t.type === 'income' ? '#4CAF50' : '#F44336',
    }));

  const renderItem: ListRenderItem<FormattedTransaction> = ({ item }) => (
    <View style={styles.transactionItem}>
      <Image 
        source={item.icon} 
        style={styles.transactionIcon} 
        defaultSource={require('@/assets/profile-avatar.png')}
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

  if (loading || transactionsLoading) {
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
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
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
  const lowerName = transaction.name?.toLowerCase() || ''; // Ensure name is defined
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