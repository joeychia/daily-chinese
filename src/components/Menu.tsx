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
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
    onClose();
  };

  const handleHomeClick = () => {
    navigate('/');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>菜单</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div className={styles.userSection}>
          <UserMenu />
        </div>
        
        <div className={styles.menuItems}>
          <div className={styles.menuItem} onClick={handleHomeClick}>
            阅读
          </div>
          <div className={styles.menuItem} onClick={() => { navigate('/articles'); onClose(); }}>
            文章列表
          </div>
          <div className={styles.menuItem} onClick={() => { navigate('/wordbank'); onClose(); }}>
            我的生词本
          </div>
        </div>
        
        <div className={styles.search}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索文章..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.content}>
          {loading && <div className={styles.loading}>加载中...</div>}
          {error && <div className={styles.error}>{error}</div>}
          
          {!loading && !error && (
            <div className={styles.articleList}>
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  className={styles.articleItem}
                  onClick={() => handleArticleClick(article.id)}
                >
                  <div className={styles.articleTitle}>{article.title}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}; 