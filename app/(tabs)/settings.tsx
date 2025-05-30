import React, { useState } from 'react';
import { View, Dimensions, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

type TabType = 'expenses' | 'incomes' | 'accountInfo' | 'changeLanguage' | 'logout';

const ProfileScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('expenses');

  const handleBackPress = () => {
    router.back();
  };

  const navigateToTab = (tab: TabType) => {
    setActiveTab(tab);
    switch (tab) {
      case 'expenses':
        router.push('/settings_tabs/AllExpanses');
        break;
      case 'incomes':
        router.push('/settings_tabs/AllIncomes');
        break;
      case 'accountInfo':
        router.push('/settings_tabs/AccountInfo');
        break;
      case 'changeLanguage':
        router.push('/settings_tabs/ChangeLanguage');
        break;
      case 'logout':
        Alert.alert('Logout', 'You have been logged out.');
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <Image
          source={require('@/assets/Rectangle.png')}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backIconContainer}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.profileTitle}>Profile</Text>
        <Ionicons name="notifications-outline" size={28} color="white" style={styles.notificationIcon} />
      </View>
      <View style={styles.profileContainer}>
        <View style={styles.profileSection}>
          <Image source={require('@/assets/profile-avatar.png')} style={styles.profileImage} resizeMode="cover" />
          <Text style={styles.profileName}>Enjelin Morgeana</Text>
          <Text style={styles.profileUsername}>@enjelin_morgeana</Text>
        </View>
      </View>

      {/* Vertical Tabs Navigation */}
      <View style={styles.tabsContainer}>
        {[
          { key: 'expenses', label: 'All Expenses' },
          { key: 'incomes', label: 'All Incomes' },
          { key: 'accountInfo', label: 'Account Info' },
          { key: 'changeLanguage', label: 'Change Language' },
          { key: 'logout', label: 'Logout' },
        ].map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.activeTab]}
            onPress={() => navigateToTab(key as TabType)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.activeTabText]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F5F5'
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    position: 'relative',
    paddingHorizontal: 20,
  },
  profileContainer: {
    padding: 5,
    marginTop: height * 0.02,
    marginHorizontal: 20,
  },
  profileTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  backIconContainer: {
    position: 'absolute',
    left: 0,
    top: 50,
    paddingHorizontal: 20,
  },
  notificationIcon: {
    position: 'absolute',
    right: 0,
    top: 50,
    paddingHorizontal: 20,
  },
  profileSection: { 
    alignItems: 'center', 
    marginVertical: 20,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 60,
    backgroundColor: '#fff',
    marginTop: 60,
  },
  profileName: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginTop: 10 
  },
  profileUsername: { 
    fontSize: 14, 
    color: 'gray' 
  },
  tabsContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 10,
    backgroundColor: '#EAEAEA',
    overflow: 'hidden',
    flexDirection: 'column'
  },
  tab: {
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  activeTab: {
    backgroundColor: '#4D9F8D',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#555',
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default ProfileScreen;