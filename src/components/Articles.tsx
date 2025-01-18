import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Articles.module.css';
import { articleService, DatabaseArticle } from '../services/articleService';
import { useAuth } from '../contexts/AuthContext';

export default function Articles() {
  const [articles, setArticles] = useState<DatabaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const fetchedArticles = await articleService.getAllArticles();
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
        <h1>文章列表</h1>
        <button 
          className={styles.createButton}
          onClick={() => navigate('/create-article')}
        >
          创建文章
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
            <div className={styles.tags}>
              {article.tags.map((tag: string, index: number) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <p className={styles.creator}>
              提供者：{article.createdBy || '每日一读'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 