import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArticleIndex, articleService } from '../services/articleService';
import { useAuth } from '../contexts/AuthContext';
import { userDataService } from '../services/userDataService';

export default function Articles() {
  const [articles, setArticles] = useState<ArticleIndex[]>([]);
  const [readStatus, setReadStatus] = useState<Record<string, boolean>>({});
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

      // Fetch read status for all visible articles
      if (user) {
        const readStatusMap: Record<string, boolean> = {};
        await Promise.all(
          visibleArticles.map(async (article) => {
            readStatusMap[article.id] = await userDataService.hasReadArticle(user.id, article.id);
          })
        );
        setReadStatus(readStatusMap);
      }

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
    return <div className="flex justify-center items-center min-h-screen text-blue-600 font-medium">Loading articles...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center p-4 font-medium rounded-lg bg-red-50 mx-auto mt-4 max-w-md">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 py-6 px-2">
      <div className="flex items-center justify-between mb-6">
      <button 
          onClick={() => navigate(-1)} 
          className="text-gray-600 hover:text-gray-800 bg-transparent transition-colors flex items-center gap-2"
        >
          <span>←</span>
        </button>
        <h1 className="text-center flex-1 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-800">文章列表</span>
          <span className="text-sm text-blue-600">Article List</span>
        </h1>
        <button 
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-md hover:shadow-lg hover:translate-y-[-1px] transition-all duration-200 flex flex-col items-center text-sm"
          onClick={() => navigate('/create-article')}
        >
          <span>创建文章</span>
          <span className="text-xs">Create Article</span>
        </button>
      </div>

      <div className="my-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 px-4 pb-8 overflow-y-auto flex-1">
        {articles.map(article => (
          <div
            key={article.id}
            className={`bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer border border-blue-100 hover:border-blue-300 hover:translate-y-[-2px] relative ${readStatus[article.id] ? 'bg-opacity-75' : ''}`}
            onClick={() => handleArticleClick(article.id)}
          >
            <h2 className="text-base font-medium text-blue-900 line-clamp-2 mb-3">{article.title}</h2>
            <div className="flex items-center justify-between">
              <div className="text-amber-400 text-sm">
                {[...Array(Number(article.difficultyLevel) || 0)].map((_, i) => (
                  <span key={i} className="mr-0.5">★</span>
                ))}
                {[...Array(5 - (Number(article.difficultyLevel) || 0))].map((_, i) => (
                  <span key={i} className="mr-0.5 opacity-30">★</span>
                ))}
              </div>
              {readStatus[article.id] && (
                <div className="text-emerald-500 text-lg" title="Already read">✓</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}