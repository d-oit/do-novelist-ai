/**
 * Help Center content data
 */

export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  description: string;
  articles: HelpArticle[];
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  relatedArticles?: string[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: '🚀',
    description: 'Quick start guides for new users',
    articles: [
      {
        id: 'welcome',
        title: 'Welcome to Novelist.ai',
        content: `# Welcome to Novelist.ai

Novelist.ai is an AI-powered novel writing assistant that helps you create, manage, and publish your stories.

## Key Features

- **Project Management**: Organize your novel projects with chapters, characters, and settings
- **AI Writing Assistant**: Generate and refine content with advanced AI models
- **Plot Engine**: Visualize story arcs and character relationships
- **World Building**: Create detailed locations, cultures, and lore
- **Publishing**: Export your work in multiple formats

## Getting Started

1. Create your first project using the project wizard
2. Add chapters and start writing
3. Use AI features to enhance your writing
4. Track your progress with metrics and analytics
`,
        tags: ['beginner', 'overview'],
      },
      {
        id: 'first-project',
        title: 'Creating Your First Project',
        content: `# Creating Your First Project

Follow these steps to create your first novel project:

## Step 1: Click "New Project"

Navigate to the Projects view and click the "New Project" button.

## Step 2: Fill in Project Details

- **Title**: Give your novel a working title
- **Genre**: Select the genre (optional, helps AI suggestions)
- **Description**: Write a brief synopsis or idea

## Step 3: Configure AI Settings (Optional)

- Choose your preferred AI model
- Set temperature for creativity level
- Configure other AI parameters

## Step 4: Create Your Project

Click "Create Project" to get started!

## What's Next?

- Create chapters for your story
- Add characters and locations
- Start writing or use AI to generate content
`,
        tags: ['beginner', 'project'],
        relatedArticles: ['chapters', 'ai-features'],
      },
    ],
  },
  {
    id: 'projects-chapters',
    title: 'Projects & Chapters',
    icon: '📚',
    description: 'Managing your writing projects',
    articles: [
      {
        id: 'chapters',
        title: 'Working with Chapters',
        content: `# Working with Chapters

Chapters are the building blocks of your novel. Here's how to work with them:

## Creating Chapters

1. Open your project
2. Click "Add Chapter" in the chapters list
3. Enter the chapter title
4. Optionally add a summary

## Editing Chapters

Click on any chapter to edit its:
- Title
- Summary
- Content

## Chapter Actions

- **Edit**: Modify chapter content
- **Refine**: Use AI to improve writing
- **Continue**: Generate more content
- **Delete**: Remove a chapter (cannot be undone)

## Tips

- Write summaries to track plot points
- Use the word count to track progress
- AI Refine works best on complete drafts
`,
        tags: ['chapter', 'editing'],
        relatedArticles: ['first-project', 'ai-features'],
      },
      {
        id: 'characters',
        title: 'Managing Characters',
        content: `# Managing Characters

Build memorable characters with detailed profiles.

## Adding Characters

1. Go to World Building view
2. Click "Add Character"
3. Fill in character details:
   - Name
   - Description
   - Personality traits
   - Background
   - Relationships

## Character Features

- **Voice Analysis**: Track dialogue patterns
- **Relationships**: Map character connections
- **Appearance**: Store visual descriptions

## Using Characters in Writing

Characters are automatically available in:
- AI content generation
- Dialogue analysis
- Plot suggestions
`,
        tags: ['character', 'world-building'],
        relatedArticles: ['locations', 'plot-engine'],
      },
    ],
  },
  {
    id: 'ai-features',
    title: 'AI Features',
    icon: '🤖',
    description: 'Using AI writing assistance',
    articles: [
      {
        id: 'ai-generate',
        title: 'AI Content Generation',
        content: `# AI Content Generation

Generate content with AI using multiple modes.

## Generation Modes

### Continue Writing
Extend your chapter naturally based on existing content.

### Rewrite
Rephrase or restructure selected text.

### Generate from Prompt
Create content from scratch using a custom prompt.

### Brainstorm
Generate ideas for plot points, characters, or scenes.

## Tips for Better Results

- Be specific with prompts
- Provide context and examples
- Use appropriate temperature settings
- Review and edit AI-generated content
`,
        tags: ['ai', 'generation'],
        relatedArticles: ['ai-refine', 'ai-settings'],
      },
      {
        id: 'ai-refine',
        title: 'AI Content Refinement',
        content: `# AI Content Refinement

Improve your writing with AI-powered editing.

## Refinement Options

- **Grammar**: Fix spelling and grammar errors
- **Style**: Enhance sentence structure and flow
- **Pacing**: Adjust the rhythm of your writing
- **Tone**: Match your desired writing style

## Using Refine

1. Select content to refine (chapter or text selection)
2. Click the "Refine" button
3. Choose refinement options
4. Review and accept/reject changes

## Preserving Length

Enable "Preserve Length" to maintain word count while improving quality.
`,
        tags: ['ai', 'editing'],
        relatedArticles: ['ai-generate', 'ai-settings'],
      },
    ],
  },
  {
    id: 'plot-engine',
    title: 'Plot Engine',
    icon: '📊',
    description: 'Story structure and visualization',
    articles: [
      {
        id: 'plot-overview',
        title: 'Plot Engine Overview',
        content: `# Plot Engine Overview

Visualize and analyze your story structure with the Plot Engine.

## Features

- **Story Arcs**: Track major plot threads
- **Character Graphs**: See character relationships
- **Timeline View**: Visualize chronological events
- **Scene Mapping**: Organize scenes by location or theme

## Benefits

- Identify plot holes
- Track story pacing
- Understand character arcs
- Plan future developments
`,
        tags: ['plot', 'visualization'],
        relatedArticles: ['chapters', 'characters'],
      },
    ],
  },
  {
    id: 'world-building',
    title: 'World Building',
    icon: '🌍',
    description: 'Creating immersive settings',
    articles: [
      {
        id: 'locations',
        title: 'Creating Locations',
        content: `# Creating Locations

Build detailed settings for your story.

## Location Elements

- **Name**: Location name
- **Type**: City, building, natural feature, etc.
- **Description**: Visual details and atmosphere
- **History**: Background and lore
- **Significance**: Role in the story

## Using Locations

Link locations to chapters and characters to:
- Track scene settings
- Maintain consistency
- Generate scene descriptions

## Tips

- Include sensory details (smell, sound, temperature)
- Consider the emotional tone of each location
- Connect locations through geography or story
`,
        tags: ['world-building', 'location'],
        relatedArticles: ['characters', 'cultures'],
      },
      {
        id: 'cultures',
        title: 'Building Cultures',
        content: `# Building Cultures

Create rich, believable cultures for your world.

## Culture Elements

- **Name and Origins**: History and foundation
- **Social Structure**: Hierarchy and classes
- **Beliefs**: Religion, philosophy, values
- **Customs**: Traditions, rituals, etiquette
- **Language**: Linguistic features

## Applications

- Character backgrounds and motivations
- Plot conflicts and resolutions
- World depth and immersion

## Tips

- Connect culture to environment
- Create internal conflicts
- Show, don't tell through character actions
`,
        tags: ['world-building', 'culture'],
        relatedArticles: ['locations', 'characters'],
      },
    ],
  },
  {
    id: 'shortcuts',
    title: 'Keyboard Shortcuts',
    icon: '⌨️',
    description: 'Speed up your workflow',
    articles: [
      {
        id: 'general-shortcuts',
        title: 'General Shortcuts',
        content: `# General Keyboard Shortcuts

## Navigation
- \`Ctrl/Cmd + K\`: Open search/command palette
- \`Ctrl/Cmd + S\`: Save current work
- \`Ctrl/Cmd + N\`: Create new project
- \`Escape\`: Close modals and dialogs

## Editor
- \`Ctrl/Cmd + Z\`: Undo
- \`Ctrl/Cmd + Y\` or \`Ctrl/Cmd + Shift + Z\`: Redo
- \`Ctrl/Cmd + B\`: Bold (in rich text mode)
- \`Ctrl/Cmd + I\`: Italics (in rich text mode)

## Navigation
- \`Ctrl/Cmd + 1\`: Dashboard
- \`Ctrl/Cmd + 2\`: Projects
- \`Ctrl/Cmd + 3\`: Plot Engine
- \`Ctrl/Cmd + 4\`: World Building
- \`Ctrl/Cmd + 5\`: Metrics
- \`Ctrl/Cmd + 6\`: Settings
`,
        tags: ['shortcuts', 'productivity'],
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: '🔧',
    description: 'Common issues and solutions',
    articles: [
      {
        id: 'common-issues',
        title: 'Common Issues',
        content: `# Common Issues and Solutions

## AI Generation Not Working

**Problem**: AI features are not generating content.

**Solutions**:
1. Check your AI provider settings in Settings > AI Provider
2. Verify your API key is valid
3. Ensure you have available credits/tokens
4. Check your internet connection

## Slow Performance

**Problem**: Application is running slowly.

**Solutions**:
1. Clear browser cache
2. Close unused browser tabs
3. Reduce chapter content length for faster processing
4. Try a different browser (Chrome recommended)

## Data Not Saving

**Problem**: Changes are not being saved.

**Solutions**:
1. Check your browser console for errors
2. Verify database connection in Settings
3. Try refreshing the page
4. Export your work as backup

## Need More Help?

If you're still experiencing issues, please:
1. Check the [GitHub Issues](https://github.com/your-repo/issues)
2. Contact support through the in-app help button
3. Join our community Discord
`,
        tags: ['troubleshooting', 'support'],
      },
    ],
  },
  {
    id: 'publishing',
    title: 'Publishing Guide',
    icon: '📖',
    description: 'Export and publish your work',
    articles: [
      {
        id: 'export-formats',
        title: 'Export Formats',
        content: `# Export Formats

Novelist.ai supports multiple export formats for publishing.

## Supported Formats

### EPUB
- Best for: e-readers (Kindle, Kobo, Apple Books)
- Features: Reflowable text, table of contents, cover image

### PDF
- Best for: Print formatting, sharing, printing
- Features: Fixed layout, custom formatting

### Markdown
- Best for: Version control, collaboration
- Features: Plain text, easy to edit

### DOCX
- Best for: Microsoft Word compatibility
- Features: Rich text formatting

## Exporting

1. Open the Publish panel for your project
2. Select your preferred format
3. Choose export options (cover, metadata, formatting)
4. Click "Export"

## Metadata

Add metadata before exporting:
- Title
- Author
- Description
- Keywords
- Cover image
`,
        tags: ['publishing', 'export'],
        relatedArticles: ['first-project', 'chapters'],
      },
    ],
  },
];

/**
 * Get all articles flattened
 */
export function getAllArticles(): HelpArticle[] {
  return HELP_CATEGORIES.flatMap(category => category.articles);
}

/**
 * Get article by ID
 */
export function getArticleById(id: string): HelpArticle | undefined {
  return getAllArticles().find(article => article.id === id);
}

/**
 * Search articles by query
 */
export function searchArticles(query: string): HelpArticle[] {
  const normalizedQuery = query.toLowerCase();

  return getAllArticles().filter(article => {
    return (
      article.title.toLowerCase().includes(normalizedQuery) ||
      article.content.toLowerCase().includes(normalizedQuery) ||
      article.tags.some(tag => tag.toLowerCase().includes(normalizedQuery))
    );
  });
}

/**
 * Get related articles
 */
export function getRelatedArticles(articleId: string): HelpArticle[] {
  const article = getArticleById(articleId);
  if (!article?.relatedArticles) return [];

  return article.relatedArticles
    .map(id => getArticleById(id))
    .filter((a): a is HelpArticle => a !== undefined);
}
