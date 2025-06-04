import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';

//Define Typescript interface for expense items
interface ExpenseItem {
  id: string,
  category: string,
  amount: number,
  date: string
}

// Mock data - replace with your real data source
const initialexpenses: ExpenseItem[] = [
  { id: '1', category: 'Food', amount: 45.50, date: '2025-05-12' },
  { id: '2', category: 'Transport', amount: 22.00, date: '2025-05-11' },
  { id: '3', category: 'Entertainment', amount: 65.25, date: '2025-05-10' },
  { id: '4', category: 'Bills', amount: 120.00, date: '2025-05-05' },
];

const AllExpanses = () => {
  const [expenses, setExpenses] = useState<ExpenseItem[]>(initialexpenses);

  const handleEdit = (id: string) => {
    Alert.alert(
      "Edit expense",
      `You would edit expense with ID: ${id}`,
      [
        { text: "Cancel" },
        {
          text: "Edit",
          onPress: () => {}
        }
      ]
    )
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this exxpense?",
      [
        { text: "Cancel" },
        { 
          text: "Delete", 
          onPress: () => {
            setExpenses(expenses.filter(expense => expense.id !== id));
          },
          style: "destructive"
        }

      ]
    )
  };

  return (
      <View style={styles.container}>
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.incomeItem}>
              <View style={styles.infoContainer}>
                <Text style={styles.sourceText}>{item.category}</Text>
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
      color: '#E74C3C',
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
  
  export default AllExpanses