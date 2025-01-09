import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
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
  content: '这是一篇测试文章的内容。',
  tags: ['标签1', '标签2'],
  quizzes: [
    {
      question: '测试问题',
      options: ['选项1', '选项2', '选项3'],
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
        <AuthContext.Provider value={{ user: mockUser, loading: false }}>
          <CreateArticle />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('starts at mode selection step', () => {
    renderComponent();
    expect(screen.getByRole('heading', { name: '选择创建方式' })).toBeInTheDocument();
    expect(screen.getByText('从提示词创建')).toBeInTheDocument();
    expect(screen.getByText('改写文章')).toBeInTheDocument();
    expect(screen.getByText('使用原文')).toBeInTheDocument();
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
    const promptLengthInput = screen.getByRole('spinbutton', { name: '文章长度（字数）：' });
    expect(promptLengthInput).toBeInTheDocument();
    cleanup();
    
    // Check rewrite method
    renderComponent();
    fireEvent.click(screen.getByText('改写文章'));
    const rewriteLengthInput = screen.getByRole('spinbutton', { name: '文章长度（字数）：' });
    expect(rewriteLengthInput).toBeInTheDocument();
  });

  it('hides length selector for metadata method', () => {
    renderComponent();
    fireEvent.click(screen.getByText('使用原文'));
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
      expect(articleService.createArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: mockUser.id
        })
      );
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
    expect(screen.getByRole('heading', { name: '选择创建方式' })).toBeInTheDocument();
  });

  it('adjusts article length with input', () => {
    renderComponent();
    
    // Go to input step
    fireEvent.click(screen.getByText('从提示词创建'));
    
    // Get input and change value
    const input = screen.getByRole('spinbutton', { name: '文章长度（字数）：' });
    fireEvent.change(input, { target: { value: '500' } });
    expect(input).toHaveValue(500);
  });

  it('enforces article length limits', () => {
    renderComponent();
    fireEvent.click(screen.getByText('从提示词创建'));
    const input = screen.getByRole('spinbutton', { name: '文章长度（字数）：' }) as HTMLInputElement;
    
    // Test minimum limit
    fireEvent.change(input, { target: { value: '50' } });
    expect(Number(input.value)).toBeGreaterThanOrEqual(100);
    
    // Test maximum limit
    fireEvent.change(input, { target: { value: '1500' } });
    expect(Number(input.value)).toBeLessThanOrEqual(1000);
  });
}); 