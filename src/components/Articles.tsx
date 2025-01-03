import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Articles.module.css';
import { articleService, DatabaseArticle } from '../services/articleService';

export default function Articles() {
  const [articles, setArticles] = useState<DatabaseArticle[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const fetchedArticles = await articleService.getAllArticles();
      setArticles(fetchedArticles);
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

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredArticles = articles.filter(article => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      article.title.toLowerCase().includes(searchTermLower) ||
      article.author.toLowerCase().includes(searchTermLower) ||
      article.content.toLowerCase().includes(searchTermLower) ||
      article.tags.some(tag => tag.toLowerCase().includes(searchTermLower))
    );
  });

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
        <input
          type="text"
          placeholder="搜索文章..."
          value={searchTerm}
          onChange={handleSearch}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.articleGrid}>
        {filteredArticles.map(article => (
          <div
            key={article.id}
            className={styles.articleCard}
            onClick={() => handleArticleClick(article.id)}
          >
            <h2>{article.title}</h2>
            <p className={styles.author}>作者：{article.author}</p>
            <div className={styles.tags}>
              {article.tags.map((tag: string, index: number) => (
                <span key={index} className={styles.tag}>
                  {tag}
                </span>
              ))}
            </div>
            <p className={styles.preview}>
              {article.content.slice(0, 100)}...
            </p>
          </div>
        ))}
      </div>
    </div>
  );
} 