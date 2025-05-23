import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useTransactions } from '@/app/context/TransactionContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const TransactionsScreen: React.FC = () => {
  const { transactions, isLoading, refreshTransactions } = useTransactions();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    if (refreshTransactions) {
      refreshTransactions();
    }
  }, []);

  // Filtering and sorting transactions
  const filteredTransactions = transactions
    .filter(t => {
      if (filter === 'all') return true;
      // Since we removed isPaid, pending filter cannot work properly; interpret pending as all expenses for now
      if (filter === 'pending') return t.type === 'expense';
      return t.type === filter;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } else {
        return b.amount - a.amount;
      }
    });

  const onRefresh = async () => {
    setRefreshing(true);
    if (refreshTransactions) {
      await refreshTransactions();
    }
    setRefreshing(false);
  };

  const getIconForTransaction = (transaction: any) => {
    const name = transaction.title?.toLowerCase() || '';
    if (name.includes('upwork')) return require('@/assets/upwork.png');
    if (name.includes('paypal')) return require('@/assets/paypal.png');
    if (name.includes('youtube')) return require('@/assets/youtube.png');
    if (name.includes('transfer')) return require('@/assets/transfer.png');
    // fallback icon based on type
    return transaction.type === 'income'
      ? require('@/assets/transfer.png')
      : require('@/assets/profile-avatar.png');
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPendingCount = () => {
    // Without isPaid, pending count means all expenses for now
    return transactions.filter(t => t.type === 'expense').length;
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#4D9F8D" />
          </TouchableOpacity>
          <Text style={styles.title}>All Transactions</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Filter and Sort Controls */}
        <View style={styles.controls}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScrollView}>
            <View style={styles.filterContainer}>
              <TouchableOpacity 
                style={[styles.filterButton, filter === 'all' && styles.activeFilter]}
                onPress={() => setFilter('all')}
              >
                <Text style={[styles.filterText, filter === 'all' && styles.activeFilterText]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, filter === 'income' && styles.activeFilter]}
                onPress={() => setFilter('income')}
              >
                <Text style={[styles.filterText, filter === 'income' && styles.activeFilterText]}>Income</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, filter === 'expense' && styles.activeFilter]}
                onPress={() => setFilter('expense')}
              >
                <Text style={[styles.filterText, filter === 'expense' && styles.activeFilterText]}>Expenses</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.filterButton, filter === 'pending' && styles.activeFilter]}
                onPress={() => setFilter('pending')}
              >
                <View style={styles.pendingFilterContent}>
                  <Text style={[styles.filterText, filter === 'pending' && styles.activeFilterText]}>Pending</Text>
                  {getPendingCount() > 0 && (
                    <View style={styles.pendingBadgeContainer}>
                      <Text style={styles.pendingBadgeText}>{getPendingCount()}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.sortContainer}>
            <Text style={styles.sortLabel}>Sort by:</Text>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'date' && styles.activeSort]}
              onPress={() => setSortBy('date')}
            >
              <Text style={[styles.sortText, sortBy === 'date' && styles.activeSortText]}>Date</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sortButton, sortBy === 'amount' && styles.activeSort]}
              onPress={() => setSortBy('amount')}
            >
              <Text style={[styles.sortText, sortBy === 'amount' && styles.activeSortText]}>Amount</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions List */}
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4D9F8D']}
            />
          }
          contentContainerStyle={styles.scrollViewContent}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4D9F8D" />
            </View>
          ) : filteredTransactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {filter === 'pending' 
                  ? "No pending transactions" 
                  : "No transactions found"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.transactionItem}>
                  <Image 
                    source={getIconForTransaction(item)} 
                    style={styles.transactionIcon} 
                  />
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{item.name}</Text>
                    <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                    {item.category && (
                      <Text style={styles.transactionCategory}>{item.category}</Text>
                    )}
                  </View>
                  <Text 
                    style={[
                      styles.transactionAmount, 
                      item.type === 'income' ? styles.income : styles.expense
                    ]}
                  >
                    {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                  </Text>
                </View>
              )}
            />
          )}
        </ScrollView>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingTop: 25,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    marginBottom: 16,
  },
  filterScrollView: {
    marginBottom: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    marginHorizontal: 4,
    borderRadius: 8,
  },
  activeFilter: {
    backgroundColor: '#4D9F8D',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  activeFilterText: {
    color: '#FFF',
  },
  pendingFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingBadgeContainer: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  pendingBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortLabel: {
    marginRight: 8,
    color: '#666',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#E8E8E8',
  },
  activeSort: {
    backgroundColor: '#4D9F8D',
  },
  sortText: {
    color: '#666',
  },
  activeSortText: {
    color: '#FFF',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  transactionCategory: {
    fontSize: 12,
    color: '#4D9F8D',
    backgroundColor: '#DFF2ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});

export default TransactionsScreen;

