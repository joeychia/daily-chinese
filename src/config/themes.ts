export interface Theme {
  id: string;
  name: string;
  displayName: string;
  isLocked: boolean;
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    cardBackground: string;
    cardBorder: string;
    highlight: string;
  };
  emoji: string;
}

export const themes: Theme[] = [
  {
    id: 'candy',
    name: '糖果乐园',
    displayName: '糖果乐园 🍬',
    isLocked: false,
    colors: {
      primary: '#ff9f43',
      secondary: '#ff7f50',
      background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      text: '#2c3e50',
      cardBackground: '#fff9f0',
      cardBorder: '#ffd995',
      highlight: '#ffe4a3'
    },
    emoji: '🍬'
  },
  {
    id: 'ocean',
    name: '海洋世界',
    displayName: '海洋世界 🌊',
    isLocked: false,
    colors: {
      primary: '#4facfe',
      secondary: '#00f2fe',
      background: 'linear-gradient(135deg, #e0f7ff 0%, #87cefa 100%)',
      text: '#1a5f7a',
      cardBackground: '#f0faff',
      cardBorder: '#bae6fd',
      highlight: '#e0f7ff'
    },
    emoji: '🌊'
  },
  {
    id: 'forest',
    name: '森林探险',
    displayName: '森林探险 🌳',
    isLocked: false,
    colors: {
      primary: '#68d391',
      secondary: '#38b2ac',
      background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
      text: '#234e52',
      cardBackground: '#f7fff9',
      cardBorder: '#9ae6b4',
      highlight: '#dcfce7'
    },
    emoji: '🌳'
  },
  {
    id: 'space',
    name: '太空漫游',
    displayName: '太空漫游 🚀',
    isLocked: true,
    colors: {
      primary: '#805ad5',
      secondary: '#6b46c1',
      background: 'linear-gradient(135deg, #e9d8fd 0%, #b794f4 100%)',
      text: '#322659',
      cardBackground: '#faf5ff',
      cardBorder: '#d6bcfa',
      highlight: '#e9d8fd'
    },
    emoji: '🚀'
  },
  {
    id: 'circus',
    name: '马戏团',
    displayName: '马戏团 🎪',
    isLocked: true,
    colors: {
      primary: '#f56565',
      secondary: '#e53e3e',
      background: 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)',
      text: '#742a2a',
      cardBackground: '#fff8f8',
      cardBorder: '#feb2b2',
      highlight: '#fed7d7'
    },
    emoji: '🎪'
  },
  {
    id: 'garden',
    name: '花园派对',
    displayName: '花园派对 🌸',
    isLocked: true,
    colors: {
      primary: '#ed64a6',
      secondary: '#d53f8c',
      background: 'linear-gradient(135deg, #fff5f7 0%, #fed7e2 100%)',
      text: '#702459',
      cardBackground: '#fff8fa',
      cardBorder: '#fbb6ce',
      highlight: '#fed7e2'
    },
    emoji: '🌸'
  },
  {
    id: 'desert',
    name: '沙漠冒险',
    displayName: '沙漠冒险 🐪',
    isLocked: true,
    colors: {
      primary: '#ecc94b',
      secondary: '#d69e2e',
      background: 'linear-gradient(135deg, #fffff0 0%, #fefcbf 100%)',
      text: '#744210',
      cardBackground: '#fffff7',
      cardBorder: '#f6e05e',
      highlight: '#fefcbf'
    },
    emoji: '🐪'
  },
  {
    id: 'arctic',
    name: '北极探险',
    displayName: '北极探险 ❄️',
    isLocked: true,
    colors: {
      primary: '#63b3ed',
      secondary: '#4299e1',
      background: 'linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%)',
      text: '#2a4365',
      cardBackground: '#f7faff',
      cardBorder: '#90cdf4',
      highlight: '#bee3f8'
    },
    emoji: '❄️'
  },
  {
    id: 'jungle',
    name: '丛林历险',
    displayName: '丛林历险 🦁',
    isLocked: true,
    colors: {
      primary: '#48bb78',
      secondary: '#38a169',
      background: 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)',
      text: '#22543d',
      cardBackground: '#f7fff9',
      cardBorder: '#9ae6b4',
      highlight: '#dcfce7'
    },
    emoji: '🦁'
  },
  {
    id: 'volcano',
    name: '火山探险',
    displayName: '火山探险 🌋',
    isLocked: true,
    colors: {
      primary: '#f6ad55',
      secondary: '#ed8936',
      background: 'linear-gradient(135deg, #fffaf0 0%, #feebc8 100%)',
      text: '#7b341e',
      cardBackground: '#fffaf5',
      cardBorder: '#fbd38d',
      highlight: '#feebc8'
    },
    emoji: '🌋'
  }
]; 