export const getAuth = jest.fn(() => ({
  currentUser: null,
  onAuthStateChanged: jest.fn()
}));
export const signInWithPopup = jest.fn();
export const GoogleAuthProvider = jest.fn();
export const onAuthStateChanged = jest.fn((_auth, callback) => {
  callback(null);
  return () => {};
}); 