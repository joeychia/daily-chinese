import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

import { characterGrades } from '../data/characterGrades';
import { userDataService, DailyStats } from '../services/userDataService';
import { Line } from 'react-chartjs-2';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface GradeStats {
  total: number;
  unknown: number;
  notFamiliar: number;
  learned: number;
  familiar: number;
  mastered: number;
}

export const calculateStats = (chars: string[], masteryData: Record<string, number>): GradeStats => {
  const stats: GradeStats = {
    total: chars.length,
    unknown: 0,
    notFamiliar: 0,
    learned: 0,
    familiar: 0,
    mastered: 0
  };

  chars.forEach(char => {
    const mastery = masteryData[char] ?? -1;
    switch (mastery) {
      case -1: stats.unknown++; break;
      case 0: stats.notFamiliar++; break;
      case 1: stats.learned++; break;
      case 2: stats.familiar++; break;
      case 3: stats.mastered++; break;
    }
  });

  return stats;
};

export const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [masteryData, setMasteryData] = useState<Record<string, number>>({});
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnknownByGrade, setShowUnknownByGrade] = useState<Record<string, boolean>>({
    'grade-1': false,
    'grade-2': false,
    'grade-3': false,
    'grade-4': false,
    'grade-5': false,
    'grade-6': false
  });

  const toggleShowUnknown = (grade: string) => {
    setShowUnknownByGrade(prev => ({
      ...prev,
      [grade]: !prev[grade]
    }));
  };

  useEffect(() => {
    const loadData = async () => {
      if (!user) return;
      
      try {
        setError(null);
        const [mastery, stats] = await Promise.all([
          userDataService.getCharacterMastery(),
          userDataService.getDailyStats(30) // Get last 30 days
        ]);
        setMasteryData(mastery || {});
        setDailyStats(stats);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('加载数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  const getMasteryColor = (mastery: number) => {
    switch (mastery) {
      case -1: return '#909399'; // lighter gray
      case 0: return '#F56C6C'; // lighter red
      case 1: return '#E6A23C'; // lighter orange
      case 2: return '#F4E04D'; // brighter yellow
      case 3: return '#67C23A'; // lighter green
      default: return '#909399';
    }
  };

  const getMasteryText = (mastery: number) => {
    switch (mastery) {
      case -1: return '未读';
      case 0: return '不熟';
      case 1: return '学过一次';
      case 2: return '学过两次';
      case 3: return '已掌握';
      default: return '未读';
    }
  };

  const calculateOverallStats = (): GradeStats => {
    const allChars = Object.values(characterGrades).flat();
    return calculateStats(allChars, masteryData);
  };

  // Prepare chart data
  const sortedDailyStats = dailyStats.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = {
    labels: sortedDailyStats.map(stat => {
      const date = new Date(stat.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }),
    datasets: [
      {
        label: '已掌握',
        data: sortedDailyStats.map(stat => stat.mastered),
        borderColor: '#67C23A',
        backgroundColor: '#67C23A',
        tension: 0.4,
      },
      {
        label: '熟悉',
        data: sortedDailyStats.map(stat => stat.familiar),
        borderColor: '#F4E04D',
        backgroundColor: '#F4E04D',
        tension: 0.4,
      },
      {
        label: '学习中',
        data: sortedDailyStats.map(stat => stat.learned),
        borderColor: '#E6A23C',
        backgroundColor: '#E6A23C',
        tension: 0.4,
      },
      {
        label: '不熟',
        data: sortedDailyStats.map(stat => stat.notFamiliar),
        borderColor: '#F56C6C',
        backgroundColor: '#F56C6C',
        tension: 0.4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          color: 'var(--text-primary)'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      },
      y: {
        grid: {
          color: 'var(--border-color)'
        },
        ticks: {
          color: 'var(--text-secondary)'
        }
      }
    }
  };

  if (authLoading || loading) {
    return <div className="flex justify-center items-center min-h-[200px] text-[--text-primary] text-lg">加载中...</div>;
  }

  if (error) {
    return <div className="text-[#F56C6C] text-center p-8 font-medium">{error}</div>;
  }

  const gradeNames = {
    'grade-1': '一',
    'grade-2': '二',
    'grade-3': '三',
    'grade-4': '四',
    'grade-5': '五',
    'grade-6': '六'
  };

  const overallStats = calculateOverallStats();

  return (
    <div className="bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 py-6 px-2">
      <div className="mb-8 relative">
        <button
          className="text-gray-600 hover:text-gray-800 bg-transparent transition-colors flex items-center gap-2 absolute left-0"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <span>←</span>
        </button>
        <h1 className="text-center text-gray-500 text-2xl font-bold mb-6 mx-auto">
          <div>学习进度</div>
          <div className="text-lg">Learning Progress</div>
        </h1>
      </div>
      {/* Daily Progress Trend */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-800 text-lg font-semibold">
            <div>学习趋势（近30天）</div>
            <div className="text-gray-500 text-base font-normal">Learning Trends (Last 30 Days)</div>
          </h2>
        </div>
        <div className="p-6">
          <div className="h-[300px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-gray-800 text-lg font-semibold">
            <div>总体进度</div>
            <div className="text-gray-500 text-base font-normal">Overall Progress</div>
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gradient-to-br from-pink-50 to-red-50 rounded-lg">
              <div className="text-gray-600 text-sm">总字数 / Total Characters</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">{overallStats.total}</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <div className="text-gray-600 text-sm">已掌握 / Mastered</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {overallStats.mastered} ({Math.round(overallStats.mastered / overallStats.total * 100)}%)
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg">
              <div className="text-gray-600 text-sm">熟悉 / Familiar</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {overallStats.familiar} ({Math.round(overallStats.familiar / overallStats.total * 100)}%)
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg">
              <div className="text-gray-600 text-sm">学习中 / Learning</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {overallStats.learned} ({Math.round(overallStats.learned / overallStats.total * 100)}%)
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-50 to-rose-50 rounded-lg">
              <div className="text-gray-600 text-sm">不熟 / Not Familiar</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {overallStats.notFamiliar} ({Math.round(overallStats.notFamiliar / overallStats.total * 100)}%)
              </div>
            </div>
            <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg">
              <div className="text-gray-600 text-sm">未读 / Unread</div>
              <div className="text-2xl font-bold text-gray-800 mt-1">
                {overallStats.unknown} ({Math.round(overallStats.unknown / overallStats.total * 100)}%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {(Object.entries(characterGrades) as [keyof typeof gradeNames, string[]][]).map(([grade, chars]) => {
        const stats = calculateStats(chars, masteryData);
        return (
          <div key={grade} className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-gray-800 text-lg font-semibold">
                  <div>{gradeNames[grade]}级汉字</div>
                  <div className="text-gray-500 text-base font-normal">{grade}</div>
                </h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    掌握 / Mastered: {Math.round(stats.mastered / stats.total * 100)}% | 
                    未读 / Unread: {stats.unknown}
                  </div>
                  <button 
                    className={`px-4 py-2 rounded-md transition-colors text-sm
                    ${showUnknownByGrade[grade] ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    onClick={() => toggleShowUnknown(grade)}
                  >
                    {showUnknownByGrade[grade] ? '隐藏未读 / Hide Unread' : '显示未读 / Show Unread'}
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(32px,1fr))] gap-2">
                {chars.map((char, index) => {
                  const mastery = masteryData[char] ?? -1;
                  if (!showUnknownByGrade[grade] && mastery === -1) return null;
                  return (
                    <div
                      key={`${grade}-${char}-${index}`}
                      className="aspect-square flex items-center justify-center rounded-lg text-lg font-medium
                        transition-all duration-200 hover:scale-110 hover:shadow-lg cursor-default"
                      style={{ 
                        backgroundColor: `${getMasteryColor(mastery)}15`,
                        color: getMasteryColor(mastery),
                        border: `2px solid ${getMasteryColor(mastery)}`
                      }}
                      title={getMasteryText(mastery)}
                    >
                      {char}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};