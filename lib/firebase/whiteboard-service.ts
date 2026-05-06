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

// Compress strokes by reducing point density to stay under Firestore 1MB limit
const compressStrokes = (strokes: any[]): any[] => {
  return strokes.map(stroke => ({
    ...stroke,
    // Keep every 3rd point to reduce size
    points: stroke.points?.filter((_: any, i: number) => i % 3 === 0) || [],
  }))
}

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

  const compressed = {
    ...session,
    pages: session.pages.map(page => ({
      ...page,
      strokes: compressStrokes(page.strokes || []),
    })),
  }

  // Timeout after 10 seconds
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Save timed out — check Firebase connection')), 10000)
  )

  await Promise.race([
    setDoc(doc(db, COLLECTION, session.id), compressed),
    timeout,
  ])
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
