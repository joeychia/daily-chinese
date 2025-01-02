import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  // Your web app's Firebase configuration
  // Get this from Firebase Console -> Project Settings -> General -> Your Apps
  projectId: "daily-chinese-7f25e",
  databaseURL: "https://daily-chinese-7f25e-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app); 