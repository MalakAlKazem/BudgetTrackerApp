import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  ListRenderItem,
} from 'react-native';
import { Ionicons} from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';


const { width, height } = Dimensions.get('window');

type Transaction = {
  id: string;
  name: string;
  amount: string;
  date: string;
  icon: any;
  color: string;
};

const transactions: Transaction[] = [
  { id: '1', name: 'Upwork', amount: '+ $850.00', date: 'Today', icon: require('@/assets/upwork.png'), color: '#4CAF50' },
  { id: '2', name: 'Transfer', amount: '- $85.00', date: 'Yesterday', icon: require('@/assets/transfer.png'), color: '#F44336' },
  { id: '3', name: 'Paypal', amount: '+ $1,406.00', date: 'Jan 30, 2022', icon: require('@/assets/paypal.png'), color: '#4CAF50' },
  { id: '4', name: 'Youtube', amount: '- $11.99', date: 'Jan 16, 2022', icon: require('@/assets/youtube.png'), color: '#F44336' },
];

type CategoryItemProps = {
  title: string;
  icon: string;
};

const CategoryItem: React.FC<CategoryItemProps> = ({ title, icon }) => (
  <View style={styles.categoryItem}>
    <FontAwesome5 name={icon} size={20} color="#343A40" />
    <Text style={styles.categoryText}>{title}</Text>
  </View>
);

const HomeScreen: React.FC = () => {
  const renderItem: ListRenderItem<Transaction> = ({ item }) => (
    <View style={styles.transactionItem}>
      <Image source={item.icon} style={styles.transactionIcon} />
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionName}>{item.name}</Text>
        <Text style={styles.transactionDate}>{item.date}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: item.color }]}>{item.amount}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.backgroundContainer}>
          <Image
            source={require('@/assets/Rectangle.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.greetingContainer}>
          <Text style={styles.greetingText}>Good afternoon,</Text>
          <Text style={styles.userName}>Enjelin Morgeana</Text>
        </View>

        <View style={styles.balanceContainer}>
          <Text style={styles.sectionTitle}>Total Balance</Text>
          <Text style={styles.balanceAmount}>$2,548.00</Text>
          <View style={styles.incomeExpenseRow}>
            <View style={styles.financeBox}>
              <Text style={styles.financeLabel}>Income</Text>
              <Text style={[styles.financeAmount, styles.incomeText]}>$1,840.00</Text>
            </View>
            <View style={styles.financeBox}>
              <Text style={styles.financeLabel}>Expenses</Text>
              <Text style={[styles.financeAmount, styles.expenseText]}>$284.00</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transactions History</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Spend Again</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.categoryRow}>
            <CategoryItem title="Food" icon="utensils" />
            <CategoryItem title="Transport" icon="bus" />
            <CategoryItem title="Shopping" icon="shopping-bag" />
          </View>
        </View>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    paddingBottom: 100,
    paddingHorizontal: 20,
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
  greetingContainer: {
    marginTop: height * 0.05,
    marginBottom: 10,
  },
  greetingText: {
    fontSize: 16,
    color: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 5,
  },
  balanceContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: height * 0.02,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343A40',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 20,
    marginTop: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    color: '#4D9F8D',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#343A40',
    marginVertical: 10,
  },
  incomeExpenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  financeBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 15,
    width: '48%',
  },
  financeLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 5,
  },
  financeAmount: {
    fontSize: 18,
    fontWeight: '600',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 14,
    color: '#888',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#388984',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  categoryItem: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
  },
  categoryText: {
    marginTop: 8,
    fontSize: 12,
    color: '#343A40',
  },
});

export default HomeScreen;
