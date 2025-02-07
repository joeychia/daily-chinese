import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import CreateArticle from './CreateArticle';
import { geminiService } from '../services/geminiService';
import { articleService } from '../services/articleService';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock services
vi.mock('../services/geminiService');
vi.mock('../services/articleService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

const mockUser = {
  id: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com'
};

const mockGeneratedArticle = {
  title: '测试文章',
  titleEnglish: 'Test Article',
  content: '这是一篇测试文章的内容。',
  contentEnglish: 'This is the content of a test article.',
  tags: ['标签1', '标签2'],
  tagsEnglish: ['Tag1', 'Tag2'],
  quizzes: [
    {
      question: '测试问题',
      questionEnglish: 'Test Question',
      options: ['选项1', '选项2', '选项3'],
      optionsEnglish: ['Option1', 'Option2', 'Option3'],
      correctAnswer: 0
    }
  ]
};

describe('CreateArticle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    (geminiService.generateArticle as ReturnType<typeof vi.fn>).mockResolvedValue(mockGeneratedArticle);
    (geminiService.generateFromText as ReturnType<typeof vi.fn>).mockResolvedValue(mockGeneratedArticle);
    (geminiService.generateMetadata as ReturnType<typeof vi.fn>).mockResolvedValue(mockGeneratedArticle);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{ 
          user: mockUser, 
          loading: false,
          setUser: () => {},
          signIn: async () => {},
          signInWithGoogle: async () => {},
          signUp: async () => {},
          signOut: async () => {}
        }}>
          <CreateArticle />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('starts at mode selection step', () => {
    renderComponent();
    expect(screen.getByText('选择')).toBeInTheDocument();
    expect(screen.getByText('从提示词创建')).toBeInTheDocument();
    expect(screen.getByText('改写文章生成测试')).toBeInTheDocument();
    expect(screen.getByText('使用原文生成测试')).toBeInTheDocument();
  });

  it('moves to input step when a method is selected', () => {
    renderComponent();
    fireEvent.click(screen.getByText('从提示词创建'));
    expect(screen.getByPlaceholderText('输入提示词...')).toBeInTheDocument();
  });

  it('shows length selector for prompt and rewrite methods', () => {
    // Check prompt method
    renderComponent();
    fireEvent.click(screen.getByText('从提示词创建'));
    cleanup();
    
    // Check rewrite method
    renderComponent();
    fireEvent.click(screen.getByText('改写文章生成测试'));
  });

  it('hides length selector for metadata method', () => {
    renderComponent();
    fireEvent.click(screen.getByText('使用原文生成测试'));
    expect(screen.queryByText('文章长度：')).not.toBeInTheDocument();
  });

  it('generates article and moves to preview step', async () => {
    renderComponent();
    
    // Select prompt method and enter text
    fireEvent.click(screen.getByText('从提示词创建'));
    fireEvent.change(screen.getByPlaceholderText('输入提示词...'), {
      target: { value: '测试提示词' }
    });
    
    // Generate article
    fireEvent.click(screen.getByText('生成'));
    
    // Wait for preview
    await waitFor(() => {
      expect(screen.getByText(mockGeneratedArticle.title)).toBeInTheDocument();
    });
  });

  it('allows saving article as private', async () => {
    renderComponent();
    
    // Generate and preview article
    fireEvent.click(screen.getByText('从提示词创建'));
    fireEvent.change(screen.getByPlaceholderText('输入提示词...'), {
      target: { value: '测试提示词' }
    });
    fireEvent.click(screen.getByText('生成'));
    
    await waitFor(() => {
      expect(screen.getByText(mockGeneratedArticle.title)).toBeInTheDocument();
    });

    // Set as private and save
    fireEvent.click(screen.getByText('仅对我可见'));
    fireEvent.click(screen.getByText('保存文章'));

    await waitFor(() => {
      expect(articleService.createArticle).toHaveBeenCalled();
    });
  });

  it('saves article as public by default', async () => {
    renderComponent();
    
    // Generate and preview article
    fireEvent.click(screen.getByText('从提示词创建'));
    fireEvent.change(screen.getByPlaceholderText('输入提示词...'), {
      target: { value: '测试提示词' }
    });
    fireEvent.click(screen.getByText('生成'));
    
    await waitFor(() => {
      expect(screen.getByText(mockGeneratedArticle.title)).toBeInTheDocument();
    });

    // Save without changing visibility
    fireEvent.click(screen.getByText('保存文章'));

    await waitFor(() => {
      expect(articleService.createArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'public'
        })
      );
    });
  });

  it('allows returning to previous steps', () => {
    renderComponent();
    
    // Go to input step
    fireEvent.click(screen.getByText('从提示词创建'));
    expect(screen.getByPlaceholderText('输入提示词...')).toBeInTheDocument();
    
    // Return to mode selection
    fireEvent.click(screen.getByText('上一步'));
    expect(screen.getByText('选择')).toBeInTheDocument();
  });

  it('adjusts article length with input', () => {
    renderComponent();
    
    // Go to input step
    fireEvent.click(screen.getByText('从提示词创建'));
    
  });

});