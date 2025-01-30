import React, { useState, useEffect } from 'react';
import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Leaderboard.module.css';
import { rewardsService } from '../services/rewardsService';

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
}

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const leaderboardRef = ref(db, 'leaderboard');
        const snapshot = await get(leaderboardRef);
        
        if (snapshot.exists()) {
          const data = snapshot.val();
          const entries = Object.entries(data).map(([id, userData]: [string, any]) => ({
            id,
            name: userData.name || 'Anonymous',
            points: userData.points || 0
          }));
          
          // Sort by points in descending order
          entries.sort((a, b) => b.points - a.points);
          setLeaderboardData(entries);

          // Check if current user exists in leaderboard
          if (user && !entries.some(entry => entry.id === user.id)) {
            setUserName(user.displayName || '');
            setShowNamePrompt(true);
          }
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user]);

  const handleSubmitName = async () => {
    if (!user || !userName.trim()) return;

    setIsSubmitting(true);
    try {
      const userTotalPoints = (await rewardsService.getPoints(user.id)).total;
      await rewardsService.syncToLeaderboard(user.id, userTotalPoints, userName.trim());
      setShowNamePrompt(false);
      // Refresh leaderboard data
      const leaderboardRef = ref(db, 'leaderboard');
      const snapshot = await get(leaderboardRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        const entries = Object.entries(data).map(([id, userData]: [string, any]) => ({
          id,
          name: userData.name || 'Anonymous',
          points: userData.points || 0
        }));
        entries.sort((a, b) => b.points - a.points);
        setLeaderboardData(entries);
      }
    } catch (error) {
      console.error('Error adding user to leaderboard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>加载中...</div>;
  }

  if (showNamePrompt) {
    return (
      <div className={styles.container}>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          ← 返回
        </button>
        <h1 className={styles.title}>加入排行榜</h1>
        <div className={styles.namePrompt}>
          <p>请输入您的名字以加入排行榜</p>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="输入名字"
            className={styles.nameInput}
          />
          <button
            onClick={handleSubmitName}
            disabled={!userName.trim() || isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? '提交中...' : '确认'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button 
        onClick={() => navigate(-1)} 
        className={styles.backButton}
      >
        ← 返回
      </button>
      <h1 className={styles.title}>排行榜</h1>
      <div className={styles.leaderboard}>
        {leaderboardData.map((entry, index) => (
          <div 
            key={entry.id} 
            className={`${styles.scoreItem} ${entry.id === user?.id ? styles.currentUser : ''}`}
          >
            <div className={styles.rank}>{index + 1}</div>
            <div className={styles.name}>{entry.name}</div>
            <div className={styles.points}>{entry.points} XP</div>
          </div>
        ))}
        {leaderboardData.length === 0 && (
          <div className={styles.empty}>暂无数据</div>
        )}
      </div>
    </div>
  );
};