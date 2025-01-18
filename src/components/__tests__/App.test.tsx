import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';
import { AuthProvider } from '../../contexts/AuthContext';
import { initializeDatabase } from '../../scripts/initializeDb';

// Track rendered routes to prevent duplicates
let renderedRoutes = new Set<string>();

// Mock Firebase initialization
vi.mock('../../scripts/initializeDb', () => ({
  initializeDatabase: vi.fn()
}));

const mockUseAuth = vi.fn();

// Mock Firebase auth
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => {
    return <div>{children}</div>;
  },
  useAuth: () => mockUseAuth()
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
    useLocation: () => ({ pathname: '/' }),
    Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    useParams: () => ({ articleId: 'test-article' }),
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  };
});

// Mock other components
vi.mock('../../components/MainContent', () => ({
  default: () => <div data-testid="main-content">Main Content</div>
}));

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    renderedRoutes.clear();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false
    });
  });

  it('should initialize database on mount', () => {
    render(<App />);
    expect(initializeDatabase).toHaveBeenCalled();
  });

  it('should redirect to login when user is not authenticated', () => {
    render(<App />);
    expect(screen.getByTestId('route-/login')).toBeInTheDocument();
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
    await waitFor(() => {
      expect(screen.getByText('Loading article...')).toBeInTheDocument();
    });
  });

  it('should handle database initialization error', () => {
    const error = new Error('Failed to initialize database');
    (initializeDatabase as any).mockRejectedValue(error);
    
    render(<App />);
    expect(screen.getByTestId('route-/login')).toBeInTheDocument();
  });

  it('should render protected routes when user is authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { uid: 'test-user', displayName: 'Test User' },
      loading: false
    });

    render(<App />);
    expect(screen.getByText('Loading article...')).toBeInTheDocument();
  });
}); 