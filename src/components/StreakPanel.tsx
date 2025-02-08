import React from 'react';
import Calendar from 'react-calendar';
import { UserStreak } from '../services/streakService';
import 'react-calendar/dist/Calendar.css';

interface StreakPanelProps {
  isOpen: boolean;
  onClose: () => void;
  streak: UserStreak | null;
}

export const StreakPanel: React.FC<StreakPanelProps> = ({ isOpen, onClose, streak }) => {
  if (!isOpen) return null;

  const today = new Date();
  const [activeDate, setActiveDate] = React.useState(today);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateCompleted = (date: Date) => {
    if (!streak?.completedDates) return false;
    const dateStr = formatDate(date);
    return streak.completedDates.includes(dateStr);
  };

  const tileClassName = (_: { date: Date }) => {
      return 'relative';
  };

  const tileContent = ({ date }: { date: Date }) => {
    if (isDateCompleted(date)) {
      return <span data-testid="calendar-fire-emoji" className="absolute  -translate-x-1/2 -translate-y-1/2">🔥</span>;
    }
    return null;
  };

  const handleActiveStartDateChange = ({ activeStartDate }: { activeStartDate: Date | null }) => {
    if (activeStartDate) {
      setActiveDate(activeStartDate);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[1000]" onClick={onClose} data-testid="streak-panel-overlay" />
      <div className="fixed top-12 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px]  bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50  border border-theme-card-border rounded-2xl shadow-lg z-[1001] animate-slideDown">
        <div className="p-4 border-b border-theme-card-border flex justify-between items-center">
          <div className="flex-1" /> {/* Left spacer */}
          <h2 className="m-0 text-xl text-theme-text flex-1 text-center">阅读记录</h2>
          <div className="flex-1 flex justify-end"> {/* Right spacer with button alignment */}
            <button className="bg-transparent border-none text-xl text-theme-secondary p-2 cursor-pointer" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="flex justify-around p-2 bg-theme-highlight rounded-xl mx-4 my-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-theme-primary">{streak?.currentStreak || 0}</div>
            <div className="text-sm text-theme-secondary mt-1">当前连续</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-theme-primary">{streak?.longestStreak || 0}</div>
            <div className="text-sm text-theme-secondary mt-1">最长连续</div>
          </div>
        </div>

        <div className="p-4">
          <Calendar
            value={today}
            maxDate={today}
            locale="zh-CN"
            calendarType="iso8601"
            formatShortWeekday={(_locale: string | undefined, date: Date) => ['一', '二', '三', '四', '五', '六', '日'][date.getDay() === 0 ? 6 : date.getDay() - 1]}
            tileClassName={tileClassName}
            tileContent={tileContent}
            showNeighboringMonth={false}
            prev2Label={null}
            next2Label={null}
            prevLabel="←"
            nextLabel="→"
            defaultView="month"
            view="month"
            activeStartDate={activeDate}
            onActiveStartDateChange={handleActiveStartDateChange}
          />
        </div>

        <div className="p-4 border-t border-theme-card-border mt-4">
          <div className="flex justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-theme-highlight rounded relative">
                <span>🔥</span>
              </div>
              <span className="text-theme-text">已完成</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 border border-theme-card-border rounded"></div>
              <span className="text-theme-text">未完成</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};