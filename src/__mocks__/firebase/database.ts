export const getDatabase = jest.fn(() => ({}));
export const ref = jest.fn(() => ({}));
export const get = jest.fn(() => Promise.resolve({ val: () => ({}) }));
export const set = jest.fn(() => Promise.resolve());
export const onValue = jest.fn((_ref, callback) => {
  callback({ val: () => ({}) });
  return () => {};
});
export const off = jest.fn(); 