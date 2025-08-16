# Clerk Authentication System

This document describes the authentication system implemented for PrepQuest, which uses **Clerk for all authentication methods** including email/password and social logins.

## Overview

The authentication system supports:
- **Email/Password sign up and sign in** (via Clerk)
- **Social login** (Google, Facebook, Apple via Clerk)
- Session persistence
- Automatic user state management
- Backward compatibility with existing code

## Architecture

### Authentication Context
The `HybridAuthContext` (kept for backward compatibility) manages authentication state and provides a unified interface for all authentication methods:

- **Clerk**: Handles all authentication including email/password and OAuth social logins
- **Unified State**: All authentication methods update the same user state

### Files Created/Modified

#### New Files
- `contexts/HybridAuthContext.tsx` - Authentication context (now Clerk-only)
- `hooks/useAuth.ts` - Backward compatibility hook
- `HYBRID_AUTH_README.md` - This documentation

#### Modified Files
- `app/_layout.tsx` - Added HybridAuthProvider wrapper
- `app/splash.tsx` - Updated to use Clerk authentication
- `app/(tabs)/account.tsx` - Updated to use Clerk authentication
- `supabase/supabase.ts` - Removed AuthService (auth now handled by Clerk)

## Authentication Flow

### 1. App Startup
- App checks for existing Clerk session
- If user is authenticated, they skip the login screen
- If no session exists, the login/signup screen is shown

### 2. Email/Password Authentication (Clerk)
- Users can sign in with email/password via Clerk
- Users can sign up with email/password via Clerk
- Password reset functionality via Clerk
- Form validation and error handling
- Email verification support

### 3. Social Login (Clerk)
- Google OAuth via Clerk
- Facebook OAuth via Clerk
- Apple OAuth via Clerk (iOS only)
- Automatic session management

### 4. Authentication State Management
- `HybridAuthContext` manages user state globally
- Automatic session persistence using AsyncStorage
- Real-time auth state changes via Clerk listeners

## Usage Examples

### Using the Auth Hook
```typescript
import { useHybridAuth } from '@/contexts/HybridAuthContext';

function MyComponent() {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    signInWithEmail, 
    signUpWithEmail, 
    resetPassword,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    signOut 
  } = useHybridAuth();
  
  const handleEmailSignIn = async () => {
    const result = await signInWithEmail(email, password);
    if (result.success) {
      // User signed in successfully via Clerk
    } else {
      // Handle error
      console.error(result.error);
    }
  };
  
  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Auth state will be updated automatically
    } catch (error) {
      console.error('Google sign in failed:', error);
    }
  };
  
  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome, {user?.email || user?.id}!</Text>
      ) : (
        <Text>Please sign in</Text>
      )}
    </View>
  );
}
```

### Backward Compatibility
For existing code that uses the old `useAuth` hook:

```typescript
import { useAuth } from '@/hooks/useAuth';

// This will work the same as before, but now uses Clerk for all authentication
const { user, signOut } = useAuth();
```

## Configuration

### Environment Variables
Create a `.env` file in the root of your project:

```bash
# Clerk Configuration (for all authentication)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Supabase Configuration (for database operations only, not auth)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Clerk Setup
1. Go to your Clerk dashboard
2. Enable email/password authentication
3. Configure OAuth providers (Google, Facebook, Apple)
4. Set up redirect URLs and OAuth credentials
5. Configure email templates for verification and password reset

## User Data Structure

The authenticated user object has the following structure:
```typescript
interface AuthUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}
```

## Error Handling

The authentication system includes comprehensive error handling:
- Network errors
- Invalid credentials
- User not found
- Email already in use
- OAuth provider errors
- Session management errors

## Migration from Hybrid to Pure Clerk

The app has been migrated from a hybrid authentication system (Supabase + Clerk) to a pure Clerk system:

### Changes Made
1. **Removed Supabase Authentication** - All authentication now uses Clerk
2. **Updated Authentication Context** - HybridAuthContext now uses Clerk for all methods
3. **Updated Email/Password Flow** - Now handled by Clerk instead of Supabase
4. **Maintained Social Login** - All OAuth functionality continues to use Clerk
5. **Simplified Architecture** - Single authentication provider for all methods

### Benefits
- Simplified authentication architecture with single provider
- Consistent user experience across all authentication methods
- Better email verification and password reset flows via Clerk
- Maintained backward compatibility with existing code
- Unified user state management with richer user data from Clerk

## Troubleshooting

### Common Issues

1. **"Missing Clerk environment variables"**
   - Make sure you have created a `.env` file with Clerk publishable key
   - Verify EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set correctly

2. **Social login not working**
   - Check that OAuth providers are properly configured in Clerk dashboard
   - Verify redirect URIs match between Clerk and OAuth providers

3. **Email/password not working**
   - Check that email/password authentication is enabled in Clerk dashboard
   - Verify email templates are set up in Clerk for verification and password reset

4. **Sign up requires email verification**
   - Clerk may require email verification for new signups
   - Check your Clerk dashboard settings for email verification requirements

5. **Password reset not working**
   - Ensure password reset is enabled in Clerk dashboard
   - Check that email templates are properly configured

### Getting Help

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React Native Guide](https://clerk.com/docs/quickstarts/react-native)
- [React Native Authentication Guide](https://reactnative.dev/docs/authentication) 