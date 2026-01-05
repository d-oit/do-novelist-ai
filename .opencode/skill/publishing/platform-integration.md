# Platform Integration

## Core Concepts

Platform-specific export workflows and submission processes for various
publishing platforms.

## Supported Platforms

```typescript
enum PublishingPlatform {
  AMAZON_KDP = 'amazon_kdp',
  GOOGLE_PLAY_BOOKS = 'google_play_books',
  APPLE_BOOKS = 'apple_books',
  KOBO = 'kobo',
  BARNES_NOBLE = 'barnes_noble',
  SMASHWORDS = 'smashwords',
  DRAFT2DIGITAL = 'draft2digital',
}
```

## Platform Requirements

```typescript
interface PlatformRequirements {
  platform: PublishingPlatform;
  fileFormats: SupportedFormat[];
  metadataRequirements: MetadataRequirement[];
  coverRequirements: CoverRequirement;
  descriptionLength: { min: number; max: number };
  pricing: PricingRequirements;
  royalties: RoyaltyStructure;
  territoryRestrictions?: Territory[];
}

interface SupportedFormat {
  format: FileFormat;
  version: string;
  maxSize: number; // in MB
  drm: boolean;
}

enum FileFormat {
  EPUB = 'epub',
  MOBI = 'mobi',
  PDF = 'pdf',
  DOCX = 'docx',
  KPF = 'kpf',
}
```

## Amazon KDP Integration

```typescript
class AmazonKDPIntegrator {
  async validateForKDP(novel: Novel, cover: Blob): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Validate cover
    const coverIssues = await this.validateKDPCover(cover);
    issues.push(...coverIssues);

    // Validate metadata
    const metadataIssues = this.validateKDPMetadata(novel.metadata);
    issues.push(...metadataIssues);

    // Validate file format
    const formatIssues = this.validateKDPFormat(novel);
    issues.push(...formatIssues);

    return {
      isValid: issues.length === 0,
      issues,
      platform: PublishingPlatform.AMAZON_KDP,
    };
  }

  async prepareKDPSubmission(
    novel: Novel,
    cover: Blob,
    options: KDPSubmissionOptions,
  ): Promise<KDPSubmissionPackage> {
    const epub = await this.generateEPUB(novel);

    return {
      book: epub,
      cover: await this.optimizeCover(cover, { width: 2560, height: 1600 }),
      metadata: this.formatKDPMetadata(novel.metadata),
      pricing: options.pricing,
      territories: options.territories,
      categories: this.mapToKDPCategories(novel.categories),
    };
  }

  private async validateKDPCover(cover: Blob): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const image = await createImageBitmap(cover);

    if (image.width < 2500 || image.height < 1563) {
      issues.push({
        type: 'cover_dimensions',
        message: 'Cover must be at least 2500x1563 pixels',
      });
    }

    if (image.width / image.height < 1.6) {
      issues.push({
        type: 'cover_ratio',
        message: 'Cover must have aspect ratio of at least 1.6:1',
      });
    }

    return issues;
  }
}
```

## Google Play Books Integration

```typescript
class GooglePlayBooksIntegrator {
  async validateForPlayBooks(novel: Novel): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Validate EPUB 3.0 compliance
    const epubIssues = await this.validateEPUB30(novel);
    issues.push(...epubIssues);

    // Validate metadata
    const metadataIssues = this.validatePlayBooksMetadata(novel.metadata);
    issues.push(...metadataIssues);

    return {
      isValid: issues.length === 0,
      issues,
      platform: PublishingPlatform.GOOGLE_PLAY_BOOKS,
    };
  }

  private async validateEPUB30(novel: Novel): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const epub = await this.generateEPUB(novel);

    // Check for EPUB 3.0 features
    const hasNavigation = await this.checkNavigation(epub);
    if (!hasNavigation) {
      issues.push({
        type: 'epub_navigation',
        message: 'EPUB must include EPUB 3.0 navigation document',
      });
    }

    const hasProperStructure = await this.checkStructure(epub);
    if (!hasProperStructure) {
      issues.push({
        type: 'epub_structure',
        message: 'EPUB must follow EPUB 3.0 structure',
      });
    }

    return issues;
  }
}
```

## Apple Books Integration

```typescript
class AppleBooksIntegrator {
  async validateForAppleBooks(
    novel: Novel,
    cover: Blob,
  ): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];

    // Validate cover (Apple requires high quality)
    const coverIssues = await this.validateAppleCover(cover);
    issues.push(...coverIssues);

    // Validate EPUB
    const epubIssues = await this.validateAppleEPUB(novel);
    issues.push(...epubIssues);

    // Validate metadata
    const metadataIssues = this.validateAppleMetadata(novel.metadata);
    issues.push(...metadataIssues);

    return {
      isValid: issues.length === 0,
      issues,
      platform: PublishingPlatform.APPLE_BOOKS,
    };
  }

  private async validateAppleCover(cover: Blob): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    const image = await createImageBitmap(cover);

    // Apple Books requires at least 1400x1400px
    if (image.width < 1400 || image.height < 1400) {
      issues.push({
        type: 'cover_resolution',
        message: 'Cover must be at least 1400x1400 pixels for Apple Books',
      });
    }

    // Check color depth
    if (!(cover.type.includes('png') || cover.type.includes('jpeg'))) {
      issues.push({
        type: 'cover_format',
        message: 'Cover must be PNG or JPEG format',
      });
    }

    return issues;
  }
}
```

## Platform Submission Workflow

```typescript
interface SubmissionWorkflow {
  platform: PublishingPlatform;
  steps: WorkflowStep[];
  status: WorkflowStatus;
}

async function executeSubmissionWorkflow(
  workflow: SubmissionWorkflow,
  novel: Novel,
): Promise<WorkflowResult> {
  let currentStep = workflow.steps[0];
  const results: StepResult[] = [];

  for (const step of workflow.steps) {
    try {
      const result = await executeStep(step, novel);
      results.push(result);

      if (!result.success) {
        return {
          status: 'failed',
          failedAt: step.id,
          results,
        };
      }
    } catch (error) {
      return {
        status: 'error',
        failedAt: step.id,
        results,
        error: error.message,
      };
    }
  }

  return {
    status: 'completed',
    results,
  };
}
```

## Multi-Platform Export

```typescript
class MultiPlatformExporter {
  async exportForMultiplePlatforms(
    novel: Novel,
    platforms: PublishingPlatform[],
    options: ExportOptions,
  ): Promise<Map<PublishingPlatform, ExportResult>> {
    const results = new Map<PublishingPlatform, ExportResult>();

    const exports = platforms.map(platform =>
      this.exportForPlatform(platform, novel, options),
    );

    const exportResults = await Promise.all(exports);

    platforms.forEach((platform, index) => {
      results.set(platform, exportResults[index]);
    });

    return results;
  }
}
```

## Performance Optimization

- Parallelize multi-platform exports
- Cache validation results
- Use streaming for large files
- Implement progress tracking

## Testing

```typescript
describe('kdp-integrator', () => {
  it('validates cover dimensions for KDP', async () => {
    const integrator = new AmazonKDPIntegrator();
    const cover = await createTestCover(3000, 2000);
    const result = await integrator.validateKDPCover(cover);

    expect(result).toHaveLength(0);
  });

  it('rejects undersized cover', async () => {
    const integrator = new AmazonKDPIntegrator();
    const cover = await createTestCover(2000, 1200);
    const result = await integrator.validateKDPCover(cover);

    expect(result).toContainEqual(
      expect.objectContaining({ type: 'cover_dimensions' }),
    );
  });
});
```

## Integration

- EPUB generation for file creation
- Cover generation for platform-specific optimization
- Publishing standards for compliance validation
