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
- [App Snapshots](#app-snapshots)
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

## 🖼️ App Snapshots

| Splash | Language | Onboarding | Onboarding | Onboarding | Onboarding |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 57 52" src="https://github.com/user-attachments/assets/47ddf335-e9ac-49e3-8243-ec5c02cea602" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 57 58" src="https://github.com/user-attachments/assets/4185b87c-2445-4ec8-beb4-689db9295fb0" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 58 14" src="https://github.com/user-attachments/assets/dff6c8ee-8acb-4c59-9e02-adbf366bc6a2" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 58 22" src="https://github.com/user-attachments/assets/f132fea9-cba5-426c-8690-5374b5cfe9a9" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 58 51" src="https://github.com/user-attachments/assets/1c3d71fa-7d7c-4ad0-a2cd-6c845cc818da" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 58 56" src="https://github.com/user-attachments/assets/a309b56f-0ccb-44fd-a620-ae8071fb575d" /> |

| Onboarding | Onboarding | Login/Signup | Clerk Auth | Loading | Coachmark |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 58 59" src="https://github.com/user-attachments/assets/71dacc72-528c-4629-a659-8775f8f36933" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 15 59 03" src="https://github.com/user-attachments/assets/f63e2e32-4f84-4a8a-b3e2-d8f3de774a0a" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 02 59" src="https://github.com/user-attachments/assets/eb5692b3-0d02-4668-8e9c-d6bd602ab4d1" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 03 12" src="https://github.com/user-attachments/assets/e155c9c9-5d62-425b-b52e-5b464b807cb6" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 04 29" src="https://github.com/user-attachments/assets/4d180c71-5f68-4f3b-8c3c-b051f374423d" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 04 33" src="https://github.com/user-attachments/assets/ae58f4c0-286d-48ce-8a9c-98ff9980ee34" /> |

| Decks Page | Decks Page | Select | Free Decks | Date Filtering | Sorting |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 04 39" src="https://github.com/user-attachments/assets/d4da4ea0-1168-4533-b74c-8781eb082ad9" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 05 28" src="https://github.com/user-attachments/assets/eb5f4800-ca62-42da-bda9-6c9cedfc434a" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 05" src="https://github.com/user-attachments/assets/3178b3df-bcf9-4105-a0b5-74a5446a99cc" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 12" src="https://github.com/user-attachments/assets/9b4260bb-7ab6-49b3-83f6-e3488b84de3d" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 17" src="https://github.com/user-attachments/assets/6467e574-e4ae-4731-93f2-6ae7148bd4a2" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 21" src="https://github.com/user-attachments/assets/e43d1813-8a2f-4e49-b82b-b52a180912fd" /> |

| Search | Sandwich Menu| Fav Decks | Fav Folders | Folders Page | Decks in Folder |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 26" src="https://github.com/user-attachments/assets/ff38ef13-67ea-486d-98d0-a15df96ca575" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 30" src="https://github.com/user-attachments/assets/bb5798e4-b88e-4189-a136-df164e238b74" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 35" src="https://github.com/user-attachments/assets/85d87c16-1208-4a0b-ad02-3ad7e9af36fd" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 37" src="https://github.com/user-attachments/assets/3c171cc0-f893-4497-a8dd-79c58f33dbad" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 46" src="https://github.com/user-attachments/assets/05b3e120-8d8d-4d0e-bdd4-153b5fdc9082" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 06 51" src="https://github.com/user-attachments/assets/36480f8a-6de0-4f5a-abd7-2685713d76c9" /> |

| Account Page | Account Page | Deck Settings | App Settings | Deck Details | Deck Details |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 00" src="https://github.com/user-attachments/assets/57fc6095-7fa2-4655-9f17-c69414924cb3" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 06" src="https://github.com/user-attachments/assets/30d8749a-d24d-40f6-b15b-7e0f2835c238" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 10" src="https://github.com/user-attachments/assets/95eb6be9-d651-497a-9a52-718e30557530" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 16" src="https://github.com/user-attachments/assets/95cde13f-f9cc-4f96-9d66-a39b86b4b5ec" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 31" src="https://github.com/user-attachments/assets/23845b9a-0191-4b51-81ef-0f0b961745ad" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 35" src="https://github.com/user-attachments/assets/fb2ecd62-e214-4bc2-b64c-0deb321f9809" /> | 

| Add Deck | Gen AI Form | File Upload | File Upload | Youtube Link | Youtube Link |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 44" src="https://github.com/user-attachments/assets/0be842ff-5a54-4b14-9842-f600a7d33c95" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 46" src="https://github.com/user-attachments/assets/0f219e97-882a-40f2-bdb2-9180aa3b0d13" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 46" src="https://github.com/user-attachments/assets/60819aa2-6932-405b-820f-f618412ac9c9" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 07 58" src="https://github.com/user-attachments/assets/91d79058-93ee-4432-8534-9926a828a25d" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 08 07" src="https://github.com/user-attachments/assets/94b463fd-e77c-4e08-a23e-804f98a7f7d0" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 08 09" src="https://github.com/user-attachments/assets/30691043-1d4e-42e7-9ceb-241cc968f15d" /> | 

| Manual | Manual | Manual | Loading | Loading minimized | In-App Notifications |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 08 14" src="https://github.com/user-attachments/assets/877557cf-4b4b-4d2a-8aa4-6c5be8ab4679" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 08 16" src="https://github.com/user-attachments/assets/a50483b1-d6a1-4200-8781-4248d0119627" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 08 20" src="https://github.com/user-attachments/assets/9da693ac-e067-40cb-9303-1242fce4f59c" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 08 51" src="https://github.com/user-attachments/assets/e41fbd6b-89c1-40bb-9151-c16fdec9ffa2" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 08 56" src="https://github.com/user-attachments/assets/ec62d93b-8134-4efb-9673-c198ba2c2daf" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 09 07" src="https://github.com/user-attachments/assets/2525f249-3b2a-4c3d-8568-2fdfb399abde" /> |

| Stats | Stats | Stats | Performance | Performance | Performance |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 10 24" src="https://github.com/user-attachments/assets/8a1a3b16-f685-418c-b736-f2da9ae36ddf" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 09 29" src="https://github.com/user-attachments/assets/c10bc133-e562-45e5-8121-1175315a9130" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 09 32" src="https://github.com/user-attachments/assets/1b5fabcb-4436-4b23-91e1-bf22a2396e82" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 10 38" src="https://github.com/user-attachments/assets/57684d80-0f19-4a06-8025-c6b1664208a8" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 10 45" src="https://github.com/user-attachments/assets/7e5d643e-222f-442a-b0d0-c83be0eb1a32" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 11" src="https://github.com/user-attachments/assets/f3bcbd37-bc64-4f98-99eb-d0cecc18715b" /> |

| Goal Setting | Streak | Streak | Badges | Badges | Badges |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 17" src="https://github.com/user-attachments/assets/3f2857a5-0cfb-4f4f-a20e-108decfae6bf" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 23" src="https://github.com/user-attachments/assets/f68e434e-3f1f-4686-b77e-7702cc34285b" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 29" src="https://github.com/user-attachments/assets/67302c86-126e-44d4-beeb-1dc29d995ebd" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 33" src="https://github.com/user-attachments/assets/1882f06a-9540-49f9-867c-fb8fec675601" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 38" src="https://github.com/user-attachments/assets/f5fb1b39-f73a-45f3-bced-4100d847b8c9" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 41" src="https://github.com/user-attachments/assets/6d214fbd-aac5-4466-b299-a76fa8e01044" />

| Badges | View Flashcards | View Flashcards | Add Flashcards | Loading | Flashcard Qn |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 11 45" src="https://github.com/user-attachments/assets/be16bcfa-5c21-46c6-9eb1-af011bd7f4e6" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 13 37" src="https://github.com/user-attachments/assets/83ddc405-62e3-4690-9610-b8fdc9f89bb2" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 13 41" src="https://github.com/user-attachments/assets/624718d7-465f-4faa-bbb7-4776d91150c7" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 13 47" src="https://github.com/user-attachments/assets/f9d7bcab-b49d-41dd-8f09-2aa606422cd7" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 13 59" src="https://github.com/user-attachments/assets/64ad6fe7-38bb-4891-b6ae-d31bb32723bd" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 14 16" src="https://github.com/user-attachments/assets/39f8ea6f-0587-4cb8-ac29-5f12c8e0dce4" /> | 

| Flashcard Ans | MCQ | Right Ans | Wrong Ans | Voice Record | Audio |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 14 18" src="https://github.com/user-attachments/assets/03b81fec-0be9-4d51-b033-e409e7067a4e" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 14 26" src="https://github.com/user-attachments/assets/300a3f0f-1dd7-43d2-ad3d-a2a851dfa506" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 14 35" src="https://github.com/user-attachments/assets/0e9c89c7-d7d6-4311-8c7f-146b373d1428" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 14 29" src="https://github.com/user-attachments/assets/8cfebeaa-1e5a-4d92-8675-dd9937a7cf61" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 14 42" src="https://github.com/user-attachments/assets/a9302ad8-cc3c-4518-8818-3afcafe0a464" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 14 45" src="https://github.com/user-attachments/assets/eb856127-80d9-4d73-9f92-1a9c4e271e9c" /> |

| Image | Quiz loading | Timer in quiz | Halfway Checkpoint | AI Feedback for Voice | Success Page |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 15 05" src="https://github.com/user-attachments/assets/26da97da-b498-497e-b112-430e66b48245" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 15 25" src="https://github.com/user-attachments/assets/a08f05c1-0b61-48d0-9e0e-5af8d3ff098f" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 15 33" src="https://github.com/user-attachments/assets/609d7e30-daa5-43c1-af57-0a850bf3729e" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 15 40" src="https://github.com/user-attachments/assets/f3a3142f-74f0-4715-88bf-0fec1f07e025" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 16 37" src="https://github.com/user-attachments/assets/896a446e-61d8-419e-97ee-40141bd1a44e" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 16 45" src="https://github.com/user-attachments/assets/4f73fb80-90d8-4737-af11-a6274c301d1b" /> |

| Full quiz stats | Full quiz stats | Dark mode | Dark mode | Dark mode | Dark mode |
| ------- | ------- | ------- | ------- | ------- | ------- |
| <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 16 51" src="https://github.com/user-attachments/assets/82d874c1-7adf-4aa8-a0c8-b1d7b8909c61" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 16 53" src="https://github.com/user-attachments/assets/76220d7b-995c-4e2b-b19a-07d2f33aeace" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 12 04" src="https://github.com/user-attachments/assets/00d93fe5-342f-430c-97be-6e557cb8fa18" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 12 09" src="https://github.com/user-attachments/assets/fa5ed256-1f31-402b-a9f1-c440d75222b0" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 12 27" src="https://github.com/user-attachments/assets/4191f798-eeaa-4b14-8bad-2e7b70e6abc8" /> | <img width="1170" height="2532" alt="Simulator Screenshot - iPhone 13 - 2026-01-03 at 16 12 42" src="https://github.com/user-attachments/assets/4b3ac9e8-d507-40e8-957c-bdd3c71b2c8b" /> |

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
  
4. **Manually Adding Flashcards** (`manualAddDeck.tsx`)
   - Manually typing question and answers
   - Adding custom images
   - Adding custom drawings
   - Adding custom voice input question and answers

### Background Task System

- **Long-Running Operations**: Deck creation continues in background
- **Progress Tracking**: Real-time progress updates via AsyncStorage
- **Network Error Handling**: Graceful handling of connectivity issues
- **Notification Integration**: Background completion notifications

### Multi-Language Support

- **Internationalization**: Full i18n support via LanguageContext
- **Dynamic Language Switching**: Change language on-the-fly
- **Localized Content**: All UI strings and content localized

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
