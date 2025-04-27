import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  Modal,
  Keyboard,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Category, useTransactions } from '@/app/context/TransactionContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CategoriesScreen = () => {
  const { categories, addCategory, deleteCategory, getDefaultCategories } = useTransactions();
  const [newCategory, setNewCategory] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('shopping-bag');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const router = useRouter();

  const availableIcons = [
    'shopping-bag', 'utensils', 'bus', 'home', 'tshirt', 'gamepad',
    'coffee', 'plane', 'graduation-cap', 'car', 'gift', 'medkit',
    'dumbbell', 'book', 'baby', 'paw', 'laptop', 'music',
    'film', 'glass-cheers', 'briefcase', 'dollar-sign', 'file-invoice',
    'money-bill-wave', 'piggy-bank', 'hand-holding-usd'
  ];

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    if (categories.some(cat => cat.name.toLowerCase() === newCategory.trim().toLowerCase())) {
      Alert.alert('Error', 'This category already exists');
      return;
    }

    setIsAdding(true);
    try {
      await addCategory({
        name: newCategory.trim(),
        icon: selectedIcon,
        type: type
      });
      setNewCategory('');
      setIsModalVisible(false);
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Error', 'Failed to add category');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        },
      ]
    );
  };

  const filteredCategories = categories.filter(
    cat => cat.type === type || cat.type === 'both'
  );

  const resetForm = () => {
    setNewCategory('');
    setSelectedIcon('shopping-bag');
    setType('expense');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Manage Categories</Text>
      </View>

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

      {/* Add Category Button */}
      <TouchableOpacity 
        style={styles.addCategoryButton}
        onPress={() => setIsModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="#4D9F8D" />
        <Text style={styles.addCategoryButtonText}>Add New Category</Text>
      </TouchableOpacity>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.categoryItem}>
            <View style={styles.categoryInfo}>
              <FontAwesome5 name={item.icon} size={20} color="#4D9F8D" />
              <Text style={styles.categoryText}>{item.name}</Text>
            </View>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={() => handleDeleteCategory(item)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome5 name="folder-open" size={40} color="#ddd" />
            <Text style={styles.emptyText}>No categories found</Text>
            <Text style={styles.emptySubText}>Add your first category</Text>
          </View>
        }
        contentContainerStyle={filteredCategories.length === 0 && styles.emptyList}
      />

      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* Add Category Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setIsModalVisible(false);
          resetForm();
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Category</Text>
              <TouchableOpacity onPress={() => {
                setIsModalVisible(false);
                resetForm();
              }}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CATEGORY NAME</Text>
              <TextInput
                style={styles.input}
                value={newCategory}
                onChangeText={setNewCategory}
                placeholder="e.g. Groceries"
                autoFocus
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>TYPE</Text>
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ICON</Text>
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
            </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddCategory}
              disabled={!newCategory.trim() || isAdding}
            >
              {isAdding ? (
                <Text style={styles.addButtonText}>Adding...</Text>
              ) : (
                <Text style={styles.addButtonText}>Add Category</Text>
              )}
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
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4D9F8D',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  toggleButton: {
    flex: 1,
    padding: 12,
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
  addCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4D9F8D',
  },
  addCategoryButtonText: {
    marginLeft: 10,
    color: '#4D9F8D',
    fontSize: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 16,
    marginLeft: 10,
  },
  deleteButton: {
    padding: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 10,
    color: '#888',
    fontSize: 18,
    fontWeight: '500',
  },
  emptySubText: {
    textAlign: 'center',
    color: '#aaa',
    fontSize: 14,
    marginTop: 5,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  backButton: {
    marginTop: 20,
    backgroundColor: '#4D9F8D',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  addButton: {
    backgroundColor: '#4D9F8D',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CategoriesScreen;