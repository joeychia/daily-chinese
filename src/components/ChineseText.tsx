import { useState } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './ChineseText.module.css';

interface ChineseTextProps {
  text: ChineseWord[];
}

export const ChineseText: React.FC<ChineseTextProps> = ({ text }) => {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

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
            onMouseDown={() => setActiveWordIndex(index)}
            onMouseUp={() => setActiveWordIndex(null)}
            onMouseLeave={() => setActiveWordIndex(null)}
            onTouchStart={(e) => {
              e.preventDefault(); // Prevent default touch behavior
              setActiveWordIndex(index);
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
        Tap on any character to see pinyin
      </div>
    </div>
  );
}; 