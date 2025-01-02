declare module 'pinyin-pro' {
  interface PinyinOptions {
    toneType?: 'symbol' | 'num' | 'none';
    type?: 'string' | 'array';
    multiple?: boolean;
  }

  export function pinyin(text: string, options?: PinyinOptions): string | string[];
} 