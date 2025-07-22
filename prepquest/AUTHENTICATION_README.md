# Authentication Implementation

This document describes the authentication system implemented for PrepQuest using Supabase.

## Overview

The authentication system supports:
- Email/Password sign up and sign in
- Social login (Google, Facebook, Apple)
- Session persistence
- Automatic user state management

## Files Created/Modified

### New Files
- `lib/supabase.ts` - Supabase client configuration and authentication utilities
- `contexts/AuthContext.tsx` - Authentication context for state management
- `hooks/useAuth.ts` - Re-export of the useAuth hook
- `AUTHENTICATION_README.md` - This documentation

### Modified Files
- `app/splash.tsx` - Integrated authentication UI and logic
- `app/_layout.tsx` - Added AuthProvider wrapper
- `app/(tabs)/account.tsx` - Added user info display and sign out functionality

## Authentication Flow

### 1. App Startup
- App checks for existing session using `AuthService.getCurrentUser()`
- If user is authenticated, they skip the login screen
- If no session exists, the login/signup screen is shown

### 2. Login/Signup Screen
- Users can sign in with email/password
- Users can sign up with email/password
- Users can use social login (Google, Facebook, Apple)
- Form validation and error handling
- Loading states during authentication

### 3. Authentication State Management
- `AuthContext` manages user state globally
- Automatic session persistence using AsyncStorage
- Real-time auth state changes via Supabase listener

## Usage Examples

### Using the Auth Hook
```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, signIn, signUp, signOut, isLoading } = useAuth();
  
  const handleSignIn = async () => {
    const result = await signIn(email, password);
    if (result.success) {
      // User signed in successfully
    } else {
      // Handle error
      console.error(result.error);
    }
  };
  
  return (
    <View>
      {user ? (
        <Text>Welcome, {user.email}!</Text>
      ) : (
        <Text>Please sign in</Text>
      )}
    </View>
  );
}
```

### Social Login
```typescript
const { signInWithGoogle, signInWithFacebook, signInWithApple } = useAuth();

// Google login
await signInWithGoogle();

// Facebook login
await signInWithFacebook();

// Apple login (iOS only)
await signInWithApple();
```

## Configuration

### Supabase Setup
The app is configured to use the Supabase project at:
- URL: `https://esbkgdyjvysatwdlkegc.supabase.co`
- Anonymous key is already configured in `lib/supabase.ts`

### Social Login Setup
To enable social login, you need to configure the providers in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Providers
3. Configure each provider:
   - **Google**: Add your Google OAuth credentials
   - **Facebook**: Add your Facebook OAuth credentials  
   - **Apple**: Add your Apple OAuth credentials

### Environment Variables
For production, consider moving the Supabase URL and key to environment variables:

```typescript
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
```

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
- Social login errors

All errors are displayed to the user via toast messages.

## Security Features

- Session persistence with secure storage
- Automatic token refresh
- Secure OAuth flow for social login
- Input validation and sanitization

## Testing

To test the authentication:

1. **Email/Password**: Use any valid email and password
2. **Social Login**: Ensure providers are configured in Supabase
3. **Sign Out**: Use the sign out button in the account screen
4. **Session Persistence**: Close and reopen the app to verify session persistence

## Troubleshooting

### Common Issues

1. **Social login not working**: Check provider configuration in Supabase dashboard
2. **Session not persisting**: Verify AsyncStorage is working correctly
3. **Network errors**: Check internet connection and Supabase service status

### Debug Information

Enable debug logging by adding console logs in the AuthContext:
```typescript
console.log('Auth state changed:', event, session?.user?.id);
```

## Next Steps

1. **User Profile**: Add user profile management
2. **Password Reset**: Implement password reset functionality
3. **Email Verification**: Add email verification flow
4. **Advanced Security**: Add 2FA, biometric authentication
5. **Analytics**: Track authentication events
6. **Testing**: Add unit tests for authentication functions 