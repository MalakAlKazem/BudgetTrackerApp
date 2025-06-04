import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
  Keyboard,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Alert,
  Switch,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Category, useTransactions } from '../../context/TransactionContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { insertTransaction } from '../../utils/database';
import { useAuth } from '../../context/AuthContext';
import { Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

const AddBudget = () => {
  const router = useRouter();
  const { addTransaction, categories, addCategory, refreshTransactions, transactions, updateTransaction } = useTransactions();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [invoice, setInvoice] = useState<string | null>(null);
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [isScheduled, setIsScheduled] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shopping-bag');
  const [isSubmitting, setIsSubmitting] = useState(false);

 const formatDate = (date: Date): string => {
  return date.getFullYear() + '-' + 
         String(date.getMonth() + 1).padStart(2, '0') + '-' + 
         String(date.getDate()).padStart(2, '0');
};
  
  const availableIcons = [
    'shopping-bag', 'utensils', 'bus', 'home', 'tshirt', 'gamepad',
    'coffee', 'plane', 'graduation-cap', 'car', 'gift', 'medkit',
    'dumbbell', 'book', 'baby', 'paw', 'laptop', 'music',
    'film', 'glass-cheers', 'briefcase', 'dollar-sign', 'file-invoice',
    'money-bill-wave', 'piggy-bank', 'hand-holding-usd'
  ];

  // Enhanced clear function that resets everything to initial state
  const clearFormCompletely = () => {
    setTitle('');
    setAmount('');
    setSelectedCategory(null);
    setInvoice(null);
    setDate(new Date());
    setIsScheduled(false);
    setType('expense'); // Reset to default
    setNewCategoryName('');
    setSelectedIcon('shopping-bag');
    
    // Close any open modals
    setCategoryModalVisible(false);
    setAddCategoryModalVisible(false);
    setDatePickerVisibility(false);
    
    // Dismiss keyboard if open
    Keyboard.dismiss();
  };

const { selectedDate, transactionId, categoryName } = useLocalSearchParams();

useEffect(() => {
  if (transactionId && typeof transactionId === 'string' && transactions.length > 0) {
    // Find the transaction to edit
    const transactionToEdit = transactions.find(t => t.id === transactionId);

    if (transactionToEdit) {
      console.log('Found transaction to edit:', transactionToEdit); // Debug log
      console.log('Available categories:', categories); // Debug log
      
      // Populate the form fields with the transaction data
      setTitle(transactionToEdit.name || '');
      setAmount(transactionToEdit.amount?.toString() || '');
      setDate(transactionToEdit.date ? new Date(transactionToEdit.date) : new Date());
      setType(transactionToEdit.type || 'expense');
      setIsScheduled(!!transactionToEdit.isRecurring);
      setInvoice(transactionToEdit.invoiceImage || null);

      // Find and set the category object by name
      if (transactionToEdit.category) {
        const category = categories.find(cat => cat.name === transactionToEdit.category);
        console.log('Found category:', category); // Debug log
        if (category) {
          setSelectedCategory(category);
        } else {
          // If category not found, try to find "Other" category
          const otherCategory = categories.find(cat => cat.name === 'Other');
          setSelectedCategory(otherCategory || null);
        }
      }
    }
  } else if (selectedDate && typeof selectedDate === 'string') {
    // Existing logic for setting date from selectedDate params
    const [year, month, day] = selectedDate.split('-').map(Number);
    const parsedDate = new Date(year, month - 1, day);
    setDate(parsedDate);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parsedDate.setHours(0, 0, 0, 0);

    if (parsedDate > today) {
      setIsScheduled(true);
    }
  }  // NEW: Handle category selection from HomeScreen
    if (categoryName && typeof categoryName === 'string' && categories.length > 0) {
      const category = categories.find(cat => 
        cat.name.toLowerCase() === categoryName.toLowerCase()
      );
      
      if (category) {
        console.log('Pre-selecting category from HomeScreen:', category);
        setSelectedCategory(category);
        
        // Set the type based on the category type if it's not 'both'
        if (category.type === 'income' || category.type === 'expense') {
          setType(category.type);
        }
      } else {
        console.log('Category not found, available categories:', categories.map(c => c.name));
      }
    } 
if (!transactionId && !selectedDate && !categoryName) {
      clearFormCompletely();
    }
  }, [selectedDate, transactionId, categoryName, transactions, categories]); // Add dependencies

// Also update the handleDateChange function to ensure consistency:
const handleDateChange = (selectedDate?: Date) => {
  if (selectedDate) {
    console.log('Date changed to:', selectedDate.toDateString()); // Debug log
    setDate(selectedDate);
    
    // Auto-check scheduled if it's a future date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newDate = new Date(selectedDate);
    newDate.setHours(0, 0, 0, 0);
    
    if (newDate > today) {
      setIsScheduled(true);
    } else {
      setIsScheduled(false);
    }
  }
};
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleSubmit = async () => {
    if (!title || !amount || !selectedCategory) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const transactionData = {
        name: title,
        amount: parseFloat(amount),
        type,
        category: selectedCategory.id,
        date: new Date(date),
        isScheduled,
        userId: user?.uid,
        createdAt: new Date().toISOString(),
        isPaid: !isScheduled,
        isRecurring: isScheduled,
        recurrenceInterval: isScheduled ? 'monthly' : null,
        invoiceImage: invoice
      };

      await insertTransaction(
        title,
        parseFloat(amount),
        date.toISOString(),
        type,
        selectedCategory.id,
        isScheduled,
        invoice
      );

      // Add to context (in memory)
      try {
        await addTransaction(transactionData);
      } catch (contextError) {
        console.warn('Context update failed, but transaction was saved to database:', contextError);
      }
        
      // Trigger refresh in other components
      if (refreshTransactions) {
        await refreshTransactions();
      }

      Alert.alert('Success', 'Transaction added successfully');
      router.back();
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Error', 'Failed to add transaction');
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    try {
      const newCategory = await addCategory({
        name: newCategoryName.trim(),
        icon: selectedIcon,
        type: type,
      });

      setSelectedCategory(newCategory);
      setNewCategoryName('');
      setAddCategoryModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
      console.error(error);
    }
  };

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets?.[0]) {
      setInvoice(result.assets[0].uri);
    }
  };

  // Helper function to check if date is in the future
  const isFutureDate = (selectedDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate > today;
  };

  const filteredCategories = categories.filter(cat => cat.type === type || cat.type === 'both');

  // Also update the handleSubmit function to handle updates
  const handleUpdateTransaction = async () => {
    if (!title || !amount || !selectedCategory || !transactionId || typeof transactionId !== 'string') {
      Alert.alert('Error', 'Please fill in all fields and ensure transaction ID is present.');
      return;
    }

    try {
        setIsSubmitting(true);
        const updatedTransactionData = {
            id: transactionId as string,
            name: title,
            amount: parseFloat(amount),
            type,
            category: selectedCategory.name,
            date: new Date(date),
            isRecurring: isScheduled,
            userId: user?.uid,
            createdAt: new Date().toISOString(),
            isPaid: !isScheduled,
            recurrenceInterval: isScheduled ? 'monthly' : null,
            invoiceImage: invoice
        };

        // Update the transaction using the context function
        await updateTransaction(updatedTransactionData);
        
        Alert.alert('Success', 'Transaction updated successfully');
        router.back();
    } catch (error) {
        console.error('Error updating transaction:', error);
        Alert.alert('Error', 'Failed to update transaction');
    } finally {
        setIsSubmitting(false);
    }
  };

  // Modify handleSubmit to call either add or update
  const handleFinalSubmit = async () => {
    if (transactionId) {
        // If transactionId exists, call the update handler
        handleUpdateTransaction();
    } else {
        // Otherwise, call the existing add handler
        handleSubmit(); // This is your original handleSubmit function
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4D9F8D" />
      
      <View style={styles.backgroundContainer}>
        <Image source={require('@/assets/Rectangle.png')} style={styles.backgroundImage} resizeMode="cover" />
      </View>

      {!keyboardVisible && (
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Add {type === 'income' ? 'Income' : 'Expense'}</Text>
          <TouchableOpacity 
            style={styles.resetButton} 
            onPress={clearFormCompletely}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoidView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formContainer}>
              {/* Type Toggle */}
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleButton, type === 'expense' && styles.selectedToggle]}
                  onPress={() => setType('expense')}
                >
                  <Text style={[styles.toggleText, type === 'expense' && styles.selectedText]}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleButton, type === 'income' && styles.selectedToggle]}
                  onPress={() => setType('income')}
                >
                  <Text style={[styles.toggleText, type === 'income' && styles.selectedText]}>Income</Text>
                </TouchableOpacity>
              </View>

              {/* Title */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TITLE</Text>
                <TextInput
                  style={styles.input}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Netflix Subscription"
                />
              </View>

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CATEGORY</Text>
                <TouchableOpacity 
                  style={styles.categorySelector}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  {selectedCategory ? (
                    <View style={styles.selectedCategoryContainer}>
                      <FontAwesome5 name={selectedCategory.icon} size={18} color="#4D9F8D" />
                      <Text style={styles.selectedCategoryText}>{selectedCategory.name}</Text>
                    </View>
                  ) : (
                    <Text style={styles.categorySelectorText}>Select a category</Text>
                  )}
                  <Ionicons name="chevron-down" size={20} color="#888" />
                </TouchableOpacity>
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>AMOUNT</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol}>$</Text>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    value={amount}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
                    placeholder="0.00"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DATE</Text>
                <TouchableOpacity onPress={() => setDatePickerVisibility(true)}>
                  <Text style={styles.dateText}>{formatDate(date)}</Text>
                </TouchableOpacity>
                {isFutureDate(date) && (
                  <Text style={styles.futureDateNote}>
                    Future date detected - transaction will be automatically scheduled
                  </Text>
                )}
                {isDatePickerVisible && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setDatePickerVisibility(false);
                      if (selectedDate) handleDateChange(selectedDate);
                    }}
                    
                  />
                
                )}
              </View>

              {/* Scheduled */}
              <View style={styles.inputGroup}>
                <View style={styles.switchContainer}>
                  <View>
                    <Text style={styles.label}>SCHEDULED</Text>
                    {isFutureDate(date) && (
                      <Text style={styles.scheduledNote}>
                        Auto-enabled for future dates
                      </Text>
                    )}
                  </View>
                  <Switch
                    value={isScheduled}
                    onValueChange={setIsScheduled}
                    trackColor={{ false: '#767577', true: '#4D9F8D' }}
                    thumbColor={isScheduled ? '#f4f3f4' : '#f4f3f4'}
                  />
                </View>
              </View>

              {/* Invoice */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>INVOICE (OPTIONAL)</Text>
                <TouchableOpacity style={styles.invoiceButton} onPress={pickImage}>
                  <Text style={styles.invoiceButtonText}>
                    {invoice ? 'Change Invoice' : 'Add Invoice'}
                  </Text>
                </TouchableOpacity>
                {invoice && (
                  <Image source={{ uri: invoice }} style={styles.invoiceImage} />
                )}
              </View>

              {/* Submit Button */}
              <Button
                mode="contained"
                onPress={handleFinalSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.addButton}
                labelStyle={styles.addButtonLabel}
              >
                {transactionId ? 'Save Changes' : (isScheduled ? 'Schedule Transaction' : 'Add Transaction')}
              </Button>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      <Modal
        visible={isCategoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => {
                    setSelectedCategory(item);
                    setCategoryModalVisible(false);
                  }}
                >
                  <FontAwesome5 name={item.icon} size={20} color="#4D9F8D" />
                  <Text style={styles.categoryItemText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              numColumns={2}
              contentContainerStyle={styles.categoryGrid}
              ListEmptyComponent={
                <Text style={styles.emptyCategoryText}>No categories found. Add a new one!</Text>
              }
            />

            <TouchableOpacity
              style={styles.addCategoryButton}
              onPress={() => {
                setCategoryModalVisible(false);
                setAddCategoryModalVisible(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="#4D9F8D" />
              <Text style={styles.addCategoryButtonText}>Add New Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        visible={isAddCategoryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => setAddCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Category name"
              autoFocus
            />

            <Text style={styles.label}>Select Icon:</Text>
            <FlatList
              data={availableIcons}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.iconItem,
                    selectedIcon === item && styles.selectedIconItem
                  ]}
                  onPress={() => setSelectedIcon(item)}
                >
                  <FontAwesome5 name={item} size={24} color="#4D9F8D" />
                </TouchableOpacity>
              )}
              numColumns={5}
              contentContainerStyle={styles.iconGrid}
            />

            <TouchableOpacity
              style={[
                styles.addButton,
                !newCategoryName.trim() && styles.disabledButton
              ]}
              onPress={handleAddNewCategory}
              disabled={!newCategoryName.trim()}
            >
              <Text style={styles.addButtonText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.35,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 40 : 60,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    padding: 8,
  },
  resetButton: {
    padding: 8,
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    backgroundColor: 'white',
    marginTop: height * 0.02,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
    fontSize: 16,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
    marginLeft: 10,
  },
  currencySymbol: {
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#4D9F8D',
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  selectedToggle: {
    backgroundColor: '#4D9F8D',
  },
  toggleText: {
    fontSize: 16,
    color: '#4D9F8D',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    fontSize: 16,
    paddingVertical: 8,
  },
  futureDateNote: {
    fontSize: 12,
    color: '#4D9F8D',
    marginTop: 4,
    fontStyle: 'italic',
  },
  scheduledNote: {
    fontSize: 12,
    color: '#4D9F8D',
    marginTop: 2,
  },
  reminderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9f7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  reminderText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#4D9F8D',
    flex: 1,
  },
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 8,
  },
  selectedCategoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedCategoryText: {
    marginLeft: 10,
    fontSize: 16,
  },
  categorySelectorText: {
    fontSize: 16,
    color: '#888',
  },
  invoiceButton: {
    borderWidth: 1,
    borderColor: '#4D9F8D',
    borderRadius: 5,
    padding: 10,
    alignItems: 'center',
  },
  invoiceButtonText: {
    color: '#4D9F8D',
  },
  invoiceImage: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#4D9F8D',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#a0cfca',
    opacity: 0.7,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4D9F8D',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  clearButtonText: {
    color: '#4D9F8D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    padding: 20,
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
  },
  categoryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    margin: 5,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  categoryItemText: {
    marginLeft: 10,
  },
  categoryGrid: {
    paddingBottom: 20,
  },
  emptyCategoryText: {
    textAlign: 'center',
    padding: 20,
    color: '#888',
  },
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 10,
  },
  addCategoryButtonText: {
    marginLeft: 10,
    color: '#4D9F8D',
  },
  iconGrid: {
    justifyContent: 'center',
    paddingBottom: 20,
  },
  iconItem: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    borderRadius: 25,
  },
  selectedIconItem: {
    backgroundColor: '#e0f2f1',
  },
  addButtonLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AddBudget;
