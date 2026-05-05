import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import { getUserProfile, type UserRole } from './roles';

export interface AuthUser extends User {
  role?: UserRole;
  isTeacher?: boolean;
  isStudent?: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Get user role from Firestore
        const profile = await getUserProfile(firebaseUser.uid);
        
        const authUser: AuthUser = {
          ...firebaseUser,
          role: profile?.role || 'student', // Default to student if no role set
          isTeacher: profile?.role === 'teacher',
          isStudent: profile?.role === 'student' || !profile, // Default to student
        };
        
        setUser(authUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signUp = async (email: string, password: string) => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  };

  const signOut = async () => {
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase not configured');
    }
    await firebaseSignOut(auth);
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };
}
