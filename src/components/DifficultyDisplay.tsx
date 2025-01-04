import { LevelDistribution } from '../utils/articleDifficulty';
import styles from './DifficultyDisplay.module.css';

interface DifficultyDisplayProps {
  difficultyLevel: number;
  characterLevels: LevelDistribution;
}

const MAX_STARS = 5;

function renderStars(level: number) {
  return (
    <div className={styles.stars}>
      {[...Array(MAX_STARS)].map((_, index) => (
        <span 
          key={index} 
          className={`${styles.star} ${index < level ? styles.filled : styles.empty}`}
        >
          {index < level ? '★' : '☆'}
        </span>
      ))}
    </div>
  );
}

export function DifficultyDisplay({ difficultyLevel, characterLevels }: DifficultyDisplayProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.difficultyBadge} ${styles[`difficulty${difficultyLevel}`]}`}>
        难度：{renderStars(difficultyLevel)}
      </div>
      <div className={styles.levelDistribution}>
        <h3>难度级别分布</h3>
        <div className={styles.bars}>
          {Object.entries(characterLevels).map(([level, percentage]) => (
            <div key={level} className={styles.barContainer}>
              <div className={styles.label}>{level.replace('LEVEL_', '级别')}</div>
              <div className={styles.barWrapper}>
                <div 
                  className={`${styles.bar} ${styles[level.toLowerCase()]}`}
                  style={{ width: `${percentage}%` }}
                />
                <span className={styles.percentage}>{percentage.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 