declare module 'hanzi' {
  interface Definition {
    definition: string;
    pinyin: string;
    simplified: string;
    traditional: string;
    level?: string;  // HSK level
  }

  interface HanziModule {
    start(): void;
    definitionLookup(word: string): Definition[];
    getCharacterFrequency(char: string): number;
    decompose(char: string): string[];
    decomposeMany(word: string): string[][];
    ifComponentExists(component: string): boolean;
    determinePhoneticRegularity(word: string): any;
  }

  const hanzi: HanziModule;
  export default hanzi;
} 