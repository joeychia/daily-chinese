import { useEffect, useState } from 'react'
import { ChineseText } from './components/ChineseText'
import { PrintableCards } from './components/PrintableCards'
import { ChineseWord } from './data/sampleText'
import { processChineseText } from './utils/textProcessor'
import './App.css'

function App() {
  const [processedText, setProcessedText] = useState<ChineseWord[]>([]);
  const [wordBank, setWordBank] = useState<ChineseWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);

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

  // Count actual Chinese characters (excluding punctuation)
  const wordCount = processedText.filter(word => 
    /[\u4e00-\u9fa5]/.test(word.characters)
  ).length;

  return (
    <div className="app">
      <h1>每日一读</h1>
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
    </div>
  )
}

export default App
