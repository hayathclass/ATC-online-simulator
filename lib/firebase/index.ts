// Firebase Configuration
export { app, db, auth, isFirebaseConfigured } from './config';

// Firebase Services
export {
  // Classes
  createClass,
  getClass,
  getClassesByTeacher,
  getAllClasses,
  updateClass,
  deleteClass,
  
  // Sessions
  createSession,
  getSession,
  getSessionsByClass,
  getSessionsByTeacher,
  updateSession,
  deleteSession,
  
  // Studio Sync
  saveStudioSession,
  loadStudioSession,
  
  // Types
  type Class,
  type Session,
} from './services';

// Authentication Hook
export { useAuth } from './auth';
