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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Category, useTransactions } from '@/app/context/TransactionContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const AddBudget = () => {
  const router = useRouter();
  const { addTransaction, categories, addCategory } = useTransactions();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isPaid, setIsPaid] = useState(true);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceInterval, setRecurrenceInterval] = useState<'monthly' | 'weekly' | 'yearly'>('monthly');
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isAddCategoryModalVisible, setAddCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shopping-bag');

  const availableIcons = [
    'shopping-bag', 'utensils', 'bus', 'home', 'tshirt', 'gamepad',
    'coffee', 'plane', 'graduation-cap', 'car', 'gift', 'medkit',
    'dumbbell', 'book', 'baby', 'paw', 'laptop', 'music',
    'film', 'glass-cheers', 'briefcase', 'dollar-sign', 'file-invoice',
    'money-bill-wave', 'piggy-bank', 'hand-holding-usd'
  ];

  const { selectedDate } = useLocalSearchParams();
  useEffect(() => {
    if (selectedDate) {
      setDate(new Date(selectedDate as string));
    }
  }, [selectedDate]);

  useEffect(() => {
    const keyboardSubscriptions = [
      Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true)),
      Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false))
    ];

    return () => {
      keyboardSubscriptions.forEach(subscription => subscription.remove());
    };
  }, []);

  const handleAddExpense = async () => {
    if (!name || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue)) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    try {
      await addTransaction({
        name,
        amount: amountValue,
        date,
        type,
        category: selectedCategory?.id,
        invoiceImage: invoiceImage || undefined,
        isPaid: type === 'income' ? true : isPaid,
        isRecurring,
        recurrenceInterval: isRecurring ? recurrenceInterval : null,
      });

      // Reset form
      setName('');
      setAmount('');
      setDate(new Date());
      setInvoiceImage(null);
      setSelectedCategory(null);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to add transaction');
      console.error(error);
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

  const filteredCategories = categories.filter(
    cat => cat.type === type || cat.type === 'both'
  );

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setInvoiceImage(result.assets[0].uri);
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
          <Text style={styles.headerText}>Add {type === 'income' ? 'Income' : 'Expense'}</Text>
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

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NAME</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Netflix"
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
                {isDatePickerVisible && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={(_, selectedDate) => {
                      setDatePickerVisibility(false);
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                )}
              </View>

              {/* Payment Status */}
              {type === 'expense' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>PAYMENT STATUS</Text>
                  <View style={styles.toggleContainer}>
                    <TouchableOpacity
                      style={[styles.toggleButton, isPaid && styles.selectedToggle]}
                      onPress={() => setIsPaid(true)}
                    >
                      <Text style={[styles.toggleText, isPaid && styles.selectedText]}>Paid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.toggleButton, !isPaid && styles.selectedToggle]}
                      onPress={() => setIsPaid(false)}
                    >
                      <Text style={[styles.toggleText, !isPaid && styles.selectedText]}>Pending</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Recurring */}
              {type === 'expense' && (
                <View style={styles.inputGroup}>
                  <View style={styles.switchContainer}>
                    <Text style={styles.label}>RECURRING EXPENSE</Text>
                    <Switch
                      value={isRecurring}
                      onValueChange={setIsRecurring}
                      trackColor={{ false: '#767577', true: '#4D9F8D' }}
                      thumbColor={isRecurring ? '#f4f3f4' : '#f4f3f4'}
                    />
                  </View>
                  {isRecurring && (
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[styles.toggleButton, recurrenceInterval === 'monthly' && styles.selectedToggle]}
                        onPress={() => setRecurrenceInterval('monthly')}
                      >
                        <Text style={[styles.toggleText, recurrenceInterval === 'monthly' && styles.selectedText]}>Monthly</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, recurrenceInterval === 'weekly' && styles.selectedToggle]}
                        onPress={() => setRecurrenceInterval('weekly')}
                      >
                        <Text style={[styles.toggleText, recurrenceInterval === 'weekly' && styles.selectedText]}>Weekly</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.toggleButton, recurrenceInterval === 'yearly' && styles.selectedToggle]}
                        onPress={() => setRecurrenceInterval('yearly')}
                      >
                        <Text style={[styles.toggleText, recurrenceInterval === 'yearly' && styles.selectedText]}>Yearly</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {/* Invoice */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>INVOICE (OPTIONAL)</Text>
                <TouchableOpacity style={styles.invoiceButton} onPress={pickImage}>
                  <Text style={styles.invoiceButtonText}>
                    {invoiceImage ? 'Change Invoice' : 'Add Invoice'}
                  </Text>
                </TouchableOpacity>
                {invoiceImage && (
                  <Image source={{ uri: invoiceImage }} style={styles.invoiceImage} />
                )}
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddExpense}
                disabled={!name || !amount}
              >
                <Text style={styles.addButtonText}>Add Transaction</Text>
              </TouchableOpacity>
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
              style={styles.addButton}
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
    alignItems: 'center',
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
  addButtonText: {
    color: '#fff',
    fontSize: 18,
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