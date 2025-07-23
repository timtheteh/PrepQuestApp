import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService, AuthUser } from '@/lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signInWithFacebook: () => Promise<{ success: boolean; error?: string }>;
  signInWithApple: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  getGoogleToken: () => Promise<{ token: string | null; error?: string }>;
  getFacebookToken: () => Promise<{ token: string | null; error?: string }>;
  getAppleToken: () => Promise<{ token: string | null; error?: string }>;
  getProviderToken: (provider?: 'google' | 'facebook' | 'apple') => Promise<{ token: string | null; error?: string }>;
  clearError: () => void;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on app start
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { user, error } = await AuthService.getCurrentUser();
        
        if (error) {
          // console.error('Error checking current user:', error);
        } else if (user) {
          setUser(user);
          // Store user ID in AsyncStorage for compatibility with existing code
          await AsyncStorage.setItem('userID', user.id);
        }
      } catch (error) {
        console.error('Error in checkUser:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const authUser: AuthUser = {
            id: session.user.id,
            email: session.user.email || undefined,
            user_metadata: session.user.user_metadata
          };
          setUser(authUser);
          await AsyncStorage.setItem('userID', authUser.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          await AsyncStorage.removeItem('userID');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const { user, error } = await AuthService.signIn(email, password);
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      if (user) {
        setUser(user);
        await AsyncStorage.setItem('userID', user.id);
        return { success: true };
      }
      
      return { success: false, error: 'Sign in failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      const { user, error } = await AuthService.signUp(email, password);
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      if (user) {
        setUser(user);
        await AsyncStorage.setItem('userID', user.id);
        return { success: true };
      }
      
      return { success: false, error: 'Sign up failed' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      const { error } = await AuthService.signInWithGoogle();
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithFacebook = async () => {
    try {
      setError(null);
      const { error } = await AuthService.signInWithFacebook();
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signInWithApple = async () => {
    try {
      setError(null);
      const { error } = await AuthService.signInWithApple();
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await AuthService.signOut();
      
      if (error) {
        setError(error.message);
      } else {
        setUser(null);
        await AsyncStorage.removeItem('userID');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      const { error } = await AuthService.resetPassword(email);
      
      if (error) {
        setError(error.message);
        return { success: false, error: error.message };
      }
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const clearError = () => {
    setError(null);
  };

  const getGoogleToken = async () => {
    try {
      const { token, error } = await AuthService.getGoogleToken();
      
      if (error) {
        return { token: null, error: error.message };
      }
      
      return { token, error: undefined };
    } catch (error) {
      return { token: null, error: 'Failed to get Google token' };
    }
  };

  const getFacebookToken = async () => {
    try {
      const { token, error } = await AuthService.getFacebookToken();
      
      if (error) {
        return { token: null, error: error.message };
      }
      
      return { token, error: undefined };
    } catch (error) {
      return { token: null, error: 'Failed to get Facebook token' };
    }
  };

  const getAppleToken = async () => {
    try {
      const { token, error } = await AuthService.getAppleToken();
      
      if (error) {
        return { token: null, error: error.message };
      }
      
      return { token, error: undefined };
    } catch (error) {
      return { token: null, error: 'Failed to get Apple token' };
    }
  };

  const getProviderToken = async (provider?: 'google' | 'facebook' | 'apple') => {
    try {
      const { token, error } = await AuthService.getProviderToken(provider);
      
      if (error) {
        return { token: null, error: error.message };
      }
      
      return { token, error: undefined };
    } catch (error) {
      return { token: null, error: 'Failed to get provider token' };
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signOut,
    resetPassword,
    getGoogleToken,
    getFacebookToken,
    getAppleToken,
    getProviderToken,
    clearError,
    error,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 