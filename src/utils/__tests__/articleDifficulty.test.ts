import { analyzeArticleDifficulty } from '../articleDifficulty';

describe('Article Difficulty Analysis', () => {
  // Test simple text with common characters
  test('analyzes simple text correctly', () => {
    const simpleText = '我是中国人'; // All common characters
    const analysis = analyzeArticleDifficulty(simpleText);

    expect(analysis.totalCharacters).toBe(5);
    expect(analysis.uniqueCharacters).toBe(5);
    expect(analysis.difficultyScore).toBeLessThan(50); // Should be relatively easy
    expect(analysis.difficultyLevel).toBe(1); // Should be level 1 (most common characters)
    
    // All characters should be in lower levels (mostly LEVEL_1 or LEVEL_2)
    expect(analysis.characterLevels.LEVEL_1 + analysis.characterLevels.LEVEL_2)
      .toBeGreaterThan(0);
  });

  // Test text with mixed difficulty
  test('analyzes mixed difficulty text correctly', () => {
    const mixedText = '我喜欢学习编程语言'; // Mix of common and less common characters
    const analysis = analyzeArticleDifficulty(mixedText);

    expect(analysis.totalCharacters).toBe(9);
    expect(analysis.uniqueCharacters).toBe(9);
    expect(analysis.difficultyScore).toBeGreaterThan(0);
    expect(analysis.difficultyScore).toBeLessThan(100);
    expect(analysis.difficultyLevel).toBeGreaterThanOrEqual(2); // Should be at least level 2
  });

  // Test text with rare/unknown characters
  test('handles rare and unknown characters correctly', () => {
    const complexText = '鎏金贔屭'; // Very rare characters
    const analysis = analyzeArticleDifficulty(complexText);

    expect(analysis.characterLevels.LEVEL_6).toBeGreaterThan(0);
    expect(analysis.difficultyScore).toBeGreaterThan(70); // Should be very difficult
    expect(analysis.difficultyLevel).toBe(5); // Should be level 5 (rare characters)
  });

  // Test empty text
  test('handles empty text correctly', () => {
    const emptyText = '';
    const analysis = analyzeArticleDifficulty(emptyText);

    expect(analysis.totalCharacters).toBe(0);
    expect(analysis.uniqueCharacters).toBe(0);
    expect(analysis.difficultyScore).toBe(0);
    expect(analysis.difficultyLevel).toBe(1); // Default to level 1 for empty text
    
    // All level distributions should be 0
    Object.values(analysis.levelDistribution).forEach(value => {
      expect(value).toBe(0);
    });
  });

  // Test text with non-Chinese characters
  test('handles mixed character types correctly', () => {
    const mixedText = '我love中国！123';
    const analysis = analyzeArticleDifficulty(mixedText);

    // Should only count Chinese characters
    expect(analysis.uniqueCharacters).toBe(3);
    expect(analysis.totalCharacters).toBe(3);
    expect(analysis.difficultyLevel).toBeGreaterThanOrEqual(1);
    expect(analysis.difficultyLevel).toBeLessThanOrEqual(5);
  });

  // Test whitespace handling
  test('handles whitespace correctly', () => {
    const textWithSpaces = '  我 是  中国 人  ';
    const analysis = analyzeArticleDifficulty(textWithSpaces);

    expect(analysis.totalCharacters).toBe(5);
    expect(analysis.uniqueCharacters).toBe(5);
    expect(analysis.difficultyLevel).toBe(1); // Should be level 1 (common characters)
  });

  // Test structure of the analysis result
  test('returns correct analysis structure', () => {
    const text = '你好';
    const analysis = analyzeArticleDifficulty(text);

    expect(analysis).toHaveProperty('totalCharacters');
    expect(analysis).toHaveProperty('uniqueCharacters');
    expect(analysis).toHaveProperty('characterLevels');
    expect(analysis).toHaveProperty('levelDistribution');
    expect(analysis).toHaveProperty('difficultyScore');
    expect(analysis).toHaveProperty('difficultyLevel');

    // Check if all levels are present in characterLevels
    expect(analysis.characterLevels).toHaveProperty('LEVEL_1');
    expect(analysis.characterLevels).toHaveProperty('LEVEL_2');
    expect(analysis.characterLevels).toHaveProperty('LEVEL_3');
    expect(analysis.characterLevels).toHaveProperty('LEVEL_4');
    expect(analysis.characterLevels).toHaveProperty('LEVEL_5');
    expect(analysis.characterLevels).toHaveProperty('LEVEL_6');

    // Check if all level distributions sum to 100 (or 0 for empty text)
    const totalDistribution = Object.values(analysis.levelDistribution).reduce((a, b) => a + b, 0);
    expect(totalDistribution).toBeCloseTo(100, 1);

    // Check difficulty level range
    expect(analysis.difficultyLevel).toBeGreaterThanOrEqual(1);
    expect(analysis.difficultyLevel).toBeLessThanOrEqual(5);
  });

  // Test specific difficulty levels
  test('assigns correct difficulty levels', () => {
    const level5Text = '鎏金贔屭'; // Should be level 5 (rare characters)
    expect(analyzeArticleDifficulty(level5Text).difficultyLevel).toBe(5);

    const level1Text = '我是你'; // Should be level 1 (common characters)
    expect(analyzeArticleDifficulty(level1Text).difficultyLevel).toBe(1);
  });

  // Test longer text analysis
  test('analyzes longer text correctly', () => {
    // A passage about learning programming
    const longText = `编程是一种创造性的活动。通过编写代码，我们可以让计算机按照我们的想法工作。在学习编程的过程中，我们需要掌握基本的概念和逻辑思维方式。首先，我们要理解变量、函数、循环等基础知识。然后，我们可以开始编写简单的程序。随着技能的提升，我们可以挑战更复杂的项目。编程不仅是一种技术，也是一种解决问题的方法。通过不断练习和实践，我们可以提高编程能力。在这个数字化时代，编程技能变得越来越重要。无论是在工作中还是在日常生活中，编程都可以帮助我们更好地完成任务。学习编程需要耐心和毅力，但最终的收获是值得的。让我们开始编程之旅吧！在编程世界中，我们可以创造出各种有趣的应用和工具。从简单的计算器到复杂的网站，从手机应用到人工智能系统，编程为我们打开了无限可能。通过持续学习和创新，我们能够在这个领域不断进步。`;

    const analysis = analyzeArticleDifficulty(longText);

    // Test basic metrics
    expect(analysis.totalCharacters).toBeGreaterThanOrEqual(300);
    expect(analysis.uniqueCharacters).toBeLessThan(analysis.totalCharacters);

    // Test level distribution
    expect(Object.values(analysis.levelDistribution).reduce((a, b) => a + b)).toBeCloseTo(100, 1);

    // Test difficulty metrics
    expect(analysis.difficultyScore).toBeGreaterThan(0);
    expect(analysis.difficultyScore).toBeLessThan(100);
    expect(analysis.difficultyLevel).toBeGreaterThanOrEqual(3);
    expect(analysis.difficultyLevel).toBeLessThanOrEqual(5);

    // Since this text contains programming terms, it should have some higher-level characters
    const higherLevelChars = analysis.characterLevels.LEVEL_4 + 
                            analysis.characterLevels.LEVEL_5 + 
                            analysis.characterLevels.LEVEL_6;
    expect(higherLevelChars).toBeGreaterThan(0);

    // The text should still contain many common characters
    expect(analysis.characterLevels.LEVEL_1).toBeGreaterThan(60); // Most characters should be common
    expect(analysis.characterLevels.LEVEL_2).toBeGreaterThan(10); // Some characters should be moderately common

    // Log the analysis for inspection
    console.log('Analysis of long text:', {
      totalCharacters: analysis.totalCharacters,
      uniqueCharacters: analysis.uniqueCharacters,
      characterLevels: analysis.characterLevels,
      levelDistribution: analysis.levelDistribution,
      difficultyScore: analysis.difficultyScore,
      difficultyLevel: analysis.difficultyLevel
    });
  });
}); 