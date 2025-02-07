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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-xl text-gray-800">加载中...</div>
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  if (showNamePrompt) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate(-1)} 
            className="text-gray-600 hover:text-gray-800 transition-colors flex items-center gap-2"
          >
            <span>←</span>
            <span>返回 / Back</span>
          </button>
        </div>
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-6">
          <h2 className="text-2xl font-bold">
            <div>加入排行榜</div>
            <div className="text-gray-500 text-lg">Join Leaderboard</div>
          </h2>
          <div className="space-y-4">
            <div>
              <div className="text-gray-800">请输入您的名字以加入排行榜</div>
              <div className="text-gray-600">Please enter your name to join the leaderboard</div>
            </div>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="输入名字 / Enter name"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSubmitName}
              disabled={!userName.trim() || isSubmitting}
              className={`w-full py-3 rounded-md text-white font-medium transition-colors ${isSubmitting || !userName.trim() ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSubmitting ? (
                <>
                  <div>提交中...</div>
                  <div className="text-sm opacity-75">Submitting...</div>
                </>
              ) : (
                <>
                  <div>确认</div>
                  <div className="text-sm opacity-75">Confirm</div>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 p-8">
      <div className="mb-8 flex items-center justify-between">
        <button 
          onClick={() => navigate(-1)} 
          className="text-gray-600 hover:text-gray-800 bg-transparent transition-colors flex items-center gap-2"
        >
          <span>←</span>
        </button>
        <h1 className="text-center text-gray-500 text-2xl font-bold flex-1">
          <div>排行榜</div>
          <div className="text-gray-500 text-lg">Leaderboard</div>
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-3">
            {[
              { id: 'all', label: '总排名', labelEn: 'All Time' },
              { id: 'week', label: '本周', labelEn: 'This Week' },
              { id: 'month', label: '本月', labelEn: 'This Month' }
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id as Period)}
                className={`px-4 py-2 rounded-md transition-colors ${selectedPeriod === period.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                <div>{period.label}</div>
                <div className="text-sm opacity-75">{period.labelEn}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {leaderboardData.map((entry, index) => {
            const getMedalColor = (position: number) => {
              switch (position) {
                case 0: return 'text-yellow-400';
                case 1: return 'text-purple-400';
                case 2: return 'text-pink-400';
                default: return 'text-blue-400';
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
                className={`p-6 transition-colors ${entry.id === user?.id ? 'bg-blue-50' : 'hover:bg-indigo-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
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
                        <div className="text-left text-sm text-blue-600">You</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 animate-gradient">
                      {entry.points}
                    </div>
                    <div className="text-sm text-gray-500">XP</div>
                  </div>
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
    </div>
  );
};