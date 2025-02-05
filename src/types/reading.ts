export interface ChineseWord {
  characters: string;
  pinyin: string[];
}

export interface Reading {
  id: string;
  title: string;
  content: string;
  tags: string[];
  author: string;
  difficultyLevel: number;
  characterLevels: {
    LEVEL_1: number;
    LEVEL_2: number;
    LEVEL_3: number;
    LEVEL_4: number;
    LEVEL_5: number;
    LEVEL_6: number;
  };
  quizzes: Quiz[];
}

export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}
