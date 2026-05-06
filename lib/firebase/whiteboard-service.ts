import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';

export interface WhiteboardPage {
  id: string;
  name: string;
  strokes: any[];
}

export interface WhiteboardSession {
  id: string;
  className: string;
  date: string;
  teacher: string;
  pages: WhiteboardPage[];
  currentPageIndex: number;
}

const COLLECTION = 'whiteboard_sessions';

export const saveWhiteboardSession = async (session: WhiteboardSession): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    // fallback to localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('whiteboard-sessions') || '[]');
      const idx = existing.findIndex((s: WhiteboardSession) => s.id === session.id);
      if (idx >= 0) existing[idx] = session;
      else existing.push(session);
      localStorage.setItem('whiteboard-sessions', JSON.stringify(existing));
    } catch {}
    return;
  }
  await setDoc(doc(db, COLLECTION, session.id), session);
};

export const deleteWhiteboardSession = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) {
    try {
      const existing = JSON.parse(localStorage.getItem('whiteboard-sessions') || '[]');
      localStorage.setItem('whiteboard-sessions', JSON.stringify(existing.filter((s: WhiteboardSession) => s.id !== id)));
    } catch {}
    return;
  }
  await deleteDoc(doc(db, COLLECTION, id));
};

export const getAllWhiteboardSessions = async (): Promise<WhiteboardSession[]> => {
  if (!isFirebaseConfigured || !db) {
    try {
      return JSON.parse(localStorage.getItem('whiteboard-sessions') || '[]');
    } catch {
      return [];
    }
  }
  const q = query(collection(db, COLLECTION), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as WhiteboardSession);
};
