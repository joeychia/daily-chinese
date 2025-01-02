import { useEffect, useState } from 'react'
import { ChineseText } from './components/ChineseText'
import { PrintableCards } from './components/PrintableCards'
import { ThemePanel } from './components/ThemePanel'
import { ChineseWord } from './data/sampleText'
import { Theme, themes } from './config/themes'
import { processChineseText } from './utils/textProcessor'
import './App.css'

function App() {
  const [processedText, setProcessedText] = useState<ChineseWord[]>([]);
  const [wordBank, setWordBank] = useState<ChineseWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('candy');
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    fetch('/sample.txt')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        const processed = processChineseText(text);
        setProcessedText(processed);
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading text:', error);
        setError(error.message);
        setIsLoading(false);
      });
  }, []);

  const handleWordPeek = (word: ChineseWord) => {
    if (!wordBank.some(w => w.characters === word.characters)) {
      setWordBank(prev => [...prev, word]);
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
  };

  // Get current theme object
  const theme = themes.find(t => t.id === currentTheme) || themes[0];

  // Count actual Chinese characters (excluding punctuation)
  const wordCount = processedText.filter(word => 
    /[\u4e00-\u9fa5]/.test(word.characters)
  ).length;

  return (
    <div className="app" style={{
      background: theme.colors.background,
      color: theme.colors.text,
      '--theme-primary': theme.colors.primary,
      '--theme-secondary': theme.colors.secondary,
      '--theme-card-bg': theme.colors.cardBackground,
      '--theme-card-border': theme.colors.cardBorder,
      '--theme-highlight': theme.colors.highlight,
    } as React.CSSProperties}>
      <div className="header">
        <h1>每日一读</h1>
        <button 
          className="themeButton" 
          onClick={() => setIsThemePanelOpen(true)}
          title="更换主题"
        >
          {theme.emoji}
        </button>
      </div>
      {isLoading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!isLoading && !error && processedText.length > 0 && (
        <>
          <ChineseText text={processedText} onWordPeek={handleWordPeek} />
          <div className="wordCount">
            字数：{wordCount}
          </div>
          {wordBank.length > 0 && (
            <div className="wordBank">
              <h2>生词本</h2>
              <div className="wordList">
                {wordBank.map((word, index) => (
                  <div key={index} className="bankWord">
                    <div className="bankCharacter">{word.characters}</div>
                    <div className="bankPinyin">{word.pinyin.join(' ')}</div>
                  </div>
                ))}
              </div>
              <button className="printButton" onClick={handlePrint}>
                打印生词卡
              </button>
            </div>
          )}
        </>
      )}
      {!isLoading && !error && processedText.length === 0 && (
        <div>No text loaded</div>
      )}
      {showPrintPreview && <PrintableCards words={wordBank} />}
      <ThemePanel
        isOpen={isThemePanelOpen}
        onClose={() => setIsThemePanelOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    </div>
  )
}

export default App
