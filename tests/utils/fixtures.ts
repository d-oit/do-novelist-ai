/**
 * Test data fixtures for Novelist.ai E2E testing
 *
 * Provides consistent, reliable test data for all test scenarios
 */

export interface TestProject {
  id: string;
  title: string;
  idea: string;
  style: string;
  chapters: TestChapter[];
  settings: TestProjectSettings;
  metadata?: {
    createdAt: Date;
    updatedAt: Date;
    wordCount: number;
  };
}

export interface TestChapter {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'review' | 'approved';
  orderIndex: number;
}

export interface TestProjectSettings {
  enableDropCaps: boolean;
  theme: 'light' | 'dark';
  autoSave: boolean;
}

// Base test project for consistent testing
export const BASE_TEST_PROJECT: TestProject = {
  id: 'test-project-base',
  title: 'The Great Adventure',
  idea: "A story about courage, friendship, and discovering one's true potential in a world of magic and mystery.",
  style: 'Fantasy Fiction',
  chapters: [],
  settings: {
    enableDropCaps: true,
    theme: 'light',
    autoSave: true,
  },
  metadata: {
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
    wordCount: 0,
  },
};

// Sample chapters for testing
export const SAMPLE_CHAPTERS: TestChapter[] = [
  {
    id: 'chapter-1',
    title: 'The Journey Begins',
    content: `The sun rose over the misty mountains, casting golden rays across the ancient forest. 
Alex stood at the edge of the village, backpack in hand, heart racing with anticipation and fear. 
This was it - the day everything would change forever.

"The road ahead may be uncertain," whispered Elena, his oldest friend, "but remember what your grandmother always said - 
'Every great adventure begins with a single step.'"

Alex nodded, gripping the weathered map his grandfather had left him. 
The parchment showed the route to the Crystal Peaks, where legend spoke of a power that could heal any wound and restore life itself.

Taking a deep breath, Alex stepped onto the cobblestone path that led out of the village. 
Behind him, the bells of the clock tower chimed nine times, marking the beginning of an odyssey 
that would test every fiber of his being.`,
    status: 'approved',
    orderIndex: 1,
  },
  {
    id: 'chapter-2',
    title: 'The Enchanted Forest',
    content: `Three days into the journey, the familiar landscape of home gave way to something mystical and strange. 
The trees here grew taller than any Alex had seen, their branches weaving together in patterns 
that seemed almost deliberate, almost purposeful.

As twilight approached, a soft, ethereal glow began to emanate from the forest floor. 
Tiny luminescent flowers carpeted the path, creating a natural light show that filled Alex with wonder 
and unease in equal measure.

"That's the Whisperflowers," came a gentle voice from the shadows. 
A young woman emerged from behind a massive oak tree, her eyes reflecting the forest's magical light.

"I'm Lyra," she said, bowing slightly. "Guardian of these woods, and apparently, your guide for what comes next."`,
    status: 'draft',
    orderIndex: 2,
  },
  {
    id: 'chapter-3',
    title: 'The Crystal Chamber',
    content: `The entrance to the Crystal Peaks was unlike anything Alex had imagined. 
Instead of a cave or mountain pass, a massive chamber carved from pure crystal stretched before them, 
its walls catching and refracting light in impossible ways.

"This is where the true test begins," Lyra explained, her voice echoing strangely in the chamber. 
"The Crystal of Life tests not just your courage, but your heart. It reveals the truth of who you are 
and what you're truly willing to sacrifice."

As they moved deeper into the chamber, the air grew thick with an energy that seemed to pulse 
with the rhythm of a great heart. At the center, floating above a pedestal of ancient stone, 
rested a gem that radiated both warmth and power.

Alex approached slowly, each step feeling like a journey in itself. 
When he finally reached out and grasped the Crystal, the world exploded into a kaleidoscope of light, 
memory, and possibility.`,
    status: 'review',
    orderIndex: 3,
  },
];

// Test users for authentication and profile testing
export interface TestUser {
  id: string;
  name: string;
  email: string;
  preferences: {
    theme: 'light' | 'dark';
    language: string;
    aiProvider: string;
    autoSave: boolean;
  };
}

export const TEST_USERS: TestUser[] = [
  {
    id: 'test-user-alice',
    name: 'Alice Writer',
    email: 'alice@test.com',
    preferences: {
      theme: 'light',
      language: 'en',
      aiProvider: 'mistral',
      autoSave: true,
    },
  },
  {
    id: 'test-user-bob',
    name: 'Bob Author',
    email: 'bob@test.com',
    preferences: {
      theme: 'dark',
      language: 'en',
      aiProvider: 'openai',
      autoSave: false,
    },
  },
];

// Test AI prompts for different functionality testing
export interface TestPrompt {
  category: 'brainstorm' | 'generate' | 'enhance' | 'translate';
  title: string;
  input: string;
  expectedResponse: string;
}

export const TEST_PROMPTS: TestPrompt[] = [
  {
    category: 'brainstorm',
    title: 'Novel Title Generation',
    input: 'A story about time travel and consequences',
    expectedResponse: 'Title suggestions for time travel story',
  },
  {
    category: 'generate',
    title: 'Character Development',
    input: 'Create a complex protagonist with unique abilities',
    expectedResponse: 'Detailed character profile',
  },
  {
    category: 'enhance',
    title: 'Dialogue Enhancement',
    input: 'Improve this conversation between two friends',
    expectedResponse: 'Enhanced dialogue with better flow',
  },
  {
    category: 'translate',
    title: 'Language Translation',
    input: 'Translate this passage to French',
    expectedResponse: 'French translation maintaining meaning and tone',
  },
];

// Utility functions for creating test data
export class TestDataFactory {
  /**
   * Create a test project with specified properties
   */
  static createTestProject(overrides: Partial<TestProject> = {}): TestProject {
    return {
      ...BASE_TEST_PROJECT,
      id: `test-project-${Date.now()}`,
      title: overrides.title || `Test Novel ${Date.now()}`,
      idea: overrides.idea || 'A compelling test story for E2E validation',
      style: overrides.style || 'Science Fiction',
      chapters: overrides.chapters || [],
      settings: {
        ...BASE_TEST_PROJECT.settings,
        ...overrides.settings,
      },
      metadata: {
        ...BASE_TEST_PROJECT.metadata!,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  /**
   * Create a test chapter with specified properties
   */
  static createTestChapter(overrides: Partial<TestChapter> = {}): TestChapter {
    return {
      id: `chapter-${Date.now()}`,
      title: overrides.title || 'Test Chapter',
      content: overrides.content || 'This is test chapter content for validation purposes.',
      status: overrides.status || 'draft',
      orderIndex: overrides.orderIndex || 1,
    };
  }

  /**
   * Create a project with sample chapters
   */
  static createProjectWithChapters(chapterCount: number = 3): TestProject {
    const chapters = SAMPLE_CHAPTERS.slice(0, chapterCount).map((chapter, index) => ({
      ...chapter,
      id: `test-chapter-${index + 1}`,
      orderIndex: index + 1,
    }));

    return this.createTestProject({
      chapters,
      metadata: {
        ...BASE_TEST_PROJECT.metadata!,
        wordCount: chapters.reduce(
          (total, chapter) => total + chapter.content.split(' ').length,
          0,
        ),
      },
    });
  }

  /**
   * Create test user with specified preferences
   */
  static createTestUser(overrides: Partial<TestUser> = {}): TestUser {
    const baseUser = TEST_USERS[0];
    if (!baseUser) {
      throw new Error('No base test user available');
    }
    return {
      ...baseUser,
      id: `test-user-${Date.now()}`,
      name: overrides.name || 'Test User',
      email: overrides.email || `test${Date.now()}@example.com`,
      preferences: {
        ...baseUser.preferences,
        ...overrides.preferences,
      },
    };
  }
}
