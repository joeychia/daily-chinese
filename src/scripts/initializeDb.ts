import { articleService } from '../services/articleService';
import sample from '../data/readings/sample.json';
import weekendTrip from '../data/readings/weekend-trip.json';

export const initializeDatabase = async () => {
  try {
    // Save sample articles
    await articleService.saveArticle(sample);
    await articleService.saveArticle(weekendTrip);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}; 