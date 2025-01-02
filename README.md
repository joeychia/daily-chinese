# DailyChinese

A React TypeScript web application for reading Chinese text with pinyin support.

## Features

- Display Chinese text in a reading-friendly format
- Show pinyin annotations above each character
- Interactive pinyin visibility toggle (press and hold to show)
- Responsive and clean user interface
- Sample text included for demonstration

## Requirements

- Node.js (v16 or higher)
- npm (Node Package Manager)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/DailyChinese.git
cd DailyChinese
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `src/components/ChineseText.tsx` - Main component for displaying Chinese text with pinyin
- `src/data/sampleText.ts` - Sample Chinese text data with pinyin mappings
- `src/App.tsx` - Root application component
- `src/components/ChineseText.module.css` - Styles for the Chinese text component

## Technologies Used

- React 18
- TypeScript
- Vite
- CSS Modules

## Future Enhancements

- Generate dynamic Chinese stories (300 words)
- Add more sample texts
- Support for different text themes and topics
- Text difficulty levels
- Vocabulary lists and learning tools
