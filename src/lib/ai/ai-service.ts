// AI Service - Backward Compatibility Layer
// Provides unified interface supporting both legacy Gemini and new multi-provider AI Gateway

import type { AIProviderConfig } from '../../types/ai-config';
import { getDefaultAIConfig, getAIConfigs } from '../services/aiConfigService';
import { AIGatewayClient } from './ai-gateway';
import * as geminiModule from '../gemini';

class AIService {
  private gatewayClient: AIGatewayClient | null = null;
  private isUsingGateway = false;

  private async getClient(): Promise<AIGatewayClient> {
    if (this.gatewayClient) {
      return this.gatewayClient;
    }

    // Try to get user-configured AI provider
    const config = await getDefaultAIConfig();

    if (config) {
      this.gatewayClient = new AIGatewayClient(config);
      this.isUsingGateway = true;
      return this.gatewayClient;
    }

    // Fall back to legacy Gemini
    this.isUsingGateway = false;
    throw new Error('No AI configuration found. Please configure an AI provider in settings.');
  }

  // Legacy Gemini functions - now support both gateway and direct Gemini
  async generateOutline(idea: string, style: string): Promise<{ title: string; chapters: any[] }> {
    try {
      const client = await this.getClient();

      const systemInstruction = `You are an expert Novel Architect.
Your goal is to take a vague book idea and structurize it into a compelling chapter outline.
The style of the book is: ${style}.
Adhere to the "Hero's Journey" or "Save the Cat" beat sheets if applicable to the genre.`;

      const prompt = `Create a title and a chapter outline for this idea: "${idea}"
Please respond with a JSON object containing:
- title: string (book title)
- chapters: array of objects with orderIndex, title, and summary`;

      const result = await client.generateText(`${systemInstruction}\n\n${prompt}`);

      try {
        return JSON.parse(result);
      } catch {
        // If not valid JSON, try to extract JSON-like content
        const match = result.match(/\{[\s\S]*\}/);
        if (match) {
          return JSON.parse(match[0]);
        }
        throw new Error('Failed to parse outline response');
      }
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.generateOutline(idea, style);
    }
  }

  async writeChapterContent(
    chapterTitle: string,
    chapterSummary: string,
    style: string,
    previousChapterSummary?: string
  ): Promise<string> {
    try {
      const client = await this.getClient();

      const prompt = `
Write the full content for the chapter: "${chapterTitle}".
Context / Summary: ${chapterSummary}
${previousChapterSummary ? `Previously: ${previousChapterSummary}` : ''}
Style: ${style}.
Write in Markdown. Focus on "Show, Don't Tell". Use sensory details.
Output only the chapter content.`;

      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.writeChapterContent(chapterTitle, chapterSummary, style, previousChapterSummary);
    }
  }

  async continueWriting(currentContent: string, chapterSummary: string, style: string): Promise<string> {
    try {
      const client = await this.getClient();

      const context = currentContent.slice(-3000);
      const prompt = `
You are a co-author. Continue the story.
Style: ${style}
Goal: ${chapterSummary}
Rules: Seamlessly continue narrative. Maintain tone. Write 300-500 words. Output ONLY new content.
Context: ...${context}`;

      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.continueWriting(currentContent, chapterSummary, style);
    }
  }

  async refineChapterContent(
    content: string,
    chapterSummary: string,
    style: string,
    options: { model?: string; temperature?: number }
  ): Promise<string> {
    try {
      const client = await this.getClient();

      const prompt = `
Refine the following chapter content.
Style: ${style}
Goal: ${chapterSummary}
Instructions: Improve flow, prose, and dialogue. Fix grammar. Maintain tone. Do NOT change plot.
Content: ${content}`;

      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.refineChapterContent(content, chapterSummary, style, options);
    }
  }

  async analyzeConsistency(chapters: any[], style: string): Promise<string> {
    try {
      const client = await this.getClient();

      const bookContext = chapters.map(c => `Ch ${c.orderIndex} (${c.title}): ${c.summary}`).join('\n');
      const prompt = `
Analyze this outline for inconsistencies, plot holes, or tonal shifts.
Style: ${style}
Outline: ${bookContext}
INSTRUCTIONS: Identify up to 3 issues. For EACH, provide a "SUGGESTED FIX".`;

      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.analyzeConsistency(chapters, style);
    }
  }

  async brainstormProject(context: string, field: 'title' | 'style' | 'idea'): Promise<string> {
    try {
      const client = await this.getClient();

      const safeContext = context.substring(0, 50000);
      let prompt = '';

      if (field === 'title') prompt = `Generate a catchy book title for: "${safeContext}". Output ONLY title.`;
      else if (field === 'style') prompt = `Suggest a genre/style for: "${safeContext}". Output ONLY style.`;
      else if (field === 'idea') prompt = `Enhance this concept into a detailed paragraph: "${safeContext}"`;

      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.brainstormProject(context, field);
    }
  }

  async generateCoverImage(title: string, style: string, idea: string): Promise<string | null> {
    try {
      return await geminiModule.generateCoverImage(title, style, idea);
    } catch (error) {
      console.error('Cover generation failed:', error);
      return null;
    }
  }

  async generateChapterIllustration(title: string, summary: string, style: string): Promise<string | null> {
    try {
      return await geminiModule.generateChapterIllustration(title, summary, style);
    } catch (error) {
      console.error('Illustration generation failed:', error);
      return null;
    }
  }

  async translateContent(content: string, targetLanguage: string): Promise<string> {
    try {
      const client = await this.getClient();

      const prompt = `Translate markdown content to ${targetLanguage}. Maintain formatting and tone.\n\nContent:\n${content}`;
      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.translateContent(content, targetLanguage);
    }
  }

  async developCharacters(idea: string, style: string): Promise<string> {
    try {
      const client = await this.getClient();

      const prompt = `Create a character cast list for: ${idea}\nStyle: ${style}\nOutput Name, Role, Motivation, Conflict.`;
      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.developCharacters(idea, style);
    }
  }

  async buildWorld(idea: string, style: string): Promise<string> {
    try {
      const client = await this.getClient();

      const prompt = `Expand setting/lore for: ${idea}\nStyle: ${style}\nFocus on rules, atmosphere, locations.`;
      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.buildWorld(idea, style);
    }
  }

  async enhancePlot(idea: string, style: string): Promise<string> {
    try {
      const client = await this.getClient();

      const prompt = `Inject conflict and structure into: ${idea}\nStyle: ${style}\nProvide Inciting Incident, Twist, Climax setup.`;
      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.enhancePlot(idea, style);
    }
  }

  async polishDialogue(content: string, style: string): Promise<string> {
    try {
      const client = await this.getClient();

      const prompt = `Rewrite ONLY dialogue to be subtext-rich and distinct.\nStyle: ${style}\nText:\n${content}`;
      return await client.generateText(prompt);
    } catch (error) {
      console.warn('AI Gateway failed, falling back to Gemini:', error);
      return geminiModule.polishDialogue(content, style);
    }
  }

  async *streamText(prompt: string): AsyncGenerator<string> {
    try {
      const client = await this.getClient();

      for await (const chunk of client.streamText(prompt)) {
        yield chunk;
      }
    } catch (error) {
      console.warn('Streaming not available with Gemini, use generateText instead');
      yield '';
    }
  }

  getCurrentProvider(): string {
    return this.isUsingGateway ? 'AI Gateway' : 'Gemini (Legacy)';
  }

  async hasValidConfig(): Promise<boolean> {
    try {
      const configs = await getAIConfigs();
      return configs.length > 0;
    } catch {
      return false;
    }
  }
}

export const aiService = new AIService();

// Export all functions as named exports for backward compatibility
export const {
  generateOutline,
  writeChapterContent,
  continueWriting,
  refineChapterContent,
  analyzeConsistency,
  brainstormProject,
  generateCoverImage,
  generateChapterIllustration,
  translateContent,
  developCharacters,
  buildWorld,
  enhancePlot,
  polishDialogue,
  streamText,
  getCurrentProvider,
  hasValidConfig,
} = aiService;
