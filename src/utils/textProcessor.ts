import { pinyin } from 'pinyin-pro';
import type { ChineseWord } from '../data/sampleText';

export function processChineseText(text: string): ChineseWord[] {
  // Split text into characters while preserving punctuation
  const characters = Array.from(text);
  console.log('Split characters:', characters.slice(0, 10)); // Debug log
  
  return characters.map(char => {
    // Get pinyin for the character with tone marks
    const pinyinStr = pinyin(char, {
      toneType: 'symbol',
      type: 'array'
    });

    return {
      characters: char,
      // If the result is an array (for Chinese characters) use it, otherwise use empty string
      pinyin: Array.isArray(pinyinStr) ? pinyinStr : ['']
    };
  });
} 