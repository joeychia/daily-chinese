const KIMI_API_ENDPOINT = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_API_KEY = import.meta.env.VITE_KIMI_API_KEY || '';

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

const generateWithKimi = async (prompt: string): Promise<string> => {
  const response = await fetch(KIMI_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${KIMI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'moonshot-v1-8k',
      messages: [
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      response_format: {type: "json_object"}
    })
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
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
      
      文章必须适合低年级小学生阅读水平，汉字应该使用常用汉字，风格要好玩，幽默，内容属于正向价值观。
      注意：请确保文章长度接近${options.maxLength || 300}个汉字。`;

      const text = await generateWithKimi(systemPrompt);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse generated content");
      }
      
      const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
      try {
        const article = JSON.parse(sanitizedJson) as GeneratedArticle;
        return article;
      } catch (error) {
        const err = error as any;
        console.error('Error parsing JSON:', err);
        console.error('Raw response:', text);
        console.error('Sanitized JSON:', sanitizedJson);
        console.error('Error position:', err.position);
        console.error('Error context:', sanitizedJson.slice(Math.max(0, err.position - 20), err.position + 20));
        throw new Error('Failed to parse JSON response from Kimi');
      }
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
      2. 使用低年级小学生容易理解的语言和汉字
      3. 保持内容有趣且富有教育意义`;

      const text = await generateWithKimi(systemPrompt);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse generated content");
      }
      
      const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
      try {
        const article = JSON.parse(sanitizedJson) as GeneratedArticle;
        return article;
      } catch (error) {
        const err = error as any;
        console.error('Error parsing JSON:', err);
        console.error('Raw response:', text);
        console.error('Sanitized JSON:', sanitizedJson);
        console.error('Error position:', err.position);
        console.error('Error context:', sanitizedJson.slice(Math.max(0, err.position - 20), err.position + 20));
        throw new Error('Failed to parse JSON response from Kimi');
      }
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
    
    Format the response as a JSON object with the following structure (do not include any markdown formatting or backticks):
    {
      "title": "标题",
      "content": "原文内容(保持不变)",
      "tags": ["标签1", "标签2", ...],
      "quizzes": [
        {
          "question": "问题",
          "options": ["选项1", "选项2", "选项3", "选项4"],
          "correctAnswer": 0
        },
        ...
      ]
    }`;

    const escapedSourceText = sourceText.replace(/"/g, '\\"');
    const text = await generateWithKimi(`${systemPrompt}\n\n${escapedSourceText}`);
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse generated content");
    }
    
    const sanitizedJson = sanitizeJsonString(jsonMatch[0]);
    try {
      return JSON.parse(sanitizedJson) as GeneratedArticle;
    } catch (error) {
      const err = error as any;
      console.error('Error parsing JSON:', err);
      console.error('Raw response:', text);
      console.error('Sanitized JSON:', sanitizedJson);
      console.error('Error position:', err.position);
      console.error('Error context:', sanitizedJson.slice(Math.max(0, err.position - 20), err.position + 20));
      throw new Error('Failed to parse JSON response from Kimi');
    }
  }
};