import React from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const data = [
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
      <View style={styles.header}>
        <Ionicons name="arrow-back" size={24} color="white" style={styles.backIcon} />
        <Text style={styles.profileTitle}>Profile</Text>
        <Ionicons name="notifications-outline" size={24} color="white" style={styles.notificationIcon} />
      </View>
      <View style={styles.profileSection}>
        <Image source={require('@/assets/profile-avatar.png')} style={styles.profileImage} />
        <Text style={styles.profileName}>Enjelin Morgeana</Text>
        <Text style={styles.profileUsername}>@enjelin_morgeana</Text>
      </View>
      <FlatList
        data= {data}
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 50 },
  profileTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  backIcon: { position: 'absolute', left: 10, top: 50 },
  notificationIcon: { position: 'absolute', right: 10, top: 50 },
  profileSection: { alignItems: 'center', marginVertical: 20 },
  profileImage: { width: 80, height: 80, borderRadius: 40 },
  profileName: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  profileUsername: { fontSize: 14, color: 'gray' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  menuText: { fontSize: 16, marginLeft: 10 },
});

export default ProfileScreen;
