export interface ChineseWord {
  characters: string;
  pinyin: string[];
  meaning: string;  // English or other language translation
}

export const sampleText: ChineseWord[] = [
  {
    characters: "小明",
    pinyin: ["xiǎo", "míng"],
    meaning: ""
  },
  {
    characters: "今天",
    pinyin: ["jīn", "tiān"],
    meaning: ""
  },
  {
    characters: "去",
    pinyin: ["qù"],
    meaning: ""
  },
  {
    characters: "公园",
    pinyin: ["gōng", "yuán"],
    meaning: ""
  },
  {
    characters: "散步",
    pinyin: ["sàn", "bù"],
    meaning: ""
  },
  {
    characters: "。",
    pinyin: [""],
    meaning: ""
  },
  {
    characters: "天气",
    pinyin: ["tiān", "qì"],
    meaning: ""
  },
  {
    characters: "很",
    pinyin: ["hěn"],
    meaning: ""
  },
  {
    characters: "好",
    pinyin: ["hǎo"],
    meaning: ""
  },
  {
    characters: "，",
    pinyin: [""],
    meaning: ""
  },
  {
    characters: "阳光",
    pinyin: ["yáng", "guāng"],
    meaning: ""
  },
  {
    characters: "明媚",
    pinyin: ["míng", "mèi"],
    meaning: ""
  },
  {
    characters: "。",
    pinyin: [""],
    meaning: ""
  }
]; 