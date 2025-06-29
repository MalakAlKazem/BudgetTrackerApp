import { Tabs, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, Keyboard, Alert, Animated, Modal, Text, TouchableOpacity, Dimensions } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebaseConfig';

const PRIMARY_COLOR = '#4D9F8D';
const { width, height } = Dimensions.get('window');

// Custom Alert Component
const CustomAlert: React.FC<{ 
  visible: boolean; 
  title: string; 
  message: string; 
  onConfirm: () => void;
  onClose: () => void; 
}> = ({ visible, title, message, onConfirm, onClose }) => {
  const slideAnim = React.useRef(new Animated.Value(-300)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(-300);
      opacityAnim.setValue(0);
      scaleAnim.setValue(0.8);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[alertStyles.overlay, { opacity: opacityAnim }]}>
        <Animated.View 
          style={[
            alertStyles.alertContainer, 
            { 
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ] 
            }
          ]}
        >
          <View style={alertStyles.iconContainer}>
            <Ionicons name="log-out" size={40} color="#FF6B6B" />
          </View>
          
          <Text style={alertStyles.title}>{title}</Text>
          <Text style={alertStyles.message}>{message}</Text>
          
          <View style={alertStyles.buttonContainer}>
            <TouchableOpacity 
              style={[alertStyles.button, alertStyles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={alertStyles.cancelButtonText}>Stay Here</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[alertStyles.button, alertStyles.confirmButton]} 
              onPress={onConfirm}
            >
              <Text style={alertStyles.confirmButtonText}>✨ Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [hideTabBar, setHideTabBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

 const router = useRouter();

 const handleLogout = () => {
    setShowLogoutAlert(true);
  };

  const confirmLogout = async () => {
    setShowLogoutAlert(false);
    try {
      await signOut(auth);
      router.replace('/login'); 
    } catch (error) {
      Alert.alert('🚨 Oops!', 'Something went wrong while logging out. Please try again in a moment.');
    }
  };

  const cancelLogout = () => {
    setShowLogoutAlert(false);
  };
  // useEffect(() => {
  //   let hideInterval: NodeJS.Timeout;

  //   const hideNavigationBar = async () => {
  //     if (Platform.OS === 'android') {
  //       try {
  //         await NavigationBar.setBehaviorAsync('inset-swipe');
  //         await NavigationBar.setVisibilityAsync('hidden');
  //       } catch (error) {
  //         console.warn('NavigationBar error:', error);
  //       }
  //     }
  //   };

  //   // Initial hide
  //   hideNavigationBar();

  //   // Re-hide periodically (useful for Android system UI visibility resets)
  //   hideInterval = setInterval(hideNavigationBar, 3000);

  //   // Hide tab bar when keyboard appears
  //   const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
  //     setHideTabBar(true);
  //     hideNavigationBar();
  //   });

  //   const keyboardDidHide = Keyboard.addListener('keyboardDidHide', () => {
  //     setHideTabBar(false);
  //     hideNavigationBar();
  //   });

    useFocusEffect(
    React.useCallback(() => {
      const hideNavigationBar = async () => {
        try {
          await NavigationBar.setVisibilityAsync("hidden");
        } catch (error) {
          console.error("Failed to hide navigation bar:", error);
        }
      };

      if (Platform.OS === "android") {
        hideNavigationBar();
      }

      setLoading(false);
    }, [])
  );

  //   return () => {
  //     clearInterval(hideInterval);
  //     keyboardDidShow.remove();
  //     keyboardDidHide.remove();
  //   };
  // }, []);

  return (
     <>
      <CustomAlert
        visible={showLogoutAlert}
        title="👋 Leaving so soon?"
        message="Your budget data will be safely stored. You can always come back anytime!"
        onConfirm={confirmLogout}
        onClose={cancelLogout}
      />
      
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: [
          styles.tabBar,
          Platform.OS === 'ios' && styles.iosTabBar,
          hideTabBar && { display: 'none' },
        ],
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: '#ccc',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="calendar.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AddBudget"
        options={{
          title: '',
          tabBarIcon: ({ color }) => (
            <View style={styles.budgetButtonContainer}>
              <View style={styles.budgetButton}>
                <Ionicons size={30} name="add" color="#fff" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="chart.bar.fill" color={color} />
          ),
        }}
      />
         <Tabs.Screen
        name="settings"
        options={{
          title: 'Logout',
         tabBarIcon: ({ color }) => (
            <Ionicons size={26} name="log-out-outline" color={color} />
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleLogout();
          },
        }}
      />
    </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    backgroundColor: 'white',
    height: 70,
    paddingBottom: 10,
    paddingTop: 5,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
  },
  iosTabBar: {
    position: 'absolute',
  },
  budgetButtonContainer: {
    position: 'absolute',
    top: -25,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
  },
  budgetButton: {
    width: 60,
    height: 60,
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: PRIMARY_COLOR,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
const alertStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    margin: 20,
    maxWidth: width * 0.85,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#FFE8E8',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});