import { pinyin } from 'pinyin-pro';
import type { ChineseWord } from '../data/sampleText';

function splitIntoSentences(text: string): string[] {
  // Split by common Chinese punctuation marks
  return text.split(/([。！？；])/g)
    .filter(Boolean)  // Remove empty strings
    .map((part, i, arr) => {
      // Reattach the punctuation mark to the sentence
      if (i % 2 === 0 && i + 1 < arr.length) {
        return part + arr[i + 1];
      }
      return i % 2 === 0 ? part : '';
    })
    .filter(Boolean);  // Remove empty strings again
}

function processSentence(sentence: string): ChineseWord[] {
  try {
    // Try to get pinyin for the whole sentence with tone marks
    const sentencePinyin = pinyin(sentence, {
      type: 'array',
      toneType: 'symbol'
    } as any);  // Use type assertion to bypass type checking

    // Check if we got the same number of pinyin as characters
    const chars = Array.from(sentence);
    if (Array.isArray(sentencePinyin) && sentencePinyin.length === chars.length) {
      return chars.map((char, index) => {
        // Skip non-Chinese characters
        if (!/[\u4E00-\u9FFF]/.test(char)) {
          return {
            characters: char,
            pinyin: [''],
            meaning: ''
          };
        }
        return {
          characters: char,
          pinyin: [sentencePinyin[index]],
          meaning: ''
        };
      });
    }
  } catch (error) {
    console.warn('Failed to process sentence as a whole:', sentence, error);
  }

  // Fallback: process character by character
  return Array.from(sentence).map(char => {
    // Check if the character is Chinese
    if (!/[\u4E00-\u9FFF]/.test(char)) {
      return {
        characters: char,
        pinyin: [''],
        meaning: ''  // Add empty meaning for non-Chinese characters
      };
    }
    
    const pinyinResult = pinyin(char, {
      type: 'array',
      toneType: 'symbol'
    } as any);  // Use type assertion to bypass type checking
    
    return {
      characters: char,
      pinyin: Array.isArray(pinyinResult) ? pinyinResult : [''],
      meaning: ''  // Add empty meaning as default
    };
  });
}

export function processChineseText(text: string): ChineseWord[] {
  if (!text) return [];
  
  // Split text into sentences
  const sentences = splitIntoSentences(text);
  console.log('Split into sentences:', sentences.length, 'sentences');

  // Process each sentence and combine results
  const results = sentences.flatMap(sentence => processSentence(sentence));
  
  return results;
} 