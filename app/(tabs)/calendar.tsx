import React, { useState, useEffect, useCallback } from 'react';
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
import { useRouter, useFocusEffect } from 'expo-router';
import { fetchTransactions } from '../../utils/database';

const { width, height } = Dimensions.get('window');

interface Transaction {
  id: number;
  title: string;
  amount: number;
  date: string;
  type: string;
  category: string;
  isScheduled: number;
  isPaid: number;
  invoice?: string;
}

interface SpendingData {
  [date: string]: {
    transactions: Transaction[];
    hasUnpaid: boolean;
  };
}

const primaryColor = '#4D9F8D';
const lightColor = '#DFF2ED';
const darkText = '#2F4F4F';
const unpaidColor = '#FF6B6B';

const CalendarScreen = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [markedDates, setMarkedDates] = useState<Record<string, any>>({});
  const router = useRouter();
  
  // Fetch transactions from the database

   const loadTransactions = useCallback(async () => {
    try {
      const fetchedTransactions = await fetchTransactions();
      console.log('Fetched transactions:', fetchedTransactions); // Debug log
      setTransactions(fetchedTransactions as Transaction[]);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  }, []);

  // Load transactions when component mounts
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Refresh transactions when screen comes into focus (when returning from AddBudget)
  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions])
  );


  // Process transactions and mark calendar dates
  useEffect(() => {
    if (transactions.length === 0) {
      setMarkedDates(selectedDate ? { [selectedDate]: { selected: true, selectedColor: primaryColor } } : {});
      return;
    }

    // Group transactions by date
    const spendingData = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'expense') {
        // Extract date in YYYY-MM-DD format
        const dateStr = transaction.date.split('T')[0];

        if (!acc[dateStr]) {
          acc[dateStr] = {
            transactions: [],
            hasUnpaid: false,
          };
        }
        
        acc[dateStr].transactions.push(transaction);
        
        // Check if transaction is unpaid (scheduled transactions that haven't been paid)
        // isPaid = 0 means unpaid, isPaid = 1 means paid
        if (transaction.isPaid === 0) {
          acc[dateStr].hasUnpaid = true;
        }
      }
      return acc;
    }, {} as SpendingData);

    console.log('Spending data:', spendingData); // Debug log

    // Create marked dates for calendar
    const newMarkedDates = Object.keys(spendingData).reduce((acc, date) => {
      const hasUnpaid = spendingData[date].hasUnpaid;
      
      acc[date] = {
        marked: true,
        dotColor: hasUnpaid ? unpaidColor : primaryColor,
        selected: selectedDate === date,
        selectedColor: hasUnpaid ? unpaidColor : primaryColor,
        selectedTextColor: '#fff'
      };
      return acc;
    }, {} as Record<string, any>);

    // If we have a selected date but no transactions for it, still mark it as selected
    if (selectedDate && !newMarkedDates[selectedDate]) {
      newMarkedDates[selectedDate] = {
        selected: true,
        selectedColor: primaryColor,
        selectedTextColor: '#fff'
      };
    }

    setMarkedDates(newMarkedDates);
  }, [transactions, selectedDate]);

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  // Get all expense transactions for selected date
  const getTransactionsForDate = (date: string) => {
    return transactions.filter(t => {
      const dateStr = t.date.split('T')[0];
      return dateStr === date && t.type === 'expense';
    });
  };

  // In calendar.tsx, add this before navigation:
const handleAddNewExpense = () => {
  if (selectedDate) {
    console.log('Calendar: Selected date being passed:', selectedDate);
    console.log('Calendar: Date object would be:', new Date(selectedDate + 'T12:00:00'));
    router.push({
      pathname: '/AddBudget',
      params: { selectedDate: selectedDate },
    });
  }
};
  const selectedTransactions = selectedDate ? getTransactionsForDate(selectedDate) : [];

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isUnpaid = item.isPaid === 0;
    const isScheduled = item.isScheduled === 1;
    
    return (
      <View style={styles.transactionItem}>
        <Text style={styles.detailText}>
          💸 Amount: <Text style={styles.highlight}>${item.amount.toFixed(2)}</Text>
        </Text>
        <Text style={styles.detailText}>
          📝 Title: <Text style={styles.highlight}>{item.title}</Text>
        </Text>
        {item.category && (
          <Text style={styles.detailText}>
            🏷️ Category: <Text style={styles.highlight}>{item.category}</Text>
          </Text>
        )}
        {isScheduled && (
          <Text style={styles.detailText}>
            📅 Status: <Text style={[styles.highlight, { color: primaryColor }]}>Scheduled</Text>
          </Text>
        )}
        {isUnpaid && (
          <Text style={[styles.detailText, { color: unpaidColor }]}>
            ⚠️ This expense is unpaid
          </Text>
        )}
        {!isUnpaid && !isScheduled && (
          <Text style={[styles.detailText, { color: '#4CAF50' }]}>
            ✅ Paid
          </Text>
        )}
        <View style={styles.separator} />
      </View>
    );
  };

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
          <Text style={styles.headerSubtitle}>
            Red dots = Unpaid expenses • Green dots = Paid expenses
          </Text>
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
            dayTextColor: darkText,
            monthTextColor: darkText,
            indicatorColor: primaryColor,
            textDisabledColor: '#d9e1e8',
            dotColor: primaryColor,
            selectedDotColor: '#fff',
            textSectionTitleColor: darkText,
            textDayFontSize: 16,
            textMonthFontSize: 18,
            textDayHeaderFontSize: 14,
            'stylesheet.calendar.header': {
              dayTextAtIndex0: {
                color: '#FF3B30'
              },
              dayTextAtIndex6: {
                color: '#007AFF'
              }
            }
          }}
        />
      </View>

      {selectedDate ? (
        <View style={styles.details}>
          <Text style={styles.dateText}>🗓 {selectedDate}</Text>
          {selectedTransactions.length > 0 ? (
            <>
              <Text style={styles.summaryText}>
                Total expenses: ${selectedTransactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
                {selectedTransactions.some(t => t.isPaid === 0) && (
                  <Text style={{ color: unpaidColor }}> (Contains unpaid)</Text>
                )}
              </Text>
              <FlatList
                data={selectedTransactions}
                renderItem={renderTransactionItem}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                scrollEnabled={false}
              />
            </>
          ) : (
            <Text style={styles.noData}>No spending recorded for this date.</Text>
          )}
          <TouchableOpacity style={styles.button} onPress={handleAddNewExpense}>
            <Text style={styles.buttonText}>Add New Expense</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.selectPrompt}>👆 Tap a date to view spending info.</Text>
      )}
      
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: unpaidColor }]} />
          <Text style={styles.legendText}>Unpaid/Scheduled expenses</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: primaryColor }]} />
          <Text style={styles.legendText}>Paid expenses</Text>
        </View>
      </View>
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
    right: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
    opacity: 0.9,
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
    marginTop: -60
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
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: darkText,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
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
    textAlign: 'center',
    padding: 20,
  },
  button: {
    marginTop: 12,
    backgroundColor: primaryColor,
    paddingVertical: 12,
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
    marginHorizontal: 20,
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
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 10,
  },
  legend: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: darkText,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: darkText,
  },
});
export default CalendarScreen;