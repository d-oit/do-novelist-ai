
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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
    polishDialogue
} from '../gemini';

// Mock @google/genai - use vi.hoisted() to ensure mocks are available during module hoisting
const { mockGenerateContent, mockGenerateImages, MockGoogleGenAI } = vi.hoisted(() => {
    const mockGenerateContent = vi.fn();
    const mockGenerateImages = vi.fn();

    class MockGoogleGenAI {
        models = {
            generateContent: mockGenerateContent,
            generateImages: mockGenerateImages
        };

        constructor(_config?: any) {
            // Mock constructor
        }
    }

    return {
        mockGenerateContent,
        mockGenerateImages,
        MockGoogleGenAI
    };
});

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: MockGoogleGenAI,
        Type: {
            OBJECT: 'OBJECT',
            STRING: 'STRING',
            ARRAY: 'ARRAY',
            INTEGER: 'INTEGER'
        }
    };
});

// Mock cache to avoid interference
vi.mock('./cache', () => ({
    withCache: (fn: any) => fn
}));

describe('Gemini AI Library', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('generateOutline', () => {
        it('should generate and parse outline correctly', async () => {
            const mockResponse = {
                text: JSON.stringify({
                    title: 'Test Book',
                    chapters: [
                        { orderIndex: 1, title: 'Chapter 1', summary: 'Summary 1' }
                    ]
                })
            };
            mockGenerateContent.mockResolvedValue(mockResponse);

            const result = await generateOutline('Test Idea', 'Fiction');

            expect(result.title).toBe('Test Book');
            expect(result.chapters).toHaveLength(1);
            expect(mockGenerateContent).toHaveBeenCalledWith(expect.objectContaining({
                contents: expect.stringContaining('Test Idea')
            }));
        });

        it('should handle errors gracefully', async () => {
            mockGenerateContent.mockRejectedValue(new Error('API Error'));
            await expect(generateOutline('Idea', 'Style')).rejects.toThrow('API Error');
        });
    });

    describe('writeChapterContent', () => {
        it('should generate chapter content', async () => {
            mockGenerateContent.mockResolvedValue({ text: '# Chapter Content' });

            const content = await writeChapterContent('Ch 1', 'Summary', 'Style');
            expect(content).toBe('# Chapter Content');
        });
    });

    describe('continueWriting', () => {
        it('should generate continuation', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Continued content' });

            const content = await continueWriting('Start...', 'Summary', 'Style');
            expect(content).toBe('Continued content');
        });
    });

    describe('refineChapterContent', () => {
        it('should refine content', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Refined content' });

            const content = await refineChapterContent('Original', 'Summary', 'Style', {
                temperature: 0.7,
                model: 'gemini-1.5-flash',
                maxTokens: 1000,
                topP: 0.9,
                focusAreas: ['style', 'grammar'],
                preserveLength: true
            });
            expect(content).toBe('Refined content');
        });
    });

    describe('analyzeConsistency', () => {
        it('should analyze consistency', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Issues found' });

            const result = await analyzeConsistency([], 'Style');
            expect(result).toBe('Issues found');
        });

        it('should return default message on error', async () => {
            mockGenerateContent.mockRejectedValue(new Error('Error'));
            const result = await analyzeConsistency([], 'Style');
            expect(result).toBe('Consistency check unavailable.');
        });
    });

    describe('brainstormProject', () => {
        it('should generate title', async () => {
            mockGenerateContent.mockResolvedValue({ text: '"New Title"' });
            const result = await brainstormProject('Context', 'title');
            expect(result).toBe('New Title');
        });

        it('should generate style', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Sci-Fi' });
            const result = await brainstormProject('Context', 'style');
            expect(result).toBe('Sci-Fi');
        });
    });

    describe('Image Generation', () => {
        it('should generate cover image', async () => {
            mockGenerateImages.mockResolvedValue({
                generatedImages: [{ image: { imageBytes: 'base64data' } }]
            });

            const result = await generateCoverImage('Title', 'Style', 'Idea');
            expect(result).toBe('data:image/png;base64,base64data');
        });

        it('should return null on image generation failure', async () => {
            mockGenerateImages.mockRejectedValue(new Error('Error'));
            const result = await generateCoverImage('Title', 'Style', 'Idea');
            expect(result).toBeNull();
        });

        it('should generate chapter illustration', async () => {
            mockGenerateImages.mockResolvedValue({
                generatedImages: [{ image: { imageBytes: 'base64data' } }]
            });
            const result = await generateChapterIllustration('Title', 'Summary', 'Style');
            expect(result).toBe('data:image/png;base64,base64data');
        });
    });

    describe('Translation', () => {
        it('should translate content', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Translated' });
            const result = await translateContent('Original', 'es');
            expect(result).toBe('Translated');
        });
    });

    describe('Agent Specialized Functions', () => {
        it('should develop characters', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Characters' });
            const result = await developCharacters('Idea', 'Style');
            expect(result).toBe('Characters');
        });

        it('should build world', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'World' });
            const result = await buildWorld('Idea', 'Style');
            expect(result).toBe('World');
        });

        it('should enhance plot', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Plot' });
            const result = await enhancePlot('Idea', 'Style');
            expect(result).toBe('Plot');
        });

        it('should polish dialogue', async () => {
            mockGenerateContent.mockResolvedValue({ text: 'Dialogue' });
            const result = await polishDialogue('Content', 'Style');
            expect(result).toBe('Dialogue');
        });
    });
});
