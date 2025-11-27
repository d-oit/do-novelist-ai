
import { GoogleGenAI, Type } from "@google/genai";
import { Chapter, RefineOptions } from "../types/index";
import { withCache } from "./cache";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const _generateOutline = async (idea: string, style: string): Promise<{ title: string; chapters: Partial<Chapter>[] }> => {
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
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Outline generation failed", error);
    throw error;
  }
};

export const generateOutline = withCache(_generateOutline, 'generateOutline');

export const writeChapterContent = async (chapterTitle: string, chapterSummary: string, style: string, previousChapterSummary?: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
    Write the full content for the chapter: "${chapterTitle}".
    Context / Summary: ${chapterSummary}
    ${previousChapterSummary ? `Previously: ${previousChapterSummary}` : ''}
    Style: ${style}.
    Write in Markdown. Focus on "Show, Don't Tell". Use sensory details.
    Output only the chapter content.`;

    const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.7 } });
    return response.text || "";
  } catch (error) {
    console.error("Chapter generation failed", error);
    throw error;
  }
};

export const continueWriting = async (currentContent: string, chapterSummary: string, style: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const context = currentContent.slice(-3000);
    const prompt = `
    You are a co-author. Continue the story.
    Style: ${style}
    Goal: ${chapterSummary}
    Rules: Seamlessly continue narrative. Maintain tone. Write 300-500 words. Output ONLY new content.
    Context: ...${context}`;

    const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.75 } });
    return response.text || "";
  } catch (error) {
    console.error("Continue writing failed", error);
    throw error;
  }
};

export const refineChapterContent = async (content: string, chapterSummary: string, style: string, options: RefineOptions): Promise<string> => {
  try {
    const model = options.model || 'gemini-2.5-flash';
    const prompt = `
    Refine the following chapter content.
    Style: ${style}
    Goal: ${chapterSummary}
    Instructions: Improve flow, prose, and dialogue. Fix grammar. Maintain tone. Do NOT change plot.
    Content: ${content}`;

    const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: options.temperature } });
    return response.text || content;
  } catch (error) {
    console.error("Refinement failed", error);
    throw error;
  }
};

export const analyzeConsistency = async (chapters: Chapter[], style: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const bookContext = chapters.map(c => `Ch ${c.orderIndex} (${c.title}): ${c.summary}`).join('\n');
    const prompt = `
    Analyze this outline for inconsistencies, plot holes, or tonal shifts.
    Style: ${style}
    Outline: ${bookContext}
    INSTRUCTIONS: Identify up to 3 issues. For EACH, provide a "SUGGESTED FIX".`;

    const response = await ai.models.generateContent({ model, contents: prompt });
    return response.text || "No issues found.";
  } catch (error) {
    return "Consistency check unavailable.";
  }
};

export const brainstormProject = async (context: string, field: 'title' | 'style' | 'idea'): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    let prompt = '';
    const safeContext = context.substring(0, 50000);
    if (field === 'title') prompt = `Generate a catchy book title for: "${safeContext}". Output ONLY title.`;
    else if (field === 'style') prompt = `Suggest a genre/style for: "${safeContext}". Output ONLY style.`;
    else if (field === 'idea') prompt = `Enhance this concept into a detailed paragraph: "${safeContext}"`;

    const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.8 } });
    return response.text?.trim().replace(/^"|"$/g, '') || "";
  } catch (error) {
    return "";
  }
};

export const generateCoverImage = async (title: string, style: string, idea: string): Promise<string | null> => {
  try {
    const model = 'imagen-4.0-generate-001';
    const prompt = `Book cover for "${title}". Style: ${style}. Concept: ${idea.substring(0, 300)}. Cinematic, no text overlay. Aspect Ratio 3:4.`;
    const response = await ai.models.generateImages({ model, prompt, config: { numberOfImages: 1, aspectRatio: '3:4' } });
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    return base64 ? `data:image/png;base64,${base64}` : null;
  } catch (error) {
    return null;
  }
};

export const generateChapterIllustration = async (title: string, summary: string, style: string): Promise<string | null> => {
  try {
    const model = 'imagen-4.0-generate-001';
    const prompt = `
    Cinematic illustration for a book chapter titled "${title}".
    Scene context: ${summary}.
    Art Style: ${style}.
    High detailed, atmospheric, wide shot.
    Aspect Ratio 16:9.
    No text.
    `;
    const response = await ai.models.generateImages({
      model,
      prompt,
      config: { numberOfImages: 1, aspectRatio: '16:9' }
    });
    const base64 = response.generatedImages?.[0]?.image?.imageBytes;
    return base64 ? `data:image/png;base64,${base64}` : null;
  } catch (error) {
    console.error("Illustration generation failed", error);
    return null;
  }
};

export const translateContent = async (content: string, targetLanguage: string): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Translate markdown content to ${targetLanguage}. Maintain formatting and tone.\n\nContent:\n${content}`;
    const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.3 } });
    return response.text || "";
  } catch (error) {
    throw error;
  }
};

export const developCharacters = async (idea: string, style: string): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const prompt = `Create a character cast list for: ${idea}\nStyle: ${style}\nOutput Name, Role, Motivation, Conflict.`;
  const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.8 } });
  return response.text || "";
};

export const buildWorld = async (idea: string, style: string): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const prompt = `Expand setting/lore for: ${idea}\nStyle: ${style}\nFocus on rules, atmosphere, locations.`;
  const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.85 } });
  return response.text || "";
};

export const enhancePlot = async (idea: string, style: string): Promise<string> => {
  const model = 'gemini-3-pro-preview';
  const prompt = `Inject conflict and structure into: ${idea}\nStyle: ${style}\nProvide Inciting Incident, Twist, Climax setup.`;
  const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.7 } });
  return response.text || "";
};

export const polishDialogue = async (content: string, style: string): Promise<string> => {
  const model = 'gemini-2.5-flash';
  const prompt = `Rewrite ONLY dialogue to be subtext-rich and distinct.\nStyle: ${style}\nText:\n${content}`;
  const response = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.6 } });
  return response.text || "";
};
