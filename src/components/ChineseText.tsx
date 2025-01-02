import { useState } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './ChineseText.module.css';

interface ChineseTextProps {
  text: ChineseWord[];
  onWordPeek?: (word: ChineseWord) => void;
}

export const ChineseText: React.FC<ChineseTextProps> = ({ text, onWordPeek }) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

  const handleWordActivate = (index: number) => {
    setActiveWordIndex(index);
    if (onWordPeek && /[\u4e00-\u9fa5]/.test(text[index].characters)) {
      onWordPeek(text[index]);
    }
  };

  if (text.length === 0) {
    return <div>No text to display</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.textContainer}>
        {text.map((word, index) => (
          <span 
            key={index} 
            className={styles.word}
            onMouseDown={() => handleWordActivate(index)}
            onMouseUp={() => setActiveWordIndex(null)}
            onMouseLeave={() => setActiveWordIndex(null)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleWordActivate(index);
            }}
            onTouchEnd={() => setActiveWordIndex(null)}
          >
            <div className={`${styles.pinyin} ${activeWordIndex === index ? styles.visible : ''}`}>
              {word.pinyin.join(' ')}
            </div>
            <div className={styles.characters}>
              {word.characters}
            </div>
          </span>
        ))}
      </div>
      <div className={styles.instructions}>
        点击汉字查看拼音
      </div>
    </div>
  );
}; 