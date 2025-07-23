import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your Supabase configuration
if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('EXPO_PUBLIC_SUPABASE_URL environment variable is required');
}
if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable is required');
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Authentication types
export interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  provider_token?: string; // OAuth provider token (Google, Facebook, etc.)
  provider_refresh_token?: string; // OAuth refresh token
}

export interface AuthError {
  message: string;
  status?: number;
}

// Authentication utilities
export class AuthService {
  // Sign up with email and password
  static async signUp(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        // Check for specific error cases
        let customMessage = error.message;
        
        // Check if user already exists
        if (error.message.includes('User already registered') ||
            error.message.includes('Email already registered') ||
            error.message.includes('User already exists')) {
          customMessage = 'User already exists! Please sign in instead';
        }
        
        return {
          user: null,
          error: { message: customMessage, status: error.status }
        };
      }

      return {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || undefined,
          user_metadata: data.user.user_metadata
        } : null,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Check for specific error cases
        let customMessage = error.message;
        
        // Check if user doesn't exist (common Supabase error messages)
        if (error.message.includes('Invalid login credentials') || 
            error.message.includes('Email not confirmed') ||
            error.message.includes('User not found') ||
            error.message.includes('Invalid email or password')) {
          customMessage = 'Invalid user! Sign up first';
        }
        
        return {
          user: null,
          error: { message: customMessage, status: error.status }
        };
      }

      return {
        user: data.user ? {
          id: data.user.id,
          email: data.user.email || undefined,
          user_metadata: data.user.user_metadata
        } : null,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Sign in with Google
  static async signInWithGoogle(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'prepquest://',
          queryParams: {
            // Force account selection screen
            prompt: 'select_account',
            // Request additional scopes if needed
            access_type: 'offline',
            // Include refresh token
            include_granted_scopes: 'true'
          }
        }
      });

      if (error) {
        return {
          user: null,
          error: { message: error.message, status: error.status }
        };
      }

      // For mobile, we need to handle the OAuth flow differently
      // The user will be redirected to the browser and back to the app
      return {
        user: null, // Will be set after OAuth completion
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Sign in with Facebook
  static async signInWithFacebook(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'prepquest://',
          queryParams: {
            // Force account selection screen
            auth_type: 'reauthenticate',
            // Request additional permissions if needed
            scope: 'email,public_profile'
          }
        }
      });

      if (error) {
        return {
          user: null,
          error: { message: error.message, status: error.status }
        };
      }

      return {
        user: null, // Will be set after OAuth completion
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Sign in with Apple (iOS only)
  static async signInWithApple(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: Platform.OS === 'web' ? window.location.origin : 'prepquest://',
          queryParams: {
            // Force account selection screen
            response_mode: 'form_post',
            // Request additional scopes if needed
            scope: 'name email'
          }
        }
      });

      if (error) {
        return {
          user: null,
          error: { message: error.message, status: error.status }
        };
      }

      return {
        user: null, // Will be set after OAuth completion
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

    // Sign out
  static async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return {
          error: { message: error.message, status: error.status }
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'prepquest://reset-password',
      });

      if (error) {
        return {
          error: { message: error.message, status: error.status }
        };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<{ user: AuthUser | null; error: AuthError | null }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        return {
          user: null,
          error: { message: error.message, status: error.status }
        };
      }

      return {
        user: user ? {
          id: user.id,
          email: user.email || undefined,
          user_metadata: user.user_metadata
        } : null,
        error: null
      };
    } catch (error) {
      return {
        user: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Get current session
  static async getCurrentSession(): Promise<{ session: any | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return {
          session: null,
          error: { message: error.message, status: error.status }
        };
      }

      return {
        session,
        error: null
      };
    } catch (error) {
      return {
        session: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Get OAuth provider token (for any provider)
  static async getProviderToken(provider?: 'google' | 'facebook' | 'apple'): Promise<{ token: string | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return {
          token: null,
          error: { message: error.message, status: error.status }
        };
      }

      if (!session) {
        return {
          token: null,
          error: { message: 'No active session found' }
        };
      }

      // If no specific provider requested, return any available token
      if (!provider) {
        const providerToken = session.provider_token;
        
        if (!providerToken) {
          return {
            token: null,
            error: { message: 'No provider token found. User may not have signed in with OAuth.' }
          };
        }

        return {
          token: providerToken,
          error: null
        };
      }

      // Check if user signed in with the specified provider
      const user = session.user;
      const identities = user?.identities || [];
      const providerIdentity = identities.find((identity: any) => identity.provider === provider);

      if (!providerIdentity) {
        return {
          token: null,
          error: { message: `User did not sign in with ${provider}` }
        };
      }

      // Get the provider token
      const providerToken = session.provider_token;
      
      if (!providerToken) {
        return {
          token: null,
          error: { message: `No ${provider} OAuth token found` }
        };
      }

      return {
        token: providerToken,
        error: null
      };
    } catch (error) {
      return {
        token: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Get Google OAuth token specifically
  static async getGoogleToken(): Promise<{ token: string | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return {
          token: null,
          error: { message: error.message, status: error.status }
        };
      }

      if (!session) {
        return {
          token: null,
          error: { message: 'No active session found' }
        };
      }

      // Check if user signed in with Google
      const user = session.user;
      const identities = user?.identities || [];
      const googleIdentity = identities.find((identity: any) => identity.provider === 'google');

      if (!googleIdentity) {
        return {
          token: null,
          error: { message: 'User did not sign in with Google' }
        };
      }

      // Get the provider token
      const providerToken = session.provider_token;
      
      if (!providerToken) {
        return {
          token: null,
          error: { message: 'No Google OAuth token found' }
        };
      }

      return {
        token: providerToken,
        error: null
      };
    } catch (error) {
      return {
        token: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Get Facebook OAuth token specifically
  static async getFacebookToken(): Promise<{ token: string | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return {
          token: null,
          error: { message: error.message, status: error.status }
        };
      }

      if (!session) {
        return {
          token: null,
          error: { message: 'No active session found' }
        };
      }

      // Check if user signed in with Facebook
      const user = session.user;
      const identities = user?.identities || [];
      const facebookIdentity = identities.find((identity: any) => identity.provider === 'facebook');

      if (!facebookIdentity) {
        return {
          token: null,
          error: { message: 'User did not sign in with Facebook' }
        };
      }

      // Get the provider token
      const providerToken = session.provider_token;
      
      if (!providerToken) {
        return {
          token: null,
          error: { message: 'No Facebook OAuth token found' }
        };
      }

      return {
        token: providerToken,
        error: null
      };
    } catch (error) {
      return {
        token: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }

  // Get Apple OAuth token specifically
  static async getAppleToken(): Promise<{ token: string | null; error: AuthError | null }> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        return {
          token: null,
          error: { message: error.message, status: error.status }
        };
      }

      if (!session) {
        return {
          token: null,
          error: { message: 'No active session found' }
        };
      }

      // Check if user signed in with Apple
      const user = session.user;
      const identities = user?.identities || [];
      const appleIdentity = identities.find((identity: any) => identity.provider === 'apple');

      if (!appleIdentity) {
        return {
          token: null,
          error: { message: 'User did not sign in with Apple' }
        };
      }

      // Get the provider token
      const providerToken = session.provider_token;
      
      if (!providerToken) {
        return {
          token: null,
          error: { message: 'No Apple OAuth token found' }
        };
      }

      return {
        token: providerToken,
        error: null
      };
    } catch (error) {
      return {
        token: null,
        error: { message: 'An unexpected error occurred' }
      };
    }
  }



  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

export default supabase; 