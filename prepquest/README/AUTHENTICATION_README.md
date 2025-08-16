# Authentication Implementation

This document describes the authentication system implemented for PrepQuest using Clerk.

## Overview

The authentication system supports:
- Email/Password sign up and sign in (via Clerk)
- Social login (Google, Facebook, Apple via Clerk)
- Session persistence
- Automatic user state management
- Email verification and password reset

## Files Created/Modified

### New Files
- `contexts/HybridAuthContext.tsx` - Authentication context for state management (now Clerk-only)
- `hooks/useAuth.ts` - Re-export of the useAuth hook for backward compatibility
- `AUTHENTICATION_README.md` - This documentation

### Modified Files
- `app/splash.tsx` - Integrated authentication UI and logic using Clerk
- `app/_layout.tsx` - Added HybridAuthProvider wrapper
- `app/(tabs)/account.tsx` - Added user info display and sign out functionality
- `supabase/supabase.ts` - Removed AuthService (auth now handled by Clerk)

## Authentication Flow

### 1. App Startup
- App checks for existing Clerk session
- If user is authenticated, they skip the login screen
- If no session exists, the login/signup screen is shown

### 2. Login/Signup Screen
- Users can sign in with email/password via Clerk
- Users can sign up with email/password via Clerk
- Users can use social login (Google, Facebook, Apple) via Clerk
- Form validation and error handling
- Loading states during authentication
- Email verification support for new signups

### 3. Authentication State Management
- `HybridAuthContext` manages user state globally
- Automatic session persistence using AsyncStorage
- Real-time auth state changes via Clerk listeners

## Usage Examples

### Using the Auth Hook
```typescript
import { useHybridAuth } from '@/contexts/HybridAuthContext';
// Or use the backward-compatible import:
// import { useAuth } from '@/hooks/useAuth';

function MyComponent() {
  const { user, signInWithEmail, signUpWithEmail, signOut, isLoading } = useHybridAuth();
  
  const handleSignIn = async () => {
    const result = await signInWithEmail(email, password);
    if (result.success) {
      // User signed in successfully via Clerk
    } else {
      // Handle error
      console.error(result.error);
    }
  };
  
  return (
    <View>
      {user ? (
        <Text>Welcome, {user.email || user.id}!</Text>
      ) : (
        <Text>Please sign in</Text>
      )}
    </View>
  );
}
```

### Social Login
```typescript
const { signInWithGoogle, signInWithFacebook, signInWithApple } = useHybridAuth();

// Google login via Clerk
await signInWithGoogle();

// Facebook login via Clerk
await signInWithFacebook();

// Apple login via Clerk (iOS only)
await signInWithApple();
```

## Configuration

### Clerk Setup
The app uses Clerk for all authentication. To configure:

1. Go to your Clerk dashboard
2. Enable email/password authentication
3. Configure OAuth providers (Google, Facebook, Apple)
4. Set up redirect URLs and OAuth credentials
5. Configure email templates for verification and password reset

### Social Login Setup
To enable social login, you need to configure the providers in your Clerk dashboard:

1. Go to your Clerk project dashboard
2. Navigate to User & Authentication > Social connections
3. Configure each provider:
   - **Google**: Add your Google OAuth credentials
   - **Facebook**: Add your Facebook OAuth credentials  
   - **Apple**: Add your Apple OAuth credentials

### Environment Variables
Make sure you have the Clerk publishable key in your environment variables:

```bash
# .env file
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
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

1. **Email/Password**: Use any valid email and password (may require email verification)
2. **Social Login**: Ensure providers are configured in Clerk dashboard
3. **Sign Out**: Use the sign out button in the account screen
4. **Session Persistence**: Close and reopen the app to verify session persistence

## Troubleshooting

### Common Issues

1. **Social login not working**: Check provider configuration in Clerk dashboard
2. **Session not persisting**: Verify AsyncStorage is working correctly
3. **Email/password signup failing**: Check if email verification is required in Clerk settings
4. **Network errors**: Check internet connection and Clerk service status

### Debug Information

Enable debug logging by adding console logs in the HybridAuthContext:
```typescript
console.log('Auth state changed:', isClerkSignedIn, clerkUserId);
```

## Next Steps

1. **User Profile**: Add user profile management using Clerk's user management features
2. **Email Verification Flow**: Handle email verification responses in the app
3. **Advanced Security**: Add 2FA, biometric authentication via Clerk
4. **Analytics**: Track authentication events
5. **Testing**: Add unit tests for authentication functions
6. **Error Handling**: Improve error messages and user feedback 