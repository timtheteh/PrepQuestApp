import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useSignIn as useClerkSignIn, useSignUp as useClerkSignUp, useOAuth, useUser } from '@clerk/clerk-expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Authentication types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

interface ClerkAuthContextType {
  // User state
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Clerk email/password methods
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
  deleteAccount: () => Promise<AuthResult>;
}

const ClerkAuthContext = createContext<ClerkAuthContextType | undefined>(undefined);

export const useHybridAuth = () => {
  const context = useContext(ClerkAuthContext);
  if (!context) {
    throw new Error('useHybridAuth must be used within a ClerkAuthProvider');
  }
  return context;
};

interface ClerkAuthProviderProps {
  children: React.ReactNode;
}

// Keep the same export name for backward compatibility, but now it's purely Clerk-based
export const HybridAuthProvider: React.FC<ClerkAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Clerk hooks
  const { isLoaded: isClerkLoaded, isSignedIn: isClerkSignedIn, userId: clerkUserId, signOut: clerkSignOut } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signIn: clerkSignIn, setActive: setActiveSignIn } = useClerkSignIn();
  const { signUp: clerkSignUp, setActive: setActiveSignUp } = useClerkSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: 'oauth_facebook' });
  const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: 'oauth_apple' });

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (isClerkLoaded && isClerkSignedIn && clerkUserId) {
          // User is authenticated with Clerk
          const authUser: AuthUser = {
            id: clerkUserId,
            email: clerkUser?.primaryEmailAddress?.emailAddress,
            user_metadata: {
              full_name: clerkUser?.fullName || undefined,
              avatar_url: clerkUser?.imageUrl || undefined,
            },
          };
          setUser(authUser);
          setIsAuthenticated(true);
          // Store user ID in AsyncStorage for compatibility
          await AsyncStorage.setItem('userID', clerkUserId);
        } else if (isClerkLoaded) {
          // Only clear state if Clerk is loaded and user is not signed in
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // Only set loading to false if Clerk is loaded
        if (isClerkLoaded) {
          setIsLoading(false);
        }
      }
    };

    // Use setTimeout to avoid state updates during render phase
    const timeoutId = setTimeout(() => {
      initializeAuth();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [isClerkLoaded, isClerkSignedIn, clerkUserId, clerkUser]);

  // Handle Clerk auth state changes
  useEffect(() => {
    if (isClerkLoaded && !isClerkSignedIn) {
      // If Clerk session is cleared, also clear our state
      setUser(null);
      setIsAuthenticated(false);
    }
  }, [isClerkLoaded, isClerkSignedIn]);

  // Clerk email/password authentication methods
  const signInWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!clerkSignIn) {
        return {
          success: false,
          error: 'Sign in not available',
        };
      }

      const result = await clerkSignIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActiveSignIn({ session: result.createdSessionId });
        // Auth state will be updated by the useEffect
        return {
          success: true,
        };
      } else {
        return {
          success: false,
          error: 'Sign in incomplete',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.errors?.[0]?.message || error.message || 'Sign in failed',
      };
    }
  };

  const signUpWithEmail = async (email: string, password: string): Promise<AuthResult> => {
    try {
      if (!clerkSignUp) {
        return {
          success: false,
          error: 'Sign up not available',
        };
      }

      const result = await clerkSignUp.create({
        emailAddress: email,
        password,
      });

      if (result.status === 'complete') {
        await setActiveSignUp({ session: result.createdSessionId });
        // Auth state will be updated by the useEffect
        return {
          success: true,
        };
      } else if (result.status === 'missing_requirements') {
        // Handle email verification if required
        await result.prepareEmailAddressVerification({ strategy: 'email_code' });
        return {
          success: false,
          error: 'Email verification required. Please check your email.',
        };
      } else {
        return {
          success: false,
          error: 'Sign up incomplete',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.errors?.[0]?.message || error.message || 'Sign up failed',
      };
    }
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    try {
      if (!clerkSignIn) {
        return {
          success: false,
          error: 'Password reset not available',
        };
      }

      // Create a sign-in attempt with the email
      const result = await clerkSignIn.create({
        identifier: email,
      });

      // Look for reset password factor in supported first factors
      const resetPasswordFactor = result.supportedFirstFactors?.find(
        (factor: any) => factor.strategy === 'reset_password_email_code'
      );

      if (!resetPasswordFactor) {
        return {
          success: false,
          error: 'Password reset not available for this email',
        };
      }

      // Prepare the reset password email
      await result.prepareFirstFactor({
        strategy: 'reset_password_email_code',
        emailAddressId: (resetPasswordFactor as any).emailAddressId,
      });

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.errors?.[0]?.message || error.message || 'Password reset failed',
      };
    }
  };

  // Clerk social login methods
  const signInWithGoogle = async (): Promise<void> => {
    try {
      const result = await startGoogleOAuth();
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // The auth state will be updated by the useEffect
      } else {
        // User canceled OAuth - throw a specific cancellation error
        const cancelError = new Error('User canceled OAuth');
        (cancelError as any).code = 'oauth_canceled';
        throw cancelError;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  };

  const signInWithFacebook = async (): Promise<void> => {
    try {
      const result = await startFacebookOAuth();
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // The auth state will be updated by the useEffect
      } else {
        // User canceled OAuth - throw a specific cancellation error
        const cancelError = new Error('User canceled OAuth');
        (cancelError as any).code = 'oauth_canceled';
        throw cancelError;
      }
    } catch (error) {
      console.error('Facebook sign in error:', error);
      throw error;
    }
  };

  const signInWithApple = async (): Promise<void> => {
    try {
      const result = await startAppleOAuth();
      if (result.createdSessionId && result.setActive) {
        await result.setActive({ session: result.createdSessionId });
        // The auth state will be updated by the useEffect
      } else {
        // User canceled OAuth - throw a specific cancellation error
        const cancelError = new Error('User canceled OAuth');
        (cancelError as any).code = 'oauth_canceled';
        throw cancelError;
      }
    } catch (error) {
      console.error('Apple sign in error:', error);
      throw error;
    }
  };

  // Common methods
  const signOut = async (): Promise<void> => {
    try {
      // Sign out from Clerk
      if (clerkSignOut) {
        await clerkSignOut();
      }
      // Clear AsyncStorage
      await AsyncStorage.removeItem('userID');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (isClerkSignedIn && clerkUserId && clerkUser) {
        const authUser: AuthUser = {
          id: clerkUserId,
          email: clerkUser.primaryEmailAddress?.emailAddress,
          user_metadata: {
            full_name: clerkUser.fullName || undefined,
            avatar_url: clerkUser.imageUrl || undefined,
          },
        };
        setUser(authUser);
        setIsAuthenticated(true);
        await AsyncStorage.setItem('userID', clerkUserId);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const deleteAccount = async (): Promise<AuthResult> => {
    try {
      if (!clerkUser || !clerkUserId) {
        return {
          success: false,
          error: 'No user to delete',
        };
      }

      // Note: Local data deletion is now handled by the background task
      // This function only handles the Clerk account deletion
      console.log('Deleting account from Clerk...');
      
      // Delete the account from Clerk
      await clerkUser.delete();
      
      // Clear local state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear AsyncStorage (should already be cleared by background task, but just to be safe)
      await AsyncStorage.removeItem('userID');
      
      console.log('Clerk account successfully deleted');
      return {
        success: true,
      };
      
    } catch (error: any) {
      console.error('Error deleting Clerk account:', error);
      return {
        success: false,
        error: error.errors?.[0]?.message || error.message || 'Account deletion failed',
      };
    }
  };

  const value: ClerkAuthContextType = {
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
    deleteAccount,
  };

  return (
    <ClerkAuthContext.Provider value={value}>
      {children}
    </ClerkAuthContext.Provider>
  );
}; 