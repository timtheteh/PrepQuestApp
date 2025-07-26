import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

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
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// Authentication service
export class AuthService {
  // Get current user
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        // console.error('Error getting current user:', error);
        return null;
      }
      return user;
    } catch (error) {
    //   console.error('Error getting current user:', error);
      return null;
    }
  }

  // Sign in with email/password
  static async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (data.user) {
        // Store user ID in AsyncStorage for compatibility with existing code
        await AsyncStorage.setItem('userID', data.user.id);
        
        return {
          success: true,
          user: data.user,
        };
      }

      return {
        success: false,
        error: 'Sign in failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign in failed',
      };
    }
  }

  // Sign up with email/password
  static async signUp(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (data.user) {
        // Store user ID in AsyncStorage for compatibility with existing code
        await AsyncStorage.setItem('userID', data.user.id);
        
        return {
          success: true,
          user: data.user,
        };
      }

      return {
        success: false,
        error: 'Sign up failed',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Sign up failed',
      };
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.removeItem('userID');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<AuthResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'prepquest://reset-password',
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Password reset failed',
      };
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error checking authentication:', error);
        return false;
      }
      return !!session;
    } catch (error) {
      console.error('Error checking authentication:', error);
      return false;
    }
  }
} 