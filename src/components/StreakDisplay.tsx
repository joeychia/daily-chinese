import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { streakService, UserStreak } from '../services/streakService';
import { StreakPanel } from './StreakPanel';
import styles from './StreakDisplay.module.css';

export const StreakDisplay: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadStreak = async () => {
      const userStreak = await streakService.getUserStreak(user.id);
      setStreak(userStreak || {
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: '',
        streakStartDate: '',
        completedDates: []
      });
    };

    loadStreak();
  }, [user, refreshTrigger]);

  if (!user) return null;

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;

  return (
    <>
      <div 
        className={styles.streakContainer}
        onClick={() => setIsOpen(true)}
      >
        <div className={styles.streakBox}>
          <span className={styles.streakIcon}>🔥</span>
          <span className={styles.streakCount}>{currentStreak}</span>
          <span className={styles.streakLabel}>天</span>
        </div>
      </div>
      <StreakPanel 
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        streak={streak}
      />
    </>
  );
}; 