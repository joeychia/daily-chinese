import { initializeRanks } from '../data/characterRanks';

// This is the data from hanzi-ranks.csv, hardcoded for browser compatibility
const characterRankData: Array<[string, number]> = [
  ['的', 1],
  ['一', 2],
  ['是', 3],
  ['不', 4],
  ['了', 5],
  ['在', 6],
  ['有', 7],
  ['人', 8],
  ['这', 9],
  ['上', 10],
  ['大', 11],
  ['来', 12],
  ['和', 13],
  ['我', 14],
  ['个', 15],
  ['中', 16],
  ['地', 17],
  ['为', 18],
  // Add more characters as needed...
];

export const initializeCharacterRanks = () => {
  try {
    initializeRanks(characterRankData);
    console.log(`Initialized ${characterRankData.length} character ranks`);
  } catch (error) {
    console.error('Failed to initialize character ranks:', error);
  }
}; 