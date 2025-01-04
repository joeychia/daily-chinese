import { ChineseWord } from '../data/sampleText';
import '../styles/print.css';

interface PrintableCardsProps {
  words: ChineseWord[];
}

export const PrintableCards: React.FC<PrintableCardsProps> = ({ words }) => {
  // Split words into groups of 30 (5x6) for each page
  const pages = [];
  for (let i = 0; i < words.length; i += 30) {
    pages.push(words.slice(i, i + 30));
  }

  return (
    <div className="printableCards">
      {pages.map((pageWords, pageIndex) => (
        <div key={pageIndex} className="cardGrid">
          {pageWords.map((word, index) => (
            <div key={index} className="printCard">
              <div className="printCharacter">{word.characters}</div>
              <div className="printPinyin">{word.pinyin.join(' ')}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}; 