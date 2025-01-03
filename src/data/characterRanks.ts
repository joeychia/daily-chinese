// Map of characters to their frequency ranks (1-based index)
export const characterRanks = new Map<string, number>();

// Initialize with the first 3000 most common characters
// This data will be populated from hanzi-ranks.csv during build time
export const initializeRanks = (rankData: Array<[string, number]>) => {
  rankData.forEach(([char, rank]) => {
    characterRanks.set(char, rank);
  });
}; 