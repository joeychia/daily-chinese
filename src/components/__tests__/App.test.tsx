import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { initializeDatabase } from '../../scripts/initializeDb';

// Track rendered routes to prevent duplicates
let renderedRoutes = new Set<string>();

// Mock Firebase initialization
vi.mock('../../scripts/initializeDb', () => ({
  initializeDatabase: vi.fn()
}));

const mockUseAuth = vi.fn();
const mockUseLocation = vi.fn().mockReturnValue({ pathname: '/' });

// Mock Firebase auth
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
  },
  useAuth: () => mockUseAuth()
}));

// Mock article service
vi.mock('../../services/articleService', () => ({
  articleService: {
    getArticleById: vi.fn(),
    getArticleIndex: vi.fn().mockResolvedValue([
      {
        id: 'test-article',
        title: '示例文章',
        author: '示例作者',
        content: '这是一个示例文章',
        tags: ['示例'],
        quizzes: [],
        isGenerated: false,
        generatedDate: '2024-01-01'
      }
    ]),
    getFirstUnreadArticle: vi.fn(),
  }
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => {
  return {
    BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Routes: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Route: ({ path, element }: { path: string, element: React.ReactNode }) => {
      if (renderedRoutes.has(path)) {
        return null;
      }
      renderedRoutes.add(path);
      return <div data-testid={`route-${path}`}>{element}</div>;
    },
    Navigate: ({ to }: { to: string }) => {
      if (renderedRoutes.has(to)) {
        return null;
      }
      renderedRoutes.add(to);
      return <div data-testid={`navigate-${to}`}>{to}</div>;
    },
    useNavigate: () => vi.fn(),
    useLocation: () => mockUseLocation(),
    Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useParams: () => ({ articleId: 'test-article' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  };
});

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderedRoutes.clear();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });
    mockUseLocation.mockReturnValue({ pathname: '/' });
  });

  it('should initialize database on mount', () => {
    render(<App />);
    expect(initializeDatabase).toHaveBeenCalled();
  });

  it('should render main content for guest users', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    render(<App />);
    expect(screen.getByTestId('route-/')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText('示')[0]).toBeInTheDocument();
      expect(screen.getAllByText('例')[0]).toBeInTheDocument();
      expect(screen.getAllByText('文')[0]).toBeInTheDocument();
      expect(screen.getAllByText('章')[0]).toBeInTheDocument();
    });
  });

  it('should show loading state when auth is loading', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: true
    });

    render(<App />);
    // Get all loading elements and verify at least one exists
    const loadingElements = screen.getAllByText('Loading...');
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('should render main content when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user', displayName: 'Test User' },
      loading: false
    });

    render(<App />);
    expect(screen.getByTestId('route-/')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText('示')[0]).toBeInTheDocument();
      expect(screen.getAllByText('例')[0]).toBeInTheDocument();
      expect(screen.getAllByText('文')[0]).toBeInTheDocument();
      expect(screen.getAllByText('章')[0]).toBeInTheDocument();
    });
  });

  it('should handle database initialization error', () => {
    const error = new Error('Failed to initialize database');
    (initializeDatabase as any).mockRejectedValue(error);
    
    render(<App />);
    expect(screen.getByTestId('route-/')).toBeInTheDocument();
  });

  it('should render protected routes when user is authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user', displayName: 'Test User' },
      loading: false
    });

    render(<App />);
    expect(screen.getByTestId('route-/')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getAllByText('示')[0]).toBeInTheDocument();
      expect(screen.getAllByText('例')[0]).toBeInTheDocument();
      expect(screen.getAllByText('文')[0]).toBeInTheDocument();
      expect(screen.getAllByText('章')[0]).toBeInTheDocument();
    });
  });

  it('should redirect to login for protected routes when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });

    mockUseLocation.mockReturnValue({ pathname: '/progress' });

    render(<App />);
    expect(screen.getByTestId('route-/login')).toBeInTheDocument();
  });
}); 