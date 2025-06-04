import React, { useState } from 'react';
import { View, Dimensions, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';

const { width, height } = Dimensions.get('window');

type TabType = 'expenses' | 'incomes' | 'accountInfo' | 'changeLanguage' | 'logout';

const tabs = [
  { key: 'expenses', label: 'All Expenses', icon: 'wallet-outline' },
  { key: 'incomes', label: 'All Incomes', icon: 'cash-outline' },
  { key: 'accountInfo', label: 'Account Info', icon: 'person-outline' },
  { key: 'changeLanguage', label: 'Change Language', icon: 'language-outline' },
  { key: 'logout', label: 'Logout', icon: 'log-out-outline' },
];

const ProfileScreen = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('expenses');

  const handleBackPress = () => {
    router.back();
  };

  const handleLogout = () => {
    Alert.alert('Confirm Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut(auth);
            router.replace('/login'); 
          } catch (error) {
            Alert.alert('Logout Error', 'Something went wrong. Please try again.');
          }
        },
      },
    ]);
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
        handleLogout();
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.backgroundContainer}>
        <Image source={require('@/assets/Rectangle.png')} style={styles.backgroundImage} resizeMode="cover" />
      </View>

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backIconContainer}>
          <Ionicons name="arrow-back" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.profileTitle}>Profile</Text>
      </View>

      <View style={styles.profileContainer}>
        <View style={styles.profileSection}>
          <Image source={require('@/assets/profile-avatar.png')} style={styles.profileImage} />
          <Text style={styles.profileName}>Enjelin Morgeana</Text>
          <Text style={styles.profileUsername}>@enjelin_morgeana</Text>
        </View>
      </View>

      <View style={styles.tabsContainer}>
        {tabs.map(({ key, label, icon }) => (
          <TouchableOpacity
            key={key}
            style={styles.tab}
            onPress={() => navigateToTab(key as TabType)}
          >
            <Ionicons name={icon as any} size={22} color="#555" style={styles.tabIcon} />
            <Text style={styles.tabText}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
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
    marginTop: 10,
  },
  profileUsername: {
    fontSize: 14,
    color: 'gray',
  },
  tabsContainer: {
    marginHorizontal: 20,
    marginTop: 30,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  tabIcon: {
    marginRight: 15,
  },
  tabText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ProfileScreen;
