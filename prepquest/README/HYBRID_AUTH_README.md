# Hybrid Authentication System

This document describes the hybrid authentication system implemented for PrepQuest, which uses **Supabase for email/password authentication** and **Clerk for social logins**.

## Overview

The authentication system supports:
- **Email/Password sign up and sign in** (via Supabase)
- **Social login** (Google, Facebook, Apple via Clerk)
- Session persistence
- Automatic user state management
- Backward compatibility with existing code

## Architecture

### Hybrid Authentication Context
The `HybridAuthContext` manages authentication state and provides a unified interface for both authentication methods:

- **Supabase**: Handles email/password authentication
- **Clerk**: Handles OAuth social logins
- **Unified State**: Both authentication methods update the same user state

### Files Created/Modified

#### New Files
- `lib/supabase.ts` - Supabase client configuration and authentication utilities
- `contexts/HybridAuthContext.tsx` - Hybrid authentication context
- `hooks/useAuth.ts` - Backward compatibility hook
- `HYBRID_AUTH_README.md` - This documentation

#### Modified Files
- `app/_layout.tsx` - Added HybridAuthProvider wrapper
- `app/splash.tsx` - Updated to use hybrid authentication
- `app/(tabs)/account.tsx` - Updated to use hybrid authentication

## Authentication Flow

### 1. App Startup
- App checks for existing session using both Supabase and Clerk
- If user is authenticated with either method, they skip the login screen
- If no session exists, the login/signup screen is shown

### 2. Email/Password Authentication (Supabase)
- Users can sign in with email/password via Supabase
- Users can sign up with email/password via Supabase
- Password reset functionality via Supabase
- Form validation and error handling

### 3. Social Login (Clerk)
- Google OAuth via Clerk
- Facebook OAuth via Clerk
- Apple OAuth via Clerk (iOS only)
- Automatic session management

### 4. Authentication State Management
- `HybridAuthContext` manages user state globally
- Automatic session persistence using AsyncStorage
- Real-time auth state changes via both Supabase and Clerk listeners

## Usage Examples

### Using the Hybrid Auth Hook
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
      // User signed in successfully
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
        <Text>Welcome, {user?.id}!</Text>
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

// This will work the same as before, but now uses the hybrid system
const { user, signOut } = useAuth();
```

## Configuration

### Environment Variables
Create a `.env` file in the root of your project:

```bash
# Clerk Configuration (for social logins)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Supabase Configuration (for email/password)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Supabase Setup
1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Settings**
3. Configure email/password authentication
4. Set up password reset templates

### Clerk Setup
1. Go to your Clerk dashboard
2. Configure OAuth providers (Google, Facebook, Apple)
3. Set up redirect URLs and OAuth credentials

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

## Migration from Pure Clerk

The app has been migrated from pure Clerk authentication to a hybrid system:

### Changes Made
1. **Added Supabase Integration** - Email/password authentication now uses Supabase
2. **Updated Authentication Context** - Created HybridAuthContext to manage both systems
3. **Updated Splash Screen** - Now handles both authentication methods
4. **Updated Account Page** - Uses hybrid sign out functionality
5. **Maintained Social Login** - All OAuth functionality still uses Clerk

### Benefits
- More control over email/password authentication
- Better integration with Supabase database
- Maintained social login functionality
- Backward compatibility with existing code
- Unified user state management

## Troubleshooting

### Common Issues

1. **"Missing Supabase environment variables"**
   - Make sure you have created a `.env` file with Supabase credentials

2. **"Missing Clerk environment variables"**
   - Make sure you have created a `.env` file with Clerk publishable key

3. **Social login not working**
   - Check that OAuth providers are properly configured in Clerk dashboard
   - Verify redirect URIs match between Clerk and OAuth providers

4. **Email/password not working**
   - Check that Supabase authentication is properly configured
   - Verify email templates are set up in Supabase

5. **Sign out not working**
   - The hybrid system handles sign out from both Supabase and Clerk
   - Check that both services are properly configured

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [React Native Authentication Guide](https://reactnative.dev/docs/authentication) 