import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { articleService } from '../services/articleService';
import type { DatabaseArticle } from '../services/articleService';
import { UserMenu } from './UserMenu';
import styles from './Menu.module.css';

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Menu: React.FC<MenuProps> = ({ isOpen, onClose }) => {
  const [articles, setArticles] = useState<DatabaseArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        const loadedArticles = await articleService.getAllArticles();
        setArticles(loadedArticles);
        setError(null);
      } catch (err) {
        console.error('Error loading articles:', err);
        setError('Failed to load articles');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadArticles();
    }
  }, [isOpen]);

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
    onClose();
  };

  const handleHomeClick = () => {
    navigate('/', { replace: true });
    onClose();
  };

  const handleArticlesClick = () => {
    navigate('/articles');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <div className={styles.logoSection}>
            <img src={`${import.meta.env.BASE_URL}rooster.png`} alt="Logo" className={styles.logo} />
            <h2>每日一读</h2>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.menuItems}>
          <div className={styles.menuItem} onClick={handleArticlesClick}>
            文章列表
          </div>
          <div className={styles.menuItem} onClick={() => navigate('/progress')}>
            学习进度
          </div>
          <div className={styles.menuItem} onClick={() => navigate('/wordbank')}>
            我的生词本
          </div>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSdjIDOY5gif53bOwFd53I_F6IpC40CQl3AE4ROuxiAcfW4Y-g/viewform?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.menuItem}
          >
            反馈
          </a>
        </div>
        <div className={styles.content}>
          {loading ? (
            <div className={styles.loading}>加载中...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <div className={styles.articleList}>
              {articles.map(article => (
                <div
                  key={article.id}
                  className={styles.articleItem}
                  onClick={() => handleArticleClick(article.id)}
                >
                  <span className={styles.articleTitle}>{article.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <UserMenu />
      </div>
    </>
  );
}; 