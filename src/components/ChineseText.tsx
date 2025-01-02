import React, { useState } from 'react';
import { ChineseWord } from '../data/sampleText';

interface ChineseTextProps {
  text: ChineseWord[];
  onWordPeek?: (word: ChineseWord) => void;
}

export const ChineseText: React.FC<ChineseTextProps> = ({ text, onWordPeek }) => {
  const [activeWord, setActiveWord] = useState<ChineseWord | null>(null);

  const handleTouchStart = (e: React.TouchEvent, word: ChineseWord) => {
    e.preventDefault(); // Prevent double-firing on mobile
    setActiveWord(word);
    if (onWordPeek) {
      onWordPeek(word);
    }
  };

  const handleMouseDown = (word: ChineseWord) => {
    setActiveWord(word);
    if (onWordPeek) {
      onWordPeek(word);
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
            cursor: 'pointer',
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
          {activeWord === word && (
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