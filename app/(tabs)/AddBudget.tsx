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
  Button,
  ScrollView,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');

const AddBudget = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');


  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleAddExpense = () => {
    console.log({ name, amount, date, invoiceImage, type });

    // Clear the form
    setName('');
    setAmount('');
    setDate(new Date());
    setInvoiceImage(null);
    setType('expense'); // reset to default

    router.back();
  };

  const handleClear = () => setAmount('');

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert('Permission is required to access media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setInvoiceImage(result.assets[0].uri);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          <View style={styles.backgroundContainer}>
            <Image
              source={require('@/assets/Rectangle.png')}
              style={styles.backgroundImage}
              resizeMode="cover"
            />
          </View>

          {!keyboardVisible && (
  <View style={styles.header}>
    <Text style={styles.headerText}>Add {type === 'income' ? 'Income' : 'Expense'}</Text>
  </View>
)}

          <ScrollView
            contentContainerStyle={styles.formWrapper}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.formContainer}>

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
                  placeholder="Netflix"
                />
              </View>

              {/* Amount */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>AMOUNT</Text>
                <View style={styles.amountContainer}>
                  <TextInput
                    style={[styles.input, styles.amountInput]}
                    value={amount ? `$ ${amount}` : ''}
                    onChangeText={(text) => setAmount(text.replace(/[^0-9]/g, ''))}
                    placeholder="$ 0.00"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
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
                    onChange={(event, selectedDate) => {
                      setDatePickerVisibility(false);
                      if (event.type === 'set' && selectedDate) {
                        setDate(selectedDate);
                      }
                    }}
                  />
                )}
              </View>

              {/* Invoice */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>INVOICE</Text>
                <TouchableOpacity style={styles.invoiceButton} onPress={pickImage}>
                  <Text style={styles.invoiceButtonText}>
                    {invoiceImage ? 'Change Invoice' : 'Add Invoice'}
                  </Text>
                </TouchableOpacity>
                {invoiceImage && (
                  <Image source={{ uri: invoiceImage }} style={styles.invoiceImage} />
                )}
              </View>
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? 40 : 60,
  },
  backgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width,
    height: height * 0.35,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    marginTop: 20,
    width: '100%',
  },
  headerText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  formWrapper: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 20,
    marginTop: 120,
    marginHorizontal: 20,
    paddingBottom: 40,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 30,
    width: '100%',
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
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
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
  
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountInput: {
    flex: 1,
  },
  clearButton: {
    marginLeft: 10,
  },
  clearText: {
    color: '#4D9F8D',
  },
  dateText: {
    fontSize: 16,
    paddingVertical: 8,
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
});

export default AddBudget;
