import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { streakService, UserStreak } from '../services/streakService';
import { StreakPanel } from './StreakPanel';
import styles from './StreakDisplay.module.css';

export const StreakDisplay: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevStreak, setPrevStreak] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const loadStreak = async () => {
      const userStreak = await streakService.getUserStreak(user.id);
      const newStreak = userStreak || {
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: '',
        streakStartDate: '',
        completedDates: []
      };
      
      // Only animate if the streak value has changed and it's not the first load
      if (prevStreak !== newStreak.currentStreak && prevStreak !== 0) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 600); // Match animation duration
      }
      
      setPrevStreak(newStreak.currentStreak);
      setStreak(newStreak);
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
          <span className={`${styles.streakCount} ${isAnimating ? styles.animate : ''}`}>
            {currentStreak}
          </span>
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