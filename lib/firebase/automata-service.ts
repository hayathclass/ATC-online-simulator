import {
  collection,
  doc,
  addDoc,
  setDoc,
  deleteDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './config';
import type { Automaton } from '@/lib/store/automata-store';

const AUTOMATA_COLLECTION = 'automata';

export const saveAutomatonToFirebase = async (automaton: Automaton): Promise<void> => {
  if (!isFirebaseConfigured || !db) return;
  const docRef = doc(db, AUTOMATA_COLLECTION, automaton.id);
  await setDoc(docRef, { ...automaton, updatedAt: Date.now() });
};

export const deleteAutomatonFromFirebase = async (id: string): Promise<void> => {
  if (!isFirebaseConfigured || !db) return;
  await deleteDoc(doc(db, AUTOMATA_COLLECTION, id));
};

export const getAllAutomataFromFirebase = async (): Promise<Automaton[]> => {
  if (!isFirebaseConfigured || !db) return [];
  const q = query(collection(db, AUTOMATA_COLLECTION), orderBy('updatedAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as Automaton);
};
