
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, RefineOptions } from "@shared/types";

// Initialize the client.
const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : '';
const ai = new GoogleGenAI({ apiKey });

/**
 * The Architect Agent: Generates an outline based on a raw idea.
 */
export const generateOutline = async (idea: string, style: string): Promise<{ title: string; chapters: Partial<Chapter>[] }> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const systemInstruction = `You are an expert Novel Architect. 
    Your goal is to take a vague book idea and structurize it into a compelling chapter outline.
    The style of the book is: ${style}.
    Adhere to the "Hero's Journey" or "Save the Cat" beat sheets if applicable to the genre.`;

    const response = await ai.models.generateContent({
      model,
      contents: `Create a title and a chapter outline for this idea: "${idea}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            chapters: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  orderIndex: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING, description: "A detailed paragraph summary of what happens in this chapter." },
                },
                required: ["orderIndex", "title", "summary"]
              }
            }
          },
          required: ["title", "chapters"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text returned from model");
    return JSON.parse(text);
  } catch (error) {
    console.error("Outline generation failed", error);
    throw error;
  }
};

/**
 * The Writer Agent: Writes a specific chapter content.
 */
export const writeChapterContent = async (
  chapterTitle: string, 
  chapterSummary: string, 
  style: string,
  previousChapterSummary?: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash'; 
    
    const prompt = `
    Write the full content for the chapter: "${chapterTitle}".
    
    Context / Summary of this chapter:
    ${chapterSummary}
    
    ${previousChapterSummary ? `Previously on this book: ${previousChapterSummary}` : ''}
    
    Maintain this style: ${style}.
    Write in Markdown format. 
    Crucial: Focus on "Show, Don't Tell". Use sensory details.
    Output only the chapter content, do not output the title.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.7 }
    });

    return response.text || "";
  } catch (error) {
    console.error("Chapter generation failed", error);
    throw error;
  }
};

/**
 * The Co-Author Agent: Continues writing from existing content.
 */
export const continueWriting = async (
  currentContent: string,
  chapterSummary: string,
  style: string
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    // Take the last ~3000 chars as context to ensure continuity without hitting token limits too fast
    const context = currentContent.slice(-3000);
    
    const prompt = `
    You are a co-author. Continue the story from the text provided below.
    
    Style: ${style}
    Chapter Goal: ${chapterSummary}
    
    Rules:
    - Seamlessly continue the narrative.
    - Maintain the tone, voice, and POV.
    - Write about 300-500 words.
    - Output ONLY the new content in Markdown. Do not repeat the input text.
    
    Previous Context:
    ...${context}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.75 }
    });

    return response.text || "";
  } catch (error) {
    console.error("Continue writing failed", error);
    throw error;
  }
};

/**
 * The Editor Agent: Refines existing content.
 */
export const refineChapterContent = async (
  content: string,
  chapterSummary: string,
  style: string,
  options: RefineOptions
): Promise<string> => {
  try {
    const model = options.model || 'gemini-2.5-flash';
    
    const prompt = `
    You are an expert Book Editor. Refine the following chapter content.
    
    Style Guide: ${style}
    Chapter Goal: ${chapterSummary}
    
    Instructions:
    - Improve flow, prose, and dialogue.
    - Fix grammatical errors.
    - Ensure the tone matches the style guide.
    - Do NOT change the plot or major events.
    - Output ONLY the refined content in Markdown.
    
    Current Content:
    ${content}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: options.temperature }
    });

    return response.text || content;
  } catch (error) {
    console.error("Chapter refinement failed", error);
    throw error;
  }
};

/**
 * The Editor Agent: Reviews content for consistency.
 */
export const analyzeConsistency = async (chapters: Chapter[], style: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    const bookContext = chapters.map(c => 
      `Chapter ${c.orderIndex} (${c.title}): ${c.summary}`
    ).join('\n');

    const prompt = `
    You are a Continuity Editor. Analyze the following book outline and style guide for logical inconsistencies, plot holes, or tonal shifts.
    Style Guide: ${style}
    Book Outline:
    ${bookContext}
    Identify up to 3 critical issues (if any) or provide positive feedback on the flow.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    
    return response.text || "No issues found.";
  } catch (error) {
    console.error("Consistency check failed", error);
    return "Consistency check unavailable at this time.";
  }
};

/**
 * Helper: Brainstorming Agent for Project Creation
 */
export const brainstormProject = async (
  context: string,
  field: 'title' | 'style' | 'idea'
): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    let prompt = '';

    const safeContext = context.substring(0, 50000);

    if (field === 'title') {
      prompt = `Generate a single, catchy, creative book title based on this idea/context: "${safeContext}". Output ONLY the title, no quotes.`;
    } else if (field === 'style') {
      prompt = `Suggest a compelling writing style and genre combo (e.g. "Cyberpunk Thriller, fast-paced" or "Victorian Mystery, atmospheric") for this idea: "${safeContext}". Output ONLY the style string.`;
    } else if (field === 'idea') {
      prompt = `Enhance this book concept into a detailed single-paragraph premise. Keep the core intent but add depth, conflict, and stakes: "${safeContext}"`;
    }

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.8 }
    });

    return response.text?.trim().replace(/^"|"$/g, '') || "";
  } catch (error) {
    console.error("Brainstorming failed", error);
    return "";
  }
};

/**
 * Generate Book Cover using Imagen
 */
export const generateCoverImage = async (
  title: string, 
  style: string, 
  idea: string
): Promise<string | null> => {
  try {
    const model = 'imagen-4.0-generate-001';
    
    const prompt = `
    A high quality, award-winning book cover for a novel titled "${title}".
    Genre & Style: ${style}.
    Core Concept: ${idea.substring(0, 300)}.
    Aesthetic: Cinematic, professional typography, evocative, detailed.
    Ensure the aspect ratio fits a standard book (3:4).
    No text overlay other than the title if possible, or text-free art.
    `;

    const response = await ai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1, aspectRatio: '3:4' },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Cover generation failed", error);
    return null;
  }
};

/**
 * Translation Agent
 */
export const translateContent = async (content: string, targetLanguage: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Translate the following markdown content into ${targetLanguage}.
    Maintain all markdown formatting (headers, bold, italic), structure, and the original tone/style.
    Do not add any translator notes.
    
    Content:
    ${content}
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: { temperature: 0.3 }
    });

    return response.text || "";
  } catch (error) {
    console.error("Translation failed", error);
    throw error;
  }
};
