import React, { useState } from 'react';
import { ChineseWord } from '../data/sampleText';
import { processChineseText } from '../utils/textProcessor';

interface ProcessedTextProps {
  text: string;
  onWordPeek?: (word: ChineseWord) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const ProcessedText: React.FC<ProcessedTextProps> = ({ 
  text, 
  onWordPeek,
  className = '',
  style = {}
}) => {
  const [activeWord, setActiveWord] = useState<ChineseWord | null>(null);
  const processedText = processChineseText(text);

  const handleWordClick = (word: ChineseWord) => {
    setActiveWord(activeWord === word ? null : word);
    if (onWordPeek) {
      onWordPeek(word);
    }
  };

  return (
    <div className={`chinese-text ${className}`} style={style}>
      {processedText.map((word, index) => (
        <span
          key={index}
          onClick={() => handleWordClick(word)}
        >
          {word.characters}
          {activeWord === word && (
            <div className="pinyin-popup">
              <div className="character">{word.characters}</div>
              <div className="pinyin">{word.pinyin.join(' ')}</div>
            </div>
          )}
        </span>
      ))}
    </div>
  );
}; 