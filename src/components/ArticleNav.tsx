import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { articleService, Article } from '../services/articleService';
import styles from './ArticleNav.module.css';

interface ArticleNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArticleNav: React.FC<ArticleNavProps> = ({ isOpen, onClose }) => {
  const [articles, setArticles] = useState<Article[]>([]);
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
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h2>Articles</h2>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        
        <div className={styles.search}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search articles..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.content}>
          {loading && <div className={styles.loading}>Loading articles...</div>}
          {error && <div className={styles.error}>{error}</div>}
          
          {!loading && !error && (
            <div className={styles.articleList}>
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  className={styles.articleItem}
                  onClick={() => handleArticleClick(article.id)}
                >
                  <h3 className={styles.articleTitle}>{article.title}</h3>
                  <div className={styles.articleMeta}>
                    <span className={styles.author}>{article.author}</span>
                    {article.generatedDate && (
                      <span className={styles.date}>{article.generatedDate}</span>
                    )}
                  </div>
                  <div className={styles.tags}>
                    {article.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}; 