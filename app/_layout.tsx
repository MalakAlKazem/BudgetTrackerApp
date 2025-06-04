import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, Pressable, Dimensions } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TransactionProvider } from '../context/TransactionContext';
import { initDatabase } from '../utils/database';
import { AuthProvider, useAuth } from '../context/AuthContext';

const AppIntroSlider: any = require('react-native-app-intro-slider').default;

SplashScreen.preventAutoHideAsync();

const { width } = Dimensions.get('window');

const slides = [
  {
    key: 'one',
    title: 'Welcome to Waffer',
    text: 'Take control of your money, one step at a time.',
    image: require('@/assets/images/slides/slide1.png'),
  },
  {
    key: 'two',
    title: 'Know where your money goes',
    text: 'Automatically categorize and track every expense.',
    image: require('@/assets/images/slides/slide2.png'),
  },
  {
    key: 'three',
    title: 'Set budgets that work for you',
    text: 'Create monthly budgets for categories like groceries, bills, and fun.',
    image: require('@/assets/images/slides/slide3.png'),
  },
  {
    key: 'four',
    title: 'Stay ahead with smart insights',
    text: 'See trends, get tips, and improve your financial habits.',
    image: require('@/assets/images/slides/slide4.png'),
  },
  {
    key: 'five',
    title: 'Bank-level security, seamless sync',
    text: 'Your data is safe, and you can link accounts for real-time updates.',
    image: require('@/assets/images/slides/slide5.png'),
  },
  {
    key: 'six',
    title: 'Lets build a better financial future',
    text: 'Start budgeting in under a minute.',
    image: require('@/assets/images/slides/slide6.png'),
  },
];

function RootLayoutNav() {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'settings_tabs';
    const isTransactionsRoute = segments[0] === 'transactions';
    const isCategoriesRoute = segments[0] === 'categories'; // Add this line
    const isCategoryTransactionsRoute = segments[0] === 'category-transactions'; // Corrected to match the valid union type
    const isEditTransactionRoute = segments[0] === 'edit-transaction'; // Add this

  if (!isAuthenticated && (inAuthGroup || isTransactionsRoute || isCategoriesRoute || isCategoryTransactionsRoute || isEditTransactionRoute)) {
    router.replace('/');
  } else if (isAuthenticated && (!inAuthGroup && !isTransactionsRoute && !isCategoriesRoute && !isCategoryTransactionsRoute && !isEditTransactionRoute)) {
    router.replace('/(tabs)');
  }
}, [isAuthenticated, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="settings_tabs" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: 'Register' }} />
        <Stack.Screen name="transactions" options={{ title: 'All Transactions', headerShown: false }} />
        <Stack.Screen name="categories" options={{ title: 'All Categories', headerShown: false }} />
        <Stack.Screen name="category-transactions" options={{ title: 'All Categories transactions', headerShown: false }} />
        <Stack.Screen name="edit-transaction" options={{ title: 'Edit Transactions', headerShown: false }} />

        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [loaded] = useFonts({
    SpaceMono: require('@/assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const [isDatabaseInitialized, setIsDatabaseInitialized] = useState(false);

  useEffect(() => {
    const checkOnboarding = async () => {
      const value = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(value === null); 
    };
    checkOnboarding();
  }, []);

  useEffect(() => {
    if (!isDatabaseInitialized) {
      setIsDatabaseInitialized(true);
    }
  }, [isDatabaseInitialized]);

  useEffect(() => {
    const setup = async () => {
      try {
        await initDatabase();
      } catch (e) {
        console.error('DB init error', e);
      }
    };
    setup();
  }, []);

  useEffect(() => {
    if (loaded && showOnboarding !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, showOnboarding]);

  const handleDone = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setShowOnboarding(false);
  };

  const renderSlide = ({ item, index }: { item: typeof slides[0]; index: number }) => {
    const isLastSlide = index === slides.length - 1;

    return (
      <LinearGradient colors={['#4D9F8D', '#2C786C']} style={styles.slide}>
        <SafeAreaView style={styles.safeArea}>
          <Text style={styles.title}>{item.title}</Text>
          <Image source={item.image} style={styles.image} />
          <Text style={styles.text}>{item.text}</Text>
          {isLastSlide && (
            <Pressable style={styles.button} onPress={handleDone}>
              <Text style={styles.buttonText}>Get Started</Text>
            </Pressable>
          )}
        </SafeAreaView>
      </LinearGradient>
    );
  };

  if (!loaded || showOnboarding === null) return null;

  if (showOnboarding) {
    return (
      <>
        <StatusBar style="light" />
        <AppIntroSlider
          data={slides}
          renderItem={(props: { item: typeof slides[0]; index: number }) => renderSlide(props)}
          onDone={handleDone}
          showSkipButton
          onSkip={handleDone}
          dotStyle={{ backgroundColor: 'rgba(255,255,255,0.3)' }}
          activeDotStyle={{ backgroundColor: '#fff', width: 24 }}
        />
      </>
    );
  }

  return (
    <AuthProvider>
      <TransactionProvider>
        <RootLayoutNav />
      </TransactionProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 60,
  },
  slide: {
    flex: 1,
    width: '100%',
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 26,
    marginTop: 10,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    color: '#2a5298',
    fontSize: 16,
    fontWeight: 'bold',
  },
});