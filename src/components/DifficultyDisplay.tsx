import { LevelDistribution } from '../utils/articleDifficulty';
import styles from './DifficultyDisplay.module.css';

interface DifficultyDisplayProps {
  difficultyLevel: number;
  characterLevels: LevelDistribution;
}

const difficultyLabels: { [key: number]: string } = {
  1: '入门',
  2: '初级',
  3: '中级',
  4: '高级',
  5: '专家'
};

export function DifficultyDisplay({ difficultyLevel, characterLevels }: DifficultyDisplayProps) {
  return (
    <div className={styles.container}>
      <div className={`${styles.difficultyBadge} ${styles[`difficulty${difficultyLevel}`]}`}>
        难度：{difficultyLabels[difficultyLevel]}
      </div>
      <div className={styles.levelDistribution}>
        <h3>字符分布</h3>
        <div className={styles.bars}>
          {Object.entries(characterLevels).map(([level, percentage]) => (
            <div key={level} className={styles.barContainer}>
              <div className={styles.label}>{level.replace('LEVEL_', '级')}</div>
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