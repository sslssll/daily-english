import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Topic, Article, VocabItem, ChatMessage, ArticleAnalysis, DifficultyLevel } from "../types";

// Helper to get client
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key is missing");
  return new GoogleGenAI({ apiKey });
};

// 1. Get Daily Topics
export const fetchDailyTopics = async (): Promise<Topic[]> => {
  const ai = getClient();
  const prompt = `
    Generate 3 distinct and engaging English news topics for today.
    The audience is a Chinese learner of English.
    Topics should be varied (e.g., Technology, Culture, Science, Lifestyle).
    Return strictly JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING, description: "Engaging title in English" },
              description: { type: Type.STRING, description: "Short summary in Chinese" },
              category: { type: Type.STRING }
            },
            required: ["id", "title", "description", "category"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error fetching topics:", error);
    return [
      { id: "1", title: "Global Warming Effects", description: "全球变暖对沿海城市的影响", category: "Science" },
      { id: "2", title: "The Future of AI", description: "人工智能如何改变我们的工作方式", category: "Technology" },
      { id: "3", title: "Healthy Morning Routines", description: "开启高效一天的健康晨间习惯", category: "Lifestyle" },
    ];
  }
};

// 2. Generate Article based on Topic and Difficulty
export const generateArticleContent = async (topic: Topic, dateStr: string, level: DifficultyLevel = 'B1'): Promise<Article> => {
  const ai = getClient();
  
  const levelDescriptions: Record<DifficultyLevel, string> = {
    'A1': 'Beginner (A1). Very basic vocabulary, short simple sentences, present simple tense mostly.',
    'A2': 'Elementary (A2). Basic everyday vocabulary, simple structures, some past/future tenses.',
    'B1': 'Intermediate (B1). Standard vocabulary (approx 3000 words), clear standard language.',
    'B2': 'Upper Intermediate (B2). Complex text, abstract topics, technical discussions.',
    'C1': 'Advanced (C1). Sophisticated vocabulary, complex sentence structures, implicit meanings.',
    'C2': 'Mastery (C2). Academic/literary level, nuance, very advanced idioms and structure.'
  };

  const prompt = `
    Write a news article/report in English about: "${topic.title}".
    
    CRITICAL CONSTRAINTS:
    1. Target Level: ${levelDescriptions[level]}.
    2. Length: Approximately 200-350 words depending on level complexity.
    3. Format: Standard journalism style.
    
    Topic Context: ${topic.description}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  return {
    id: crypto.randomUUID(),
    date: dateStr,
    title: topic.title,
    content: response.text || "Failed to generate article.",
    topic: topic,
    difficulty: level
  };
};

// 3. Generate Audio for Text
export const generateAudio = async (text: string): Promise<string | null> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating audio:", error);
    return null;
  }
};

export const generateArticleAudio = generateAudio;

// 4. Define a word
export const defineWord = async (word: string, contextSentence?: string): Promise<VocabItem> => {
  const ai = getClient();
  
  const systemInstruction = `
    You are a witty, knowledgeable, and friendly English learning companion for a Chinese user.
    When explaining a word or phrase:
    1.  **Tone**: Relaxed, interesting, conversational (like a friend chatting). Avoid dry textbook definitions.
    2.  **Explanation Content**: Briefly cover cultural context, usage scenarios, tone, and differences with synonyms or confusingly similar words if applicable.
    3.  **Brevity**: Go straight to the point. Be very concise.
    4.  **Language**: The explanation and translations must be in Chinese.
  `;

  const prompt = `
    Explain the English word/phrase: "${word}".
    ${contextSentence ? `Context from article: "${contextSentence}"` : "No specific context provided."}
    
    Return JSON with:
    - translation: Chinese translation.
    - explanation: The fun, friend-like explanation described above.
    - visualPrompt: A short, vivid English description of a concept image that represents this word.
    - examples: EXACTLY 2 distinct example sentences. Each with 'english' and 'chinese' keys.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: { type: Type.STRING },
            explanation: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            examples: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  english: { type: Type.STRING },
                  chinese: { type: Type.STRING }
                },
                required: ["english", "chinese"]
              }
            }
          },
          required: ["translation", "explanation", "visualPrompt", "examples"]
        }
      }
    });
    
    const data = JSON.parse(response.text || "{}");
    return {
      id: crypto.randomUUID(),
      word,
      translation: data.translation || "Translation unavailable",
      explanation: data.explanation || "No explanation available.",
      visualPrompt: data.visualPrompt || "Abstract shapes",
      examples: data.examples || [],
      addedAt: Date.now()
    };
  } catch (e) {
    console.error("Definition error", e);
    return {
      id: crypto.randomUUID(),
      word,
      translation: "未知",
      explanation: "Could not retrieve definition.",
      visualPrompt: "Question mark",
      examples: [],
      addedAt: Date.now()
    };
  }
};

// 5. Generate Story from Words
export const generateStoryFromWords = async (words: string[]): Promise<{title: string, content: string}> => {
  const ai = getClient();
  const wordList = words.slice(0, 10).join(", ");
  const prompt = `
    Create a fun, short, and creative story (approx 100-150 words) that incorporates the following English words: ${wordList}.
    The story should be suitable for an intermediate learner.
    Highlight the keywords in the text if possible (using markdown bold).
    Return JSON with 'title' and 'content'.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          }
        }
      }
    });
    return JSON.parse(response.text || '{"title": "Story", "content": "Could not generate story."}');
  } catch (e) {
    return { title: "Error", content: "Failed to generate story." };
  }
};

// 6. Generate Concept Image
export const generateWordImage = async (visualPrompt: string): Promise<string | undefined> => {
  const ai = getClient();
  const prompt = `Generate a simple, clear, illustrative image for a flashcard based on this description: ${visualPrompt}. 
  Style: Minimalist, vector art, colorful.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', 
      contents: {
        parts: [{ text: prompt }]
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
         return part.inlineData.data;
      }
    }
    return undefined;
  } catch (e) {
    console.error("Image gen failed", e);
    return undefined;
  }
};

// 7. Chat with Word
export const chatAboutWord = async (
  word: string, 
  wordInfo: VocabItem, 
  history: ChatMessage[], 
  newMessage: string
): Promise<string> => {
  const ai = getClient();
  
  const historyContent = history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const systemInstruction = `
    You are a helpful English tutor. The user is asking about the word "${word}".
    
    Definition provided to user: ${wordInfo.explanation}
    Context/Examples: ${JSON.stringify(wordInfo.examples)}
    
    Answer the user's question about this word. 
    Keep it friendly, concise, and educational.
  `;

  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    history: historyContent,
    config: { systemInstruction }
  });

  const response = await chat.sendMessage({ message: newMessage });
  return response.text || "I couldn't understand that.";
};

// 8. Analyze Article
export const generateArticleAnalysis = async (content: string): Promise<ArticleAnalysis> => {
  const ai = getClient();
  
  const prompt = `
    Analyze this English article for a Chinese learner.
    Article content:
    "${content}"

    Task:
    1. Break down the article sentence by sentence. For each sentence, provide a Chinese translation.
    2. Identify if a sentence is "complex" (long, difficult structure, or advanced grammar). If yes, provide a brief grammar analysis.
    3. Identify ALL distinct grammar points appearing in the article. Group the sentences under these grammar points.

    Return JSON matching this schema:
    {
       "sentences": [ { "original": "", "translation": "", "isComplex": boolean, "grammarNotes": "Analysis if complex" } ],
       "grammarPoints": [ { "point": "Name of Grammar Point", "explanation": "Brief explanation", "sentences": ["Original sentence 1", "Original sentence 2"] } ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentences: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  original: { type: Type.STRING },
                  translation: { type: Type.STRING },
                  isComplex: { type: Type.BOOLEAN },
                  grammarNotes: { type: Type.STRING, nullable: true },
                },
                required: ["original", "translation", "isComplex"]
              }
            },
            grammarPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  point: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  sentences: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["point", "explanation", "sentences"]
              }
            }
          },
          required: ["sentences", "grammarPoints"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Analysis failed", error);
    return { sentences: [], grammarPoints: [] };
  }
};
