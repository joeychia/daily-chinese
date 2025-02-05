import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './Leaderboard.module.css';
import { rewardsService } from '../services/rewardsService';

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
}

type Period = 'all' | 'week' | 'month';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [userName, setUserName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const entries = await rewardsService.getLeaderboardByPeriod(selectedPeriod);
        setLeaderboardData(entries);

        // Check if current user exists in leaderboard
        if (user && !entries.some(entry => entry.id === user.id)) {
          setUserName(user.displayName || '');
          setShowNamePrompt(true);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [user, selectedPeriod]);

  const handleSubmitName = async () => {
    if (!user || !userName.trim()) return;

    setIsSubmitting(true);
    try {
      const userTotalPoints = (await rewardsService.getPoints(user.id)).total;
      await rewardsService.syncToLeaderboard(user.id, userTotalPoints, userName.trim());
      setShowNamePrompt(false);
      // Refresh leaderboard data
      const entries = await rewardsService.getLeaderboardByPeriod(selectedPeriod);
      setLeaderboardData(entries);
    } catch (error) {
      console.error('Error adding user to leaderboard:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div>加载中...</div>
        <div className={styles.englishLabel}>Loading...</div>
      </div>
    );
  }

  if (showNamePrompt) {
    return (
      <div className={styles.container}>
        <button 
          onClick={() => navigate(-1)} 
          className={styles.backButton}
        >
          <span>← 返回</span>
          <span className={styles.englishLabel}>Back</span>
        </button>
        <h1 className={styles.title}>
          <div>加入排行榜</div>
          <div className={styles.englishLabel}>Join Leaderboard</div>
        </h1>
        <div className={styles.namePrompt}>
          <p>
            <div>请输入您的名字以加入排行榜</div>
            <div className={styles.englishLabel}>Please enter your name to join the leaderboard</div>
          </p>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="输入名字 / Enter name"
            className={styles.nameInput}
          />
          <button
            onClick={handleSubmitName}
            disabled={!userName.trim() || isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? (
              <>
                <div>提交中...</div>
                <div className={styles.englishLabel}>Submitting...</div>
              </>
            ) : (
              <>
                <div>确认</div>
                <div className={styles.englishLabel}>Confirm</div>
              </>
            )}
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
        <span>← 返回</span>
        <span className={styles.englishLabel}>Back</span>
      </button>
      <h1 className={styles.title}>
        <div>排行榜</div>
        <div className={styles.englishLabel}>Leaderboard</div>
      </h1>
      <div className={styles.periodSelector}>
        <button 
          onClick={() => setSelectedPeriod('all')}
          className={`${styles.periodButton} ${selectedPeriod === 'all' ? styles.active : ''}`}
        >
          <div>总排名</div>
          <div className={styles.englishLabel}>All Time</div>
        </button>
        <button 
          onClick={() => setSelectedPeriod('week')}
          className={`${styles.periodButton} ${selectedPeriod === 'week' ? styles.active : ''}`}
        >
          <div>本周</div>
          <div className={styles.englishLabel}>This Week</div>
        </button>
        <button 
          onClick={() => setSelectedPeriod('month')}
          className={`${styles.periodButton} ${selectedPeriod === 'month' ? styles.active : ''}`}
        >
          <div>本月</div>
          <div className={styles.englishLabel}>This Month</div>
        </button>
      </div>
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
          <div className={styles.empty}>
            <div>暂无数据</div>
            <div className={styles.englishLabel}>No data available</div>
          </div>
        )}
      </div>
    </div>
  );
};