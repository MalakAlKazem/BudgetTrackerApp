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
import { useTransactions} from '../context/TransactionContext';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { Stack } from 'expo-router';

const TransactionsScreen: React.FC = () => {
  const { transactions, categories, isLoading, refreshTransactions, markTransactionAsPaid, deleteTransaction } = useTransactions();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');

  useEffect(() => {
    if (refreshTransactions) {
      refreshTransactions();
    }
  }, []);

  // Helper function to get category info
  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId);
  };

  // Filtering and sorting transactions
  const filteredTransactions = transactions
    .filter(t => {
      switch (filter) {
        case 'all':
          return true;
        case 'income':
          return t.type === 'income';
        case 'expense':
          return t.type === 'expense';
        case 'pending':
          return !t.isPaid; // Show unpaid transactions
        default:
          return true;
      }
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
    // First check if there's a category with an icon
    if (transaction.category) {
      const categoryInfo = getCategoryInfo(transaction.category);
      if (categoryInfo) {
        return categoryInfo.icon;
      }
    }


    // Fallback to name-based icons
    const name = transaction.name?.toLowerCase() || '';
    if (name.includes('upwork')) return require('@/assets/upwork.png');
    if (name.includes('paypal')) return require('@/assets/paypal.png');
    if (name.includes('youtube')) return require('@/assets/youtube.png');
    if (name.includes('transfer')) return require('@/assets/transfer.png');
    
    // Default fallback
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
    return transactions.filter(t => !t.isPaid).length;
  };

  const handleMarkAsPaid = async (transactionId: string) => {
    try {
      await markTransactionAsPaid(transactionId);
    } catch (error) {
      console.error('Error marking transaction as paid:', error);
    }
  };
  const handleDeleteTransaction = async (id: string) => {
  try {
    await deleteTransaction(id);
  } catch (e) {
    console.error("Failed to delete:", e);
  }
};

  const renderTransactionIcon = (transaction: any) => {
    const iconSource = getIconForTransaction(transaction);
    
    // If it's a FontAwesome icon name (string), render FontAwesome5 component
    if (typeof iconSource === 'string') {
      return (
        <View style={styles.iconContainer}>
          <FontAwesome5 name={iconSource} size={20} color="#4D9F8D" />
        </View>
      );
    }
    
    // Otherwise render as Image
    return (
      <Image 
        source={iconSource} 
        style={styles.transactionIcon} 
      />
    );
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
              <Ionicons name="receipt-outline" size={64} color="#ccc" />
              <Text style={styles.emptyText}>
                {filter === 'pending' 
                  ? "No pending transactions" 
                  : filter === 'income'
                  ? "No income transactions"
                  : filter === 'expense'
                  ? "No expense transactions"
                  : "No transactions found"}
              </Text>
              <Text style={styles.emptySubText}>
                Add your first transaction to get started
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredTransactions}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              renderItem={({ item }) => {
                const categoryInfo = getCategoryInfo(item.category || '');
                
                return (
                  <View style={[
                    styles.transactionItem,
                    !item.isPaid && styles.pendingTransaction
                  ]}>
                    {renderTransactionIcon(item)}
                    
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionName}>{item.name}</Text>
                      <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
                     
                      {categoryInfo && (
                        <Text style={styles.transactionCategory}>{categoryInfo.name}</Text>
                      )}
                      {!item.isPaid && (
                        <Text style={styles.pendingLabel}>Pending</Text>
                      )}
                    </View>
                    
                    <View style={styles.transactionRight}>
                      <Text 
                        style={[
                          styles.transactionAmount, 
                          item.type === 'income' ? styles.income : styles.expense
                        ]}
                      >
                        {item.type === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                      </Text>
                      
                      {!item.isPaid && (
                        <TouchableOpacity 
                          style={styles.markPaidButton}
                          onPress={() => handleMarkAsPaid(item.id)}
                        >
                          <Text style={styles.markPaidButtonText}>Mark Paid</Text>
                        </TouchableOpacity>
                      )}
                       {/* TRASH ICON BELOW PRICE */}
           <TouchableOpacity onPress={() => handleDeleteTransaction(item.id)}>
  <Ionicons name="trash-bin" size={20} color="#B00020" />
</TouchableOpacity>
                    </View>
                  </View>
                );
              }}
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
  pendingTransaction: {
    backgroundColor: '#FFF9E6',
    borderLeftWidth: 4,
    borderLeftColor: '#FFA500',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
    marginBottom: 2,
  },
  pendingLabel: {
    fontSize: 11,
    color: '#FFA500',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  income: {
    color: '#4CAF50',
  },
  expense: {
    color: '#F44336',
  },
  markPaidButton: {
    backgroundColor: '#4D9F8D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  markPaidButtonText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    color: '#aaa',
    fontSize: 14,
  },
});

export default TransactionsScreen;