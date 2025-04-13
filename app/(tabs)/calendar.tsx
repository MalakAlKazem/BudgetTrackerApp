import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface SpendingData {
  [date: string]: {
    amount: number;
    notes: string;
  };
}

const primaryColor = '#4D9F8D';
const lightColor = '#DFF2ED';
const darkText = '#2F4F4F';

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [spendingData] = useState<SpendingData>({
    '2025-04-05': { amount: 20, notes: 'Groceries' },
    '2025-04-04': { amount: 10, notes: 'Coffee' },
  });

  const onDayPress = (day: { dateString: string }) => {
    setSelectedDate(day.dateString);
  };

  const markedDates = Object.keys(spendingData).reduce((acc, date) => {
    acc[date] = {
      marked: true,
      dotColor: primaryColor,
      selected: selectedDate === date,
      selectedColor: primaryColor,
    };
    return acc;
  }, {} as Record<string, any>);

  if (selectedDate && !markedDates[selectedDate]) {
    markedDates[selectedDate] = {
      selected: true,
      selectedColor: primaryColor,
    };
  }

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
          <Text style={styles.headerGreeting}>Good afternoon,</Text>
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
          {spendingData[selectedDate] ? (
            <>
              <Text style={styles.detailText}>
                💸 Amount: <Text style={styles.highlight}>${spendingData[selectedDate].amount}</Text>
              </Text>
              <Text style={styles.detailText}>
                📝 Note: <Text style={styles.highlight}>{spendingData[selectedDate].notes}</Text>
              </Text>
            </>
          ) : (
            <Text style={styles.noData}>No spending recorded.</Text>
          )}
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Add / View Expense</Text>
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
  headerBackground: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerContent: {
    position: 'absolute',
    top: height * 0.05,
    left: 20,
    
  },
  headerGreeting: {
    fontSize: 16,
    color: '#fff',
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
});

export default CalendarScreen;
