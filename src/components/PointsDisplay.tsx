import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { rewardsService } from '../services/rewardsService';
import styles from './PointsDisplay.module.css';

interface PointsDisplayProps {
  refreshTrigger: number;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [points, setPoints] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastPoints, setLastPoints] = useState(0);

  useEffect(() => {
    if (!user) {
      setPoints(0);
      return;
    }

    const loadPoints = async () => {
      try {
        const pointsData = await rewardsService.getPoints(user.id);
        if (pointsData.total !== lastPoints) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 1000);
          setLastPoints(pointsData.total);
        }
        setPoints(pointsData.total);
      } catch (error) {
        console.error('Error loading points:', error);
      }
    };

    loadPoints();
  }, [user, refreshTrigger, lastPoints]);

  return (
    <span className={`${styles.container} ${isAnimating ? styles.animate : ''}`}>
      🏅 {points} XP
    </span>
  );
}; 