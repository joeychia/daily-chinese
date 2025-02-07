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
    <div className="p-4 bg-[--card-bg]">
      <button
        className="bg-none border-none text-[--primary-color] text-2xl cursor-pointer block absolute p-5 hover:opacity-80"
        onClick={() => navigate(-1)}
        aria-label="Go back"
      >
        ←
      </button>
      <h1 className="text-[--text-primary] mb-6 text-2xl px-4 font-semibold">
        学习进度
        <span className="block text-base font-normal">Learning Progress</span>
      </h1>
      
      {/* Daily Progress Trend */}
      <div className="mb-8 p-4 bg-[--background] rounded-lg">
        <h2 className="text-[--text-primary] text-lg font-semibold mb-4">
          学习趋势（近30天）
          <span className="block text-base font-normal">Learning Trends (Last 30 Days)</span>
        </h2>
        <div className="h-[300px] p-4 bg-[--card-bg] rounded-lg border border-[--border-color]">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className="mb-8 p-4 bg-[--background] rounded-lg">
        <h2 className="text-[--text-primary] text-lg font-semibold mb-4">
          总体进度
          <span className="block text-base font-normal">Overall Progress</span>
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-4 mt-4 text-[--text-primary] font-medium">
          <div>
            总字数 <span className="block text-sm text-[--text-secondary]">Total Characters</span> {overallStats.total}
          </div>
          <div>
            已掌握 <span className="block text-sm text-[--text-secondary]">Mastered</span> {overallStats.mastered} ({Math.round(overallStats.mastered / overallStats.total * 100)}%)
          </div>
          <div>
            熟悉 <span className="block text-sm text-[--text-secondary]">Familiar</span> {overallStats.familiar} ({Math.round(overallStats.familiar / overallStats.total * 100)}%)
          </div>
          <div>
            学习中 <span className="block text-sm text-[--text-secondary]">Learning</span> {overallStats.learned} ({Math.round(overallStats.learned / overallStats.total * 100)}%)
          </div>
          <div>
            不熟 <span className="block text-sm text-[--text-secondary]">Not Familiar</span> {overallStats.notFamiliar} ({Math.round(overallStats.notFamiliar / overallStats.total * 100)}%)
          </div>
          <div>
            未读 <span className="block text-sm text-[--text-secondary]">Unread</span> {overallStats.unknown} ({Math.round(overallStats.unknown / overallStats.total * 100)}%)
          </div>
        </div>
      </div>
      {(Object.entries(characterGrades) as [keyof typeof gradeNames, string[]][]).map(([grade, chars]) => {
        const stats = calculateStats(chars, masteryData);
        return (
          <div key={grade} className="mb-8 bg-[--background] rounded-lg p-4">
            <h2 className="text-[--text-primary] mb-4 text-lg font-semibold pb-2 border-b border-[--border-color] flex justify-between items-center">
              {gradeNames[grade]}级汉字
              <span className="text-base font-normal">{grade}</span>
              <span className="text-sm text-[--text-primary] ml-4 font-normal">
                (掌握 <span className="font-normal">Mastered</span>: {Math.round(stats.mastered / stats.total * 100)}% | 
                未读 <span className="font-normal">Unread</span>: {stats.unknown})
                <button 
                  className="ml-4 px-3 py-1 border border-[--border-color] rounded bg-[--card-bg] text-[--text-primary] cursor-pointer text-sm font-normal hover:bg-[--hover-highlight]"
                  onClick={() => toggleShowUnknown(grade)}
                >
                  {showUnknownByGrade[grade] ? '隐藏未读 Hide Unread' : '显示未读 Show Unread'}
                </button>
              </span>
            </h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(28px,1fr))] gap-1 py-2">
              {chars.map((char, index) => {
                const mastery = masteryData[char] ?? -1;
                if (!showUnknownByGrade[grade] && mastery === -1) return null;
                return (
                  <div
                    key={`${grade}-${char}-${index}`}
                    className="border-2 rounded p-1 text-center bg-[--card-bg] transition-transform duration-200 text-base leading-none cursor-default font-medium hover:scale-120 hover:z-10"
                    style={{ 
                      borderColor: getMasteryColor(mastery),
                      color: getMasteryColor(mastery)
                    }}
                    title={getMasteryText(mastery)}
                  >
                    {char}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};