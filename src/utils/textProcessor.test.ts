import { describe, it, expect } from 'vitest';
import { processChineseText } from './textProcessor';

describe('processChineseText', () => {
  it('should correctly process a simple sentence', () => {
    const text = '我是中国人。';
    const result = processChineseText(text);
    
    expect(result).toHaveLength(6); // Including punctuation
    expect(result[0]).toEqual({
      characters: '我',
      pinyin: ['wǒ'],
      meaning: ''
    });
    expect(result[1]).toEqual({
      characters: '是',
      pinyin: ['shì'],
      meaning: ''
    });
  });

  it('should handle multiple sentences', () => {
    const text = '今天天气很好。我想去公园！';
    const result = processChineseText(text);
    
    // First sentence
    expect(result[0]).toEqual({
      characters: '今',
      pinyin: ['jīn'],
      meaning: ''
    });
    expect(result[1]).toEqual({
      characters: '天',
      pinyin: ['tiān'],
      meaning: ''
    });

    // Second sentence
    expect(result[10]).toEqual({
      characters: '公',
      pinyin: ['gōng'],
      meaning: ''
    });
    expect(result[11]).toEqual({
      characters: '园',
      pinyin: ['yuán'],
      meaning: ''
    });
  });

  it('should handle multi-character words with different pronunciations', () => {
    const text = '听到欢乐的音乐我会快快乐乐。';
    const result = processChineseText(text);
    
    // 听到欢乐
    expect(result[0]).toEqual({
      characters: '听',
      pinyin: ['tīng'],
      meaning: ''
    });
    expect(result[1]).toEqual({
      characters: '到',
      pinyin: ['dào'],
      meaning: ''
    });
    expect(result[2]).toEqual({
      characters: '欢',
      pinyin: ['huān'],
      meaning: ''
    });
    expect(result[3]).toEqual({
      characters: '乐',
      pinyin: ['lè'],
      meaning: ''
    });
    
    // 的音乐
    expect(result[4]).toEqual({
      characters: '的',
      pinyin: ['de'],
      meaning: ''
    });
    expect(result[5]).toEqual({
      characters: '音',
      pinyin: ['yīn'],
      meaning: ''
    });
    expect(result[6]).toEqual({
      characters: '乐',
      pinyin: ['yuè'],
      meaning: ''
    });
    
    // 我会快快乐乐
    expect(result[7]).toEqual({
      characters: '我',
      pinyin: ['wǒ'],
      meaning: ''
    });
    expect(result[8]).toEqual({
      characters: '会',
      pinyin: ['huì'],
      meaning: ''
    });
    expect(result[9]).toEqual({
      characters: '快',
      pinyin: ['kuài'],
      meaning: ''
    });
    expect(result[10]).toEqual({
      characters: '快',
      pinyin: ['kuài'],
      meaning: ''
    });
    expect(result[11]).toEqual({
      characters: '乐',
      pinyin: ['lè'],
      meaning: ''
    });
    expect(result[12]).toEqual({
      characters: '乐',
      pinyin: ['lè'],
      meaning: ''
    });
  });

  it('should handle punctuation marks', () => {
    const text = '你好！你是谁？我是老师。';
    const result = processChineseText(text);
    
    expect(result.find(w => w.characters === '！')).toBeTruthy();
    expect(result.find(w => w.characters === '？')).toBeTruthy();
    expect(result.find(w => w.characters === '。')).toBeTruthy();
  });

  it('should handle numbers and non-Chinese characters', () => {
    const text = '我有2个苹果。';
    const result = processChineseText(text);
    
    expect(result[2]).toEqual({
      characters: '2',
      pinyin: [''],
      meaning: ''
    });
  });

  it('should handle empty input', () => {
    const result = processChineseText('');
    expect(result).toEqual([]);
  });

  it('should handle a long sentence with 30+ characters', () => {
    const text = '在这个美丽的春天，我们一起去公园散步，看着五颜六色的鲜花盛开，感受大自然的美好。';
    const result = processChineseText(text);
    

    // Check some key characters
    expect(result[0]).toEqual({
      characters: '在',
      pinyin: ['zài'],
      meaning: ''
    });
    expect(result[38]).toEqual({
      characters: '好',
      pinyin: ['hǎo'],
      meaning: ''
    });
  });

  it('should handle two long sentences with mixed content', () => {
    const text = '2023年的第一场雪❄️让整个城市turns white，温度降到-10°C！\n' +
                '星期一的早上8:30，我和一千个游客一起看日出，拍了很多📷照片。';
    const result = processChineseText(text);
    
    // Check some key positions
    expect(result[0]).toEqual({
      characters: '2',
      pinyin: [''],
      meaning: ''
    });
    expect(result[1]).toEqual({
      characters: '0',
      pinyin: [''],
      meaning: ''
    });
    expect(result[4]).toEqual({
      characters: '年',
      pinyin: ['nián'],
      meaning: ''
    });
    expect(result[9]).toEqual({
      characters: '雪',
      pinyin: ['xuě'],
      meaning: ''
    });
  });
}); 