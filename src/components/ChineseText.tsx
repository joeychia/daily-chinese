import React, { useState } from 'react';
import { ChineseWord } from '../data/sampleText';

interface ChineseTextProps {
  text: ChineseWord[];
  onWordPeek?: (word: ChineseWord) => void;
}

// Helper function to check if a word is a Chinese character (has valid pinyin)
const isChineseCharacter = (word: ChineseWord): boolean => {
  // Check if it's a Chinese character by checking its Unicode range
  const char = word.characters;
  const code = char.charCodeAt(0);
  return (
    (code >= 0x4E00 && code <= 0x9FFF) || // CJK Unified Ideographs
    (code >= 0x3400 && code <= 0x4DBF) || // CJK Unified Ideographs Extension A
    (code >= 0x20000 && code <= 0x2A6DF) || // CJK Unified Ideographs Extension B
    (code >= 0x2A700 && code <= 0x2B73F) || // CJK Unified Ideographs Extension C
    (code >= 0x2B740 && code <= 0x2B81F) || // CJK Unified Ideographs Extension D
    (code >= 0x2B820 && code <= 0x2CEAF) // CJK Unified Ideographs Extension E
  );
};

export const ChineseText: React.FC<ChineseTextProps> = ({ text, onWordPeek }) => {
  const [activeWord, setActiveWord] = useState<ChineseWord | null>(null);

  const handleTouchStart = (e: React.TouchEvent, word: ChineseWord) => {
    if (isChineseCharacter(word)) {
      e.preventDefault(); // Prevent double-firing on mobile
      setActiveWord(word);
      if (onWordPeek) {
        onWordPeek(word);
      }
    }
  };

  const handleMouseDown = (word: ChineseWord) => {
    if (isChineseCharacter(word)) {
      setActiveWord(word);
      if (onWordPeek) {
        onWordPeek(word);
      }
    }
  };

  const handleRelease = () => {
    setActiveWord(null);
  };

  return (
    <div className="chinese-text" style={{ fontSize: '1.5rem', lineHeight: '2.5', position: 'relative' }}>
      {text.map((word, index) => (
        <span
          key={index}
          style={{ 
            display: 'inline-block',
            position: 'relative',
            cursor: isChineseCharacter(word) ? 'pointer' : 'default',
            padding: '0 2px',
            userSelect: 'none', // Prevent text selection on tap/click
            WebkitUserSelect: 'none'
          }}
          onMouseDown={() => handleMouseDown(word)}
          onMouseUp={handleRelease}
          onMouseLeave={handleRelease}
          onTouchStart={(e) => handleTouchStart(e, word)}
          onTouchEnd={handleRelease}
        >
          {word.characters}
          {activeWord === word && isChineseCharacter(word) && (
            <div className={`pinyin-popup visible`}>
              <div className="character">{word.characters}</div>
              <div className="pinyin">{word.pinyin.join(' ')}</div>
            </div>
          )}
        </span>
      ))}
    </div>
  );
};