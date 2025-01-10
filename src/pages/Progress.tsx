import { useState, useEffect } from 'react';
import { characterGrades } from '../data/characterGrades';
import { userDataService, DailyStats } from '../services/userDataService';
import { useAuth } from '../contexts/AuthContext';
import { Line } from 'react-chartjs-2';
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
import styles from './Progress.module.css';

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

interface CharacterMastery {
  character: string;
  mastery: number;
}

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
    return <div className={styles.loading}>加载中...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
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
    <div className={styles.container}>
      <h1 className={styles.title}>学习进度</h1>
      
      {/* Daily Progress Trend */}
      <div className={styles.trendSection}>
        <h2>学习趋势（近30天）</h2>
        <div className={styles.chartContainer}>
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      <div className={styles.overallStats}>
        <h2>总体进度</h2>
        <div className={styles.statsGrid}>
          <div>总字数: {overallStats.total}</div>
          <div>已掌握: {overallStats.mastered} ({Math.round(overallStats.mastered / overallStats.total * 100)}%)</div>
          <div>熟悉: {overallStats.familiar} ({Math.round(overallStats.familiar / overallStats.total * 100)}%)</div>
          <div>学习中: {overallStats.learned} ({Math.round(overallStats.learned / overallStats.total * 100)}%)</div>
          <div>不熟: {overallStats.notFamiliar} ({Math.round(overallStats.notFamiliar / overallStats.total * 100)}%)</div>
          <div>未读: {overallStats.unknown} ({Math.round(overallStats.unknown / overallStats.total * 100)}%)</div>
        </div>
      </div>
      {(Object.entries(characterGrades) as [keyof typeof gradeNames, string[]][]).map(([grade, chars]) => {
        const stats = calculateStats(chars, masteryData);
        return (
          <div key={grade} className={styles.gradeSection}>
            <h2 className={styles.gradeTitle}>
              {gradeNames[grade]}级汉字
              <span className={styles.gradeStats}>
                (掌握: {Math.round(stats.mastered / stats.total * 100)}% | 
                未读: {stats.unknown})
                <button 
                  className={styles.toggleButton}
                  onClick={() => toggleShowUnknown(grade)}
                >
                  {showUnknownByGrade[grade] ? '隐藏未读' : '显示未读'}
                </button>
              </span>
            </h2>
            <div className={styles.charactersGrid}>
              {chars.map((char, index) => {
                const mastery = masteryData[char] ?? -1;
                if (!showUnknownByGrade[grade] && mastery === -1) return null;
                return (
                  <div
                    key={`${grade}-${char}-${index}`}
                    className={styles.characterCard}
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