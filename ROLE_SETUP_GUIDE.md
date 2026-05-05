# Role-Based Access Control Setup Guide

## Overview
The Learning Studio now has role-based access control with two user types:

- **👨‍🏫 Teachers**: Full access - can create, edit, delete, and save sessions
- **👨‍🎓 Students**: Read-only access - can view sessions but cannot make changes

## How It Works

### Teacher Permissions:
✅ Draw on whiteboard  
✅ Use all tools (pen, eraser, colors)  
✅ Save sessions  
✅ Delete sessions  
✅ Add/delete pages  
✅ Undo/Redo actions  

### Student Permissions:
✅ View sessions  
✅ Load saved sessions  
✅ Export as image  
❌ Cannot draw or edit  
❌ Cannot save changes  
❌ Cannot delete anything  

## Setup Instructions

### Step 1: Create User Accounts
1. Go to your app's sign-up page
2. Create accounts for teachers and students
3. Or use Firebase Authentication to create users

### Step 2: Assign Teacher Role
After creating a teacher account, you need to assign them the "teacher" role:

**Method 1: Using Browser Console**
```javascript
// 1. Open browser console (F12)
// 2. Import the setup function
import { setupTeacher } from './lib/firebase/setup-roles'

// 3. Get the user's UID from Firebase Console -> Authentication
// 4. Run:
await setupTeacher('USER_UID_HERE', 'teacher@school.com', 'Teacher Name')
```

**Method 2: Direct Firestore Update**
1. Go to Firebase Console
2. Navigate to Firestore Database
3. Find the `users` collection
4. Create/update document with user's UID as document ID
5. Set these fields:
   ```
   uid: "USER_UID_HERE"
   email: "teacher@school.com"
   role: "teacher"
   displayName: "Teacher Name"
   ```

**Method 3: Create a Setup Page**
Create a temporary admin page in your app:
```tsx
import { setupTeacher } from '@/lib/firebase/setup-roles'

export default function AdminSetup() {
  const handleMakeTeacher = async () => {
    await setupTeacher('uid', 'email@example.com', 'Name')
    alert('Teacher role assigned!')
  }
  
  return <button onClick={handleMakeTeacher}>Make Teacher</button>
}
```

### Step 3: Verify Role
1. Log in as the user
2. Navigate to `/studio`
3. You should see a badge showing "Teacher" or "Student"
4. Teachers see full toolbar, students see "Read-only mode"

## Default Behavior
- **New users** without a role assigned default to **STUDENT** (read-only)
- This is safe - students can't accidentally get teacher permissions

## Testing

### Test as Teacher:
1. Log in with teacher account
2. Go to `/studio`
3. You should see:
   - Blue "Teacher" badge
   - Full drawing tools
   - Save button
   - Delete buttons on sessions (hover over session)

### Test as Student:
1. Log in with student account (or not logged in)
2. Go to `/studio`
3. You should see:
   - Green "Student" badge
   - Yellow "Read Only" badge
   - Message: "📖 Read-only mode - Students can view but cannot edit"
   - No drawing tools
   - No save button
   - Can still load and view sessions

## Database Structure

### Firestore Collection: `users`
```
users/
  {uid}/
    uid: string
    email: string
    role: "teacher" | "student"
    displayName: string
    createdAt: ISO timestamp
    updatedAt: ISO timestamp
```

## Security Notes

⚠️ **Important**: This is client-side role checking. For production:
1. Add Firebase Security Rules to enforce roles server-side
2. Validate all write operations check user roles
3. Don't rely solely on UI restrictions

### Example Firestore Security Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      // Only allow role updates from authenticated users
      allow write: if request.auth != null;
    }
    
    // Sessions - Teachers can write, everyone can read
    match /sessions/{sessionId} {
      allow read: if true;
      allow create, update, delete: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
  }
}
```

## Troubleshooting

**Problem**: Teacher doesn't see editing tools
- **Solution**: Check Firestore has correct role set, refresh page

**Problem**: Student can still draw
- **Solution**: Clear browser cache, ensure role is set to "student"

**Problem**: Role not updating
- **Solution**: Sign out and sign back in to refresh auth state

## Need Help?
Check the file `lib/firebase/setup-roles.ts` for utility functions to manage roles.
