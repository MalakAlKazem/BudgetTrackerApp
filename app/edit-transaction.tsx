import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTransactions, Category, Transaction } from '../context/TransactionContext';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const EditTransactionScreen = () => {
  const router = useRouter();
  const { transactionId } = useLocalSearchParams();
  const { transactions, categories, updateTransaction } = useTransactions();
  
  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [isScheduled, setIsScheduled] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [invoice, setInvoice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  // Load transaction data
  useEffect(() => {
    if (transactionId && typeof transactionId === 'string' && transactions.length > 0) {
      const transactionToEdit = transactions.find(t => t.id === transactionId);

      if (transactionToEdit) {
        console.log('Loading transaction for edit:', transactionToEdit);
        
        // Populate form fields
        setTitle(transactionToEdit.name || '');
        setAmount(transactionToEdit.amount?.toString() || '');
        setDate(new Date(transactionToEdit.date));
        setType(transactionToEdit.type || 'expense');
        setIsScheduled(!!transactionToEdit.isRecurring);
        setInvoice(transactionToEdit.invoiceImage || null);

        // Find and set category
        if (transactionToEdit.category) {
          const category = categories.find(cat => 
            cat.name.toLowerCase() === transactionToEdit.category?.toLowerCase()
          );
          if (category) {
            setSelectedCategory(category);
          }
        }
      } else {
        Alert.alert('Error', 'Transaction not found');
        router.back();
      }
    }
  }, [transactionId, transactions, categories]);

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setDatePickerVisibility(false);
    if (selectedDate) {
      setDate(selectedDate);
      
      // Auto-check scheduled if future date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newDate = new Date(selectedDate);
      newDate.setHours(0, 0, 0, 0);
      
      if (newDate > today) {
        setIsScheduled(true);
      }
    }
  };

  const handleUpdateTransaction = async () => {
    if (!title.trim() || !amount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedTransactionData: Transaction = {
        id: transactionId as string,
        name: title.trim(),
        amount: parsedAmount,
        type,
        category: selectedCategory.name,
        date: date,
        isRecurring: isScheduled,
        isPaid: !isScheduled,
        recurrenceInterval: isScheduled ? 'monthly' : null,
        invoiceImage: invoice
      };

      await updateTransaction(updatedTransactionData);
      
      Alert.alert('Success', 'Transaction updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating transaction:', error);
      Alert.alert('Error', 'Failed to update transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategoryModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Category</Text>
          <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.categoryList}>
          {categories
            .filter(cat => cat.type === type || cat.type === 'both')
            .map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryOption,
                  selectedCategory?.id === category.id && styles.selectedCategoryOption
                ]}
                onPress={() => {
                  setSelectedCategory(category);
                  setCategoryModalVisible(false);
                }}
              >
                <FontAwesome5 name={category.icon} size={20} color="#4D9F8D" />
                <Text style={styles.categoryOptionText}>{category.name}</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4D9F8D" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Edit Transaction</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formContainer}>
              
              {/* Transaction Type Toggle */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TYPE</Text>
                <View style={styles.toggleContainer}>
                  <TouchableOpacity
                    style={[styles.toggleButton, type === 'expense' && styles.selectedToggle]}
                    onPress={() => {
                      setType('expense');
                      setSelectedCategory(null); // Reset category when type changes
                    }}
                  >
                    <Text style={[styles.toggleText, type === 'expense' && styles.selectedToggleText]}>
                      Expense
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.toggleButton, type === 'income' && styles.selectedToggle]}
                    onPress={() => {
                      setType('income');
                      setSelectedCategory(null); // Reset category when type changes
                    }}
                  >
                    <Text style={[styles.toggleText, type === 'income' && styles.selectedToggleText]}>
                      Income
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Title Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TITLE *</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Enter transaction title"
                  placeholderTextColor="#aaa"
                />
              </View>

              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>AMOUNT *</Text>
                <TextInput
                  style={styles.input}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor="#aaa"
                  keyboardType="numeric"
                />
              </View>

              {/* Category Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CATEGORY *</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  {selectedCategory ? (
                    <View style={styles.selectedCategoryContainer}>
                      <FontAwesome5 name={selectedCategory.icon} size={20} color="#4D9F8D" />
                      <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.categorySelectorPlaceholder}>Select a category</Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color="#aaa" />
                </TouchableOpacity>
              </View>

              {/* Date Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DATE</Text>
                <TouchableOpacity
                  style={styles.dateSelector}
                  onPress={() => setDatePickerVisibility(true)}
                >
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                  <Ionicons name="calendar" size={20} color="#4D9F8D" />
                </TouchableOpacity>
                
                {isDatePickerVisible && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                  />
                )}
              </View>

              {/* Scheduled Toggle */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <View>
                    <Text style={styles.switchLabel}>Scheduled Transaction</Text>
                    <Text style={styles.switchDescription}>
                      Mark as scheduled for future payment
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switch, isScheduled && styles.switchActive]}
                    onPress={() => setIsScheduled(!isScheduled)}
                  >
                    <View style={[styles.switchThumb, isScheduled && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Update Button */}
              <TouchableOpacity
                style={[styles.updateButton, isSubmitting && styles.updateButtonDisabled]}
                onPress={handleUpdateTransaction}
                disabled={isSubmitting}
              >
                <Text style={styles.updateButtonText}>
                  {isSubmitting ? 'Updating...' : 'Update Transaction'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      {isCategoryModalVisible && renderCategoryModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  headerText: {
    flex: 1,
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedToggle: {
    backgroundColor: '#4D9F8D',
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  selectedToggleText: {
    color: '#fff',
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  categorySelectorPlaceholder: {
    fontSize: 16,
    color: '#aaa',
  },
  dateSelector: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  switch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#4D9F8D',
  },
  switchThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  switchThumbActive: {
    transform: [{ translateX: 20 }],
  },
  updateButton: {
    backgroundColor: '#4D9F8D',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonDisabled: {
    backgroundColor: '#aaa',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 12,
    maxHeight: '70%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedCategoryOption: {
    backgroundColor: '#f0f9f7',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
});

export default EditTransactionScreen;