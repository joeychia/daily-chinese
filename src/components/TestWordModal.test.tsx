import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestWordModal } from './TestWordModal';
import userEvent from '@testing-library/user-event';

describe('TestWordModal', () => {
  const mockWord = {
    characters: '你',
    pinyin: ['nǐ'],
    english: 'you'
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

  it('should not render when isOpen is false', () => {
    render(<TestWordModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('测试')).toBeNull();
  });

  it('should render character and mastery level', () => {
    render(<TestWordModal {...defaultProps} />);
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(screen.getByText('掌握程度：不熟')).toBeInTheDocument();
  });

  it('should show success message and remaining tests when answer is correct', async () => {
    render(<TestWordModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni');
    fireEvent.click(screen.getByText('确认'));

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(screen.getByText('还需要在其他日子测试2次才能从生词本中移除')).toBeInTheDocument();
    expect(defaultProps.onCorrect).toHaveBeenCalled();
  });

  it('should show error message when answer is incorrect', async () => {
    render(<TestWordModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'wrong');
    fireEvent.click(screen.getByText('确认'));

    expect(screen.getByText('拼音不正确，正确答案是：nǐ')).toBeInTheDocument();
    expect(defaultProps.onCorrect).not.toHaveBeenCalled();
  });

  it('should handle Enter key press', async () => {
    render(<TestWordModal {...defaultProps} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni{Enter}');

    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    expect(defaultProps.onCorrect).toHaveBeenCalled();
  });

  it('should show already tested message when word was tested today', () => {
    const today = new Date().toISOString().split('T')[0];
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(JSON.stringify({ '你': today }));

    render(<TestWordModal {...defaultProps} />);
    
    expect(screen.getByText('今天已经测试过这个字了！')).toBeInTheDocument();
    expect(screen.getByText('还需要在其他日子测试3次才能从生词本中移除')).toBeInTheDocument();
  });

  it('should show congratulations message when mastery reaches 3', async () => {
    render(<TestWordModal {...defaultProps} mastery={2} />);
    
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni');
    fireEvent.click(screen.getByText('确认'));

    expect(screen.getByText('恭喜！这个字已经掌握了，将从生词本中移除。')).toBeInTheDocument();
  });

  it('should show close button when answer is correct and not close until clicked', async () => {
    render(<TestWordModal {...defaultProps} />);
    
    // Enter correct answer
    const input = screen.getByPlaceholderText('输入拼音（不用输入声调）');
    await userEvent.type(input, 'ni');
    fireEvent.click(screen.getByText('确认'));

    // Verify success message and close button are shown
    expect(screen.getByText('回答正确！')).toBeInTheDocument();
    const closeButton = screen.getByText('关闭');
    expect(closeButton).toBeInTheDocument();

    // Verify dialog is still open
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(defaultProps.onClose).not.toHaveBeenCalled();

    // Click close button and verify dialog closes
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should close modal when close button is clicked', () => {
    render(<TestWordModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('×'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should close modal when cancel button is clicked', () => {
    render(<TestWordModal {...defaultProps} />);
    
    fireEvent.click(screen.getByText('取消'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
}); 