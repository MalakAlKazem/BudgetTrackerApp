import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
  const checkAuthState = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      if (savedUser) {
        console.log('Previous user session found - waiting for Firebase verification...');
        // Don't set any state here, let Firebase handle it
      }
    } catch (error) {
      console.error('Error checking auth state:', error);
    }
  };

  checkAuthState();

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('Auth state changed: User logged in -', user.email);
      setUser(user);
      setIsAuthenticated(true);
      
      await AsyncStorage.setItem('user', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      }));
    } else {
      console.log('Auth state changed: User logged out');
      setUser(null);
      setIsAuthenticated(false);
      await AsyncStorage.removeItem('user');
    }
    
    setIsLoading(false);
  });

  return () => unsubscribe();
}, []);
  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('User signed in successfully:', userCredential.user.email);
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setIsLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }
      
      console.log('User signed up successfully:', userCredential.user.email);
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await signOut(auth);
      console.log('User signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error.message);
      throw new Error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string): Promise<void> => {
    try {
      if (user) {
        await updateProfile(user, { displayName });
        console.log('Profile updated successfully');
      }
    } catch (error: any) {
      console.error('Profile update error:', error.message);
      throw new Error(error.message);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    logout,
    updateUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};