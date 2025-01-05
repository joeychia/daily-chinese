import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Articles from './Articles';
import { articleService } from '../services/articleService';
import { geminiService } from '../services/geminiService';
import { AuthContext } from '../contexts/AuthContext';

// Mock services
vi.mock('../services/articleService');
vi.mock('../services/geminiService');

const mockUser = {
  id: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com'
};

const mockArticles = [
  {
    id: '1',
    title: '测试文章1',
    content: '内容1',
    author: '作者1',
    tags: ['标签1', '标签2'],
    quizzes: [],
    isGenerated: false,
    generatedDate: new Date().toISOString(),
    createdBy: 'Test User'
  },
  {
    id: '2',
    title: '测试文章2',
    content: '内容2',
    author: '作者2',
    tags: ['标签3'],
    quizzes: [],
    isGenerated: true,
    generatedDate: new Date().toISOString(),
    createdBy: 'Test User'
  }
];

const mockGeneratedArticle = {
  title: '生成的文章',
  content: '生成的内容',
  tags: ['生成标签1', '生成标签2'],
  quizzes: [
    {
      question: '测试问题',
      options: ['选项1', '选项2', '选项3', '选项4'],
      correctAnswer: 0
    }
  ]
};

describe('Articles Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock service implementations
    articleService.getAllArticles = vi.fn().mockResolvedValue(mockArticles);
    geminiService.generateArticle = vi.fn().mockResolvedValue(mockGeneratedArticle);
    geminiService.generateFromText = vi.fn().mockResolvedValue(mockGeneratedArticle);
    geminiService.generateMetadata = vi.fn().mockResolvedValue(mockGeneratedArticle);
  });

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: mockUser, loading: false }}>
          {ui}
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  test('renders article list', async () => {
    renderWithRouter(<Articles />);
    
    await waitFor(() => {
      expect(screen.getByText('测试文章1')).toBeInTheDocument();
      expect(screen.getByText('测试文章2')).toBeInTheDocument();
    });
    
    expect(screen.getByText('标签1')).toBeInTheDocument();
    expect(screen.getByText('标签2')).toBeInTheDocument();
    expect(screen.getByText('标签3')).toBeInTheDocument();
  });

  test('opens create modal when clicking create button', async () => {
    renderWithRouter(<Articles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('创建文章'));
    
    expect(screen.getByText('从提示词创建文章')).toBeInTheDocument();
    expect(screen.getByText('改写文章生成测验')).toBeInTheDocument();
    expect(screen.getByText('保留原文生成测验')).toBeInTheDocument();
  });

  test('generates article from prompt', async () => {
    renderWithRouter(<Articles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    // Open modal
    fireEvent.click(screen.getByText('创建文章'));
    
    // Select prompt method
    fireEvent.click(screen.getByText('从提示词创建文章'));
    
    // Enter prompt
    const promptInput = screen.getByPlaceholderText('输入提示词...');
    fireEvent.change(promptInput, { target: { value: '测试提示词' } });
    
    // Generate article
    fireEvent.click(screen.getByText('生成'));
    
    await waitFor(() => {
      expect(screen.getByText('生成的文章')).toBeInTheDocument();
      expect(screen.getByText('生成标签1')).toBeInTheDocument();
      expect(screen.getByText('生成标签2')).toBeInTheDocument();
    });
  });

  test('adjusts article length', async () => {
    renderWithRouter(<Articles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    // Open modal
    fireEvent.click(screen.getByText('创建文章'));
    
    // Find length input
    const lengthInput = screen.getByRole('spinbutton');
    expect(lengthInput).toHaveValue(300);
    
    // Decrease length
    fireEvent.click(screen.getByText('-'));
    expect(lengthInput).toHaveValue(250);
    
    // Increase length
    fireEvent.click(screen.getByText('+'));
    expect(lengthInput).toHaveValue(300);
  });

  test('saves generated article', async () => {
    articleService.createArticle = vi.fn().mockResolvedValue(undefined);
    
    renderWithRouter(<Articles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    // Open modal and generate article
    fireEvent.click(screen.getByText('创建文章'));
    const promptInput = screen.getByPlaceholderText('输入提示词...');
    fireEvent.change(promptInput, { target: { value: '测试提示词' } });
    fireEvent.click(screen.getByText('生成'));
    
    await waitFor(() => {
      expect(screen.getByText('生成的文章')).toBeInTheDocument();
    });
    
    // Save article
    fireEvent.click(screen.getByText('保存文章'));
    
    await waitFor(() => {
      expect(articleService.createArticle).toHaveBeenCalled();
      expect(articleService.getAllArticles).toHaveBeenCalledTimes(2); // Initial + after save
    });
  });

  test('handles error states', async () => {
    // Mock error
    articleService.getAllArticles = vi.fn().mockRejectedValue(new Error('Failed to load'));
    
    renderWithRouter(<Articles />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load articles')).toBeInTheDocument();
    });
  });
}); 