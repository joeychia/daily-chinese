import { useState, useEffect } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { articleService, Article } from '../services/articleService';
import { geminiService } from '../services/geminiService';

SyntaxHighlighter.registerLanguage('json', json);

type GenerationMode = 'prompt' | 'text' | 'original';

const Articles = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [prompt, setPrompt] = useState('');
  const [maxLength, setMaxLength] = useState(300);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedArticle, setGeneratedArticle] = useState<Article | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [generationMode, setGenerationMode] = useState<GenerationMode>('prompt');

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      const loadedArticles = await articleService.getAllArticles();
      setArticles(loadedArticles);
      setError(null);
    } catch (err) {
      setError('Failed to load articles');
      console.error('Error loading articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      let article;
      if (generationMode === 'prompt') {
        article = await geminiService.generateArticle(prompt, { maxLength });
      } else if (generationMode === 'text') {
        article = await geminiService.generateFromText(sourceText, { maxLength });
      } else {
        // Original mode
        article = await geminiService.generateMetadata(sourceText);
      }
      
      const newArticle: Article = {
        ...article,
        id: `article-${Date.now()}`,
        author: generationMode === 'original' ? "原文" : "AI生成",
        isGenerated: generationMode !== 'original',
        generatedDate: new Date().toISOString().split('T')[0],
      };
      
      setGeneratedArticle(newArticle);
      setShowConfirmation(true);
    } catch (err) {
      setError('Failed to generate article');
      console.error('Error generating article:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirm = async () => {
    if (!generatedArticle) return;
    
    try {
      await articleService.saveArticle(generatedArticle);
      setArticles([generatedArticle, ...articles]);
      setShowConfirmation(false);
      setGeneratedArticle(null);
      setPrompt('');
      setSourceText('');
      setError(null);
    } catch (err) {
      setError('Failed to save article');
      console.error('Error saving article:', err);
    }
  };

  const handleEdit = (article: Article) => {
    setEditingId(article.id);
    setEditingContent(JSON.stringify(article, null, 2));
  };

  const handleSaveEdit = async (id: string) => {
    try {
      const updatedArticle = JSON.parse(editingContent);
      await articleService.saveArticle(updatedArticle);
      setArticles(articles.map(a => a.id === id ? updatedArticle : a));
      setEditingId(null);
      setEditingContent('');
      setError(null);
    } catch (err) {
      setError('Failed to save changes');
      console.error('Error saving changes:', err);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingContent('');
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="articles-page">
      <div className="articles-container">
        <div className="articles-header">
          <h1>Reading Samples</h1>
          <p className="articles-subtitle">Generate and manage Chinese reading articles</p>
        </div>

        <div className="articles-generation-panel">
          <div className="articles-panel-header">
            <h2>Generate New Article</h2>
          </div>
          <div className="articles-generation-content">
            <div className="articles-generation-mode">
              <button
                className={`articles-mode-button ${generationMode === 'prompt' ? 'active' : ''}`}
                onClick={() => setGenerationMode('prompt')}
              >
                Generate from Prompt
              </button>
              <button
                className={`articles-mode-button ${generationMode === 'text' ? 'active' : ''}`}
                onClick={() => setGenerationMode('text')}
              >
                Generate from Text
              </button>
              <button
                className={`articles-mode-button ${generationMode === 'original' ? 'active' : ''}`}
                onClick={() => setGenerationMode('original')}
              >
                Use Original Text
              </button>
            </div>

            {generationMode === 'prompt' ? (
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a topic or prompt for the article..."
                className="articles-search-input"
                disabled={isGenerating || showConfirmation}
              />
            ) : (
              <textarea
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                placeholder={generationMode === 'original' 
                  ? "Paste the original text here. The text will be kept as is, and we'll generate title, tags, and quizzes for it..."
                  : "Paste the source text here..."
                }
                className="articles-source-text-input"
                disabled={isGenerating || showConfirmation}
              />
            )}

            <div className="articles-generation-controls">
              {generationMode !== 'original' && (
                <input
                  type="number"
                  value={maxLength}
                  onChange={(e) => setMaxLength(parseInt(e.target.value))}
                  min="100"
                  max="1000"
                  step="50"
                  className="articles-length-input"
                  disabled={isGenerating || showConfirmation}
                />
              )}
              <button
                className="articles-primary-button"
                onClick={handleGenerate}
                disabled={isGenerating || showConfirmation || (!prompt && !sourceText)}
              >
                {isGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>

        {showConfirmation && generatedArticle && (
          <div className="articles-preview-panel">
            <div className="articles-panel-header">
              <h2>Preview Generated Article</h2>
            </div>
            <div className="articles-generation-content">
              <SyntaxHighlighter
                language="json"
                style={atomOneDark}
                customStyle={{ margin: 0, borderRadius: '0.5rem' }}
              >
                {JSON.stringify(generatedArticle, null, 2)}
              </SyntaxHighlighter>
              <div className="articles-generation-controls">
                <button className="articles-secondary-button" onClick={() => setShowConfirmation(false)}>
                  Cancel
                </button>
                <button className="articles-primary-button" onClick={handleConfirm}>
                  Save Article
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="articles-list-panel">
          <div className="articles-panel-header">
            <h2>Saved Articles</h2>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or tag..."
              className="articles-search-input"
            />
          </div>

          {loading && <div className="articles-loading">Loading articles...</div>}
          {error && <div className="articles-error-message">{error}</div>}

          <div className="articles-grid">
            {filteredArticles.map((article) => (
              <div key={article.id} className="articles-card">
                <div className="articles-panel-header">
                  <div>
                    <h2 className="articles-title">{article.title}</h2>
                    <div className="articles-tags">
                      {article.tags.map((tag, index) => (
                        <span key={index} className="articles-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="articles-actions">
                    {editingId === article.id ? (
                      <>
                        <button
                          className="articles-secondary-button small"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>
                        <button
                          className="articles-primary-button small"
                          onClick={() => handleSaveEdit(article.id)}
                        >
                          Save
                        </button>
                      </>
                    ) : (
                      <button
                        className="articles-secondary-button small"
                        onClick={() => handleEdit(article)}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                <div className="articles-content">
                  {editingId === article.id ? (
                    <textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="articles-json-editor"
                    />
                  ) : (
                    <SyntaxHighlighter
                      language="json"
                      style={atomOneDark}
                      customStyle={{ margin: 0, borderRadius: '0.5rem' }}
                    >
                      {JSON.stringify(article, null, 2)}
                    </SyntaxHighlighter>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Articles; 