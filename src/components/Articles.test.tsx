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
    createdBy: 'Test User',
    visibility: 'public'
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
    createdBy: 'Test User',
    visibility: 'public'
  },
  {
    id: '3',
    title: '私密文章',
    content: '私密内容',
    author: '其他作者',
    tags: ['私密'],
    quizzes: [],
    isGenerated: true,
    generatedDate: new Date().toISOString(),
    createdBy: 'Other User',
    visibility: 'other-user-id'
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
    
    // Find length input and buttons
    const lengthInput = screen.getByRole('spinbutton');
    const decrementButton = screen.getByText('-');
    const incrementButton = screen.getByText('+');
    
    // Initial value should be 300
    expect(lengthInput).toHaveValue(300);
    
    // Test decrement
    fireEvent.click(decrementButton);
    expect(lengthInput).toHaveValue(250);
    
    // Test decrement limit
    for (let i = 0; i < 10; i++) {
      fireEvent.click(decrementButton);
    }
    expect(lengthInput).toHaveValue(50); // Should not go below 50
    
    // Test increment
    fireEvent.click(incrementButton);
    expect(lengthInput).toHaveValue(100);
    
    // Test increment limit
    for (let i = 0; i < 30; i++) {
      fireEvent.click(incrementButton);
    }
    expect(lengthInput).toHaveValue(1000); // Should not go above 1000
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

  test('saves article with public visibility by default', async () => {
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
    
    // Save article without changing visibility
    fireEvent.click(screen.getByText('保存文章'));
    
    await waitFor(() => {
      expect(articleService.createArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: 'public'
        })
      );
    });
  });

  test('saves article with private visibility when selected', async () => {
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
    
    // Set visibility to private
    const visibilityCheckbox = screen.getByLabelText('仅对我可见');
    fireEvent.click(visibilityCheckbox);
    expect(visibilityCheckbox).toBeChecked();
    
    // Save article
    fireEvent.click(screen.getByText('保存文章'));
    
    await waitFor(() => {
      expect(articleService.createArticle).toHaveBeenCalledWith(
        expect.objectContaining({
          visibility: mockUser.id
        })
      );
    });
  });

  test('resets visibility when canceling article generation', async () => {
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
    
    // Set visibility to private
    const visibilityCheckbox = screen.getByLabelText('仅对我可见');
    fireEvent.click(visibilityCheckbox);
    expect(visibilityCheckbox).toBeChecked();
    
    // Cancel and reopen
    fireEvent.click(screen.getByText('重新生成'));
    
    // Generate new article
    fireEvent.change(promptInput, { target: { value: '新的提示词' } });
    fireEvent.click(screen.getByText('生成'));
    
    await waitFor(() => {
      expect(screen.getByText('生成的文章')).toBeInTheDocument();
    });
    
    // Check that visibility is reset
    const newVisibilityCheckbox = screen.getByLabelText('仅对我可见');
    expect(newVisibilityCheckbox).not.toBeChecked();
  });

  test('does not show private articles from other users', async () => {
    renderWithRouter(<Articles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    // Public articles should be visible
    expect(screen.getByText('测试文章1')).toBeInTheDocument();
    expect(screen.getByText('测试文章2')).toBeInTheDocument();
    
    // Private article from other user should not be visible
    expect(screen.queryByText('私密文章')).not.toBeInTheDocument();
    expect(screen.queryByText('私密')).not.toBeInTheDocument();
  });

  test('shows articles without visibility field as public', async () => {
    // Add an article without visibility field to mock data
    const articlesWithoutVisibility = [
      ...mockArticles,
      {
        id: '4',
        title: '无可见性设置的文章',
        content: '内容',
        author: '作者',
        tags: ['标签'],
        quizzes: [],
        isGenerated: false,
        generatedDate: new Date().toISOString(),
        createdBy: 'Test User'
      }
    ];
    
    // Override the mock implementation for this test
    articleService.getAllArticles = vi.fn().mockResolvedValue(articlesWithoutVisibility);
    
    renderWithRouter(<Articles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    // Public articles and article without visibility should be visible
    expect(screen.getByText('测试文章1')).toBeInTheDocument();
    expect(screen.getByText('测试文章2')).toBeInTheDocument();
    expect(screen.getByText('无可见性设置的文章')).toBeInTheDocument();
    
    // Private article from other user should still not be visible
    expect(screen.queryByText('私密文章')).not.toBeInTheDocument();
  });

  test('shows default creator for articles without createdBy field', async () => {
    // Add an article without createdBy field to mock data
    const articlesWithoutCreator = [
      ...mockArticles,
      {
        id: '5',
        title: '无创建者文章',
        content: '内容',
        author: '作者',
        tags: ['标签'],
        quizzes: [],
        isGenerated: false,
        generatedDate: new Date().toISOString(),
        visibility: 'public'
      }
    ];
    
    // Override the mock implementation for this test
    articleService.getAllArticles = vi.fn().mockResolvedValue(articlesWithoutCreator);
    
    renderWithRouter(<Articles />);
    
    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    // Check that the article without creator shows default value
    expect(screen.getByText('提供者：每日一读')).toBeInTheDocument();
    
    // Check that articles with creator show their creator
    const creatorElements = screen.getAllByText('提供者：Test User');
    expect(creatorElements).toHaveLength(2); // Two articles with Test User as creator
  });
}); 