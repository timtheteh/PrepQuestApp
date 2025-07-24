import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useSignIn as useClerkSignIn, useSignUp as useClerkSignUp, useOAuth } from '@clerk/clerk-expo';
import { AuthService, AuthUser, AuthResult } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HybridAuthContextType {
  // User state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Supabase email/password methods
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  
  // Clerk social login methods
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  
  // Common methods
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const HybridAuthContext = createContext<HybridAuthContextType | undefined>(undefined);

export const useHybridAuth = () => {
  const context = useContext(HybridAuthContext);
  if (!context) {
    throw new Error('useHybridAuth must be used within a HybridAuthProvider');
  }
  return context;
};

interface HybridAuthProviderProps {
  children: React.ReactNode;
}

export const HybridAuthProvider: React.FC<HybridAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Clerk hooks
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, userId: clerkUserId, signOut: clerkSignOut } = useClerkAuth();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check if user is authenticated with Supabase
        const supabaseUser = await AuthService.getCurrentUser();
        const isSupabaseAuthenticated = await AuthService.isAuthenticated();
        
        if (supabaseUser && isSupabaseAuthenticated) {
          setUser(supabaseUser);
          setIsAuthenticated(true);
        } else if (isClerkLoaded && isClerkSignedIn && clerkUserId) {
          // User is authenticated with Clerk (social login)
          const clerkUser: AuthUser = {
            id: clerkUserId,
            email: undefined, // Clerk doesn't expose email directly in this context
            user_metadata: {
              full_name: undefined,
              avatar_url: undefined,
            },
          };
          setUser(clerkUser);
          setIsAuthenticated(true);
          // Store user ID in AsyncStorage for compatibility
          await AsyncStorage.setItem('userID', clerkUserId);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [isClerkLoaded, isClerkSignedIn, clerkUserId]);

  // Handle Clerk auth state changes
  useEffect(() => {
    if (isClerkLoaded && !isClerkSignedIn) {
      // If Clerk session is cleared, also clear our state
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [isClerkLoaded, isClerkSignedIn]);

  // Supabase email/password authentication methods
  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      // First, ensure we're signed out from Clerk if there's a session
      if (isClerkLoaded && isClerkSignedIn && clerkSignOut) {
        await clerkSignOut();
      }
      
      const result = await AuthService.signIn(email, password);
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed',
      };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      // First, ensure we're signed out from Clerk if there's a session
      if (isClerkLoaded && isClerkSignedIn && clerkSignOut) {
        await clerkSignOut();
      }
      
      const result = await AuthService.signUp(email, password);
      if (result.success && result.user) {
        setUser(result.user);
        setIsAuthenticated(true);
      }
      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign up failed',
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    return await AuthService.resetPassword(email);
  };

  // Clerk social login methods
  const signInWithGoogle = async (): Promise<void> => {
    try {
      // First, ensure we're signed out from Supabase if there's a session
      const isSupabaseAuthenticated = await AuthService.isAuthenticated();
      if (isSupabaseAuthenticated) {
        await AuthService.signOut();
      }
      
      const result = await startGoogleOAuth();
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // The auth state will be updated by the useEffect
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithFacebook = async (): Promise<void> => {
    try {
      // First, ensure we're signed out from Supabase if there's a session
      const isSupabaseAuthenticated = await AuthService.isAuthenticated();
      if (isSupabaseAuthenticated) {
        await AuthService.signOut();
      }
      
      const result = await startFacebookOAuth();
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // The auth state will be updated by the useEffect
      }
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  };

  const signInWithApple = async (): Promise<void> => {
    try {
      // First, ensure we're signed out from Supabase if there's a session
      const isSupabaseAuthenticated = await AuthService.isAuthenticated();
      if (isSupabaseAuthenticated) {
        await AuthService.signOut();
      }
      
      const result = await startAppleOAuth();
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // The auth state will be updated by the useEffect
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  };

  // Common methods
  const signOut = async (): Promise<void> => {
    try {
      // Sign out from both Supabase and Clerk
      await AuthService.signOut();
      if (clerkSignOut) {
        await clerkSignOut();
      }
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const supabaseUser = await AuthService.getCurrentUser();
      if (supabaseUser) {
        setUser(supabaseUser);
        setIsAuthenticated(true);
      } else if (isClerkSignedIn && clerkUserId) {
        const clerkUser: AuthUser = {
          id: clerkUserId,
          email: undefined,
          user_metadata: {
            full_name: undefined,
            avatar_url: undefined,
          },
        };
        setUser(clerkUser);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: HybridAuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signOut,
    refreshUser,
  };

  return (
    <HybridAuthContext.Provider value={value}>
      {children}
    </HybridAuthContext.Provider>
  );
}; 