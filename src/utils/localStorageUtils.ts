export const getLocalStorageItem = (key: string): any => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
};

export const setLocalStorageItem = (key: string, value: any): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const clearLocalStorageItem = (key: string): void => {
  localStorage.removeItem(key);
}; 