import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rewardsService } from '../services/rewardsService';
import styles from './PointsDisplay.module.css';

interface PointsDisplayProps {
  refreshTrigger: number;
  streakRefreshTrigger?: number;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({ refreshTrigger, streakRefreshTrigger = 0 }) => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!user) {
      setPoints(0);
      return;
    }

    const loadPoints = async () => {
      try {
        const pointsData = await rewardsService.getPoints(user.id);
        if (pointsData.total !== points) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1000);
          setPoints(pointsData.total);
        }
      } catch (error) {
        console.error('Error loading points:', error);
      }
    };

    loadPoints();
  }, [user, refreshTrigger, streakRefreshTrigger]);

  return (
    <span className={`${styles.container} ${isAnimating ? styles.animate : ''}`}>
      💰 {points} XP
    </span>
  );
}; 