import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
      <div className="flex flex-col items-center justify-center min-h-screen gap-2 text-lg">
        <div className="text-gray-800">加载中...</div>
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (showNamePrompt) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 mb-6 transition-colors"
        >
          <span>← 返回</span>
          <span className="text-gray-600">Back</span>
        </button>
        <h1 className="text-2xl font-bold mb-8">
          <div>加入排行榜</div>
          <div className="text-gray-500 text-lg">Join Leaderboard</div>
        </h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <p className="mb-4">
            <div className="text-gray-800">请输入您的名字以加入排行榜</div>
            <div className="text-gray-600">Please enter your name to join the leaderboard</div>
          </p>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="输入名字 / Enter name"
            className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <button
            onClick={handleSubmitName}
            disabled={!userName.trim() || isSubmitting}
            className={`w-full py-2 rounded-md text-white transition-colors ${isSubmitting || !userName.trim() ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isSubmitting ? (
              <>
                <div>提交中...</div>
                <div className="text-white">Submitting...</div>
              </>
            ) : (
              <>
                <div>确认</div>
                <div className="text-white">Confirm</div>
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button 
        onClick={() => navigate(-1)} 
        className="absolute left-4 items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <span>←</span>
      </button>
      <h1 className="text-2xl font-bold mb-8 text-gray-800">
        <div>排行榜</div>
        <div className="text-gray-400 text-lg">Leaderboard</div>
      </h1>
      <div className="flex gap-2 mb-6 overflow-x-auto p-3">
        <button 
          onClick={() => setSelectedPeriod('all')}
          className={`px-4 py-2 rounded-md transition-colors ${selectedPeriod === 'all' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <div>总排名</div>
          <div className="text-sm opacity-75">All Time</div>
        </button>
        <button 
          onClick={() => setSelectedPeriod('week')}
          className={`px-4 py-2 rounded-md transition-colors ${selectedPeriod === 'week' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <div>本周</div>
          <div className="text-sm opacity-75">This Week</div>
        </button>
        <button 
          onClick={() => setSelectedPeriod('month')}
          className={`px-4 py-2 rounded-md transition-colors ${selectedPeriod === 'month' ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
        >
          <div>本月</div>
          <div className="text-sm opacity-75">This Month</div>
        </button>
      </div>
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-lg shadow-lg overflow-hidden border border-gray-200">
        {leaderboardData.map((entry, index) => {
          const getMedalColor = (position: number) => {
            switch (position) {
              case 0: return 'text-yellow-500'; // Gold
              case 1: return 'text-gray-400';  // Silver
              case 2: return 'text-amber-600';  // Bronze
              default: return 'text-gray-600';
            }
          };

          const getMedalEmoji = (position: number) => {
            switch (position) {
              case 0: return '🥇';
              case 1: return '🥈';
              case 2: return '🥉';
              default: return '';
            }
          };

          return (
            <div 
              key={entry.id} 
              className={`flex items-center justify-between p-6 border-b last:border-b-0 transition-colors ${entry.id === user?.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
            >
              <div className="flex items-center gap-6">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${index < 3 ? 'bg-gradient-to-br from-gray-100 to-white shadow-md' : ''} ${getMedalColor(index)}`}>
                  {index < 3 ? (
                    <span className="text-2xl">{getMedalEmoji(index)}</span>
                  ) : (
                    <span className="text-xl font-bold">{index + 1}</span>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{entry.name}</div>
                  {entry.id === user?.id && (
                    <div className="text-sm text-blue-600">You</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                  {entry.points}
                </div>
                <div className="text-sm text-gray-500">XP</div>
              </div>
            </div>
          );
        })}
        {leaderboardData.length === 0 && (
          <div className="p-8 text-center">
            <div className="text-gray-800">暂无数据</div>
            <div className="text-sm text-gray-600">No data available</div>
          </div>
        )}
      </div>
    </div>
  );
};