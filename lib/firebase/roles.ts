import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export type UserRole = 'teacher' | 'student';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper to check Firebase availability
const ensureFirebase = (): boolean => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured. Add environment variables to enable cloud sync.');
    return false;
  }
  return true;
};

// Create or update user profile with role
export const setUserRole = async (
  uid: string,
  email: string,
  role: UserRole,
  displayName?: string
): Promise<void> => {
  if (!ensureFirebase()) return;

  const now = new Date().toISOString();
  const userProfile: UserProfile = {
    uid,
    email,
    role,
    displayName: displayName || email.split('@')[0],
    createdAt: now,
    updatedAt: now,
  };

  const docRef = doc(db!, 'users', uid);
  await setDoc(docRef, userProfile, { merge: true });
};

// Get user profile and role
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!ensureFirebase()) return null;

  const docRef = doc(db!, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// Check if user is a teacher
export const isTeacher = async (uid: string): Promise<boolean> => {
  const profile = await getUserProfile(uid);
  return profile?.role === 'teacher';
};

// Check if user is a student
export const isStudent = async (uid: string): Promise<boolean> => {
  const profile = await getUserProfile(uid);
  return profile?.role === 'student';
};
