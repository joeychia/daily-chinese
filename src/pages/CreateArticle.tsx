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
 *    - Select up to 5 words from personal word bank
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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { articleService, DatabaseArticle } from '../services/articleService';
import { geminiService } from '../services/geminiService';
import { useAuth } from '../contexts/AuthContext';
import { getWordBank } from '../services/userDataService';
import { ChineseWord } from '../types/reading';
import WordSelectionModal from '../components/WordSelectionModal';
import { rewardsService } from '../services/rewardsService';
import { analyzeArticleDifficulty } from '../utils/articleDifficulty';
import { DifficultyDisplay } from '../components/DifficultyDisplay';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [editableQuizzes, setEditableQuizzes] = useState(generatedPreview?.quizzes || []);

  useEffect(() => {
    const loadWordBank = async () => {
      if (!user) return;
      
      try {
        const words = await getWordBank(user.id);
        setWordBank(words);
        if (createMethod === 'wordbank') {
          const shuffled = [...words].sort(() => 0.5 - Math.random());
          setSelectedWords(shuffled.slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading word bank:', err);
        setError('加载生词本失败');
      }
    };

    loadWordBank();
  }, [user, createMethod]);

  useEffect(() => {
    if (generatedPreview) {
      setEditableQuizzes(generatedPreview.quizzes);
    }
  }, [generatedPreview]);

  const handleQuizChange = (quizIndex: number, field: string | number, value: string | number) => {
    if (typeof field === 'string' && field === 'correctAnswer' && typeof value === 'number') {
      setEditableQuizzes(prevQuizzes => {
        const updatedQuizzes = [...prevQuizzes];
        updatedQuizzes[quizIndex].correctAnswer = value;
        return updatedQuizzes;
      });
    } else if (typeof field === 'number') {
      setEditableQuizzes(prevQuizzes => {
        const updatedQuizzes = [...prevQuizzes];
        updatedQuizzes[quizIndex].options[field] = value as string;
        return updatedQuizzes;
      });
    }
  };

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
        const difficulty = analyzeArticleDifficulty(generatedArticle.content);
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
          visibility: isPrivate ? user.id : 'public',
          characterLevels: difficulty.levelDistribution,
          difficultyLevel: difficulty.difficultyLevel
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

      await articleService.createArticle(generatedPreview);
      await rewardsService.addPoints(user.id, 20, 'creation');
      navigate(`/article/${generatedPreview.id}`);
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
    setIsPrivate(method === 'wordbank');
  };

  const toggleWordSelection = (word: ChineseWord) => {
    setSelectedWords(prev => {
      if (prev.includes(word)) {
        return prev.filter(w => w !== word);
      }
      if (prev.length >= 5) {
        setError('5');
        return prev;
      }
      return [...prev, word];
    });
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between items-center my-0 px-0 relative">
      {/* Progress line */}
      <div className="absolute top-4 left-0 h-0.5 bg-gray-200 w-full -z-10" />
      <div className="absolute top-4 left-0 h-0.5 bg-blue-500 transition-all duration-300 -z-10" style={{
        width: currentStep === 'mode' ? '0%' :
               currentStep === 'input' ? '33%' :
               currentStep === 'preview' ? '66%' : '100%'
      }} />

      {/* Steps */}
      {[
        { key: 'mode', label: '选择', subLabel: 'Mode', number: 1 },
        { key: 'input', label: '输入', subLabel: 'Input', number: 2 },
        { key: 'preview', label: '预览', subLabel: 'Preview', number: 3 },
        { key: 'save', label: '保存', subLabel: 'Save', number: 4 }
      ].map((step) => (
        <div key={step.key} className="flex flex-col items-center relative">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm
            transition-all duration-300 mb-1
            ${currentStep === step.key
              ? 'bg-blue-500 text-white'
              : currentStep === 'save' || 
                (currentStep === 'preview' && step.key !== 'save') || 
                (currentStep === 'input' && (step.key === 'mode' || step.key === 'input'))
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-400 border border-gray-300'}`}>
            {step.number}
          </div>
          <div className={`text-xs font-medium text-center transition-colors duration-300
            ${currentStep === step.key ? 'text-blue-600' : 'text-gray-500'}`}>
            {step.label}
            <span className="block text-[10px] text-gray-400">{step.subLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );

  const renderModeSelection = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-yellow-200">


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button onClick={() => handleMethodSelect('prompt')} className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl p-4 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-300">
          <div className="block text-base font-medium">从提示词创建</div>
          <div className="block text-sm text-gray-100 mt-1">Create from Prompt</div>
        </button>
        <button onClick={() => handleMethodSelect('rewrite')} className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl p-4 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-300">
          <div className="block text-base font-medium">改写文章生成测试</div>
          <div className="block text-sm text-gray-100 mt-1">Rewrite and Generate Quiz</div>
        </button>
        <button onClick={() => handleMethodSelect('metadata')} className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl p-4 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-300">
          <div className="block text-base font-medium">使用原文生成测试</div>
          <div className="block text-sm text-gray-100 mt-1">Generate Quiz</div>
        </button>
        <button onClick={() => handleMethodSelect('wordbank')} className="bg-gradient-to-r from-blue-400 to-purple-400 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl p-4 transition-all duration-200 transform hover:scale-105 shadow-lg border-2 border-blue-300">
          <div className="block text-base font-medium">从生词本创建</div>
          <div className="block text-sm text-gray-100 mt-1">Create from Word Bank</div>
        </button>
      </div>
    </div>
  );

  const renderSelectedWords = () => {
    if (selectedWords.length === 0) return null;

    return (
      <div className="mb-6 bg-gradient-to-r from-green-200 to-teal-200 rounded-xl p-4 border-2 border-green-300 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h4 className="block text-gray-600 text-left">
            随机生词
            <span className="block text-sm text-gray-500 mt-1">Random Words</span>
          </h4>
          <button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-teal-400 to-green-400 hover:from-teal-500 hover:to-green-500 text-white px-4 py-2 rounded-xl transition-colors duration-200 shadow-md border-2 border-teal-300">
            选择生词 ({selectedWords.length}/5)
            <span className="block text-sm text-gray-100 mt-1">Select Words ({selectedWords.length}/5)</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedWords.map((word) => (
            <div key={word.characters} className="bg-white px-4 py-2 rounded-xl shadow-sm text-teal-700 font-medium border border-teal-200">
              {word.characters}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderInputStep = () => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-blue-200">
      {createMethod === 'wordbank' && (
        <>
          {renderSelectedWords()}
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-700 mb-2">输入提示词：</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="可以输入额外的要求，比如文章主题、风格等..."
              className="w-full p-3 bg-white/95 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:ring focus:ring-blue-200 text-gray-700 focus:ring-opacity-50 transition-colors duration-200 shadow-sm"
            />
          </div>
        </>
      )}
      {createMethod === 'prompt' && (
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">输入提示词：</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="输入提示词..."
            className="w-full p-3 bg-white/95 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200 shadow-sm text-gray-800"
          />
        </div>
      )}
      {(createMethod === 'rewrite' || createMethod === 'metadata') && (
        <div className="mb-6">
          <label className="block text-lg font-medium text-gray-700 mb-2">输入原文：</label>
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="请输入要处理的文章..."
            className="w-full p-3 bg-white/95 border-2 border-blue-200 rounded-xl focus:border-blue-400 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-colors duration-200 shadow-sm"
          />
        </div>
      )}
      {createMethod !== 'metadata' && (
        <div className="mb-6">
          <label htmlFor="articleLength" className="block text-lg font-medium text-gray-700 mb-2">文章长度（字数）：{articleLength}</label>
          <div className="mt-2">
            <input
              id="articleLength"
              type="range"
              value={articleLength}
              onChange={(e) => {
                const value = Number(e.target.value);
                setArticleLength(value);
              }}
              min={100}
              max={1000}
              step={50}
              className="w-full h-3 bg-blue-100 rounded-xl appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-blue-400 [&::-webkit-slider-thumb]:to-purple-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:from-blue-500 [&::-webkit-slider-thumb]:hover:to-purple-500 [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-300"
              aria-label="文章长度（字数）："
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderEditableQuizzes = () => (
    <div className="space-y-6">
      {editableQuizzes.map((quiz, quizIndex) => (
        <div key={quizIndex} className="bg-purple-50 rounded-xl p-4 border border-purple-100">
          <div className="mb-4">
            <span className="font-medium text-purple-600">问题 {quizIndex + 1}:</span>
            <input
              type="text"
              value={quiz.question}
              onChange={(e) => handleQuizChange(quizIndex, 'question', e.target.value)}
              className="w-full p-2 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white text-gray-800"
            />
          </div>
          <ul className="space-y-2">
            {quiz.options.map((option, optIndex) => (
              <li key={optIndex} className="flex items-center gap-2">
                <span className="font-medium text-purple-600">{String.fromCharCode(65 + optIndex)}.</span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => handleQuizChange(quizIndex, optIndex, e.target.value.toString())}
                  className="flex-1 p-2 border-2 border-purple-200 rounded-xl focus:border-purple-400 focus:ring focus:ring-purple-200 focus:ring-opacity-50 bg-white text-gray-800"
                />
                <input
                  type="radio"
                  name={`correctAnswer-${quizIndex}`}
                  checked={optIndex === quiz.correctAnswer}
                  onChange={() => handleQuizChange(quizIndex, 'correctAnswer', optIndex)}
                  className="w-5 h-5 bg-white text-purple-600 border-2 border-purple-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 cursor-pointer hover:border-purple-500 checked:bg-white checked:border-purple-600 checked:hover:border-purple-700 checked:[&:not(:focus)]:ring-2 checked:[&:not(:focus)]:ring-purple-500 checked:[&:not(:focus)]:ring-offset-2 checked:bg-purple-600"
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );

  const renderPreviewStep = () => (
    <>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 border-2 border-purple-200">
        <h3 className="text-xl font-bold mb-4">{generatedPreview?.title}</h3>
        {generatedPreview && (
          <DifficultyDisplay
            difficultyLevel={generatedPreview.difficultyLevel}
            characterLevels={generatedPreview.characterLevels}
          />
        )}
        <div className="mt-4 p-4 text-gray-600 bg-purple-50 rounded-xl border border-purple-100">
          {generatedPreview?.content}
        </div>
        <div className="mt-6">
          <h4 className="text-lg font-semibold">
            测验题目
            <span className="block text-sm text-gray-500 mt-1">Quiz Questions</span>
          </h4>
          {renderEditableQuizzes()}
        </div>
      </div>
      <div className="mt-6 flex items-center gap-2 text-gray-700">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          仅对我可见
          <span className="block text-sm text-gray-500 mt-1">Private</span>
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
          <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl transition-colors duration-200 border-2 border-gray-200" onClick={handleCancel}>
            <div className="block text-base font-medium">取消</div>
            <div className="block text-sm text-gray-500 mt-1">Cancel</div>
          </button>
        );
      case 'input':
        return (
          <>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl transition-colors duration-200 border-2 border-gray-200" onClick={() => setCurrentStep('mode')}>
              <div className="block text-base font-medium">上一步</div>
              <div className="block text-sm text-gray-500 mt-1">Previous</div>
            </button>
            <button
              className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-pink-300"
              onClick={handleCreateArticle}
              disabled={isGenerating || (!prompt && !sourceText)}
            >
              <div className="block text-base font-medium">{isGenerating ? '生成中...' : '生成'}</div>
              <div className="block text-sm text-gray-100 mt-1">{isGenerating ? 'Generating...' : 'Generate'}</div>
            </button>
          </>
        );
      case 'preview':
        return (
          <>
            <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-xl transition-colors duration-200 border-2 border-gray-200" onClick={handleCancelSave}>
              <div className="block text-base font-medium">重新生成</div>
              <div className="block text-sm text-gray-500 mt-1">Regenerate</div>
            </button>
            <button className="bg-gradient-to-r from-pink-400 to-purple-400 hover:from-pink-500 hover:to-purple-500 text-white px-6 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md border-2 border-pink-300" onClick={handleConfirmSave}>
              <div className="block text-base font-medium">保存文章</div>
              <div className="block text-sm text-gray-100 mt-1">Save Article</div>
            </button>
          </>
        );
    }
  };

  if (error) {
    return <div className="bg-red-100 border-2 border-red-300 text-red-700 p-4 rounded-xl">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 py-6 px-2">
         <div className="mb-8 flex items-center justify-between"><button 
          onClick={() => navigate(-1)} 
          className="absolute text-gray-600 hover:text-gray-800 bg-transparent transition-colors flex items-center gap-2"
        >
          <span>←</span>
        </button>
        <h1 className="text-center text-gray-500 text-2xl font-bold flex-1">
          创建文章</h1></div>
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-8 border-2 border-pink-200">

        {renderStepIndicator()}
      </div>
      <div className="mt-8">
        {renderStepContent()}
      </div>
      <div className="mt-8 flex justify-end gap-4">
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