export interface ChineseWord {
  characters: string;
  pinyin: string[];
}

export interface Quiz {
  question: string;
  options: string[];
  correctOption: number;
}

export interface Reading {
  id: string;
  title: string;
  author: string;
  content: string;
  tags: string[];
  quizzes: Quiz[];
  isGenerated: boolean;
  generatedDate: string;
  difficultyLevel: number;
} 