// USAGE: node --loader ts-node/esm src/scripts/analyzeText.js "小王是一名大学生。每天早上七点钟，他准时起床。"

import { getCharacterGrade } from '../data/characterGrades.ts';

function analyzeText(text) {
  // Filter out punctuation and non-Chinese characters
  // Only include characters in the CJK Unified Ideographs range (4E00-9FFF)
  const chars = [...text].filter(char => {
    const isChinese = /[\u4E00-\u9FFF]/.test(char);
    const isPunctuation = /[，。！？；：""''（）、]/.test(char);
    return isChinese && !isPunctuation;
  });

  // Initialize level buckets with character counts
  const levels = {
    LEVEL_1: new Map(),  // Grade 1
    LEVEL_2: new Map(),  // Grade 2
    LEVEL_3: new Map(),  // Grade 3
    LEVEL_4: new Map(),  // Grade 4
    LEVEL_5: new Map(),  // Grade 5
    LEVEL_6: new Map()   // Grade 6 or not found
  };

  // Analyze each character occurrence
  chars.forEach(char => {
    const grade = getCharacterGrade(char);
    const level = grade === 7 ? 'LEVEL_6' : `LEVEL_${grade}`;
    const currentCount = levels[level].get(char) || 0;
    levels[level].set(char, currentCount + 1);
  });

  // Calculate level percentages
  const totalChars = chars.length;
  const levelCounts = {
    LEVEL_1: Array.from(levels.LEVEL_1.values()).reduce((a, b) => a + b, 0),
    LEVEL_2: Array.from(levels.LEVEL_2.values()).reduce((a, b) => a + b, 0),
    LEVEL_3: Array.from(levels.LEVEL_3.values()).reduce((a, b) => a + b, 0),
    LEVEL_4: Array.from(levels.LEVEL_4.values()).reduce((a, b) => a + b, 0),
    LEVEL_5: Array.from(levels.LEVEL_5.values()).reduce((a, b) => a + b, 0),
    LEVEL_6: Array.from(levels.LEVEL_6.values()).reduce((a, b) => a + b, 0)
  };

  const levelPercentages = {
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
  if (levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 5;
  } else if (levelPercentages.LEVEL_4 + levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 4;
  } else if (levelPercentages.LEVEL_3 + levelPercentages.LEVEL_4 + levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 3;
  } else if (levelPercentages.LEVEL_2 + levelPercentages.LEVEL_3 + levelPercentages.LEVEL_4 + levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6 > THRESHOLD) {
    difficultyLevel = 2;
  } else {
    difficultyLevel = 1;
  }

  // Print results
  console.log('Character Level Analysis:');
  Object.entries(levels).forEach(([level, charMap]) => {
    if (charMap.size > 0) {
      const uniqueCount = charMap.size;
      const totalCount = levelCounts[level];
      console.log(`\n${level} (${uniqueCount} unique characters, ${totalCount} total occurrences, ${levelPercentages[level].toFixed(1)}%):`);
      const charEntries = Array.from(charMap.entries())
        .map(([char, count]) => `${char}(${count})`)
        .join(' ');
      console.log(charEntries);
    }
  });

  // Print cumulative percentages
  console.log('\nCumulative Percentages:');
  console.log(`Level 5-6: ${(levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6).toFixed(1)}%`);
  console.log(`Level 4-6: ${(levelPercentages.LEVEL_4 + levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6).toFixed(1)}%`);
  console.log(`Level 3-6: ${(levelPercentages.LEVEL_3 + levelPercentages.LEVEL_4 + levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6).toFixed(1)}%`);
  console.log(`Level 2-6: ${(levelPercentages.LEVEL_2 + levelPercentages.LEVEL_3 + levelPercentages.LEVEL_4 + levelPercentages.LEVEL_5 + levelPercentages.LEVEL_6).toFixed(1)}%`);

  // Print difficulty level with description
  const difficultyLabels = {
    1: '入门',
    2: '初级',
    3: '中级',
    4: '高级',
    5: '专家'
  };

  console.log(`\nDifficulty Level: ${difficultyLevel} (${difficultyLabels[difficultyLevel]})`);
}

// Get text from command line argument
const inputText = process.argv[2];

if (!inputText) {
  console.log('Please provide text to analyze as a command line argument.');
  console.log('Usage: node --loader ts-node/esm src/scripts/analyzeText.js "你的中文文本"');
  process.exit(1);
}

analyzeText(inputText); 