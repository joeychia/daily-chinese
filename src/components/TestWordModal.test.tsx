import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TestWordModal } from './TestWordModal';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthContext';
import { get } from 'firebase/database';

// Mock Firebase
vi.mock('firebase/database', () => {
  type MockRef = {
    key: string;
    parent: MockRef | null;
    root: MockRef;
    ref: MockRef;
    path: string;
    toString: () => string;
    isEqual: () => boolean;
    toJSON: () => string;
  };

  const createMockRef = (): MockRef => {
    const mockRef: Partial<MockRef> = {
      key: 'mock-key',
      path: 'mock/path',
      toString: () => 'mock/path',
      isEqual: () => false,
      toJSON: () => 'mock/path'
    };
    mockRef.parent = mockRef as MockRef;
    mockRef.root = mockRef as MockRef;
    mockRef.ref = mockRef as MockRef;
    return mockRef as MockRef;
  };

  const mockRef = createMockRef();

  const mockSnapshot = (exists: boolean, value: any) => {
    const snapshot = {
      exists: () => exists,
      val: () => value,
      ref: mockRef,
      key: null,
      size: 0,
      priority: null,
      forEach: () => true,
      hasChild: () => false,
      hasChildren: () => false,
      numChildren: () => 0,
      child: () => mockSnapshot(false, null),
      exportVal: () => value,
      toJSON: () => value
    };
    return snapshot;
  };

  return {
    ref: vi.fn(() => mockRef),
    get: vi.fn(() => Promise.resolve(mockSnapshot(false, null))),
    set: vi.fn(),
    db: {}
  };
});

vi.mock('../config/firebase', () => ({
  db: {}
}));

describe('TestWordModal', () => {
  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockAuthContext = {
    user: mockUser,
    loading: false,
    setUser: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  };

  const mockWord = {
    characters: '你',
    pinyin: ['nǐ'],
    english: 'you',
    meaning: 'you'
  };

  const defaultProps = {
    word: mockWord,
    isOpen: true,
    onClose: vi.fn(),
    onCorrect: vi.fn(),
    mastery: 0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{}');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'clear').mockImplementation(() => {});
  });

  const renderWithAuth = (ui: React.ReactElement) => {
    return render(
      <AuthContext.Provider value={mockAuthContext}>
        {ui}
      </AuthContext.Provider>
    );
  };

  it('should not render when isOpen is false', () => {
    renderWithAuth(<TestWordModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('测试')).toBeNull();
  });

  it('should render character and mastery level', () => {
    renderWithAuth(<TestWordModal {...defaultProps} />);
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(screen.getByText('不熟')).toBeInTheDocument();
  });

  it('should show success message and remaining tests when answer is correct', async () => {
    renderWithAuth(<TestWordModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni');
    await userEvent.click(screen.getByText('确认'));

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(screen.getByText('还需测试2次')).toBeInTheDocument();
    expect(defaultProps.onCorrect).toHaveBeenCalled();
  });

  it('should show error message when answer is incorrect', async () => {
    renderWithAuth(<TestWordModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'wrong');
    await userEvent.click(screen.getByText('确认'));

    expect(screen.getByText('正确答案：nǐ')).toBeInTheDocument();
    expect(defaultProps.onCorrect).not.toHaveBeenCalled();
  });

  it('should handle Enter key press', async () => {
    renderWithAuth(<TestWordModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni{Enter}');

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(defaultProps.onCorrect).toHaveBeenCalled();
  });

  it('should show already tested message when word was tested today', async () => {
    const today = new Date().toISOString().split('T')[0];
    
    type MockRef = {
      key: string;
      parent: MockRef | null;
      root: MockRef;
      ref: MockRef;
      path: string;
      toString: () => string;
      isEqual: () => boolean;
      toJSON: () => string;
    };

    const createMockRef = (): MockRef => {
      const mockRef: Partial<MockRef> = {
        key: 'mock-key',
        path: 'mock/path',
        toString: () => 'mock/path',
        isEqual: () => false,
        toJSON: () => 'mock/path'
      };
      mockRef.parent = mockRef as MockRef;
      mockRef.root = mockRef as MockRef;
      mockRef.ref = mockRef as MockRef;
      return mockRef as MockRef;
    };

    const mockRef = createMockRef();

    const mockSnapshot = (exists: boolean, value: any) => {
      const snapshot = {
        exists: () => exists,
        val: () => value,
        ref: mockRef,
        key: null,
        size: 0,
        priority: null,
        forEach: () => true,
        hasChild: () => false,
        hasChildren: () => false,
        numChildren: () => 0,
        child: () => mockSnapshot(false, null),
        exportVal: () => value,
        toJSON: () => value
      };
      return snapshot;
    };

    vi.mocked(get).mockResolvedValueOnce(mockSnapshot(true, today));

    renderWithAuth(<TestWordModal {...defaultProps} />);
    
    // Wait for the async checkIfTestedToday to complete
    await screen.findByText('今天已测试');
    expect(screen.getByText('还需改天再测试3次')).toBeInTheDocument();
  });

  it('should show congratulations message when mastery reaches 3', async () => {
    renderWithAuth(<TestWordModal {...defaultProps} mastery={2} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni');
    await userEvent.click(screen.getByText('确认'));

    expect(screen.getByText('已掌握，将从生词本中移除')).toBeInTheDocument();
  });

  it('should show close button when answer is correct and not close until clicked', async () => {
    renderWithAuth(<TestWordModal {...defaultProps} />);
    
    // Enter correct answer
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni');
    await userEvent.click(screen.getByText('确认'));

    // Verify success message and close button are shown
    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    const closeButton = screen.getByText('关闭');
    expect(closeButton).toBeInTheDocument();

    // Verify dialog is still open
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(defaultProps.onClose).not.toHaveBeenCalled();

    // Click close button and verify dialog closes
    await userEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should close modal when close button is clicked', async () => {
    renderWithAuth(<TestWordModal {...defaultProps} />);
    
    await userEvent.click(screen.getByText('×'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});