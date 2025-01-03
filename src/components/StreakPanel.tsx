import React from 'react';
import Calendar from 'react-calendar';
import { UserStreak } from '../services/articleService';
import styles from './StreakPanel.module.css';
import 'react-calendar/dist/Calendar.css';

interface StreakPanelProps {
  isOpen: boolean;
  onClose: () => void;
  streak: UserStreak | null;
}

export const StreakPanel: React.FC<StreakPanelProps> = ({ isOpen, onClose, streak }) => {
  if (!isOpen) return null;

  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const isDateCompleted = (date: Date) => {
    if (!streak?.completedDates) return false;
    const dateStr = formatDate(date);
    return streak.completedDates.includes(dateStr);
  };

  const tileClassName = ({ date }: { date: Date }) => {
    if (isDateCompleted(date)) {
      return styles.completed;
    }
    return '';
  };

  const tileContent = ({ date }: { date: Date }) => {
    if (isDateCompleted(date)) {
      return <span className={styles.completedIcon}>🔥</span>;
    }
    return null;
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>阅读记录</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{streak?.currentStreak || 0}</div>
            <div className={styles.statLabel}>当前连续</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{streak?.longestStreak || 0}</div>
            <div className={styles.statLabel}>最长连续</div>
          </div>
        </div>

        <div className={styles.calendar}>
          <Calendar
            value={today}
            maxDate={today}
            minDate={oneMonthAgo}
            locale="zh-CN"
            tileClassName={tileClassName}
            tileContent={tileContent}
            showNeighboringMonth={false}
            prev2Label={null}
            next2Label={null}
          />
        </div>

        <div className={styles.footer}>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={styles.completed}>
                <span className={styles.completedIcon}>🔥</span>
              </div>
              <span>已完成</span>
            </div>
            <div className={styles.legendItem}>
              <div className={styles.incomplete}></div>
              <span>未完成</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 