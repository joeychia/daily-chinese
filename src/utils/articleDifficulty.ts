import { characterRankData } from '../data/characterRankData';

interface CharacterLevels {
  LEVEL_1: number;  // Top 300
  LEVEL_2: number;  // Top 600
  LEVEL_3: number;  // Top 1000
  LEVEL_4: number;  // Top 1500
  LEVEL_5: number;  // Top 2000
  LEVEL_6: number;  // Beyond 2000
}

interface ArticleAnalysis {
  totalCharacters: number;
  uniqueCharacters: number;
  levelDistribution: CharacterLevels;
  difficultyScore: number;
  difficultyLevel: number;
}

const CHAR_LEVELS = {
  LEVEL_1: { min: 1, max: 300 },
  LEVEL_2: { min: 301, max: 600 },
  LEVEL_3: { min: 601, max: 1000 },
  LEVEL_4: { min: 1001, max: 1500 },
  LEVEL_5: { min: 1501, max: 2000 },
  LEVEL_6: { min: 2001, max: Infinity }
};

function getCharacterRank(char: string): number {
  const index = characterRankData.indexOf(char);
  return index === -1 ? 3000 : index + 1; // Return 3000 for unknown characters
}

function getCharacterLevel(rank: number): keyof CharacterLevels {
  if (rank <= CHAR_LEVELS.LEVEL_1.max) return 'LEVEL_1';
  if (rank <= CHAR_LEVELS.LEVEL_2.max) return 'LEVEL_2';
  if (rank <= CHAR_LEVELS.LEVEL_3.max) return 'LEVEL_3';
  if (rank <= CHAR_LEVELS.LEVEL_4.max) return 'LEVEL_4';
  if (rank <= CHAR_LEVELS.LEVEL_5.max) return 'LEVEL_5';
  return 'LEVEL_6';
}

function calculateDifficultyLevel(levelDistribution: CharacterLevels): number {
  const THRESHOLD = 10; // 10% threshold for each level
  
  if (levelDistribution.LEVEL_6 + levelDistribution.LEVEL_5 > THRESHOLD) return 5;
  if (levelDistribution.LEVEL_4 > THRESHOLD) return 4;
  if (levelDistribution.LEVEL_3 > THRESHOLD) return 3;
  if (levelDistribution.LEVEL_2 > THRESHOLD) return 2;
  return 1;
}

export function analyzeArticleDifficulty(text: string): ArticleAnalysis {
  // Initialize character level counts
  const levelCounts: CharacterLevels = {
    LEVEL_1: 0,
    LEVEL_2: 0,
    LEVEL_3: 0,
    LEVEL_4: 0,
    LEVEL_5: 0,
    LEVEL_6: 0
  };

  // Count total and unique characters
  const characters = text.split('');
  const uniqueChars = new Set(characters);
  const charFrequency: { [key: string]: number } = {};

  // Count frequency of each character
  characters.forEach(char => {
    charFrequency[char] = (charFrequency[char] || 0) + 1;
  });

  // Calculate level distribution
  let totalWeightedRank = 0;
  Object.entries(charFrequency).forEach(([char, frequency]) => {
    const rank = getCharacterRank(char);
    const level = getCharacterLevel(rank);
    levelCounts[level] += (frequency / characters.length) * 100; // Convert to percentage
    totalWeightedRank += rank * frequency;
  });

  // Calculate difficulty score (weighted average of ranks)
  const difficultyScore = totalWeightedRank / characters.length;

  return {
    totalCharacters: characters.length,
    uniqueCharacters: uniqueChars.size,
    levelDistribution: levelCounts,
    difficultyScore,
    difficultyLevel: calculateDifficultyLevel(levelCounts)
  };
} 