declare module 'tiny-pinyin' {
  const PINYIN: {
    isSupported(): boolean;
    convertToPinyin(text: string, separator?: string, lowerCase?: boolean): string;
    parse(text: string): Array<{ source: string; type: string; target: string }>;
  };
  export default PINYIN;
} 