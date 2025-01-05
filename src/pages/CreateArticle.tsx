import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateArticle.module.css';
import { articleService, DatabaseArticle } from '../services/articleService';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';

type Step = 'mode' | 'input' | 'preview' | 'save';

export default function CreateArticle() {
  const [currentStep, setCurrentStep] = useState<Step>('mode');
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [createMethod, setCreateMethod] = useState<'prompt' | 'rewrite' | 'metadata'>('prompt');
  const [generatedPreview, setGeneratedPreview] = useState<DatabaseArticle | null>(null);
  const [articleLength, setArticleLength] = useState<number>(300);
  const [isPrivate, setIsPrivate] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

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
        setCurrentStep('preview');
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
      navigate('/articles');
    } catch (error) {
      console.error('Error saving article:', error);
      setError('Failed to save article');
    }
  };

  const handleCancel = () => {
    navigate('/articles');
  };

  const handleCancelSave = () => {
    setGeneratedPreview(null);
    setIsPrivate(false);
    setCurrentStep('input');
  };

  const handleMethodSelect = (method: 'prompt' | 'rewrite' | 'metadata') => {
    setCreateMethod(method);
    setCurrentStep('input');
  };

  const renderStepIndicator = () => (
    <div className={styles.stepIndicator}>
      <div className={`${styles.step} ${currentStep === 'mode' ? styles.active : ''}`} data-number="1">
        选择创建方式
      </div>
      <div className={`${styles.step} ${currentStep === 'input' ? styles.active : ''}`} data-number="2">
        输入内容
      </div>
      <div className={`${styles.step} ${currentStep === 'preview' ? styles.active : ''}`} data-number="3">
        预览文章
      </div>
      <div className={`${styles.step} ${currentStep === 'save' ? styles.active : ''}`} data-number="4">
        保存
      </div>
    </div>
  );

  const renderModeSelection = () => (
    <div className={styles.methodSelector}>
      <button
        className={`${styles.methodButton} ${createMethod === 'prompt' ? styles.active : ''}`}
        onClick={() => handleMethodSelect('prompt')}
      >
        从提示词创建文章
      </button>
      <button
        className={`${styles.methodButton} ${createMethod === 'rewrite' ? styles.active : ''}`}
        onClick={() => handleMethodSelect('rewrite')}
      >
        改写文章生成测验
      </button>
      <button
        className={`${styles.methodButton} ${createMethod === 'metadata' ? styles.active : ''}`}
        onClick={() => handleMethodSelect('metadata')}
      >
        保留原文生成测验
      </button>
    </div>
  );

  const renderInputStep = () => (
    <>
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
    </>
  );

  const renderPreviewStep = () => (
    <>
      <div className={styles.preview}>
        <h3>{generatedPreview?.title}</h3>
        <div className={styles.tags}>
          {generatedPreview?.tags.map((tag, index) => (
            <span key={index} className={styles.tag}>{tag}</span>
          ))}
        </div>
        <div className={styles.previewContent}>
          {generatedPreview?.content}
        </div>
        <div className={styles.quizPreview}>
          <h4>测验题目</h4>
          {generatedPreview?.quizzes.map((quiz, index) => (
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
    </>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'mode':
        return renderModeSelection();
      case 'input':
        return renderInputStep();
      case 'preview':
      case 'save':
        return renderPreviewStep();
    }
  };

  const renderActions = () => {
    switch (currentStep) {
      case 'mode':
        return (
          <button className={styles.cancelButton} onClick={handleCancel}>
            取消
          </button>
        );
      case 'input':
        return (
          <>
            <button className={styles.cancelButton} onClick={() => setCurrentStep('mode')}>
              上一步
            </button>
            <button
              className={styles.submitButton}
              onClick={handleCreateArticle}
              disabled={isGenerating || (!prompt && !sourceText)}
            >
              {isGenerating ? '生成中...' : '生成'}
            </button>
          </>
        );
      case 'preview':
        return (
          <>
            <button className={styles.cancelButton} onClick={handleCancelSave}>
              重新生成
            </button>
            <button className={styles.submitButton} onClick={handleConfirmSave}>
              保存文章
            </button>
          </>
        );
    }
  };

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>创建文章</h1>
        {renderStepIndicator()}
      </div>
      <div className={styles.content}>
        {renderStepContent()}
      </div>
      <div className={styles.actions}>
        {renderActions()}
      </div>
    </div>
  );
} 