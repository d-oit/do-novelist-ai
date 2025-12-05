import { http, HttpResponse } from 'msw';

/**
 * MSW Request Handlers for AI Service Mocking
 * These handlers intercept AI API calls during E2E tests and return realistic mock responses
 */

// Base URL patterns for AI services (supports both localhost and any domain)
const AI_GATEWAY_PATTERN = '*/v1/chat/completions';
const IMAGE_GENERATION_PATTERN = '*/v1/images/generations';

/**
 * Mock AI Chat Completions (Character Development, Dialogue Polish, Story Drafting)
 */
const chatCompletionsHandler = http.post(AI_GATEWAY_PATTERN, async ({ request }) => {
  const body = (await request.json()) as { messages?: Array<{ role: string; content: string }> };
  const userMessage = body.messages?.[body.messages.length - 1]?.content || '';

  // Generate realistic mock responses based on request context
  let mockContent = 'This is a mocked AI response for testing purposes.';

  if (userMessage.toLowerCase().includes('character')) {
    mockContent = `Character Profile Analysis:

**Name:** Alexandra Chen
**Age:** 28
**Occupation:** Cybersecurity Analyst

**Personality Traits:**
- Analytical and methodical in approach
- Strong sense of justice and ethics
- Introverted but fiercely loyal to close friends
- Perfectionist tendencies that sometimes cause self-doubt

**Background:**
Grew up in a tech-savvy household where her parents were early internet pioneers.

**Motivations:**
Driven by a desire to protect vulnerable systems and prevent cyber attacks.

**Conflicts:**
Struggles to balance her intense work focus with personal relationships.`;
  } else if (
    userMessage.toLowerCase().includes('dialogue') ||
    userMessage.toLowerCase().includes('polish')
  ) {
    mockContent = `"I understand your concerns," she said. "But we need to act now."

He turned to face her. "You're asking me to trust you with everything."

"I know. And I wouldn't ask if there were any other way."`;
  } else if (
    userMessage.toLowerCase().includes('draft') ||
    userMessage.toLowerCase().includes('write') ||
    userMessage.toLowerCase().includes('story')
  ) {
    mockContent = `The rain hammered against the windows of the old library. Sarah stood at the entrance, hesitating.

Inside lay the answers she'd been searching for. The truth about her grandmother's disappearance.

Taking a deep breath, she pushed the door open.`;
  }

  return HttpResponse.json({
    id: `chatcmpl-mock-${Date.now()}`,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: 'mistral-medium-latest',
    choices: [
      {
        index: 0,
        message: {
          role: 'assistant',
          content: mockContent,
        },
        finish_reason: 'stop',
      },
    ],
    usage: {
      prompt_tokens: 50,
      completion_tokens: 200,
      total_tokens: 250,
    },
  });
});

/**
 * Mock Image Generation (Cover Generator)
 */
const imageGenerationHandler = http.post(IMAGE_GENERATION_PATTERN, async () => {
  // Return a 1x1 pixel transparent PNG as data URI
  const transparentPNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  return HttpResponse.json({
    created: Math.floor(Date.now() / 1000),
    data: [
      {
        url: transparentPNG,
      },
    ],
  });
});

/**
 * Export all handlers
 */
export const handlers = [chatCompletionsHandler, imageGenerationHandler];
