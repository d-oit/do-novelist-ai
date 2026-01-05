# Basic Usage - Publishing

## Example 1: Generating an EPUB

```typescript
import { EPUBGenerator } from '@/features/publishing';

const generator = new EPUBGenerator();

// Create novel with metadata
const novel: Novel = {
  id: 'novel-001',
  title: 'The Magical Journey',
  chapters: [
    {
      id: 'chapter-001',
      title: 'Chapter 1: The Beginning',
      content: ['First paragraph...', 'Second paragraph...'],
    },
  ],
  metadata: {
    title: 'The Magical Journey',
    author: 'Jane Doe',
    description: 'An epic tale of magic and adventure',
    publisher: 'Magic Books Publishing',
    publishedDate: new Date('2026-01-05'),
    language: 'en',
  },
};

// Generate EPUB
const epub = await generator.generateEPUB(novel, {
  styles: 'body { font-family: serif; }',
  fonts: [],
  images: [],
});

// Download EPUB
downloadBlob(epub, 'the-magical-journey.epub');
```

## Example 2: Generating a Cover

```typescript
import { CoverGenerator } from '@/features/publishing';

const generator = new CoverGenerator();

// Generate cover for fantasy novel
const cover = await generator.generateCover({
  title: 'The Magical Journey',
  author: 'Jane Doe',
  genre: Genre.FANTASY,
  style: CoverStyle.ILLUSTRATED,
  aspectRatio: AspectRatio.PORTRAIT_2_3,
  mood: CoverMood.EPIC,
  elements: [
    {
      type: 'character',
      description: 'Mysterious figure holding a glowing staff',
    },
    {
      type: 'landscape',
      description: 'Dramatic mountain backdrop with dark clouds',
    },
  ],
  colors: {
    primary: '#2c1810',
    secondary: '#1a1a2e',
    accent: '#ffd700',
  },
});

// Display cover
const imageUrl = URL.createObjectURL(cover);
document.getElementById('cover-preview').src = imageUrl;
```

## Example 3: Validating for Amazon KDP

```typescript
import { AmazonKDPIntegrator } from '@/features/publishing';

const integrator = new AmazonKDPIntegrator();

// Validate novel and cover for KDP
const result = await integrator.validateForKDP(novel, cover);

if (!result.isValid) {
  console.error('Validation issues:');
  result.issues.forEach(issue => {
    console.error(`- ${issue.type}: ${issue.message}`);
  });
} else {
  console.log('Novel is ready for KDP submission');
}
```

## Example 4: Preparing KDP Submission

```typescript
import { AmazonKDPIntegrator } from '@/features/publishing';

const integrator = new AmazonKDPIntegrator();

// Prepare submission package
const submission = await integrator.prepareKDPSubmission(novel, cover, {
  pricing: {
    ebookPrice: 9.99,
    printPrice: 14.99,
    royaltyOption: '70%',
  },
  territories: ['US', 'GB', 'CA', 'AU'],
  categories: ['Fiction > Fantasy > Epic'],
});

// Submit to KDP
await integrator.submitToKDP(submission);
```

## Example 5: Exporting for Multiple Platforms

```typescript
import { MultiPlatformExporter } from '@/features/publishing';

const exporter = new MultiPlatformExporter();

// Export for multiple platforms
const results = await exporter.exportForMultiplePlatforms(
  novel,
  [
    PublishingPlatform.AMAZON_KDP,
    PublishingPlatform.GOOGLE_PLAY_BOOKS,
    PublishingPlatform.APPLE_BOOKS,
  ],
  { parallel: true },
);

// Check results
results.forEach((result, platform) => {
  console.log(`${platform}: ${result.success ? 'Success' : 'Failed'}`);
  if (!result.success) {
    console.error('Issues:', result.issues);
  }
});
```
