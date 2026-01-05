# Cover Generation

## Core Concepts

AI-powered cover image generation with style presets, aspect ratios, and
customization options.

## Cover Data Model

```typescript
interface CoverGenerationOptions {
  title: string;
  author: string;
  genre: Genre;
  style: CoverStyle;
  aspectRatio: AspectRatio;
  mood?: CoverMood;
  elements?: CoverElement[];
  colors?: ColorPalette;
}

enum Genre {
  FANTASY = 'fantasy',
  SCIENCE_FICTION = 'science_fiction',
  ROMANCE = 'romance',
  THRILLER = 'thriller',
  MYSTERY = 'mystery',
  HORROR = 'horror',
  LITERARY = 'literary',
  NON_FICTION = 'non_fiction',
}

enum CoverStyle {
  PHOTOGRAPHIC = 'photographic',
  ILLUSTRATED = 'illustrated',
  MINIMALIST = 'minimalist',
  TYPOGRAPHIC = 'typographic',
  ABSTRACT = 'abstract',
  CLASSIC = 'classic',
}
```

## AI Image Generation

```typescript
class CoverGenerator {
  private aiService: AIService;

  async generateCover(options: CoverGenerationOptions): Promise<Blob> {
    const prompt = this.buildPrompt(options);
    const negativePrompt = this.buildNegativePrompt(options);

    const result = await this.aiService.generateImage({
      prompt,
      negativePrompt,
      width: this.getWidth(options.aspectRatio),
      height: this.getHeight(options.aspectRatio),
      steps: 50,
      guidanceScale: 7.5,
    });

    return await this.addTitleOverlay(result, options);
  }

  private buildPrompt(options: CoverGenerationOptions): string {
    const genreStyle = this.getGenrePrompt(options.genre);
    const stylePrompt = this.getStylePrompt(options.style);
    const moodPrompt = options.mood ? this.getMoodPrompt(options.mood) : '';

    return `${genreStyle} ${stylePrompt} ${moodPrompt} book cover design, ${options.elements?.map(e => e.description).join(', ') || ''}`;
  }
}
```

## Style Presets

```typescript
interface CoverStylePreset {
  id: string;
  name: string;
  genre: Genre[];
  style: CoverStyle;
  prompt: string;
  negativePrompt: string;
  colors: ColorPalette;
  typography: TypographyStyle;
}

const STYLE_PRESETS: CoverStylePreset[] = [
  {
    id: 'fantasy-epic',
    name: 'Epic Fantasy',
    genre: [Genre.FANTASY],
    style: CoverStyle.ILLUSTRATED,
    prompt: 'epic fantasy landscape, dramatic lighting, mystical atmosphere',
    negativePrompt: 'modern, contemporary, urban, minimalist',
    colors: { primary: '#2c1810', secondary: '#1a1a2e', accent: '#ffd700' },
    typography: { font: 'serif', weight: 'bold', size: 'large' },
  },
  {
    id: 'scifi-cyberpunk',
    name: 'Cyberpunk',
    genre: [Genre.SCIENCE_FICTION],
    style: CoverStyle.ILLUSTRATED,
    prompt: 'cyberpunk cityscape, neon lights, futuristic technology',
    negativePrompt: 'fantasy, medieval, rustic, natural',
    colors: { primary: '#0d0d0d', secondary: '#00ffff', accent: '#ff00ff' },
    typography: { font: 'sans-serif', weight: 'bold', size: 'large' },
  },
];
```

## Aspect Ratio Support

```typescript
enum AspectRatio {
  SQUARE_1_1 = '1:1',
  PORTRAIT_3_4 = '3:4',
  PORTRAIT_2_3 = '2:3',
  PORTRAIT_1_1_5 = '1:1.5',
  LANDSCAPE_4_3 = '4:3',
}

interface AspectDimensions {
  width: number;
  height: number;
}

function getAspectRatioDimensions(
  ratio: AspectRatio,
  baseSize: number = 2048,
): AspectDimensions {
  const dimensions: Record<AspectRatio, AspectDimensions> = {
    [AspectRatio.SQUARE_1_1]: { width: baseSize, height: baseSize },
    [AspectRatio.PORTRAIT_3_4]: {
      width: Math.round(baseSize * 0.75),
      height: baseSize,
    },
    [AspectRatio.PORTRAIT_2_3]: {
      width: Math.round(baseSize * 0.667),
      height: baseSize,
    },
    [AspectRatio.PORTRAIT_1_1_5]: {
      width: Math.round(baseSize * 0.667),
      height: Math.round(baseSize),
    },
    [AspectRatio.LANDSCAPE_4_3]: {
      width: baseSize,
      height: Math.round(baseSize * 0.75),
    },
  };

  return dimensions[ratio];
}
```

## Title Overlay

```typescript
async function addTitleOverlay(
  image: Blob,
  options: CoverGenerationOptions,
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const img = await loadImage(image);
  canvas.width = img.width;
  canvas.height = img.height;

  ctx.drawImage(img, 0, 0);

  ctx.fillStyle = options.colors?.primary || '#ffffff';
  ctx.font = `${options.style === CoverStyle.MINIMALIST ? 'bold' : 'normal'} ${canvas.height * 0.12}px ${this.getFontFamily(options.style)}`;
  ctx.textAlign = 'center';

  const titleY = canvas.height * 0.6;
  const authorY = canvas.height * 0.85;

  ctx.fillText(options.title, canvas.width / 2, titleY);
  ctx.font = `${canvas.height * 0.05}px ${this.getFontFamily(options.style)}`;
  ctx.fillText(options.author, canvas.width / 2, authorY);

  return await canvasToBlob(canvas);
}
```

## Color Management

```typescript
interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background?: string;
}

function generatePaletteFromGenre(genre: Genre): ColorPalette {
  const palettes: Record<Genre, ColorPalette> = {
    [Genre.FANTASY]: {
      primary: '#2c1810',
      secondary: '#1a1a2e',
      accent: '#ffd700',
    },
    [Genre.SCIENCE_FICTION]: {
      primary: '#0d0d0d',
      secondary: '#00ffff',
      accent: '#ff00ff',
    },
    [Genre.ROMANCE]: {
      primary: '#ff69b4',
      secondary: '#ffc0cb',
      accent: '#ff1493',
    },
    // ... more genres
  };

  return palettes[genre];
}
```

## Performance Optimization

- Cache generated images with hash-based keys
- Use Web Workers for image processing
- Implement progressive loading
- Optimize overlay composition

## Testing

```typescript
describe('cover-generator', () => {
  it('generates cover with correct dimensions', async () => {
    const generator = new CoverGenerator();
    const cover = await generator.generateCover({
      title: 'Test Novel',
      author: 'Test Author',
      genre: Genre.FANTASY,
      style: CoverStyle.ILLUSTRATED,
      aspectRatio: AspectRatio.PORTRAIT_2_3,
    });

    const image = await createImageBitmap(cover);
    const expected = getAspectRatioDimensions(AspectRatio.PORTRAIT_2_3);
    expect(image.width).toBe(expected.width);
    expect(image.height).toBe(expected.height);
  });
});
```

## Integration

- EPUB generation for cover embedding
- Publishing platform validation
- Writing-assistant for title styling
