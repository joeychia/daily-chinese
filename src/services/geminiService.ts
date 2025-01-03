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

// Helper function to sanitize JSON string
const sanitizeJsonString = (str: string): string => {
  // Remove any potential control characters
  return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
    // Ensure proper quote usage
    .replace(/[""]/g, '"')
    // Remove any potential leading/trailing non-JSON content
    .replace(/^[^{]*({.*})[^}]*$/, '$1')
    // Fix any double quotes within text
    .replace(/(?<!\\)\\"/g, '"')
    .replace(/\\\\"/g, '\\"');
};

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

      请按以下JSON格式返回，不要添加任何其他内容：
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
      
      const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
      const article = JSON.parse(sanitizedJson) as GeneratedArticle;
      return article;
    } catch (error) {
      console.error("Error generating article:", error);
      throw error;
    }
  },

  async generateFromText(sourceText: string, options: GenerationOptions = {}): Promise<GeneratedArticle> {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const lengthInstruction = options.maxLength 
        ? `文章长度大约${options.maxLength}个汉字`
        : "文章长度大约300个汉字";
      
      const systemPrompt = `这是一段文字内容，请根据这个内容生成一篇适合小学生阅读的文章，要求如下：
      1. 提取主要内容，简化语言，使用常用汉字
      2. 保持原文的核心信息，但用更有趣、更容易理解的方式表达
      3. 确保内容积极向上，富有教育意义
      4. 文章长度（${lengthInstruction}）
      5. 添加3-5个相关标签
      6. 生成3个与内容相关的选择题，考察阅读理解

      请按以下JSON格式返回，不要添加任何其他内容：
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

      原文内容：
      ${sourceText}
      
      注意：
      1. 请确保文章长度接近${options.maxLength || 300}个汉字
      2. 使用小学生容易理解的语言和汉字
      3. 保持内容有趣且富有教育意义`;

      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text();
      
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse generated content");
      }
      
      const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
      const article = JSON.parse(sanitizedJson) as GeneratedArticle;
      return article;
    } catch (error) {
      console.error("Error generating article from text:", error);
      throw error;
    }
  },

  async generateMetadata(sourceText: string): Promise<GeneratedArticle> {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const systemPrompt = `You are a Chinese language learning assistant. For the given Chinese text:
    1. Generate an appropriate title if not obvious from the text
    2. Keep the original content exactly as is
    3. Generate relevant tags for categorization
    4. Create 3 multiple choice questions to test comprehension
    
    Important:
    - Use simplified Chinese characters in the questions and options
    - Keep questions at an intermediate level (HSK 3-4)
    - Make sure questions test understanding, not just vocabulary
    - Each question should have 4 options
    
    Format the response as a JSON object with the following structure:
    {
      "title": "标题",
      "content": "原文内容(保持不变)",
      "tags": ["标签1", "标签2", ...],
      "quizzes": [
        {
          "question": "问题",
          "options": ["选项1", "选项2", "选项3", "选项4"],
          "correctAnswer": 0 // index of correct option
        },
        ...
      ]
    }`;

    const result = await model.generateContent([systemPrompt, sourceText]);
    const response = result.response;
    const text = response.text();
    return JSON.parse(text);
  }
}; 