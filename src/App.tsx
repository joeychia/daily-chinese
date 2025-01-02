import { useEffect, useState } from 'react'
import { ChineseText } from './components/ChineseText'
import { ChineseWord } from './data/sampleText'
import { processChineseText } from './utils/textProcessor'
import './App.css'

function App() {
  const [processedText, setProcessedText] = useState<ChineseWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    // Load and process the text file
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
          <ChineseText text={processedText} />
          <div className="wordCount">
            字数：{wordCount}
          </div>
        </>
      )}
      {!isLoading && !error && processedText.length === 0 && (
        <div>No text loaded</div>
      )}
    </div>
  )
}

export default App
