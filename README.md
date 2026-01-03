# 🎓 PrepQuest

<div align="center">

**AI-Powered Interview & Study Preparation Platform**

*Transform your learning journey with intelligent flashcards and comprehensive study tools*

[![React Native](https://img.shields.io/badge/React%20Native-0.79.5-61DAFB?logo=react)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0.22-000020?logo=expo)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-Private-red)]()

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Key Features Deep Dive](#-key-features-deep-dive)
- [Development](#-development)
- [Environment Setup](#-environment-setup)
- [Authentication](#-authentication)
- [Build & Deployment](#-build--deployment)
- [License](#-license)

---

## 🎯 Overview

**PrepQuest** is a comprehensive cross-platform mobile application designed to revolutionize how students and professionals prepare for interviews and exams. Built with React Native and Expo, it leverages cutting-edge AI technology to generate intelligent flashcards from various sources including text input, files, YouTube videos, and more.

PrepQuest enables students and interview goers to better prepare for their tests, assessments, interviews using AI-Powered flashcards. In addition to basic CRUD operations (eg. creating flashcards, decks and folders) the app gives the user in-depth data analytics in a visually impactful manner. The app also allows the user to leverage on AI to create flashcards through a myriad of methods: 1. via a form 2. via uploading docs such as pdf, powerpoints, etc 3. via a youtube link 4. manually which includes drawing their own diagrams.

### Core Philosophy

- **Offline-First**: All flashcards and study data stored locally using SQLite
- **AI-Powered**: Intelligent flashcard generation using OpenAI/DeepSeek APIs
- **Spaced Repetition**: Advanced FSRS algorithm for optimal learning retention
- **Multi-Modal**: Support for text, images, audio, and handwritten content
- **Cross-Platform**: Native iOS and Android support with shared codebase

---

## ✨ Features

### 🧠 AI Flashcard Generation
- **Survey-Based Creation**: Generate flashcards from structured forms (study/interview modes)
- **File Processing**: Extract content from PDFs, DOCX, and images via OCR
- **YouTube Integration**: Automatically generate flashcards from video transcripts
- **Smart Prompts**: Context-aware prompt engineering for high-quality flashcards

### 📚 Study Modes
- **Study Mode**: Educational flashcards for academic preparation
- **Interview Mode**: Technical, behavioral, and case study questions
- **Multiple Question Types**: MCQ, Cloze, Voice Recorded, and more
- **Customizable Distribution**: Control the mix of question types

### 🎯 Learning Features
- **Quick Revise**: Fast review mode for quick practice
- **Progress Tracking**: Detailed statistics and performance analytics
- **Goal Setting**: Set and track daily/weekly study goals
- **Achievement System**: Unlock badges and awards for milestones

### 📱 User Experience
- **Offline Support**: Full functionality without internet connection
- **Background Tasks**: Long-running operations continue in background
- **Push Notifications**: Study reminders and achievement notifications
- **Multi-Language Support**: Internationalization for global users
- **Dark/Light Theme**: Automatic theme switching based on system preferences

### 🔐 Security & Sync
- **Hybrid Authentication**: Clerk-based auth with email/password and OAuth
- **Secure Storage**: Encrypted local database with AsyncStorage
- **Cloud Backup**: Optional Supabase sync for data backup
- **Privacy-First**: Local-first architecture with optional cloud features

---

## 🛠 Tech Stack

### Frontend
- **Framework**: React Native 0.79.5 with Expo 53.0.22
- **Routing**: Expo Router (file-based routing)
- **State Management**: React Context API
- **UI Components**: Custom component library with React Native Reanimated
- **Styling**: StyleSheet API with theme system
- **Animations**: Lottie React Native, React Native Reanimated

### Backend & Services
- **Database**: SQLite (expo-sqlite) for local storage
- **Backend**: Supabase (Auth, Functions, Storage)
- **Authentication**: Clerk (Email/Password + OAuth)
- **AI Services**: 
  - DeepSeek API (Flashcard generation)
  - Claude API (OCR)
  - Google Speech-to-text

### Key Libraries
- **File Processing**: `mammoth` (DOCX), `expo-document-picker`
- **Media**: `expo-av`, `expo-audio`, `expo-image-picker`, `expo-camera`
- **Notifications**: `expo-notifications`, `react-native-background-actions`
- **Monetization**: `react-native-purchases` (RevenueCat)
- **Analytics**: Mixpanel, AppsFlyer
- **Other**: `date-fns`, `react-native-calendars`, `lottie-react-native`

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS) or **Android Emulator**
- **Expo Go** app (for quick testing) or **EAS Build** (for development builds)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PrepQuestApp
   ```

2. **Install dependencies**
   ```bash
   cd prepquest
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file in prepquest directory
   cp .env.example .env
   # Edit .env with your credentials (see Environment Setup section)
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   
   # Web (limited functionality)
   npm run web
   ```

### Quick Start Guide

For detailed setup instructions, see:
- [Environment Setup Guide](./prepquest/README/ENVIRONMENT_SETUP.md)
- [Authentication Setup](./prepquest/README/AUTHENTICATION_README.md)
- [Clerk Setup](./prepquest/README/CLERK_SETUP.md)

---

## 📁 Project Structure

```
PrepQuestApp/
├── prepquest/                    # Main application directory
│   ├── app/                      # Expo Router pages
│   │   ├── (tabs)/               # Tab navigation screens
│   │   ├── _layout.tsx           # Root layout with providers
│   │   ├── genAIForm.tsx         # AI flashcard generation form
│   │   ├── flashcardView.tsx     # Flashcard study interface
│   │   ├── fileUploadPage.tsx    # File upload & processing
│   │   └── ...                   # Other screens
│   │
│   ├── components/               # Reusable components
│   │   ├── general/              # General UI components
│   │   ├── formComponents/       # Form-specific components
│   │   ├── modals/               # Modal components
│   │   ├── flashcardView/        # Flashcard-related components
│   │   └── ...                   # Other component categories
│   │
│   ├── contexts/                 # React Context providers
│   │   ├── LanguageContext.tsx   # Internationalization
│   │   ├── ThemeContext.tsx      # Theme management
│   │   ├── HybridAuthContext.tsx # Authentication
│   │   ├── BackgroundTaskContext.tsx # Background operations
│   │   └── ...                   # Other contexts
│   │
│   ├── db/                       # Database layer
│   │   ├── schema.ts             # SQLite schema definitions
│   │   ├── decks.ts              # Deck operations
│   │   ├── users.ts              # User operations
│   │   ├── backup.ts             # Backup/restore functionality
│   │   └── ...                   # Other database modules
│   │
│   ├── utils/                    # Utility functions
│   │   ├── genAIPromptGeneration.ts # AI prompt engineering
│   │   ├── notifications.ts      # Push notification service
│   │   ├── statisticsCache.ts    # Performance optimization
│   │   └── ...                   # Other utilities
│   │
│   ├── constants/                # App constants
│   │   ├── strings.ts            # Internationalization strings
│   │   ├── Colors.ts             # Color definitions
│   │   ├── Fonts.ts              # Font configurations
│   │   └── ...                   # Other constants
│   │
│   ├── assets/                   # Static assets
│   │   ├── fonts/                # Custom fonts
│   │   ├── icons/                # SVG icons
│   │   ├── images/               # Images
│   │   └── animations/           # Lottie animations
│   │
│   ├── supabase/                 # Supabase configuration
│   │   └── supabase.ts           # Supabase client
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts            # Authentication hook
│   │   ├── useThemeColor.ts      # Theme color hook
│   │   └── ...                   # Other hooks
│   │
│   ├── package.json              # Dependencies
│   ├── app.json                  # Expo configuration
│   └── tsconfig.json             # TypeScript configuration
│
├── README.md                     # This file
├── Requirements.md               # Detailed requirements document
└── .env.example                  # Environment variables template
```

---

## 🔍 Key Features Deep Dive

### AI Flashcard Generation

The app supports multiple input methods for generating flashcards:

1. **Form-Based Generation** (`genAIForm.tsx`)
   - Study mode: Education level, subjects, topics, subtopics
   - Interview mode: Job role, interview type, company, experience level
   - Customizable question types and distributions
   - Background task processing for long operations

2. **File Upload** (`fileUploadPage.tsx`)
   - PDF processing with OCR
   - DOCX document parsing
   - Image OCR via Google Vision API
   - Batch processing support

3. **YouTube Integration** (`youtubeLink.tsx`)
   - Automatic transcript extraction
   - Video metadata parsing
   - Smart content segmentation

### Spaced Repetition System

- **Adaptive Learning**: Adjusts difficulty based on performance
- **Progress Tracking**: Detailed statistics on learning progress
- **Review Scheduling**: Intelligent scheduling based on memory retention curves

### Background Task System

- **Long-Running Operations**: Deck creation continues in background
- **Progress Tracking**: Real-time progress updates via AsyncStorage
- **Network Error Handling**: Graceful handling of connectivity issues
- **Notification Integration**: Background completion notifications

### Multi-Language Support

- **Internationalization**: Full i18n support via LanguageContext
- **Dynamic Language Switching**: Change language on-the-fly
- **Localized Content**: All UI strings and content localized
- **RTL Support**: Right-to-left language support (where applicable)

---

## 💻 Development

### Development Scripts

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web (limited)
npm run web

# Lint code
npm run lint

# Reset project (cleans example code)
npm run reset-project
```

### Code Style

- **TypeScript**: Strict type checking enabled
- **ESLint**: Expo ESLint configuration
- **File Naming**: PascalCase for components, camelCase for utilities
- **Component Structure**: Functional components with hooks

### Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm test -- --watch
```

### Debugging

- **React Native Debugger**: Use for debugging React components
- **Flipper**: Network inspection and debugging
- **Expo Dev Tools**: Built-in debugging tools
- **Console Logs**: Comprehensive logging throughout the app

---

## ⚙️ Environment Setup

### Required Environment Variables

Create a `.env` file in the `prepquest` directory:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL=your_supabase_functions_url

# Clerk Configuration (if using Clerk)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Services (configured in Supabase Edge Functions)
# These are typically handled server-side via Supabase Functions
```

### Supabase Setup

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from Settings → API
3. Set up Edge Functions for AI flashcard generation
4. Configure storage buckets for file uploads (if needed)

See [Environment Setup Guide](./prepquest/README/ENVIRONMENT_SETUP.md) for detailed instructions.

### Clerk Authentication Setup

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Configure OAuth providers (Google, Facebook, Apple)
4. Get your publishable key
5. Configure redirect URLs

See [Clerk Setup Guide](./prepquest/README/CLERK_SETUP.md) for detailed instructions.

---

## 🔐 Authentication

PrepQuest uses a hybrid authentication system:

- **Primary**: Clerk for all authentication methods
- **Fallback**: Supabase Auth (legacy support)
- **Methods**: Email/Password, Google OAuth, Facebook OAuth, Apple Sign-In

### Authentication Flow

1. User opens app → Check for existing session
2. If authenticated → Skip to main app
3. If not authenticated → Show login/signup screen
4. After authentication → Sync user data with local database

See [Authentication README](./prepquest/README/AUTHENTICATION_README.md) for details.

---

## 📦 Build & Deployment

### Development Build

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for iOS (development)
eas build --platform ios --profile development

# Build for Android (development)
eas build --platform android --profile development
```

### Production Build

```bash
# Build for iOS (production)
eas build --platform ios --profile production

# Build for Android (production)
eas build --platform android --profile production

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

### EAS Configuration

The project uses EAS Build for native builds. Configuration is in `eas.json`:

- **Development Profile**: For testing on physical devices
- **Production Profile**: For App Store/Play Store releases
- **Preview Profile**: For internal testing

### App Store Requirements

- **iOS**: Requires Apple Developer account ($99/year)
- **Android**: Requires Google Play Developer account ($25 one-time)

---

## 📄 License

This project is **private** and proprietary. All rights reserved.

---

<div align="center">

**Built with ❤️ using React Native & Expo**

*Making learning smarter, one flashcard at a time* 🚀

</div>
