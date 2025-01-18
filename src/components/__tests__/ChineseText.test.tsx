import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChineseText } from '../ChineseText';
import { ChineseWord } from '../../data/sampleText';

describe('ChineseText', () => {
  const mockText: ChineseWord[] = [
    { characters: '你', pinyin: ['nǐ'], meaning: '' },
    { characters: '，', pinyin: [','], meaning: '' },
    { characters: '好', pinyin: ['hǎo'], meaning: '' }
  ];

  const mockWordBank: ChineseWord[] = [
    { characters: '你', pinyin: ['nǐ'], meaning: '' }
  ];

  const mockOnWordPeek = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render text correctly', () => {
    render(<ChineseText text={mockText} onWordPeek={mockOnWordPeek} />);
    
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(screen.getByText('，')).toBeInTheDocument();
    expect(screen.getByText('好')).toBeInTheDocument();
  });

  it('should show pinyin popup on character click', () => {
    render(<ChineseText text={mockText} onWordPeek={mockOnWordPeek} />);
    
    const character = screen.getByText('你');
    fireEvent.click(character);

    expect(screen.getByText('nǐ')).toBeInTheDocument();
    expect(mockOnWordPeek).toHaveBeenCalledWith(mockText[0]);
  });

  it('should hide pinyin popup when clicking away', () => {
    render(<ChineseText text={mockText} onWordPeek={mockOnWordPeek} />);
    
    // Click character to show pinyin
    const character = screen.getByText('你');
    fireEvent.click(character);
    expect(screen.getByText('nǐ')).toBeInTheDocument();

    // Click document to hide pinyin
    fireEvent.click(document.body);
    expect(screen.queryByText('nǐ')).not.toBeInTheDocument();
  });

  it('should toggle pinyin popup when clicking same character twice', () => {
    render(<ChineseText text={mockText} onWordPeek={mockOnWordPeek} />);
    
    const character = screen.getByText('你');
    
    // First click shows pinyin
    fireEvent.click(character);
    expect(screen.getByText('nǐ')).toBeInTheDocument();
    
    // Second click hides pinyin
    fireEvent.click(character);
    expect(screen.queryByText('nǐ')).not.toBeInTheDocument();
  });

  it('should show word bank indicator for characters in word bank', () => {
    render(<ChineseText text={mockText} onWordPeek={mockOnWordPeek} wordBank={mockWordBank} />);
    
    // Get the container of the character that should have the indicator
    const characterContainer = screen.getByText('你').parentElement;
    expect(characterContainer?.querySelector('[class*="wordBankDot"]')).toBeInTheDocument();
    
    // Verify other characters don't have the indicator
    const otherCharacterContainer = screen.getByText('好').parentElement;
    expect(otherCharacterContainer?.querySelector('[class*="wordBankDot"]')).not.toBeInTheDocument();
  });

  it('should not show pinyin for non-Chinese characters', () => {
    render(<ChineseText text={mockText} onWordPeek={mockOnWordPeek} />);
    
    const punctuation = screen.getByText('，');
    fireEvent.click(punctuation);
    
    // The pinyin for the punctuation should not be shown
    expect(screen.queryByText(',')).not.toBeInTheDocument();
    expect(mockOnWordPeek).not.toHaveBeenCalled();
  });

  it('should handle switching between different characters', () => {
    render(<ChineseText text={mockText} onWordPeek={mockOnWordPeek} />);
    
    // Click first character
    const firstChar = screen.getByText('你');
    fireEvent.click(firstChar);
    expect(screen.getByText('nǐ')).toBeInTheDocument();
    
    // Click second character
    const secondChar = screen.getByText('好');
    fireEvent.click(secondChar);
    
    // First character's pinyin should be hidden, second character's pinyin should be shown
    expect(screen.queryByText('nǐ')).not.toBeInTheDocument();
    expect(screen.getByText('hǎo')).toBeInTheDocument();
    
    expect(mockOnWordPeek).toHaveBeenCalledTimes(2);
  });
}); 