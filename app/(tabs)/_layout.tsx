import { Tabs } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, Keyboard } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from "@react-navigation/native";

const PRIMARY_COLOR = '#4D9F8D';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [hideTabBar, setHideTabBar] = useState(false);
 const [loading, setLoading] = useState(true);
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
          title: 'Settings',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
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