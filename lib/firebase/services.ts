import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { Lesson } from '@/lib/store/studio-store';

// Firestore collections
const CLASSES_COLLECTION = 'classes';
const SESSIONS_COLLECTION = 'sessions';

// Helper to check Firebase availability
const ensureFirebase = (): boolean => {
  if (!isFirebaseConfigured || !db) {
    console.warn('Firebase not configured. Add environment variables to enable cloud sync.');
    return false;
  }
  return true;
};

export interface Class {
  id: string;
  name: string;
  description: string;
  teacherId: string;
  teacherName: string;
  createdAt: any;
  updatedAt: any;
}

export interface Session {
  id: string;
  classId: string;
  title: string;
  description: string;
  teacherId: string;
  teacherName: string;
  lessonData: Lesson;
  metadata: {
    date: any;
    duration?: number;
    tags?: string[];
  };
  createdAt: any;
  updatedAt: any;
}

// Classes CRUD
export const createClass = async (
  name: string,
  description: string,
  teacherId: string,
  teacherName: string
): Promise<string> => {
  if (!ensureFirebase()) return '';

  const classData = {
    name,
    description,
    teacherId,
    teacherName,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db!, CLASSES_COLLECTION), classData);
  return docRef.id;
};

export const getClass = async (classId: string): Promise<Class | null> => {
  if (!ensureFirebase()) return null;
  
  const docRef = doc(db!, CLASSES_COLLECTION, classId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Class;
  }
  return null;
};

export const getClassesByTeacher = async (teacherId: string): Promise<Class[]> => {
  if (!ensureFirebase()) return [];
  
  const q = query(
    collection(db!, CLASSES_COLLECTION),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Class));
};

export const getAllClasses = async (): Promise<Class[]> => {
  if (!ensureFirebase()) return [];
  
  const q = query(collection(db!, CLASSES_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Class));
};

export const updateClass = async (
  classId: string,
  updates: Partial<Omit<Class, 'id' | 'createdAt'>>
): Promise<void> => {
  if (!ensureFirebase()) return;
  
  const docRef = doc(db!, CLASSES_COLLECTION, classId);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteClass = async (classId: string): Promise<void> => {
  if (!ensureFirebase()) return;
  
  const docRef = doc(db!, CLASSES_COLLECTION, classId);
  await deleteDoc(docRef);
};

// Sessions CRUD
export const createSession = async (
  classId: string,
  title: string,
  description: string,
  teacherId: string,
  teacherName: string,
  lessonData: Lesson
): Promise<string> => {
  if (!ensureFirebase()) return '';

  const sessionData = {
    classId,
    title,
    description,
    teacherId,
    teacherName,
    lessonData,
    metadata: {
      date: serverTimestamp(),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db!, SESSIONS_COLLECTION), sessionData);
  return docRef.id;
};

export const getSession = async (sessionId: string): Promise<Session | null> => {
  if (!ensureFirebase()) return null;
  
  const docRef = doc(db!, SESSIONS_COLLECTION, sessionId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Session;
  }
  return null;
};

export const getSessionsByClass = async (classId: string): Promise<Session[]> => {
  if (!ensureFirebase()) return [];
  
  const q = query(
    collection(db!, SESSIONS_COLLECTION),
    where('classId', '==', classId),
    orderBy('metadata.date', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Session));
};

export const getSessionsByTeacher = async (teacherId: string): Promise<Session[]> => {
  if (!ensureFirebase()) return [];
  
  const q = query(
    collection(db!, SESSIONS_COLLECTION),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as Session));
};

export const updateSession = async (
  sessionId: string,
  updates: Partial<Omit<Session, 'id' | 'createdAt'>>
): Promise<void> => {
  if (!ensureFirebase()) return;
  
  const docRef = doc(db!, SESSIONS_COLLECTION, sessionId);
  await updateDoc(docRef, { ...updates, updatedAt: serverTimestamp() });
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  if (!ensureFirebase()) return;
  
  const docRef = doc(db!, SESSIONS_COLLECTION, sessionId);
  await deleteDoc(docRef);
};

// Save/Load studio session
export const saveStudioSession = async (
  classId: string,
  lessonData: Lesson,
  teacherId: string,
  teacherName: string,
  sessionId?: string
): Promise<string> => {
  if (!ensureFirebase()) return '';
  
  if (sessionId) {
    // Update existing session
    await updateSession(sessionId, {
      lessonData,
      title: lessonData.title,
      description: lessonData.description,
    });
    return sessionId;
  } else {
    // Create new session
    return await createSession(
      classId,
      lessonData.title,
      lessonData.description,
      teacherId,
      teacherName,
      lessonData
    );
  }
};

export const loadStudioSession = async (sessionId: string): Promise<Lesson | null> => {
  if (!ensureFirebase()) return null;
  
  const session = await getSession(sessionId);
  return session?.lessonData || null;
};
