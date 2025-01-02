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
        ? `The content should be about ${options.maxLength} characters long.`
        : "The content should be about 200-300 characters long.";
      
      const systemPrompt = `Generate a Chinese reading article with the following format:
      1. A title in Chinese
      2. Main content in Chinese (${lengthInstruction})
      3. 3-5 relevant tags in Chinese
      4. 3 multiple choice questions about the content
      
      Format the response as a valid JSON object with the following structure:
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
      
      The content should be about: ${prompt}`;

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