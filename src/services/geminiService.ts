import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-pro",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        content: { type: SchemaType.STRING },
        tags: {
          type: SchemaType.ARRAY,
          items: { type: SchemaType.STRING }
        },
        quizzes: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              question: { type: SchemaType.STRING },
              options: {
                type: SchemaType.ARRAY,
                items: { type: SchemaType.STRING }
              },
              correctAnswer: { type: SchemaType.NUMBER }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      },
      required: ["title", "content", "tags", "quizzes"]
    }
  }
});

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

// Helper function to sanitize JSON string (kept as backup, though Gemini usually returns valid JSON)
const sanitizeJsonString = (str: string): string => {
  // Remove any markdown code block markers
  str = str.replace(/```(json)?\n?/g, '');
  
  // Remove any potential control characters
  str = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
  
  // Remove any potential leading/trailing non-JSON content
  str = str.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
  
  // Remove any trailing commas before closing brackets/braces
  str = str.replace(/,(\s*[}\]])/g, '$1');
  
  // Remove any non-JSON trailing content
  str = str.replace(/\s*\n*$/, '');
  
  return str;
};

const generateWithGemini = async (prompt: string): Promise<GeneratedArticle> => {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY is not set");
  }

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Sometimes Gemini might wrap in markdown blocks even with mime type set, 
    // or if the model decides to be chatty.
    // But with responseSchema it should be strict.
    
    // Parse the JSON
    // We can try direct parse first
    try {
      return JSON.parse(text) as GeneratedArticle;
    } catch (e) {
      // If direct parse fails, try sanitizing
      const sanitized = sanitizeJsonString(text);
      return JSON.parse(sanitized) as GeneratedArticle;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const geminiService = {
  async generateArticle(prompt: string, options: GenerationOptions = {}): Promise<GeneratedArticle> {
    try {
      const lengthInstruction = options.maxLength 
        ? `文章长度大约${options.maxLength}个汉字`
        : "文章长度大约300个汉字";
      
      const systemPrompt = `请生成一篇中文阅读文章，要求如下：
      1. 中文标题
      2. 正文内容（${lengthInstruction}）
      3. 3-5个相关标签
      4. 3个与内容相关的选择题
      
      文章主题：${prompt}
      
      文章必须适合低年级小学生阅读水平，汉字应该使用常用汉字，风格要好玩，幽默，内容属于正向价值观。
      注意：请确保文章长度接近${options.maxLength || 300}个汉字。`;

      return await generateWithGemini(systemPrompt);
    } catch (error) {
      console.error("Error generating article:", error);
      throw error;
    }
  },

  async generateFromText(sourceText: string, options: GenerationOptions = {}): Promise<GeneratedArticle> {
    try {
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

      原文内容：
      ${sourceText}
      
      注意：
      1. 请确保文章长度接近${options.maxLength || 300}个汉字
      2. 使用低年级小学生容易理解的语言和汉字
      3. 保持内容有趣且富有教育意义`;

      return await generateWithGemini(systemPrompt);
    } catch (error) {
      console.error("Error generating article from text:", error);
      throw error;
    }
  },

  async generateMetadata(sourceText: string): Promise<GeneratedArticle> {
    const systemPrompt = `You are a Chinese language learning assistant. For the given Chinese text:
    1. Generate an appropriate title if not obvious from the text
    2. Keep the original content exactly as is
    3. Generate relevant tags for categorization
    4. Create 3 multiple choice questions to test comprehension
    
    Important:
    - Use simplified Chinese characters in the questions and options
    - Keep questions at an easy level (HSK 1-2)
    - Make sure 1 of questions test understanding, not just vocabulary
    - Each question should have 4 options
    
    Input text:
    ${sourceText}`;

    return await generateWithGemini(systemPrompt);
  }
};