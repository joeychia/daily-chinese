export interface Quiz {
  question: string;
  options: string[];
  correctOption: number;
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