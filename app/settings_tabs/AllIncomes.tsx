import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';

// Define TypeScript interface for income items
interface IncomeItem {
  id: string;
  source: string;
  amount: number;
  date: string;
}

// Mock data - replace with your real data source
const initialIncomes: IncomeItem[] = [
  { id: '1', source: 'Salary', amount: 3200.00, date: '2025-05-01' },
  { id: '2', source: 'Freelance', amount: 450.00, date: '2025-05-07' },
  { id: '3', source: 'Dividends', amount: 125.50, date: '2025-05-15' },
];

const AllIncomes = () => {
  const [incomes, setIncomes] = useState<IncomeItem[]>(initialIncomes);

  const handleEdit = (id: string) => {
    // In a real app, this would navigate to an edit screen or open a modal
    Alert.alert(
      "Edit Income",
      `You would edit income with ID: ${id}`,
      [
        { text: "Cancel" },
        { 
          text: "Edit", 
          onPress: () => console.log(`Editing income ${id}`) 
        }
      ]
    );
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Income",
      "Are you sure you want to delete this income?",
      [
        { text: "Cancel" },
        { 
          text: "Delete", 
          onPress: () => {
            setIncomes(incomes.filter(income => income.id !== id));
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={incomes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.incomeItem}>
            <View style={styles.infoContainer}>
              <Text style={styles.sourceText}>{item.source}</Text>
              <Text style={styles.dateText}>{item.date}</Text>
            </View>
            <View style={styles.rightContainer}>
              <Text style={styles.amountText}>+${item.amount.toFixed(2)}</Text>
              <View style={styles.buttonsContainer}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]} 
                  onPress={() => handleEdit(item.id)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => handleDelete(item.id)}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No income recorded yet</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  incomeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoContainer: {
    flex: 1,
  },
  rightContainer: {
    alignItems: 'flex-end',
  },
  sourceText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  amountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27AE60',
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  editButton: {
    backgroundColor: '#F0F0F0',
  },
  deleteButton: {
    backgroundColor: '#FFEBEE',
  },
  editButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});

export default AllIncomes;