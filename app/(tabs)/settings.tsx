import React from 'react';
import { View,Dimensions, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');


const data: { id: string; name: string; icon: "diamond" | "person-outline" | "people-outline" | "mail-outline" | "shield-outline" | "lock-closed-outline" }[] = [
  { id: '1', name: 'Invite Friends', icon: 'diamond' },
  { id: '2', name: 'Account info', icon: 'person-outline' },
  { id: '3', name: 'Personal profile', icon: 'people-outline' },
  { id: '4', name: 'Message center', icon: 'mail-outline' },
  { id: '5', name: 'Login and security', icon: 'shield-outline' },
  { id: '6', name: 'Data and privacy', icon: 'lock-closed-outline' },
];

const ProfileScreen = () => {
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
        <Ionicons name="arrow-back" size={28} color="white" style={styles.backIcon} />
        <Text style={styles.profileTitle}>Profile</Text>
        <Ionicons name="notifications-outline" size={28} color="white" style={styles.notificationIcon}  />
      </View>
      <View style={styles.profileContainer}>
      <View style={styles.profileSection}>
        <Image source={require('@/assets/profile-avatar.png')} style={styles.profileImage} resizeMode="cover"/>
        <Text style={styles.profileName}>Enjelin Morgeana</Text>
        <Text style={styles.profileUsername}>@enjelin_morgeana</Text>
      </View>
      </View>
      <FlatList
  contentContainerStyle={{ paddingTop: 10 }}
  data={data}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <TouchableOpacity style={styles.menuItem}>
      <Ionicons name={item.icon} size={24} color="black" />
      <Text style={styles.menuText}>{item.name}</Text>
    </TouchableOpacity>
  )}
/>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 20 },
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
  backIcon: {
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
  
  profileSection: { alignItems: 'center', marginVertical: 20 , },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 60,
    overflow: 'hidden',      // Add this
    backgroundColor: '#fff',
    marginTop: 60,     // Optional: helps if image has transparency
  },
  profileName: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  profileUsername: { fontSize: 14, color: 'gray' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  menuText: { fontSize: 16, marginLeft: 10 },
});

export default ProfileScreen;