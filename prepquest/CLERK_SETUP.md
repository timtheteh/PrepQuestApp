# Clerk Authentication Setup

This document explains how to set up Clerk authentication for the PrepQuest app.

## Environment Variables

Create a `.env` file in the root of your project with the following variables:

```bash
# Clerk Configuration
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here

# Supabase Configuration (if still needed for other features)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Your Clerk Publishable Key

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application or select an existing one
3. Go to **API Keys** in the sidebar
4. Copy your **Publishable Key**
5. Add it to your `.env` file

## Configuring OAuth Providers

### Google OAuth Setup

1. **In Clerk Dashboard:**
   - Go to **User & Authentication** → **Social Connections**
   - Enable **Google**
   - Add your Google OAuth credentials

2. **In Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable **Google+ API** and **Google Identity API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
   - Set **Application Type** to **Web application**
   - Add authorized redirect URIs from your Clerk dashboard
   - Copy **Client ID** and **Client Secret**

3. **Back in Clerk:**
   - Paste your Google **Client ID** and **Client Secret**
   - Save the configuration

### Facebook OAuth Setup

1. **In Clerk Dashboard:**
   - Go to **User & Authentication** → **Social Connections**
   - Enable **Facebook**
   - Add your Facebook OAuth credentials

2. **In Facebook Developers:**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add **Facebook Login** product
   - Configure OAuth settings
   - Add redirect URI from your Clerk dashboard
   - Copy **App ID** and **App Secret**

3. **Back in Clerk:**
   - Paste your Facebook **App ID** and **App Secret**
   - Save the configuration

### Apple OAuth Setup (iOS Only)

1. **In Clerk Dashboard:**
   - Go to **User & Authentication** → **Social Connections**
   - Enable **Apple**
   - Add your Apple OAuth credentials

2. **In Apple Developer Console:**
   - Go to [Apple Developer](https://developer.apple.com/)
   - Create a **Sign in with Apple** service
   - Configure the service
   - Copy **Service ID**, **Team ID**, and **Key ID**

3. **Back in Clerk:**
   - Paste your Apple credentials
   - Save the configuration

## App Configuration

The app is already configured to use Clerk with the following setup:

### Token Cache
- Uses `expo-secure-store` for secure token storage
- Automatically handles token persistence and refresh

### Authentication Flow
- Splash screen shows when user is not authenticated
- Automatic transition to main app when user signs in
- Sign out functionality in account page

### Features Implemented
- Email/Password sign in and sign up
- Google OAuth
- Facebook OAuth  
- Apple OAuth (iOS only)
- Password reset (placeholder - can be enhanced with Clerk's built-in flow)
- Session persistence
- Automatic auth state management

## Usage

The authentication is now handled by Clerk hooks:

```typescript
import { useAuth, useSignIn, useSignUp, useOAuth } from '@clerk/clerk-expo';

// Check if user is signed in
const { isLoaded, isSignedIn } = useAuth();

// Sign in with email/password
const { signIn } = useSignIn();
const result = await signIn.create({
  identifier: email,
  password,
});

// Sign up with email/password
const { signUp } = useSignUp();
const result = await signUp.create({
  emailAddress: email,
  password,
});

// OAuth sign in
const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
const result = await startOAuthFlow();
```

## Migration from Supabase

The app has been migrated from Supabase authentication to Clerk:

### Changes Made
1. **Removed Supabase AuthContext** - Replaced with Clerk hooks
2. **Updated Splash Screen** - Now uses Clerk authentication directly
3. **Updated App Layout** - Uses ClerkProvider and handles auth state
4. **Updated Account Page** - Uses Clerk's signOut function
5. **Removed Supabase Dependencies** - No longer need Supabase auth

### Benefits
- Better OAuth support
- More secure token handling
- Built-in session management
- Better developer experience
- More authentication options

## Troubleshooting

### Common Issues

1. **"EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY environment variable is required"**
   - Make sure you have created a `.env` file with your Clerk publishable key

2. **OAuth not working**
   - Check that OAuth providers are properly configured in Clerk dashboard
   - Verify redirect URIs match between Clerk and OAuth providers

3. **Sign out not working**
   - Clerk handles sign out automatically when `signOut()` is called
   - The app will automatically show the splash screen when user signs out

4. **Session not persisting**
   - Check that `expo-secure-store` is properly installed
   - Verify token cache configuration

### Getting Help

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk React Native Guide](https://clerk.com/docs/quickstarts/get-started-with-react-native)
- [Clerk Expo Guide](https://clerk.com/docs/quickstarts/get-started-with-expo) 