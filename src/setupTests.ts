import '@testing-library/jest-dom';

// Mock Firebase environment variables
const mockEnv = {
  VITE_FIREBASE_API_KEY: 'test-api-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'test-auth-domain',
  VITE_FIREBASE_PROJECT_ID: 'test-project-id',
  VITE_FIREBASE_STORAGE_BUCKET: 'test-storage-bucket',
  VITE_FIREBASE_MESSAGING_SENDER_ID: 'test-messaging-sender-id',
  VITE_FIREBASE_APP_ID: 'test-app-id',
  VITE_FIREBASE_DATABASE_URL: 'test-database-url'
};

// Add environment variables to process.env
Object.assign(process.env, mockEnv);

// Mock Firebase modules
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getApp: jest.fn(() => ({}))
}));

jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn(() => ({})),
  get: jest.fn(() => Promise.resolve({ val: () => ({}) })),
  set: jest.fn(() => Promise.resolve()),
  onValue: jest.fn((_ref, callback) => {
    callback({ val: () => ({}) });
    return () => {};
  }),
  off: jest.fn()
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    onAuthStateChanged: jest.fn()
  })),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn((_auth, callback) => {
    callback(null);
    return () => {};
  })
}));

jest.mock('firebase/analytics', () => ({
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn()
})); 