// Password utilities
export { hashPassword, verifyPassword } from './password';

// Session utilities
export { 
  getSession, 
  saveSession, 
  destroySession, 
  generateSessionKey,
  sessionOptions,
  defaultSession 
} from './session';

// Types
export type { SessionData } from './session';