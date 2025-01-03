import React, { useState, useEffect } from 'react';
import styles from './Timer.module.css';

interface TimerProps {
  startTime: number;
  isRunning: boolean;
  lastReadTime?: number;
}

export const Timer: React.FC<TimerProps> = ({ startTime, isRunning, lastReadTime }) => {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.timerContainer}>
      {lastReadTime && (
        <span className={styles.lastTime}>
          上次阅读时间：{formatTime(lastReadTime)}
        </span>
      )}
      <span className={styles.currentTime}>
        {isRunning ? '阅读时间：' : '完成时间：'}{formatTime(elapsedTime)}
      </span>
    </div>
  );
}; 