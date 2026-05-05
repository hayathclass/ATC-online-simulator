# Firebase Integration Setup Guide

## Overview

AutomataLab now supports cloud-based storage for classes and sessions using Firebase. This allows teachers to save lessons and students to access them from any device.

## Features

- **Authentication**: Teacher login via Firebase Auth
- **Cloud Storage**: Classes and sessions stored in Firestore
- **Sync**: Automatic sync between Zustand store and Firebase
- **Multi-device Access**: Access your lessons from anywhere

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `automatalab` (or your choice)
4. Enable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Authentication

1. In Firebase Console, go to **Authentication**
2. Click "Get started"
3. Enable **Email/Password** sign-in method
4. Click "Save"

### 3. Create Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Start in **test mode** (for development)
4. Choose a location close to you
5. Click "Enable"

### 4. Get Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (`</>`)
4. Register app name: `automatalab-web`
5. Copy the config values

### 5. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Update `.env.local` with your Firebase config:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

### 6. Install Dependencies

Firebase is already installed. If needed:
```bash
npm install firebase
```

### 7. Restart Development Server

```bash
npm run dev
```

## Firestore Data Structure

### Collections

**classes**
```typescript
{
  id: string,
  name: string,
  description: string,
  teacherId: string,
  teacherName: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**sessions**
```typescript
{
  id: string,
  classId: string,
  title: string,
  description: string,
  teacherId: string,
  teacherName: string,
  lessonData: Lesson, // Full studio state
  metadata: {
    date: Timestamp,
    duration?: number,
    tags?: string[]
  },
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Usage

### In Studio Store

The Zustand store now includes Firebase actions:

```typescript
const {
  // User management
  setUser,
  user,
  
  // Class management
  currentClass,
  classes,
  setCurrentClass,
  loadClasses,
  createClassInFirebase,
  
  // Session management
  currentSessionId,
  sessions,
  setCurrentSessionId,
  loadSessions,
  saveSessionToFirebase,
  loadSessionFromFirebase,
  
  // Sync status
  syncStatus, // 'idle' | 'saving' | 'saved' | 'error'
} = useStudioStore();
```

### Example: Save Session

```typescript
// Set user (after login)
setUser(firebaseUser);

// Create or select a class
const classId = await createClassInFirebase('CS101', 'Introduction to Automata');
setCurrentClass({ id: classId, ... });

// Save current lesson to cloud
const sessionId = await saveSessionToFirebase();
```

### Example: Load Session

```typescript
// Load classes for current user
await loadClasses();

// Select a class
setCurrentClass(selectedClass);

// Load sessions for that class
await loadSessions();

// Load a specific session
await loadSessionFromFirebase(sessionId);
```

## Security Rules (Production)

For production, update Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Teachers can read/write their own classes
    match /classes/{classId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.resource.data.teacherId == request.auth.uid;
      
      // Sessions within a class
      match /sessions/{sessionId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update, delete: if request.auth != null 
                              && resource.data.teacherId == request.auth.uid;
      }
    }
  }
}
```

## Testing Without Firebase

The app works without Firebase configured. You'll see a warning:
```
Firebase not configured. Set environment variables to enable cloud sync.
```

All local features continue to work. Cloud sync is only enabled when environment variables are set.

## Troubleshooting

**Build fails with Firebase error**
- Ensure all environment variables are set in `.env.local`
- Check that Firebase project is properly configured

**Authentication not working**
- Verify Email/Password auth is enabled in Firebase Console
- Check API key restrictions (if any)

**Firestore permission denied**
- Check security rules in Firebase Console
- Ensure user is authenticated before accessing data

## Next Steps

- Add real-time sync with Firestore listeners
- Implement student read-only access
- Add class sharing via invite codes
- Export/import lessons as JSON backup
