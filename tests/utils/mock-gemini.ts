
import { Page } from '@playwright/test';

/**
 * Sets up network interception for Google GenAI API calls.
 * Returns realistic mock responses based on the prompt context.
 */
export const setupGeminiMock = async (page: Page) => {
  await page.route('**/generativelanguage.googleapis.com/**', async route => {
    const request = route.request();
    const postData = request.postDataJSON();
    const url = request.url();

    // Convert payload to string for easy fuzzy matching
    const payloadStr = JSON.stringify(postData || {});
    console.log(`[Mock Interceptor] ${url} | Context: ${payloadStr.substring(0, 30)}...`);

    // 1. Brainstorming
    if (payloadStr.includes('Generate a catchy book title for:')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: 'The Quantum Paradox' }] } }] })
      });
    }

    if (payloadStr.includes('Suggest a genre/style')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Hard Sci-Fi, Gritty' }] } }] })
      });
    }

    if (payloadStr.includes('Enhance this concept')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Enhanced Idea: A scientist discovers a time loop...' }] } }] })
      });
    }

    // 2. Outline Generation
    if (payloadStr.includes('Create a title and a chapter outline')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify({
                  title: 'The Quantum Paradox',
                  chapters: [
                    { orderIndex: 1, title: 'The Discovery', summary: 'Alice finds a strange device.' },
                    { orderIndex: 2, title: 'The Activation', summary: 'Alice turns it on.' }
                  ]
                })
              }]
            }
          }]
        })
      });
    }

    // 3. Chapter Writing & Continuing
    if (payloadStr.includes('Write the full content') || payloadStr.includes('You are a co-author')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '# Generated Content\n\nThe machine hummed with energy. Alice stepped back...' }] } }] })
      });
    }

    // 9. Dialogue Doctor
    if (payloadStr.includes('Rewrite ONLY dialogue') || payloadStr.includes('subtext-rich')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '# Polished Script\n\n"Don\'t touch that," he hissed.' }] } }] })
      });
    }

    // 4. Refinement
    if (payloadStr.includes('Refine the following chapter content')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '# Refined Content\n\nThe machine pulsed with a deep, rhythmic energy...' }] } }] })
      });
    }

    // 5. Consistency Analysis
    if (payloadStr.includes('Analyze the following book outline')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '**Issue 1**: Pacing issues in Chapter 2.\n- *Suggested Fix*: Add more conflict.' }] } }] })
      });
    }

    // --- NEW AGENTS ---

    // 6. Character Profiler
    if (payloadStr.includes('Create a character cast list')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '## Main Characters\n\n**Alice**: A brilliant physicist with a hidden past...' }] } }] })
      });
    }

    // 7. World Builder
    if (payloadStr.includes('Expand setting/lore')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '## Setting Rules\n\nThe year is 2145. Gravity is optional...' }] } }] })
      });
    }

    // 8. Plot Deepener
    if (payloadStr.includes('Inject conflict and structure')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '## Plot Enhancements\n\n1. **Inciting Incident**: The device isn\'t found, it\'s sent to her.' }] } }] })
      });
    }

    // 10. Image Generation (Imagen)
    if (url.includes('generateImages') || payloadStr.includes('generateImages') || (postData && postData.prompt && !postData.contents)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ generatedImages: [{ image: { imageBytes: 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7' } }] })
      });
    }

    // Fallback
    return route.continue();
  });
};
