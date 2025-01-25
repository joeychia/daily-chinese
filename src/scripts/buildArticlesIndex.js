import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  databaseURL: process.env.VITE_FIREBASE_DATABASE_URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const buildArticlesIndex = async () => {
  console.log('Starting to build articles index...');
  
  try {
    // Get all articles
    const articlesRef = ref(db, 'articles');
    const snapshot = await get(articlesRef);
    
    if (!snapshot.exists()) {
      console.log('No articles found in the database');
      return;
    }

    const articles = snapshot.val();
    const articleEntries = Object.entries(articles);
    
    // Create index entries with metadata
    const articlesIndex = articleEntries.map(([id, article]) => {
      return {
        id,
        title: article.title,
        visibility: article.visibility || 'public', // Default to public if not set
        generatedDate: article.generatedDate,
        difficultyLevel: article.difficultyLevel
      };
    });

    // Sort by generatedDate (newest first)
    articlesIndex.sort((a, b) => {
      const dateA = new Date(a.generatedDate);
      const dateB = new Date(b.generatedDate);
      return dateB - dateA;
    });

    // Save the index
    const indexRef = ref(db, 'articlesIndex');
    await set(indexRef, articlesIndex);

    console.log(`Successfully built index for ${articlesIndex.length} articles`);
  } catch (error) {
    console.error('Error building articles index:', error);
    throw error;
  }
};

// Run the script
buildArticlesIndex()
  .then(() => {
    console.log('Articles index build completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to build articles index:', error);
    process.exit(1);
  });