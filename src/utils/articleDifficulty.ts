import { readFileSync } from 'fs';
import path from 'path';

// Define character level ranges
export const CHAR_LEVELS = {
  LEVEL_1: { min: 1, max: 500 },    // Most common 500
  LEVEL_2: { min: 501, max: 1000 }, // 501-1000
  LEVEL_3: { min: 1001, max: 1500 }, // 1001-1500
  LEVEL_4: { min: 1501, max: 2000 }, // 1501-2000
  LEVEL_5: { min: 2001, max: 2500 }, // 2001-2500
  LEVEL_6: { min: 2501, max: Infinity }, // 2501+
};

// Interface for character frequency data
interface CharacterData {
  id: number;
  character: string;
  frequency: number;
  percentage: number;
  cumulative: number;
}

// Interface for article analysis results
export interface ArticleAnalysis {
  totalCharacters: number;
  uniqueCharacters: number;
  characterLevels: {
    [key: string]: number;
  };
  difficultyScore: number;
  difficultyLevel: number; // 1-5 scale
  levelDistribution: {
    [key: string]: number;
  };
}

// Load and parse the character frequency data
const loadCharacterData = (): Map<string, CharacterData> => {
  const characterMap = new Map<string, CharacterData>();
  try {
    const csvPath = path.join(process.cwd(), 'src', 'data', 'hanzi-top3000.csv');
    const fileContent = readFileSync(csvPath, 'utf-8');
    const lines = fileContent.split('\n').slice(1); // Skip header

    lines.forEach(line => {
      if (!line.trim()) return;
      const [id, char, freq, percentage, cumulative] = line.split(',');
      characterMap.set(char, {
        id: parseInt(id),
        character: char,
        frequency: parseInt(freq),
        percentage: parseFloat(percentage),
        cumulative: parseFloat(cumulative)
      });
    });
  } catch (error) {
    console.error('Error loading character frequency data:', error);
  }
  return characterMap;
}

// Get character level based on its rank
const getCharacterLevel = (rank: number): string => {
  if (rank <= CHAR_LEVELS.LEVEL_1.max) return 'LEVEL_1';
  if (rank <= CHAR_LEVELS.LEVEL_2.max) return 'LEVEL_2';
  if (rank <= CHAR_LEVELS.LEVEL_3.max) return 'LEVEL_3';
  if (rank <= CHAR_LEVELS.LEVEL_4.max) return 'LEVEL_4';
  if (rank <= CHAR_LEVELS.LEVEL_5.max) return 'LEVEL_5';
  return 'LEVEL_6';
};

// Calculate difficulty score (0-100, higher means more difficult)
const calculateDifficultyScore = (levelDistribution: { [key: string]: number }): number => {
  const weights = {
    LEVEL_1: 0,
    LEVEL_2: 0.2,
    LEVEL_3: 0.4,
    LEVEL_4: 0.6,
    LEVEL_5: 0.8,
    LEVEL_6: 1
  };

  let score = 0;
  let totalPercentage = 0;

  Object.entries(levelDistribution).forEach(([level, percentage]) => {
    score += percentage * weights[level as keyof typeof weights];
    totalPercentage += percentage;
  });

  // Return 0 if there are no characters
  if (totalPercentage === 0) return 0;
  
  // Normalize score to 0-100 range
  return Math.round((score / totalPercentage) * 100);
};

// Check if a character is Chinese
const isChineseCharacter = (char: string): boolean => {
  const code = char.charCodeAt(0);
  return code >= 0x4E00 && code <= 0x9FFF;
};

// Calculate difficulty level (1-5) based on level distribution
const calculateDifficultyLevel = (levelDistribution: { [key: string]: number }): number => {
  // If more than 10% characters are in level 5 or 6, return level 5
  if (levelDistribution.LEVEL_5 + levelDistribution.LEVEL_6 > 10) {
    return 5;
  }
  // If more than 10% characters are in level 4, return level 4
  if (levelDistribution.LEVEL_4 > 10) {
    return 4;
  }
  // If more than 10% characters are in level 3, return level 3
  if (levelDistribution.LEVEL_3 > 10) {
    return 3;
  }
  // If more than 10% characters are in level 2, return level 2
  if (levelDistribution.LEVEL_2 > 10) {
    return 2;
  }
  // If mostly level 1 characters, return level 1
  return 1;
};

// Main function to analyze article difficulty
export const analyzeArticleDifficulty = (text: string): ArticleAnalysis => {
  const characterData = loadCharacterData();
  // Filter only Chinese characters
  const characters = Array.from(text.trim()).filter(isChineseCharacter);
  const uniqueChars = new Set(characters);
  
  // Initialize level counts
  const characterLevels: { [key: string]: number } = {
    LEVEL_1: 0,
    LEVEL_2: 0,
    LEVEL_3: 0,
    LEVEL_4: 0,
    LEVEL_5: 0,
    LEVEL_6: 0
  };

  // Count characters by level
  uniqueChars.forEach(char => {
    const data = characterData.get(char);
    if (data) {
      const level = getCharacterLevel(data.id);
      characterLevels[level]++;
    } else {
      characterLevels.LEVEL_6++;
    }
  });

  // Calculate level distribution as percentages
  const totalUnique = uniqueChars.size;
  const levelDistribution = Object.entries(characterLevels).reduce((acc, [level, count]) => {
    acc[level] = totalUnique === 0 ? 0 : Number(((count / totalUnique) * 100).toFixed(1));
    return acc;
  }, {} as { [key: string]: number });

  return {
    totalCharacters: characters.length,
    uniqueCharacters: uniqueChars.size,
    characterLevels,
    levelDistribution,
    difficultyScore: calculateDifficultyScore(levelDistribution),
    difficultyLevel: calculateDifficultyLevel(levelDistribution)
  };
}; 