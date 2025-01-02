export interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct option
}

export interface Reading {
  id: string;
  title: string;
  author?: string;
  sourceDate?: string;
  content: string;
  tags: string[];
  quizzes: Quiz[];
} 