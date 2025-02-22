/**
 * Menu Component Requirements
 * 
 * Features:
 * 1. Navigation:
 *    - Home link
 *    - Articles list
 *    - Progress tracking
 *    - Word bank
 *    - Feedback
 * 
 * 2. User Management:
 *    - Display user profile via UserMenu
 *    - Show user's name before dropdown
 *    - Handle authentication state
 *    - Proper color contrast for text
 * 
 * 3. Responsive Design:
 *    - Mobile-friendly layout
 *    - Collapsible menu on small screens
 *    - Touch-friendly targets
 * 
 * 4. Theme Integration:
 *    - Consistent with app theme
 *    - Proper color variables usage
 *    - Visual feedback on interactions
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import { useAuth } from '../contexts/AuthContext';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Menu: React.FC<MenuProps> = ({ isOpen, onClose }): JSX.Element => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const { user } = useAuth();
  const isGuest = !user || (user as any).uid === 'guest';

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
      return;
    }

    if (isIOS || isSafari) {
      setShowInstallButton(true);
    } else {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
      });
    }
  }, [isIOS, isSafari]);

  const handleInstall = async () => {
    if (isIOS || isSafari) {
      const message = 'To install this app:\n1. Tap the Share button in your browser (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
      alert(message);
    } else if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowInstallButton(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }
    onClose();
  };

  const handleFeedbackClick = (): void => {
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'visible' : 'invisible'}`}>
      <div className={`fixed top-[env(safe-area-inset-top,0)] left-0 w-[300px] h-[calc(100%-env(safe-area-inset-top,0))] bg-white flex flex-col shadow-lg z-[1001] transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b border-gray-200 flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL}rooster.png`} alt="Logo" className="w-8 h-8 object-contain" />
          <h2 className="text-xl font-semibold text-gray-900 m-0">每日一读</h2>
        </div>
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <UserMenu />
        </div>
        <nav className="flex flex-col gap-2 p-4 overflow-y-auto">
          <Link to="/" onClick={onClose} className="p-3 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors no-underline">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="flex items-center gap-2">
                <span>首页</span>
                <span className="text-gray-500">Home</span>
              </span>
            </span>
          </Link>
          <Link to="/articles" onClick={onClose} className="p-3 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors no-underline">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span className="flex items-center gap-2">
                <span>文章列表</span>
                <span className="text-gray-500">Articles</span>
              </span>
            </span>
          </Link>
          <Link to="/create-article" onClick={onClose} className="p-3 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors no-underline relative">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="flex items-center gap-2">
                <span>创建文章</span>
                <span className="text-gray-500">Create</span>
              </span>
            </span>
            {isGuest && <span className="absolute top-1 right-1 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">需登录</span>}
          </Link>
          <Link to="/wordbank" onClick={onClose} className="p-3 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors no-underline relative">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="flex items-center gap-2">
                <span>生词本</span>
                <span className="text-gray-500">Word Bank</span>
              </span>
            </span>
            {isGuest && <span className="absolute top-1 right-1 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">需登录</span>}
          </Link>
          <Link to="/progress" onClick={onClose} className="p-3 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors no-underline relative">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="flex items-center gap-2">
                <span>学习进度</span>
                <span className="text-gray-500">Progress</span>
              </span>
            </span>
            {isGuest && <span className="absolute top-1 right-1 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">需登录</span>}
          </Link>
          <Link to="/leaderboard" onClick={onClose} className="p-3 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors no-underline relative">
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="flex items-center gap-2">
                <span>排行榜</span>
                <span className="text-gray-500">Leaderboard</span>
              </span>
            </span>
            {isGuest && <span className="absolute top-1 right-1 text-xs bg-red-100 text-red-600 px-1 py-0.5 rounded">需登录</span>}
          </Link>
          {showInstallButton && (
            <button 
              onClick={handleInstall} 
              className="p-3 rounded-lg bg-primary-50 hover:bg-primary-100 text-primary-600 transition-colors text-left"
            >
              <span className="flex items-center gap-2">
                <span>安装应用</span>
                <span className="text-primary-500">Install App</span>
              </span>
            </button>
          )}
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSdjIDOY5gif53bOwFd53I_F6IpC40CQl3AE4ROuxiAcfW4Y-g/viewform?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleFeedbackClick}
            className="p-3 rounded-lg hover:bg-gray-100 text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              <span className="flex items-center gap-2">
                <span>反馈</span>
                <span className="text-gray-500">Feedback</span>
              </span>
            </span>
          </a>
        </nav>
      </div>
      <div 
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-50 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
    </div>
  );
};