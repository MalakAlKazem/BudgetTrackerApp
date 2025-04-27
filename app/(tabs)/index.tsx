import React from 'react';
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
} from 'react-native';
import { Ionicons} from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTransactions } from '@/app/context/TransactionContext';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

type Transaction = {
  id: string;
  name: string;
  amount: string;
  date: string;
  icon: any;
  color: string;
};
type CategoryItemProps = {
  title: string;
  icon: string;
};

const CategoryItem: React.FC<CategoryItemProps> = ({ title, icon }) => (
  <View style={styles.categoryItem}>
    <FontAwesome5 name={icon} size={20} color="#343A40" />
    <Text style={styles.categoryText}>{title}</Text>
  </View>
);

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { transactions, getBalance, getTotalIncome, getTotalExpenses } = useTransactions();

  // Format transactions for display
  const formattedTransactions = transactions
    .slice() // Create a copy
    .sort((a, b) => b.date.getTime() - a.date.getTime()) // Sort by date (newest first)
    .slice(0, 4) // Take only the 4 most recent
    .map(t => ({
      id: t.id,
      name: t.name,
      amount: `${t.type === 'income' ? '+ ' : '- '}$${t.amount.toFixed(2)}`,
      date: formatDate(t.date),
      icon: getIconForTransaction(t),
      color: t.type === 'income' ? '#4CAF50' : '#F44336',
    }));

  const renderItem: ListRenderItem<typeof formattedTransactions[0]> = ({ item }) => (
    <View style={styles.transactionItem}>
      <Image source={item.icon} style={styles.transactionIcon} />
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionName}>{item.name}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.color }]}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.backgroundContainer}>
          <Image
            source={require('@/assets/Rectangle.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Good afternoon,</Text>
          <Text style={styles.userName}>Enjelin Morgeana</Text>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.sectionTitle}>Total Balance</Text>
          <Text style={styles.balanceAmount}>${getBalance().toFixed(2)}</Text>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.financeBox}>
              <Text style={styles.financeLabel}>Income</Text>
              <Text style={[styles.financeAmount, styles.incomeText]}>
                ${getTotalIncome().toFixed(2)}
              </Text>
            </View>
            <View style={styles.financeBox}>
              <Text style={styles.financeLabel}>Expenses</Text>
              <Text style={[styles.financeAmount, styles.expenseText]}>
                ${getTotalExpenses().toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push('/transactions')}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {formattedTransactions.length > 0 ? (
            <FlatList
              data={formattedTransactions}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noTransactionsText}>No transactions yet</Text>
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spend Again</Text>
            <TouchableOpacity onPress={() => router.push('/categories')}>
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

// Helper functions
function formatDate(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

function getIconForTransaction(transaction: any) {
  // You can customize this based on your transaction categories
  if (transaction.name.toLowerCase().includes('upwork')) {
    return require('@/assets/upwork.png');
  } else if (transaction.name.toLowerCase().includes('paypal')) {
    return require('@/assets/paypal.png');
  } else if (transaction.name.toLowerCase().includes('youtube')) {
    return require('@/assets/youtube.png');
  } else if (transaction.type === 'income') {
    return require('@/assets/transfer.png');
  } else {
    return require('@/assets/upwork.png');
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
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 16,
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: height * 0.02,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4D9F8D',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#343A40',
    marginVertical: 10,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financeBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    width: '48%',
  },
  financeLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
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
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 14,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#388984',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    color: '#343A40',
  },
  noTransactionsText: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 20,
    fontStyle: 'italic',
  },
});

export default HomeScreen;
