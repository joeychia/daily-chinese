import { analyzeArticleDifficulty } from '../articleDifficulty';

describe('analyzeArticleDifficulty', () => {
  it('should analyze text difficulty correctly', () => {
    const text = '小王是一名大学生。每天早上七点钟，他准时起床。';
    const result = analyzeArticleDifficulty(text);

    // Verify the structure of the result
    expect(result).toHaveProperty('levelDistribution');
    expect(result).toHaveProperty('difficultyLevel');
    expect(result).toHaveProperty('characters');

    // Verify level distribution adds up to approximately 100%
    const totalPercentage = Object.values(result.levelDistribution).reduce((a, b) => a + b, 0);
    expect(totalPercentage).toBeCloseTo(100, 1);

    // Verify character maps contain the expected characters
    expect(result.characters.LEVEL_1.size).toBeGreaterThan(0);
    expect(Array.from(result.characters.LEVEL_1.keys())).toContain('大');
    expect(Array.from(result.characters.LEVEL_1.keys())).toContain('上');

    // Verify character counts
    const totalChars = Object.values(result.characters).reduce(
      (sum, map) => sum + Array.from(map.values()).reduce((a, b) => a + b, 0),
      0
    );
    expect(totalChars).toBe([...text].filter(char => {
      const isChinese = /[\u4E00-\u9FFF]/.test(char);
      const isPunctuation = /[，。！？；：""''（）、]/.test(char);
      return isChinese && !isPunctuation;
    }).length);
  });

  it('should calculate difficulty level correctly', () => {
    // Test Level 1 (入门) text
    const level1Text = '我是大学生';
    const level1Result = analyzeArticleDifficulty(level1Text);
    expect(level1Result.difficultyLevel).toBe(1);

    // Test Level 5 (专家) text with many high-grade characters
    const level5Text = '蕴含着深邃的韵味，令人回味无穷';
    const level5Result = analyzeArticleDifficulty(level5Text);
    expect(level5Result.difficultyLevel).toBe(5);
  });

  it('should handle empty text', () => {
    const result = analyzeArticleDifficulty('');
    expect(result.levelDistribution.LEVEL_1).toBe(0);
    expect(result.levelDistribution.LEVEL_2).toBe(0);
    expect(result.levelDistribution.LEVEL_3).toBe(0);
    expect(result.levelDistribution.LEVEL_4).toBe(0);
    expect(result.levelDistribution.LEVEL_5).toBe(0);
    expect(result.levelDistribution.LEVEL_6).toBe(0);
    expect(result.difficultyLevel).toBe(1);
  });

  it('should handle text with only punctuation', () => {
    const result = analyzeArticleDifficulty('。，！？');
    expect(result.levelDistribution.LEVEL_1).toBe(0);
    expect(result.levelDistribution.LEVEL_2).toBe(0);
    expect(result.levelDistribution.LEVEL_3).toBe(0);
    expect(result.levelDistribution.LEVEL_4).toBe(0);
    expect(result.levelDistribution.LEVEL_5).toBe(0);
    expect(result.levelDistribution.LEVEL_6).toBe(0);
    expect(result.difficultyLevel).toBe(1);
  });

  it('should handle text with English, Emoji, and punctuation', () => {
    const result = analyzeArticleDifficulty('我喜欢coding！🎉 Let\'s learn 中文 together。');
    
    // Verify only Chinese characters are analyzed
    const totalChars = Object.values(result.characters).reduce(
      (sum, map) => sum + Array.from(map.values()).reduce((a, b) => a + b, 0),
      0
    );
    
    // Should only count: 我喜欢中文 (5 Chinese characters)
    expect(totalChars).toBe(5);
    
    // Verify level distribution adds up to 100%
    const totalPercentage = Object.values(result.levelDistribution).reduce((a, b) => a + b, 0);
    expect(totalPercentage).toBeCloseTo(100, 1);

    // Verify non-Chinese characters are ignored
    const allChars = Object.values(result.characters).reduce(
      (chars, map) => [...chars, ...Array.from(map.keys())],
      [] as string[]
    );
    expect(allChars).not.toContain('c');  // English
    expect(allChars).not.toContain('🎉');  // Emoji
    expect(allChars).not.toContain('！');  // Chinese punctuation
    expect(allChars).toContain('我');  // Chinese
    expect(allChars).toContain('中');  // Chinese
  });
}); 