import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactions, Transaction } from '../context/TransactionContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CategoryTransactionsScreen = () => {
  const router = useRouter();
  const { categoryName, categoryIcon, categoryType } = useLocalSearchParams();
  const { transactions } = useTransactions();
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [previewTransaction, setPreviewTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    if (categoryName && typeof categoryName === 'string') {
      const filtered = transactions.filter(
        transaction => transaction.category?.toLowerCase() === categoryName.toLowerCase()
      );
      setFilteredTransactions(filtered);
    }
  }, [transactions, categoryName]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getTotalAmount = (): number => {
    return filteredTransactions.reduce((total, transaction) => {
      return transaction.isPaid ? total + transaction.amount : total;
    }, 0);
  };

  const getPendingAmount = (): number => {
    return filteredTransactions.reduce((total, transaction) => {
      return !transaction.isPaid ? total + transaction.amount : total;
    }, 0);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity 
      style={styles.transactionItem}
      onPress={() => {
        setPreviewTransaction(item);
      }}
    >
      <View style={styles.transactionLeft}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.isPaid ? '#4CAF50' : '#FF9800' }
        ]} />
        
        <View style={styles.transactionDetails}>
          <Text style={styles.transactionName}>{item.name}</Text>
          <Text style={styles.transactionDate}>{formatDate(item.date)}</Text>
          {!item.isPaid && (
            <Text style={styles.pendingText}>Pending</Text>
          )}
        </View>
      </View>
      
      <View style={styles.transactionRight}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'income' ? '#4CAF50' : '#F44336' }
        ]}>
          {item.type === 'income' ? '+' : '-'}{formatAmount(item.amount)}
        </Text>
        
        {item.isRecurring && (
          <View style={styles.recurringBadge}>
            <Text style={styles.recurringText}>Recurring</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
const renderPreviewModal = () => (
  <Modal
    visible={previewTransaction !== null}
    transparent={true}
    animationType="slide"
    onRequestClose={() => setPreviewTransaction(null)}
  >
    <View style={styles.modalOverlay}>
      <View style={styles.previewModalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Transaction Details</Text>
          <TouchableOpacity onPress={() => setPreviewTransaction(null)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
         
        {previewTransaction && (
          <View style={styles.modalDetailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Name:</Text>
              <Text style={styles.detailValue}>{previewTransaction.name || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>
                ${previewTransaction.amount ? previewTransaction.amount.toFixed(2) : '0.00'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>{previewTransaction.type || 'N/A'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category:</Text>
              <Text style={styles.detailValue}>{previewTransaction.category || 'Uncategorized'}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {previewTransaction.date ? formatDate(previewTransaction.date) : 'N/A'}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <Text style={styles.detailValue}>
                {previewTransaction.isPaid !== undefined ? 
                  (previewTransaction.isPaid ? 'Paid' : 'Pending') : 'Unknown'}
              </Text>
            </View>
            
            {previewTransaction.isRecurring && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recurring:</Text>
                <Text style={styles.detailValue}>Yes</Text>
              </View>
            )}
          </View>
        )}
         
        <View style={styles.modalActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              setPreviewTransaction(null);
              router.push({
                pathname: '/(tabs)/AddBudget',
                params: {
                  transactionName: previewTransaction?.name || '',
                  transactionAmount: previewTransaction?.amount?.toString() || '0',
                  transactionType: previewTransaction?.type || 'expense',
                  categoryName: previewTransaction?.category || '',
                  transactionDate: previewTransaction?.date?.toISOString() || new Date().toISOString(),
                  isRecurring: previewTransaction?.isRecurring?.toString() || 'false',
                  invoiceImage: previewTransaction?.invoiceImage || '',
                  duplicateMode: 'true'
                },
              });
            }}
          >
            <Ionicons name="copy-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Spend Again</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              setPreviewTransaction(null);
              router.push({
                pathname: '/edit-transaction',
                params: { transactionId: previewTransaction?.id || '' },
              });
            }}
          >
            <Ionicons name="pencil-outline" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <FontAwesome5 
            name={categoryIcon as string || 'folder'} 
            size={24} 
            color="#fff" 
          />
          <Text style={styles.headerTitle}>{categoryName}</Text>
        </View>
        
        <View style={styles.headerRight} />
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total {categoryType === 'income' ? 'Income' : 'Expenses'}</Text>
          <Text style={[
            styles.summaryAmount,
            { color: categoryType === 'income' ? '#4CAF50' : '#F44336' }
          ]}>
            {formatAmount(getTotalAmount())}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pending</Text>
          <Text style={styles.summaryAmount}>
            {formatAmount(getPendingAmount())}
          </Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryCount}>
            {filteredTransactions.length}
          </Text>
        </View>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="receipt" size={40} color="#ddd" />
              <Text style={styles.emptyText}>No transactions found</Text>
              <Text style={styles.emptySubText}>
                No transactions for this category yet
              </Text>
              
              <TouchableOpacity 
                style={styles.addTransactionButton}
                onPress={() => {
                  router.push({
                    pathname: '/AddBudget',
                    params: { categoryName: categoryName }
                  });
                }}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addTransactionText}>Add Transaction</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={
            filteredTransactions.length === 0 ? styles.emptyList : styles.listContent
          }
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* Floating Add Button */}
      {filteredTransactions.length > 0 && (
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => {
            router.push({
              pathname: '/AddBudget',
              params: { categoryName: categoryName }
            });
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      )}
          {renderPreviewModal()}

    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  header: {
    backgroundColor: '#4D9F8D',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  headerRight: {
    width: 40,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  modalDetailsContainer: { // ✅ New name to avoid conflict
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4D9F8D',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 100,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 15,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '500',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  recurringBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recurringText: {
    fontSize: 10,
    color: '#1976D2',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
    modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.7,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
   actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4D9F8D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#FF9800',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#888',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  addTransactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4D9F8D',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addTransactionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#4D9F8D',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default CategoryTransactionsScreen;