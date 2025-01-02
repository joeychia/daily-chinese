import { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { articleService, Article } from '../services/articleService';

SyntaxHighlighter.registerLanguage('json', json);

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      const data = await articleService.getAllArticles();
      setArticles(data);
      setError(null);
    } catch (err) {
      setError('Failed to load articles');
      console.error('Error loading articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadArticles();
      return;
    }

    try {
      setIsLoading(true);
      let results = await articleService.searchByTag(searchTerm);
      if (results.length === 0) {
        results = await articleService.searchByTitle(searchTerm);
      }
      setArticles(results);
      setError(null);
    } catch (err) {
      setError('Search failed');
      console.error('Error searching articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="app">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Reading Samples</h1>
        
        <div className="search-bar mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索标题或标签..."
            className="search-input"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch} className="actionButton">
            搜索
          </button>
        </div>

        {isLoading && <div className="loading">Loading...</div>}
        {error && <div className="error">{error}</div>}
        
        <div className="grid gap-4">
          {articles.map((article) => (
            <div 
              key={article.id} 
              className="article-card"
              onClick={() => toggleExpand(article.id)}
            >
              <div className="article-header">
                <div className="article-info">
                  <h2 className="article-title">{article.title}</h2>
                  {article.generatedDate && (
                    <span className="article-date">{article.generatedDate}</span>
                  )}
                </div>
                <div className="article-tags">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="tag"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm(tag);
                        handleSearch();
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              {expandedId === article.id && (
                <div className="article-content">
                  <div className="article-actions">
                    <button
                      onClick={(e) => handleCopy(JSON.stringify(article, null, 2), article.id, e)}
                      className="actionButton"
                    >
                      {copiedId === article.id ? '已复制!' : '复制 JSON'}
                    </button>
                  </div>
                  <SyntaxHighlighter
                    language="json"
                    style={atomOneDark}
                    customStyle={{
                      margin: 0,
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      fontSize: '0.9rem',
                      backgroundColor: '#1e1e1e'
                    }}
                  >
                    {JSON.stringify(article, null, 2)}
                  </SyntaxHighlighter>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Articles; 