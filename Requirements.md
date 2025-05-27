# Requirements Document for PrepQuest App

## Overview
**PrepQuest** is a mobile app for AI-powered interview and study preparation via flashcards. It is built using Expo and React Native, with local SQLite storage for offline usage and Supabase for backend services. It integrates various AI APIs for flashcard generation, quizzes, and speech functionality.

---

## 1. Tech Stack

### Frontend
- **React Native** (with **Expo** managed workflow)
- **Tailwind CSS** (via `nativewind`)
- **React Navigation**
- **Redux Toolkit** (optional for state management)
- **Expo Modules**
  - `expo-camera` (for file scanning)
  - `expo-av` (for text-to-speech)
  - `expo-file-system`
  - `expo-sqlite` (for local DB)
  - `expo-notifications`
  - `expo-image-picker`

### Backend
- **Supabase** (Auth, Functions, and Storage)
- **SQLite** (for offline flashcard storage)
- **Custom API routes** (if needed for AI interactions)

---

## 2. AI/ML Services

| Feature                          | Service Used           |
|----------------------------------|------------------------|
| Flashcard generation             | OpenAI / DeepSeek API  |
| OCR (images, PDFs, files)        | Google Vision API      |
| Speech-to-text                   | Whisper API            |
| YouTube caption parsing          | YouTube Data API       |
| Text-to-speech                   | Expo built-in          |

---

## 3. Core Features

- AI-generated flashcards from:
  - Survey
  - Files (PDF, DOCX, images)
  - YouTube links
  - Auto-decks
- Manual flashcard creation
- Multiple quiz formats (Case, Behavioral, Technical, etc.)
- Spaced Repetition (FSRS, QuickRevise)
- Offline study via SQLite
- User statistics & achievements
- Goal tracking
- Push notifications

---

## 4. Dependencies

### Expo Modules
- `expo` (v50+)
- `expo-sqlite`
- `expo-camera`
- `expo-av`
- `expo-file-system`
- `expo-notifications`
- `expo-image-picker`

### React Native Libraries
- `react-native`
- `react-native-svg`
- `react-native-gesture-handler`
- `react-native-reanimated`
- `react-native-safe-area-context`
- `react-native-screens`

### Tailwind Integration
- `nativewind`

### AI SDKs
- `openai` (Node SDK)
- `axios` (for HTTP requests)
- `@supabase/supabase-js`

---

## 5. Development Environment

- **Code Editor**: Cursor AI Code Editor
- **Package Manager**: `npm` or `yarn`
- **Platform**: Expo Go / EAS Build
- **Testing**: Jest + React Native Testing Library (optional)

---

## 6. Security & Performance

- Use `.env` for storing API keys securely
- Configure Supabase rules for auth & data access
- Minimize third-party dependencies for smaller bundle size
- Use caching strategies and pagination for API results

---

## 7. Build & Distribution

- Use **EAS Build** for production builds
- App Store deployment: Android & iOS
- In-app purchases & subscriptions via RevenueCat
- Analytics via Mixpanel
- Attribution via Appsflyer
- Paywall optimization via Superwall

---

## 8. Monetization Limits (Free vs Paid)

| Feature                        | Free                        | Paid                        |
|-------------------------------|-----------------------------|-----------------------------|
| AI flashcards                 | 3 queries, 5 cards each     | Unlimited                   |
| Manual decks                  | 3 decks, 10 cards each      | Unlimited                   |
| File & Anki imports           | ❌                           | ✅                          |
| MCQ Support                   | ❌                           | ✅                          |

---

## 9. APIs & External Services

| Service            | Endpoint / SDK Used                    |
|--------------------|----------------------------------------|
| OpenAI             | `openai` npm SDK or REST API           |
| DeepSeek AI        | REST API                               |
| Google Vision      | `@google-cloud/vision` (backend use)   |
| Whisper            | OpenAI Whisper API                     |
| YouTube Data API   | `youtube/v3/captions`                  |
| Supabase           | `@supabase/supabase-js`                |
| RevenueCat         | `react-native-purchases`               |
| Superwall          | Web SDK (for mobile paywall)           |
| Appsflyer          | `react-native-appsflyer`               |
| Mixpanel           | `@mixpanel/react-native`               |

---

## 10. Notes

- Store flashcards offline using `expo-sqlite`
- All quiz logic and FSRS spaced repetition runs client-side
- App uses multi-modal interactions: audio, text, image, scribble
- Design should be sleek and intuitive, optimized for mobile

---