import { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { articleService, Article } from '../services/articleService';
import { geminiService, GeneratedArticle } from '../services/geminiService';

SyntaxHighlighter.registerLanguage('json', json);

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generationPrompt, setGenerationPrompt] = useState('');
  const [maxLength, setMaxLength] = useState<number>(300);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<GeneratedArticle | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

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

  const handleGenerate = async () => {
    if (!generationPrompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setIsGenerating(true);
      setError(null);
      const generated = await geminiService.generateArticle(generationPrompt, { maxLength });
      setGeneratedArticle(generated);
      setShowConfirmation(true);
    } catch (err) {
      setError('Failed to generate article');
      console.error('Error generating article:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!generatedArticle) return;

    try {
      const newArticle: Article = {
        id: `article-${Date.now()}`,
        title: generatedArticle.title,
        author: "AI生成",
        content: generatedArticle.content,
        tags: generatedArticle.tags,
        quizzes: generatedArticle.quizzes,
        isGenerated: true,
        generatedDate: new Date().toISOString().split('T')[0]
      };

      await articleService.saveArticle(newArticle);
      await loadArticles();
      setGenerationPrompt('');
      setGeneratedArticle(null);
      setShowConfirmation(false);
      setExpandedId(newArticle.id);
    } catch (err) {
      setError('Failed to save article');
      console.error('Error saving article:', err);
    }
  };

  const handleCancelSave = () => {
    setGeneratedArticle(null);
    setShowConfirmation(false);
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

  const handleLengthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setMaxLength(300); // Reset to default
      return;
    }
    setMaxLength(parseInt(value));
  };

  return (
    <div className="app">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Reading Samples</h1>
        
        <div className="generation-form mb-8">
          <div className="input-group">
            <input
              type="text"
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              placeholder="输入主题来生成新文章..."
              className="search-input"
              disabled={isGenerating || showConfirmation}
            />
            <div className="length-input-group">
              <input
                type="number"
                value={maxLength}
                onChange={handleLengthChange}
                min="100"
                max="1000"
                step="50"
                className="length-input-simple"
                disabled={isGenerating || showConfirmation}
              />
              <span className="length-label">字</span>
            </div>
            <button 
              onClick={handleGenerate}
              className="actionButton"
              disabled={isGenerating || showConfirmation}
            >
              {isGenerating ? '生成中...' : '生成文章'}
            </button>
          </div>
        </div>

        {/* Confirmation Dialog */}
        {showConfirmation && generatedArticle && (
          <div className="confirmation-dialog">
            <h2 className="dialog-title">预览生成的文章</h2>
            <div className="preview-content">
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
                {JSON.stringify(generatedArticle, null, 2)}
              </SyntaxHighlighter>
            </div>
            <div className="dialog-actions">
              <button onClick={handleConfirmSave} className="actionButton">
                保存文章
              </button>
              <button onClick={handleCancelSave} className="actionButton cancel">
                取消
              </button>
            </div>
          </div>
        )}

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