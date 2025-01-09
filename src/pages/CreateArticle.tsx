/**
 * CreateArticle Feature Requirements
 * 
 * Purpose:
 * Provides an interface for creating Chinese reading articles with various generation methods,
 * customization options, and quiz generation.
 * 
 * Core Features:
 * 1. Multiple Creation Methods:
 *    - Prompt-based generation (从提示词创建)
 *    - Article rewriting (改写文章生成测试)
 *    - Metadata generation (使用原文生成测试)
 *    - Word bank-based generation (从生词本创建)
 * 
 * 2. Article Configuration:
 *    - Customizable article length (100-1000 characters)
 *    - Visibility control (public/private)
 * 
 * 3. Word Bank Integration:
 *    - Select up to 10 words from personal word bank
 *    - Random word selection
 *    - Custom prompt with selected words
 * 
 * 4. Step-by-Step Creation Process:
 *    - Mode selection
 *    - Content input
 *    - Preview
 *    - Save
 * 
 * 5. Preview Features:
 *    - Title preview
 *    - Content preview
 *    - Tag display
 *    - Quiz preview with correct answers
 * 
 * Technical Requirements:
 * - Input validation and length constraints
 * - Accessibility support
 * - Real-time preview
 * - Firebase integration for storage
 * - Authentication integration
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CreateArticle.module.css';
import { articleService, DatabaseArticle } from '../services/articleService';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { getWordBank } from '../services/userDataService';
import { ChineseWord } from '../types/reading';
import WordSelectionModal from '../components/WordSelectionModal';

type Step = 'mode' | 'input' | 'preview' | 'save';
type CreateMethod = 'prompt' | 'rewrite' | 'metadata' | 'wordbank';

export default function CreateArticle() {
  const [currentStep, setCurrentStep] = useState<Step>('mode');
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [createMethod, setCreateMethod] = useState<CreateMethod>('prompt');
  const [generatedPreview, setGeneratedPreview] = useState<DatabaseArticle | null>(null);
  const [articleLength, setArticleLength] = useState<number>(300);
  const [isPrivate, setIsPrivate] = useState(false);
  const [selectedWords, setSelectedWords] = useState<ChineseWord[]>([]);
  const [wordBank, setWordBank] = useState<ChineseWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadWordBank = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const words = await getWordBank(user.id);
        setWordBank(words);
        if (createMethod === 'wordbank') {
          const shuffled = [...words].sort(() => 0.5 - Math.random());
          setSelectedWords(shuffled.slice(0, 5));
        }
      } catch (err) {
        console.error('Error loading word bank:', err);
        setError('加载生词本失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadWordBank();
  }, [user, createMethod]);

  const handleCreateArticle = async () => {
    if (!user) return;
    if (createMethod === 'wordbank' && selectedWords.length === 0) {
      setError('请至少选择一个词');
      return;
    }
    
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
        case 'wordbank': {
          const wordsText = selectedWords.map(word => word.characters).join('、');
          let wordbankPrompt = `请创建一篇文章，要求自然地运用以下词语：${wordsText}。`;
          if (prompt.trim()) {
            wordbankPrompt += ` 额外要求：${prompt.trim()}`;
          }
          generatedArticle = await geminiService.generateArticle(wordbankPrompt, options);
          break;
        }
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
          visibility: isPrivate ? user.id : 'public'
        };

        setGeneratedPreview(newArticle);
        setCurrentStep('preview');
      }
    } catch (error) {
      console.error('Error generating article:', error);
      setError('生成文章失败，请重试');
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

  const handleMethodSelect = (method: CreateMethod) => {
    setCreateMethod(method);
    setCurrentStep('input');
    setError(null);
    setSelectedWords([]);
  };

  const toggleWordSelection = (word: ChineseWord) => {
    setSelectedWords(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word);
      }
      if (prev.length >= 10) {
        setError('最多只能选择10个词');
        return prev;
      }
      return [...prev, word];
    });
  };

  const handleRandomSelection = () => {
    const shuffled = [...wordBank].sort(() => 0.5 - Math.random());
    setSelectedWords(shuffled.slice(0, 5));
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
    <div className={styles.modeSelection}>
      <h2>选择创建方式</h2>
      <div className={styles.modeButtons}>
        <button onClick={() => handleMethodSelect('prompt')}>
          从提示词创建
        </button>
        <button onClick={() => handleMethodSelect('rewrite')}>
          改写文章生成测试
        </button>
        <button onClick={() => handleMethodSelect('metadata')}>
          使用原文生成测试
        </button>
        <button onClick={() => handleMethodSelect('wordbank')}>
          从生词本创建
        </button>
      </div>
    </div>
  );

  const renderSelectedWords = () => {
    if (selectedWords.length === 0) return null;

    return (
      <div className={styles.selectedWordsSection}>
        <div className={styles.selectedWordsHeader}>
          <h4>随机生词</h4>
          <button onClick={() => setIsModalOpen(true)} className={styles.selectMoreButton}>
            选择生词 ({selectedWords.length}/10)
          </button>
        </div>
        <div className={styles.selectedWordsList}>
          {selectedWords.map((word) => (
            <div key={word.characters} className={styles.selectedWordItem}>
              {word.characters}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInputStep = () => (
    <div className={styles.inputStep}>
      {createMethod === 'wordbank' && (
        <>
          {renderSelectedWords()}
          <div className={styles.inputGroup}>
            <label>输入提示词（可选）：</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="可以输入额外的要求，比如文章主题、风格等..."
            />
          </div>
        </>
      )}
      {createMethod === 'prompt' && (
        <div className={styles.inputGroup}>
          <label>输入提示词：</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入提示词..."
          />
        </div>
      )}
      {(createMethod === 'rewrite' || createMethod === 'metadata') && (
        <div className={styles.inputGroup}>
          <label>输入原文：</label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="请输入要处理的文章..."
          />
        </div>
      )}
      {createMethod !== 'metadata' && (
        <div className={styles.inputGroup}>
          <label htmlFor="articleLength">文章长度（字数）：</label>
          <input
            id="articleLength"
            type="number"
            value={articleLength}
            onChange={(e) => {
              const value = Number(e.target.value);
              if (value < 100) {
                setArticleLength(100);
              } else if (value > 1000) {
                setArticleLength(1000);
              } else {
                setArticleLength(value);
              }
            }}
            min={100}
            max={1000}
            aria-label="文章长度（字数）："
          />
        </div>
      )}
    </div>
  );

  const renderPreviewStep = () => (
    <>
      <div className={styles.preview}>
        <h3>{generatedPreview?.title}</h3>
        <div className={styles.previewContent}>
          {generatedPreview?.content}
        </div>
        <div className={styles.quizPreview}>
          <h4>测验题目</h4>
          <div className={styles.quizList}>
            {generatedPreview?.quizzes.map((quiz, index) => (
              <div key={index} className={styles.quizItem}>
                <div className={styles.quizQuestion}>
                  <span className={styles.questionNumber}>问题 {index + 1}:</span>
                  <p>{quiz.question}</p>
                </div>
                <ul className={styles.quizOptions}>
                  {quiz.options.map((option, optIndex) => (
                    <li 
                      key={optIndex} 
                      className={`${styles.option} ${optIndex === quiz.correctAnswer ? styles.correctOption : ''}`}
                    >
                      <span className={styles.optionLabel}>{String.fromCharCode(65 + optIndex)}.</span>
                      {option}
                      {optIndex === quiz.correctAnswer && (
                        <span className={styles.correctMark}>✓</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
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
      <WordSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        words={wordBank}
        selectedWords={selectedWords}
        onWordSelect={toggleWordSelection}
      />
    </div>
  );
} 