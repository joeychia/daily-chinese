import { getCharacterGrade } from '../data/characterGrades';

export interface LevelDistribution {
  LEVEL_1: number;
  LEVEL_2: number;
  LEVEL_3: number;
  LEVEL_4: number;
  LEVEL_5: number;
  LEVEL_6: number;
}

type LevelKey = keyof LevelDistribution;

export interface ArticleAnalysis {
  levelDistribution: LevelDistribution;
  difficultyLevel: number;
  characters: {
    [K in LevelKey]: Map<string, number>;
  };
}

export function analyzeArticleDifficulty(text: string): ArticleAnalysis {
  // Filter out punctuation and non-Chinese characters
  const chars = [...text].filter(char => {
    const isChinese = /[\u4E00-\u9FFF]/.test(char);  // Basic CJK range
    const isPunctuation = /[，。！？；：""''（）、\s]/.test(char);  // Chinese punctuation and whitespace
    return isChinese && !isPunctuation;
  });

  // Initialize level buckets with character counts
  const characters = {
    LEVEL_1: new Map<string, number>(),  // Grade 1
    LEVEL_2: new Map<string, number>(),  // Grade 2
    LEVEL_3: new Map<string, number>(),  // Grade 3
    LEVEL_4: new Map<string, number>(),  // Grade 4
    LEVEL_5: new Map<string, number>(),  // Grade 5
    LEVEL_6: new Map<string, number>()   // Grade 6 or not found
  };

  // Analyze each character occurrence
  chars.forEach(char => {
    const grade = getCharacterGrade(char);
    const level = grade === 7 ? 'LEVEL_6' : `LEVEL_${grade}` as LevelKey;
    const currentCount = characters[level].get(char) || 0;
    characters[level].set(char, currentCount + 1);
  });

  // Calculate level counts
  const levelCounts = {
    LEVEL_1: Array.from(characters.LEVEL_1.values()).reduce((a, b) => a + b, 0),
    LEVEL_2: Array.from(characters.LEVEL_2.values()).reduce((a, b) => a + b, 0),
    LEVEL_3: Array.from(characters.LEVEL_3.values()).reduce((a, b) => a + b, 0),
    LEVEL_4: Array.from(characters.LEVEL_4.values()).reduce((a, b) => a + b, 0),
    LEVEL_5: Array.from(characters.LEVEL_5.values()).reduce((a, b) => a + b, 0),
    LEVEL_6: Array.from(characters.LEVEL_6.values()).reduce((a, b) => a + b, 0)
  };

  // Calculate level percentages
  const totalChars = chars.length;
  const levelDistribution: LevelDistribution = totalChars === 0 ? {
    LEVEL_1: 0,
    LEVEL_2: 0,
    LEVEL_3: 0,
    LEVEL_4: 0,
    LEVEL_5: 0,
    LEVEL_6: 0
  } : {
    LEVEL_1: (levelCounts.LEVEL_1 / totalChars) * 100,
    LEVEL_2: (levelCounts.LEVEL_2 / totalChars) * 100,
    LEVEL_3: (levelCounts.LEVEL_3 / totalChars) * 100,
    LEVEL_4: (levelCounts.LEVEL_4 / totalChars) * 100,
    LEVEL_5: (levelCounts.LEVEL_5 / totalChars) * 100,
    LEVEL_6: (levelCounts.LEVEL_6 / totalChars) * 100
  };

  // Calculate difficulty level
  const THRESHOLD = 10; // 10% threshold
  let difficultyLevel;
  if (totalChars === 0) {
    difficultyLevel = 1;
  } else if (levelDistribution.LEVEL_5 + levelDistribution.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 5;
  } else if (levelDistribution.LEVEL_4 + levelDistribution.LEVEL_5 + levelDistribution.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 4;
  } else if (levelDistribution.LEVEL_3 + levelDistribution.LEVEL_4 + levelDistribution.LEVEL_5 + levelDistribution.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 3;
  } else if (levelDistribution.LEVEL_2 + levelDistribution.LEVEL_3 + levelDistribution.LEVEL_4 + levelDistribution.LEVEL_5 + levelDistribution.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 2;
  } else {
    difficultyLevel = 1;
  }

  return {
    levelDistribution,
    difficultyLevel,
    characters
  };
} 