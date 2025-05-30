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
import * as Notifications from 'expo-notifications';

const { width, height } = Dimensions.get('window');

const AddBudget = () => {
  const router = useRouter();
  const { addTransaction, categories, addCategory, refreshTransactions } = useTransactions();
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
    return date.toISOString().split('T')[0];
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

  const { selectedDate } = useLocalSearchParams();
  useEffect(() => {
    if (selectedDate && typeof selectedDate === 'string') {
      const parsedDate = new Date(selectedDate);
      setDate(parsedDate);
      
      // Auto-check scheduled if it's a future date
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);
      
      if (parsedDate > today) {
        setIsScheduled(true);
      }
    }
  }, [selectedDate]);

  // Check if selected date is in the future and auto-set scheduled
  const handleDateChange = (selectedDate?: Date) => {
    if (selectedDate) {
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

  // Request notifications permission on component mount
  useEffect(() => {
    const requestNotificationsPermission = async () => {
      if (Platform.OS === 'ios' || Platform.OS === 'android') {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Notification permissions not granted');
        }
      }
    };
    
    requestNotificationsPermission();
  }, []);

  const scheduleReminderNotification = async (transactionTitle: string, transactionType: string, transactionDate: Date) => {
    try {
      // Calculate the reminder date (1 day before transaction date)
      const reminderDate = new Date(transactionDate);
      reminderDate.setDate(reminderDate.getDate() - 1);
      reminderDate.setHours(22, 48, 0, 0); // Set reminder time to 9 AM

      // Only schedule if reminder date is in the future
      const now = new Date();
      if (reminderDate > now) {
        // Calculate seconds until the reminder date
        const secondsUntilReminder = Math.max(1, Math.floor((reminderDate.getTime() - Date.now()) / 1000));

        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Upcoming Transaction Reminder',
            body: `Tomorrow you have a scheduled ${transactionType}: "${transactionTitle}" for $${amount}`,
            sound: true,
          },
          trigger: {
            seconds: secondsUntilReminder,
            repeats: false,
          } as Notifications.TimeIntervalTriggerInput,
        });

        console.log(`Reminder scheduled for ${reminderDate.toLocaleString()} (in ${secondsUntilReminder} seconds)`);
      }
    } catch (error) {
      console.error('Error scheduling reminder notification:', error);
    }
  };

  const scheduleNotification = async (transactionTitle: string, transactionType: string) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Transaction Added',
        body: `Your ${transactionType} "${transactionTitle}" has been successfully added!`,
      },
      trigger: null, // Send immediately
    });
  };

  const handleAddTransaction = async () => {
    if (!title || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Insert into local SQLite database first
      const transactionId = await insertTransaction(
        title,
        amountValue,
        date.toISOString(),
        type,
        selectedCategory?.id || '',
        isScheduled,
        invoice
      );

      // Create a transaction object for the context
      const newTransaction = {
        id: transactionId,
        name: title,
        amount: amountValue,
        date: date,
        type: type,
        category: selectedCategory?.id || '',
        isPaid: isScheduled ? false : true,
        isRecurring: isScheduled,
        recurrenceInterval: isScheduled ? 'monthly' : null,
        invoiceImage: invoice
      };

      // Add to context (in memory)
      try {
        await addTransaction(newTransaction);
      } catch (contextError) {
        console.warn('Context update failed, but transaction was saved to database:', contextError);
      }
        
      // Trigger refresh in other components
      if (refreshTransactions) {
        await refreshTransactions();
      }
        
      // Schedule reminder notification if it's a scheduled transaction
      if (isScheduled) {
        try {
          await scheduleReminderNotification(title, type, date);
        } catch (notificationError) {
          console.warn('Failed to schedule notification:', notificationError);
        }
      }
        
      // Show immediate success notification
      try {
        await scheduleNotification(title, type);
      } catch (notificationError) {
        console.warn('Failed to show success notification:', notificationError);
      }

      const successMessage = isScheduled 
        ? `Transaction scheduled successfully! You'll receive a reminder one day before the due date.`
        : 'Transaction saved successfully';

      // Reset the submitting state before showing the alert
      setIsSubmitting(false);

      Alert.alert(
        'Success', 
        successMessage,
        [
          { 
            text: 'Add Another', 
            onPress: () => {
              clearFormCompletely(); // Use the enhanced clear function
            } 
          },
          { 
            text: 'Go to Home', 
            onPress: () => {
              router.replace('/');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving transaction:', error);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
      setIsSubmitting(false);
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

              {/* Reminder Info */}
              {isScheduled && (
                <View style={styles.reminderInfo}>
                  <Ionicons name="notifications-outline" size={16} color="#4D9F8D" />
                  <Text style={styles.reminderText}>
                    You'll receive a reminder one day before this transaction
                  </Text>
                </View>
              )}

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
              <TouchableOpacity 
                style={[
                  styles.addButton,
                  (!title || !amount || isSubmitting) && styles.disabledButton
                ]} 
                onPress={() => {
                  handleAddTransaction();
                  clearFormCompletely();
                }}
                disabled={!title || !amount || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>
                    {isScheduled ? 'Schedule Transaction' : 'Add Transaction'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Clear Button
              <TouchableOpacity 
                style={styles.clearButton} 
                onPress={clearFormCompletely}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity> */}
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
});

export default AddBudget;