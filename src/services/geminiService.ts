import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export interface GeneratedArticle {
  title: string;
  content: string;
  tags: string[];
  quizzes: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
}

export interface GenerationOptions {
  maxLength?: number;
}

export const geminiService = {
  async generateArticle(prompt: string, options: GenerationOptions = {}): Promise<GeneratedArticle> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const lengthInstruction = options.maxLength 
        ? `文章长度大约${options.maxLength}个汉字`
        : "文章长度大约300个汉字";
      
      const systemPrompt = `请生成一篇中文阅读文章，要求如下：
      1. 中文标题
      2. 正文内容（${lengthInstruction}）
      3. 3-5个相关标签
      4. 3个与内容相关的选择题

      请按以下JSON格式返回：
      {
        "title": "标题",
        "content": "正文内容...",
        "tags": ["标签1", "标签2", "标签3"],
        "quizzes": [
          {
            "question": "问题1",
            "options": ["选项A", "选项B", "选项C", "选项D"],
            "correctAnswer": 0
          }
        ]
      }
      
      文章主题：${prompt}
      文章必须适合小学生阅读水平，汉字应该使用常用汉字，风格要好玩，幽默，内容属于正向价值观。
      注意：请确保文章长度接近${options.maxLength || 300}个汉字。`;

      const result = await model.generateContent(systemPrompt);
      const response = result.response;
      const text = response.text();
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse generated content");
      }
      
      const article = JSON.parse(jsonMatch[0]) as GeneratedArticle;
      return article;
    } catch (error) {
      console.error("Error generating article:", error);
      throw error;
    }
  }
}; 