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
  sourceDate?: string;
  difficultyLevel: number;
  characterLevels: {
    LEVEL_1: number;  // Top 300
    LEVEL_2: number;  // Top 600
    LEVEL_3: number;  // Top 1000
    LEVEL_4: number;  // Top 1500
    LEVEL_5: number;  // Top 2000
    LEVEL_6: number;  // Beyond 2000
  };
} 