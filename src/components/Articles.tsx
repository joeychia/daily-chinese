import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    return <div className="flex justify-center items-center min-h-screen text-gray-600">Loading articles...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 bg-gray-900 min-h-screen flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <button
          className="flex items-center justify-center w-8 h-8 bg-transparent text-gray-300 hover:text-white text-xl transition-colors"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          ←
        </button>
        <h1 className="text-center flex-1 flex flex-col items-center">
          <span className="text-xl font-bold text-white">文章列表</span>
          <span className="text-xs text-gray-400">Article List</span>
        </h1>
        <button 
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex flex-col items-center text-sm"
          onClick={() => navigate('/create-article')}
        >
          <span>创建文章</span>
          <span className="text-xs">Create Article</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 px-2 overflow-y-auto flex-1">
        {articles.map(article => (
          <div
            key={article.id}
            className="bg-gray-800 p-3 rounded-md shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-700 hover:bg-gray-700"
            onClick={() => handleArticleClick(article.id)}
          >
            <h2 className="text-base font-medium text-white line-clamp-2">{article.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}