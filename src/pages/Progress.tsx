import { useState, useEffect } from 'react';
import { characterGrades } from '../data/characterGrades';
import { userDataService } from '../services/userDataService';
import { useAuth } from '../contexts/AuthContext';
import styles from './Progress.module.css';

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

export const Progress = () => {
  const { user, loading: authLoading } = useAuth();
  const [masteryData, setMasteryData] = useState<Record<string, number>>({});
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
    const loadMasteryData = async () => {
      if (!user) return;
      
      try {
        setError(null);
        const data = await userDataService.getCharacterMastery();
        setMasteryData(data || {});
      } catch (error) {
        console.error('Error loading mastery data:', error);
        setError('加载数据失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      loadMasteryData();
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

  const calculateStats = (chars: string[]): GradeStats => {
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

  const calculateOverallStats = (): GradeStats => {
    const allChars = Object.values(characterGrades).flat();
    return calculateStats(allChars);
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
        const stats = calculateStats(chars);
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