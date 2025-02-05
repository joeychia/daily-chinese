import { ref, set, get } from 'firebase/database';
import { db } from '../config/firebase';
import { Quiz } from '../types/reading';

interface Article {
  id: string;
  title: string;
  author: string;
  content: string;
  tags: string[];
  isGenerated: boolean;
  generatedDate: string;
  quizzes: Quiz[];
}

export const initializeDatabase = async () => {
  console.log('Checking if database needs initialization...');
  const articlesRef = ref(db, 'articles');
  const snapshot = await get(articlesRef);

  if (snapshot.exists()) {
    console.log('Database already initialized');
    return;
  }

  console.log('Initializing database with sample data...');

  const sampleArticles: Article[] = [
    {
      id: 'sample1',
      title: '春天的花园',
      author: '李明',
      content: '春天来了，花园里的花儿开始绽放。红色的玫瑰，黄色的菊花，紫色的兰花，五颜六色，美不胜收。蜜蜂在花丛中飞舞，采集花蜜。小鸟在树枝上歌唱，欢迎春天的到来。',
      tags: ['春天', '花园', '自然'],
      isGenerated: false,
      generatedDate: '2024-01-01',
      quizzes: [
        {
          id: '1',
          question: '花园里有什么颜色的花？',
          options: ['红色和蓝色', '红色和黄色', '蓝色和紫色', '黄色和白色'],
          correctAnswer: '红色和黄色'
        },
        {
          id: '2',
          question: '谁在花丛中飞舞？',
          options: ['蝴蝶', '蜜蜂', '小鸟', '蜻蜓'],
          correctAnswer: '蜜蜂'
        }
      ]
    },
    {
      id: 'sample2',
      title: '我的小狗',
      author: '王华',
      content: '我有一只可爱的小狗，它的毛是白色的，像棉花一样柔软。它最喜欢和我一起玩球，每天都会摇着尾巴等我回家。它还会做一些简单的动作，比如坐下、握手和翻滚。',
      tags: ['宠物', '小狗', '生活'],
      isGenerated: false,
      generatedDate: '2024-01-02',
      quizzes: [
        {
          id: '3',
          question: '小狗的毛是什么颜色的？',
          options: ['黑色', '白色', '棕色', '灰色'],
          correctAnswer: '白色'
        },
        {
          id: '4',
          question: '小狗会做什么动作？',
          options: ['跳舞', '唱歌', '握手', '说话'],
          correctAnswer: '握手'
        }
      ]
    }
  ];

  for (const article of sampleArticles) {
    await set(ref(db, `articles/${article.id}`), article);
  }

  console.log('Database initialized successfully');
};