import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  onValue: jest.fn(),
  off: jest.fn()
}));

jest.mock('./config/firebase', () => ({
  db: {},
  auth: {}
})); 