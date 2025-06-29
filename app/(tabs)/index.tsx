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
  Animated,
} from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
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
  onPress?: () => void;
}

interface FormattedTransaction {
  id: string;
  name: string;
  amount: string;
  date: string;
  iconType: 'arrow' | 'image';
  iconName?: string;
  iconSource?: any;
  color: string;
  backgroundColor: string;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ title, icon, onPress }) => (
  <TouchableOpacity style={styles.categoryItem} onPress={onPress}>
    <View style={styles.categoryIconContainer}>
      <FontAwesome5 name={icon} size={20} color="#4D9F8D" />
    </View>
    <Text style={styles.categoryText}>{title}</Text>
  </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const [userName, setUserName] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [refreshing, setRefreshing] = React.useState<boolean>(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  const { 
    transactions, 
    totalIncome, 
    totalExpenses, 
    balance, 
    refreshTransactions,
    isLoading: transactionsLoading
  } = useTransactions();

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
          const name = userData?.displayName || 
                       userData?.fullName || 
                       currentUser?.displayName || 
                       currentUser?.email?.split('@')[0] || 
                       'User';
          setUserName(name);
        } else {
          const name = currentUser?.displayName || 
                       currentUser?.email?.split('@')[0] || 
                       'User';
          setUserName(name);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firestore listener error:', error);
        const name = currentUser?.displayName || 
                     currentUser?.email?.split('@')[0] || 
                     'User';
        setUserName(name);
        setLoading(false);
      }
    );
  
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
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
    .map((t) => {
      const transactionIcon = getIconForTransaction(t);
      return {
        id: t.id,
        name: t.name || 'Unnamed Transaction',
        amount: `${t.type === 'income' ? '+ ' : '- '}$${t.amount?.toFixed(2) || '0.00'}`,
        date: formatDate(t.date),
        iconType: transactionIcon.type,
        iconName: transactionIcon.iconName,
        iconSource: transactionIcon.iconSource,
        color: t.type === 'income' ? '#4CAF50' : '#F44336',
        backgroundColor: t.type === 'income' ? '#E8F5E9' : '#FFF5F5',
      };
    });

    // Function to handle category selection and navigation
  const handleCategoryPress = (categoryName: string, categoryIcon: string) => {
    router.push({
      pathname: '/AddBudget',
      params: {
        categoryName: categoryName,
        selectedIcon: categoryIcon
      }
    });
  };
  const renderItem: ListRenderItem<FormattedTransaction> = ({ item }) => (
    <TouchableOpacity style={styles.transactionItem}>
      <View style={[styles.transactionIconContainer, { backgroundColor: item.backgroundColor }]}>
        {item.iconType === 'arrow' ? (
          <FontAwesome5 name={item.iconName!} size={20} color={item.color} />
        ) : (
          <Image 
            source={item.iconSource} 
            style={styles.transactionIcon} 
            defaultSource={require('@/assets/profile-avatar.png')}
          />
        )}
      </View>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.color }]}>{item.amount}</Text>
    </TouchableOpacity>
  );

  if (loading || transactionsLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4D9F8D" />
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

        <Animated.View style={[styles.greetingContainer, { opacity: fadeAnim }]}>
          <Text style={styles.greetingText}>Welcome back,</Text>
          <Text style={styles.userName}>{userName}</Text>
        </Animated.View>

        <Animated.View style={[styles.balanceContainer, { opacity: fadeAnim }]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.sectionTitle}>Total Balance</Text>
            <TouchableOpacity style={styles.refreshButton}>
              <Ionicons name="refresh" size={20} color="#4D9F8D" />
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>
            ${balance.toFixed(2)}
          </Text>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.financeBox}>
              <View style={styles.financeIconContainer}>
                <FontAwesome5 name="arrow-down" size={16} color="#4CAF50" />
              </View>
              <View>
                <Text style={styles.financeLabel}>Income</Text>
                <Text style={[styles.financeAmount, styles.incomeText]}>
                  ${totalIncome.toFixed(2)}
                </Text>
              </View>
            </View>
            <View style={styles.financeBox}>
              <View style={[styles.financeIconContainer, { backgroundColor: '#FFF5F5' }]}>
                <FontAwesome5 name="arrow-up" size={16} color="#F44336" />
              </View>
              <View>
                <Text style={styles.financeLabel}>Expenses</Text>
                <Text style={[styles.financeAmount, styles.expenseText]}>
                  ${totalExpenses.toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity 
              onPress={() => router.push('/transactions')}
              style={styles.seeAllButton}
            >
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color="#4D9F8D" />
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
        </Animated.View>

        <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
             <TouchableOpacity 
  onPress={() => {
    console.log('Navigating to categories...');
    router.push('/categories');
  }}
  style={styles.seeAllButton}
>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color="#4D9F8D" />
            </TouchableOpacity>
          </View>

          <View style={styles.categoryGrid}>
            <CategoryItem 
              title="Food" 
              icon="utensils" 
              onPress={() => handleCategoryPress("Food", "utensils")}
            />
            <CategoryItem 
              title="Transport" 
              icon="bus" 
              onPress={() => handleCategoryPress("Transport", "bus")}
            />
            <CategoryItem 
              title="Shopping" 
              icon="shopping-bag" 
              onPress={() => handleCategoryPress("Shopping", "shopping-bag")}
            />
            <CategoryItem 
              title="Housing" 
              icon="home" 
              onPress={() => handleCategoryPress("Housing", "home")}
            />
          </View>
        </Animated.View>
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
  const lowerName = transaction.name?.toLowerCase() || '';
  
  // Check for specific service icons first
  if (lowerName.includes('upwork')) {
    return {
      type: 'image' as const,
      iconSource: require('@/assets/upwork.png')
    };
  } else if (lowerName.includes('paypal')) {
    return {
      type: 'image' as const,
      iconSource: require('@/assets/paypal.png')
    };
  } else if (lowerName.includes('youtube')) {
    return {
      type: 'image' as const,
      iconSource: require('@/assets/youtube.png')
    };
  }
  
  // Default to arrows for income/expense
  if (transaction.type === 'income') {
    return {
      type: 'arrow' as const,
      iconName: 'arrow-up'
    };
  } else {
    return {
      type: 'arrow' as const,
      iconName: 'arrow-down'
    };
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
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
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  balanceContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refreshButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#343A40',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: '#4D9F8D',
    marginVertical: 10,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  financeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
    width: '48%',
  },
  financeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  financeLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  financeAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  sectionContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4D9F8D',
    marginRight: 4,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#343A40',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6C757D',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#343A40',
  },
  noTransactionsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6C757D',
    marginTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default HomeScreen;