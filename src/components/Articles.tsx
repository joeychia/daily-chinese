import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Articles.module.css';
import { ArticleIndex, articleService } from '../services/articleService';
import { useAuth } from '../contexts/AuthContext';

export default function Articles() {
  const [articles, setArticles] = useState<ArticleIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const fetchedArticles = await articleService.getArticleIndex();
      const visibleArticles = fetchedArticles.filter(article => 
        !article.visibility ||
        article.visibility === 'public' || 
        article.visibility === user?.id
      );
      setArticles(visibleArticles);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading articles:', error);
      setError('Failed to load articles');
      setIsLoading(false);
    }
  };

  const handleArticleClick = (articleId: string) => {
    navigate(`/article/${articleId}`);
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading articles...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate(-1)}
        >
          ←
        </button>
        <h1>
          文章列表
          <span className={styles.englishLabel}>Article List</span>
        </h1>
        <button 
          className={styles.createButton}
          onClick={() => navigate('/create-article')}
        >
          创建文章
          <span className={styles.englishLabel}>Create Article</span>
        </button>
      </div>

      <div className={styles.articleGrid}>
        {articles.map(article => (
          <div
            key={article.id}
            className={styles.articleCard}
            onClick={() => handleArticleClick(article.id)}
          >
            <h2>{article.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}