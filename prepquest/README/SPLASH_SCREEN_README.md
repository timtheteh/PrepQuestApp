# Splash Screen Implementation

## Overview

The splash screen is implemented to show while the database initializes and loads dummy data. It displays the `SplashScreenAnimation.json` animation that covers the full screen.

## How It Works

### 1. Splash Screen Component (`app/splash.tsx`)
- Displays the Lottie animation from `assets/animations/SplashScreenAnimation.json`
- Covers the full screen with a black background
- Includes error handling for animation loading failures
- Shows a "Loading..." text as fallback if animation fails

### 2. Root Layout Integration (`app/_layout.tsx`)
- Shows the splash screen while:
  - Fonts are loading (`!loaded`)
  - Database is initializing (`!isDatabaseReady`)
- Automatically transitions to the main app when both conditions are met
- Includes detailed logging for database initialization timing

### 3. Database Initialization Flow
1. App starts → Native splash screen shows (configured in `app.json`)
2. Native splash screen disappears → Custom splash screen shows
3. Database initialization begins:
   - Schema creation
   - Dummy data population
   - Data verification
4. When complete → Transition to main app (`(tabs)`)

## Files Modified/Created

- **Created**: `app/splash.tsx` - Splash screen component
- **Modified**: `app/_layout.tsx` - Added splash screen logic and database state management

## Customization

### Changing the Animation
Replace the animation file at `assets/animations/SplashScreenAnimation.json` with your own Lottie animation.

### Modifying the Background Color
Edit the `backgroundColor` in the `styles.container` of `app/splash.tsx`.

### Adding Loading Text
The loading text is already included and can be customized in the `styles.loadingText` of `app/splash.tsx`.

### Adjusting Timing
The splash screen automatically disappears when the database is ready. If you need to add a minimum display time, you can modify the logic in `app/_layout.tsx`.

## Error Handling

- If the animation fails to load, a "Loading..." text will be displayed
- If the database initialization fails, the app will still proceed to show the main interface
- All errors are logged to the console for debugging

## Performance Notes

- The splash screen uses `lottie-react-native` which is already installed
- The animation is set to `autoPlay` and `loop` for continuous display
- Database initialization timing is logged to help optimize performance

## Testing

To test the splash screen:
1. Start the app - you should see the native splash screen first
2. Then the custom splash screen with the animation
3. Finally, the main app interface

The splash screen will show for as long as it takes for the database to initialize and load dummy data. 