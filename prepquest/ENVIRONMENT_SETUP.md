# Environment Setup Guide

## 1. Create `.env` file

Create a `.env` file in the root of your project with your Supabase credentials:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 2. Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public** key

## 3. Configure OAuth Providers in Supabase

### Google OAuth Setup

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Enable **Google**
   - Add your Google OAuth credentials

2. **In Google Cloud Console:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable **Google+ API** and **Google Identity API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client IDs**
   - Set **Application Type** to **Web application**
   - Add authorized redirect URIs:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**

3. **Back in Supabase:**
   - Paste your Google **Client ID** and **Client Secret**
   - Save the configuration

### Facebook OAuth Setup

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Enable **Facebook**
   - Add your Facebook OAuth credentials

2. **In Facebook Developers:**
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app
   - Add **Facebook Login** product
   - Configure OAuth settings
   - Add redirect URI:
     ```
     https://your-project-ref.supabase.co/auth/v1/callback
     ```
   - Copy **App ID** and **App Secret**

3. **Back in Supabase:**
   - Paste your Facebook **App ID** and **App Secret**
   - Save the configuration

### Apple OAuth Setup (iOS Only)

1. **In Supabase Dashboard:**
   - Go to **Authentication** → **Providers**
   - Enable **Apple**
   - Add your Apple OAuth credentials

2. **In Apple Developer Console:**
   - Go to [Apple Developer](https://developer.apple.com/)
   - Create a **Sign in with Apple** service
   - Configure the service
   - Copy **Service ID**, **Team ID**, and **Key ID**

3. **Back in Supabase:**
   - Paste your Apple credentials
   - Save the configuration

## 4. Configure URL Schemes (for Mobile OAuth)

### For iOS (app.json):
```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "ios": {
      "bundleIdentifier": "com.yourcompany.yourapp"
    }
  }
}
```

### For Android (app.json):
```json
{
  "expo": {
    "scheme": "your-app-scheme",
    "android": {
      "package": "com.yourcompany.yourapp"
    }
  }
}
```

## 5. Update Supabase Redirect URLs

In your Supabase project settings, add these redirect URLs:

```
your-app-scheme://
your-app-scheme://*
```

## 6. Test OAuth Flow

After setup, test the OAuth flow:

1. **Start your app**
2. **Click "Continue with Google"**
3. **You should see Google account selection screen**
4. **Choose an account or add a new one**
5. **Complete the sign-in process**

## Troubleshooting

### If you don't see account selection:

1. **Check Supabase OAuth settings** - Ensure providers are properly configured
2. **Verify redirect URLs** - Make sure they match your app scheme
3. **Clear app cache** - Sometimes cached sessions prevent account selection
4. **Check Google Cloud Console** - Ensure OAuth consent screen is configured
5. **Verify app.json scheme** - Make sure it matches your Supabase redirect URLs

### Common Issues:

- **"Successfully signed in" without account selection**: OAuth not properly configured
- **"Invalid redirect URI"**: Redirect URLs don't match between Supabase and provider
- **"OAuth provider not enabled"**: Provider not enabled in Supabase dashboard

## 7. Environment Variables Reference

```bash
# Required
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (for additional features)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
EXPO_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
```

## 8. Verify Setup

After completing the setup:

1. **Restart your development server**
2. **Clear app cache/storage**
3. **Test OAuth flow** - You should see account selection screens
4. **Check console logs** for any OAuth-related errors

Your OAuth providers should now properly show account selection screens! 🎉 