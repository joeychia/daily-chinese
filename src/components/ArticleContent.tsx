import { ChineseText } from './ChineseText';
import { DifficultyDisplay } from './DifficultyDisplay';
import { Reading } from '../types/reading';
import { ChineseWord } from '../data/sampleText';
import styles from './ArticleContent.module.css';

interface ArticleContentProps {
  reading: Reading;
  processedText: ChineseWord[];
  processedTitle: ChineseWord[];
  onWordPeek: (word: ChineseWord) => void;
  wordBank?: ChineseWord[];
}

export function ArticleContent({ reading, processedText, processedTitle, onWordPeek, wordBank }: ArticleContentProps) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <ChineseText text={processedTitle} onWordPeek={onWordPeek} wordBank={wordBank} />
        <p className={styles.author}>作者：{reading.author}</p>
        <div className={styles.tags}>
          {reading.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
      </div>

      <DifficultyDisplay 
        difficultyLevel={reading.difficultyLevel} 
        characterLevels={reading.characterLevels}
      />

      <div className={styles.content}>
        <ChineseText text={processedText} onWordPeek={onWordPeek} wordBank={wordBank} />
      </div>
    </div>
  );
} 