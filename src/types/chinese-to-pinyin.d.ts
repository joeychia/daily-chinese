declare module 'chinese-to-pinyin' {
  interface PinyinOptions {
    toneType?: 'mark' | 'number' | 'none';
    removeSpace?: boolean;
    firstCharacter?: boolean;
  }

  class Pinyin {
    convert(text: string, options?: PinyinOptions): string;
  }

  export default Pinyin;
} 