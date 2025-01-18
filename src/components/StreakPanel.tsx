import React from 'react';
import Calendar from 'react-calendar';
import { UserStreak } from '../services/streakService';
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
  const [activeDate, setActiveDate] = React.useState(today);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
      return <span data-testid="calendar-fire-emoji" className={styles.completedIcon}>🔥</span>;
    }
    return null;
  };

  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setActiveDate(activeStartDate);
    }
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} data-testid="streak-panel-overlay" />
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
            locale="zh-CN"
            calendarType="iso8601"
            formatShortWeekday={(_locale: string | undefined, date: Date) => ['一', '二', '三', '四', '五', '六', '日'][date.getDay() === 0 ? 6 : date.getDay() - 1]}
            tileClassName={tileClassName}
            tileContent={tileContent}
            showNeighboringMonth={false}
            prev2Label={null}
            next2Label={null}
            prevLabel="←"
            nextLabel="→"
            defaultView="month"
            view="month"
            activeStartDate={activeDate}
            onActiveStartDateChange={handleActiveStartDateChange}
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