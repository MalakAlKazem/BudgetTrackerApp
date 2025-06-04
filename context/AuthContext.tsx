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
import { Alert } from 'react-native';
import { initDatabase } from '../utils/database';

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
          // console.log('Previous user session found - waiting for Firebase verification...');
          // Do nothing, just wait for onAuthStateChanged
        }
      } catch (error) {
        console.error('Error checking auth state:', error);
      }
    };

    checkAuthState();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setIsAuthenticated(true);
        
        await AsyncStorage.setItem('user', JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        }));
        await initDatabase();
      } else {
        setUser(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem('user');
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // console.log('User signed in successfully:', userCredential.user.email);
      // Initialize database for the newly signed-in user
      await initDatabase();
    } catch (error: any) {
      Alert.alert("Sign In Error", error.message);
      console.error("Sign In Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update display name if provided
      if (displayName && userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
      }
      
      // console.log('User signed up successfully:', userCredential.user.email);
      // Initialize database for the newly signed-up user
      await initDatabase();
    } catch (error: any) {
      Alert.alert("Sign Up Error", error.message);
      console.error("Sign Up Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut(auth);
      // console.log('User signed out successfully');
      // Clear user-specific local data if necessary
    } catch (error: any) {
      Alert.alert("Sign Out Error", error.message);
      console.error("Sign Out Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (displayName: string): Promise<void> => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await updateProfile(currentUser, { displayName });
        // console.log('Profile updated successfully');
        // Optionally update local user state
        setUser({ ...currentUser, displayName } as User);
      } catch (error: any) {
        Alert.alert("Profile Update Error", error.message);
        console.error("Profile Update Error:", error);
      }
    } else {
      Alert.alert("Profile Update Error", "No user logged in");
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