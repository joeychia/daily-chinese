import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Articles.module.css';
import { articleService, DatabaseArticle } from '../services/articleService';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

export default function Articles() {
  const [articles, setArticles] = useState<DatabaseArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [createMethod, setCreateMethod] = useState<'prompt' | 'rewrite' | 'metadata'>('prompt');
  const [generatedPreview, setGeneratedPreview] = useState<DatabaseArticle | null>(null);
  const [articleLength, setArticleLength] = useState<number>(300);
  const [isPrivate, setIsPrivate] = useState(false);
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

  const handleCreateArticle = async () => {
    if (!prompt && !sourceText) return;
    if (!user) return;
    
    setIsGenerating(true);
    try {
      let generatedArticle;
      const options = { maxLength: articleLength };
      
      switch (createMethod) {
        case 'prompt':
          generatedArticle = await geminiService.generateArticle(prompt, options);
          break;
        case 'rewrite':
          generatedArticle = await geminiService.generateFromText(sourceText, options);
          break;
        case 'metadata':
          generatedArticle = await geminiService.generateMetadata(sourceText);
          break;
      }

      if (generatedArticle) {
        const newArticle: DatabaseArticle = {
          id: Date.now().toString(),
          title: generatedArticle.title,
          content: generatedArticle.content,
          author: 'AI助手',
          tags: generatedArticle.tags,
          quizzes: generatedArticle.quizzes,
          isGenerated: true,
          generatedDate: new Date().toISOString(),
          createdBy: user.displayName || user.email || 'Unknown User',
          visibility: 'public'
        };

        setGeneratedPreview(newArticle);
      }
    } catch (error) {
      console.error('Error generating article:', error);
      setError('Failed to generate article');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmSave = async () => {
    if (!generatedPreview || !user) return;
    
    try {
      const articleToSave = {
        ...generatedPreview,
        visibility: isPrivate ? user.id : 'public'
      };
      await articleService.createArticle(articleToSave);
      await loadArticles();
      setShowCreateModal(false);
      setPrompt('');
      setSourceText('');
      setGeneratedPreview(null);
      setIsPrivate(false);
    } catch (error) {
      console.error('Error saving article:', error);
      setError('Failed to save article');
    }
  };

  const handleCancelSave = () => {
    setGeneratedPreview(null);
    setIsPrivate(false);
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
          onClick={() => setShowCreateModal(true)}
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

      {showCreateModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            {!generatedPreview ? (
              <>
                <h2>创建文章</h2>
                <div className={styles.methodSelector}>
                  <button
                    className={`${styles.methodButton} ${createMethod === 'prompt' ? styles.active : ''}`}
                    onClick={() => setCreateMethod('prompt')}
                  >
                    从提示词创建文章
                  </button>
                  <button
                    className={`${styles.methodButton} ${createMethod === 'rewrite' ? styles.active : ''}`}
                    onClick={() => setCreateMethod('rewrite')}
                  >
                    改写文章生成测验
                  </button>
                  <button
                    className={`${styles.methodButton} ${createMethod === 'metadata' ? styles.active : ''}`}
                    onClick={() => setCreateMethod('metadata')}
                  >
                    保留原文生成测验
                  </button>
                </div>

                {createMethod !== 'metadata' && (
                  <div className={styles.lengthSelector}>
                    <label htmlFor="articleLength">文章长度：</label>
                    <div className={styles.lengthControl}>
                      <button
                        className={styles.lengthButton}
                        onClick={() => setArticleLength(prev => Math.max(50, prev - 50))}
                      >
                        -
                      </button>
                      <input
                        id="articleLength"
                        type="number"
                        value={articleLength}
                        readOnly
                        className={styles.lengthInput}
                      />
                      <button
                        className={styles.lengthButton}
                        onClick={() => setArticleLength(prev => Math.min(1000, prev + 50))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}

                {createMethod === 'prompt' ? (
                  <textarea
                    placeholder="输入提示词..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className={styles.textInput}
                  />
                ) : (
                  <textarea
                    placeholder="输入原文..."
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    className={styles.textInput}
                  />
                )}

                <div className={styles.modalActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setShowCreateModal(false)}
                  >
                    取消
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={handleCreateArticle}
                    disabled={isGenerating || (!prompt && !sourceText)}
                  >
                    {isGenerating ? '生成中...' : '生成'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>预览文章</h2>
                <div className={styles.preview}>
                  <h3>{generatedPreview.title}</h3>
                  <div className={styles.tags}>
                    {generatedPreview.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <div className={styles.previewContent}>
                    {generatedPreview.content}
                  </div>
                  <div className={styles.quizPreview}>
                    <h4>测验题目</h4>
                    {generatedPreview.quizzes.map((quiz, index) => (
                      <div key={index} className={styles.quizItem}>
                        <p>{quiz.question}</p>
                        <ul>
                          {quiz.options.map((option, optIndex) => (
                            <li key={optIndex} className={optIndex === quiz.correctAnswer ? styles.correctOption : ''}>
                              {option}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.visibilityControl}>
                  <label>
                    <input
                      type="checkbox"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                    />
                    仅对我可见
                  </label>
                </div>
                <div className={styles.modalActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={handleCancelSave}
                  >
                    重新生成
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={handleConfirmSave}
                  >
                    保存文章
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 