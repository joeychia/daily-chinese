import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import Articles from './Articles';
import { articleService } from '../services/articleService';
import { AuthContext } from '../contexts/AuthContext';

// Mock services and router
vi.mock('../services/articleService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn()
  };
});

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

describe('Articles Component', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock service implementations
    articleService.getAllArticles = vi.fn().mockResolvedValue(mockArticles);
    (useNavigate as any).mockImplementation(() => mockNavigate);
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

  test('navigates to article page when clicking an article', async () => {
    renderWithRouter(<Articles />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('测试文章1'));
    expect(mockNavigate).toHaveBeenCalledWith('/article/1');
  });

  test('displays loading state', () => {
    articleService.getAllArticles = vi.fn().mockImplementation(() => new Promise(() => {}));
    renderWithRouter(<Articles />);
    expect(screen.getByText('Loading articles...')).toBeInTheDocument();
  });

  test('displays empty state when no articles', async () => {
    articleService.getAllArticles = vi.fn().mockResolvedValue([]);
    renderWithRouter(<Articles />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
  });

  test('filters articles based on visibility and user', async () => {
    const mockArticlesWithMixedVisibility = [
      {
        id: '1',
        title: 'Public Article',
        content: 'Content',
        author: 'Author',
        tags: ['Tag'],
        quizzes: [],
        isGenerated: false,
        generatedDate: new Date().toISOString(),
        createdBy: 'Test User',
        visibility: 'public'
      },
      {
        id: '2',
        title: 'Private User Article',
        content: 'Content',
        author: 'Author',
        tags: ['Tag'],
        quizzes: [],
        isGenerated: false,
        generatedDate: new Date().toISOString(),
        createdBy: 'Test User',
        visibility: 'test-user-id'
      },
      {
        id: '3',
        title: 'Other User Private Article',
        content: 'Content',
        author: 'Author',
        tags: ['Tag'],
        quizzes: [],
        isGenerated: false,
        generatedDate: new Date().toISOString(),
        createdBy: 'Other User',
        visibility: 'other-user-id'
      }
    ];

    articleService.getAllArticles = vi.fn().mockResolvedValue(mockArticlesWithMixedVisibility);
    renderWithRouter(<Articles />);

    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });

    // Should show public and user's private articles
    expect(screen.getByText('Public Article')).toBeInTheDocument();
    expect(screen.getByText('Private User Article')).toBeInTheDocument();
    // Should not show other user's private article
    expect(screen.queryByText('Other User Private Article')).not.toBeInTheDocument();
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

  test('navigates to create article page when clicking create button', async () => {
    renderWithRouter(<Articles />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading articles...')).not.toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('创建文章'));
    expect(mockNavigate).toHaveBeenCalledWith('/create-article');
  });
}); 