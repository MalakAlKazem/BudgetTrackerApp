import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useRouter } from 'expo-router';
import { useTransactions } from '@/app/context/TransactionContext';

const { width, height } = Dimensions.get('window');

interface SpendingData {
  [date: string]: {
    transactions: Array<{
      amount: number;
      notes: string;
      isPaid?: boolean;
      isRecurring?: boolean;
      recurrenceInterval?: string | null;
    }>;
    hasUnpaid: boolean;
  };
}

const primaryColor = '#4D9F8D';
const lightColor = '#DFF2ED';
const darkText = '#2F4F4F';
const unpaidColor = '#FF6B6B';

const CalendarScreen = () => {
  const { transactions } = useTransactions();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const router = useRouter();
  
  // Process transactions and upcoming unpaid expenses
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Group transactions by date
    const spendingData = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'expense') {
        const dateStr = transaction.date.toISOString().split('T')[0];
        
        if (!acc[dateStr]) {
          acc[dateStr] = {
            transactions: [],
            hasUnpaid: false,
          };
        }
        
        acc[dateStr].transactions.push({
          amount: transaction.amount,
          notes: transaction.name,
          isPaid: transaction.isPaid,
          isRecurring: transaction.isRecurring,
          recurrenceInterval: transaction.recurrenceInterval,
        });
        
        if (transaction.isPaid === false) {
          acc[dateStr].hasUnpaid = true;
        }
      }
      return acc;
    }, {} as SpendingData);

    // Create marked dates
    const newMarkedDates = Object.keys(spendingData).reduce((acc, date) => {
      acc[date] = {
        marked: true,
        // Use unpaid color if any transaction is unpaid
        dotColor: spendingData[date].hasUnpaid ? unpaidColor : primaryColor,
        selected: selectedDate === date,
        selectedColor: spendingData[date].hasUnpaid ? unpaidColor : primaryColor,
      };
      return acc;
    }, {} as Record<string, any>);

    if (selectedDate && !newMarkedDates[selectedDate]) {
      newMarkedDates[selectedDate] = {
        selected: true,
        selectedColor: primaryColor,
      };
    }

    setMarkedDates(newMarkedDates);
  }, [transactions, selectedDate]);

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  // Get all transactions for selected date
  const getTransactionsForDate = (date: string) => {
    return transactions.filter(t => {
      const dateStr = t.date.toISOString().split('T')[0];
      return dateStr === date && t.type === 'expense';
    });
  };

  const handleAddNewExpense = () => {
    if (selectedDate) {
      router.push({
        pathname: '/AddBudget',
        params: { selectedDate },
      });
    }
  };

  const selectedTransactions = selectedDate ? getTransactionsForDate(selectedDate) : [];

  const renderTransactionItem = ({ item }: { item: any }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.detailText}>
        💸 Amount: <Text style={styles.highlight}>${item.amount.toFixed(2)}</Text>
      </Text>
      <Text style={styles.detailText}>
        📝 Note: <Text style={styles.highlight}>{item.name}</Text>
      </Text>
      {item.isPaid === false && (
        <Text style={[styles.detailText, { color: unpaidColor }]}>
          ⚠️ This expense is unpaid
        </Text>
      )}
      {item.isRecurring && (
        <Text style={styles.detailText}>
          🔄 Recurring: {item.recurrenceInterval}
        </Text>
      )}
      <View style={styles.separator} />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.backgroundContainer}>
          <Image
            source={require('@/assets/Rectangle.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>📅 Budget Calendar</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Calendar
          onDayPress={onDayPress}
          markedDates={markedDates}
          style={styles.calendar}
          theme={{
            selectedDayBackgroundColor: primaryColor,
            todayTextColor: primaryColor,
            arrowColor: primaryColor,
            textDayFontFamily: 'System',
            textMonthFontFamily: 'System',
            textDayHeaderFontFamily: 'System',
          }}
        />
      </View>

      {selectedDate ? (
        <View style={styles.details}>
          <Text style={styles.dateText}>🗓 {selectedDate}</Text>
          {selectedTransactions.length > 0 ? (
            <FlatList
              data={selectedTransactions}
              renderItem={renderTransactionItem}
              keyExtractor={(item, index) => item.id || index.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Text style={styles.noData}>No spending recorded.</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={handleAddNewExpense}>
            <Text style={styles.buttonText}>Add New Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.selectPrompt}>👆 Tap a date to view spending info.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerContainer: {
    position: 'relative',
    height: height * 0.28,
    marginBottom: 16,
  },
  headerContent: {
    position: 'absolute',
    top: height * 0.05,
    left: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 20,
    marginTop: -110
  },
  calendar: {
    borderRadius: 12,
  },
  details: {
    backgroundColor: lightColor,
    padding: 20,
    borderRadius: 15,
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#ccc',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  dateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: darkText,
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    color: darkText,
    marginBottom: 6,
  },
  highlight: {
    fontWeight: '600',
    color: '#2E7D71',
  },
  noData: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#777',
    marginBottom: 10,
  },
  button: {
    marginTop: 12,
    backgroundColor: primaryColor,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  selectPrompt: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
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
  transactionItem: {
    marginBottom: 10,
    paddingBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
});

export default CalendarScreen;