# Export Workflows

## Core Concepts

Export pipelines and automation for generating publishing-ready files and
submissions.

## Export Pipeline

```typescript
interface ExportPipeline {
  steps: PipelineStep[];
  parallelExecution: boolean;
  errorHandling: ErrorHandlingStrategy;
  progressReporting: boolean;
}

interface PipelineStep {
  id: string;
  name: string;
  execute: (context: ExportContext) => Promise<StepResult>;
  dependencies?: string[];
  retryPolicy?: RetryPolicy;
}
```

## Export Context

```typescript
interface ExportContext {
  novel: Novel;
  options: ExportOptions;
  metadata: NovelMetadata;
  assets: ExportAssets;
  cache: Map<string, unknown>;
}

interface ExportAssets {
  cover: Blob;
  images: Map<string, Blob>;
  fonts: Map<string, Blob>;
  customStyles: string;
}
```

## Pipeline Execution

```typescript
class ExportPipelineExecutor {
  async execute(
    pipeline: ExportPipeline,
    context: ExportContext,
  ): Promise<PipelineResult> {
    const results: Map<string, StepResult> = new Map();
    const completedSteps = new Set<string>();

    for (const step of pipeline.steps) {
      if (!this.canExecuteStep(step, completedSteps)) {
        continue;
      }

      const result = await this.executeStepWithRetry(step, context);

      results.set(step.id, result);

      if (result.success) {
        completedSteps.add(step.id);
      } else {
        return {
          status: 'failed',
          completedSteps,
          failedAt: step.id,
          results,
          error: result.error,
        };
      }
    }

    return {
      status: 'completed',
      completedSteps,
      results,
    };
  }

  private async executeStepWithRetry(
    step: PipelineStep,
    context: ExportContext,
  ): Promise<StepResult> {
    const retryPolicy = step.retryPolicy || {
      maxAttempts: 3,
      backoff: 'exponential',
    };
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= retryPolicy.maxAttempts; attempt++) {
      try {
        const result = await step.execute(context);
        if (result.success) {
          return result;
        }
      } catch (error) {
        lastError = error;

        if (attempt < retryPolicy.maxAttempts) {
          const delay = this.calculateBackoff(attempt, retryPolicy.backoff);
          await this.sleep(delay);
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Step failed',
      attempts: retryPolicy.maxAttempts,
    };
  }
}
```

## Pre-Export Validation

```typescript
interface ValidationStep {
  validate: (context: ExportContext) => Promise<ValidationResult>;
  isBlocking: boolean;
}

const PRE_EXPORT_VALIDATIONS: ValidationStep[] = [
  {
    validate: validateMetadataCompleteness,
    isBlocking: true,
  },
  {
    validate: validateContentFormatting,
    isBlocking: false,
  },
  {
    validate: validateAssetAvailability,
    isBlocking: true,
  },
  {
    validate: validateCopyrightCompliance,
    isBlocking: true,
  },
];

async function validateMetadataCompleteness(
  context: ExportContext,
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];

  const { metadata } = context;

  if (!metadata.title || metadata.title.trim().length === 0) {
    issues.push({ type: 'missing_title', message: 'Title is required' });
  }

  if (!metadata.author || metadata.author.trim().length === 0) {
    issues.push({ type: 'missing_author', message: 'Author is required' });
  }

  if (!metadata.description || metadata.description.trim().length < 50) {
    issues.push({
      type: 'short_description',
      message: 'Description must be at least 50 characters',
    });
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
```

## File Generation Steps

```typescript
async function generateEPUBFile(context: ExportContext): Promise<StepResult> {
  const { novel, options, assets } = context;

  const generator = new EPUBGenerator();
  const epub = await generator.generateEPUB(novel, {
    styles: assets.customStyles,
    fonts: Array.from(assets.fonts.entries()),
    images: Array.from(assets.images.entries()),
  });

  context.cache.set('epub', epub);

  return {
    success: true,
    output: epub,
    metadata: { size: epub.size, type: 'epub' },
  };
}

async function generateMOBIFile(context: ExportContext): Promise<StepResult> {
  const epub = context.cache.get('epub') as Blob;

  if (!epub) {
    return {
      success: false,
      error: 'EPUB must be generated before MOBI conversion',
    };
  }

  const converter = new MOBIConverter();
  const mobi = await converter.convert(epub);

  context.cache.set('mobi', mobi);

  return {
    success: true,
    output: mobi,
    metadata: { size: mobi.size, type: 'mobi' },
  };
}

async function generatePDFFile(context: ExportContext): Promise<StepResult> {
  const { novel, options } = context;

  const generator = new PDFGenerator();
  const pdf = await generator.generate(novel, options.pdfOptions);

  context.cache.set('pdf', pdf);

  return {
    success: true,
    output: pdf,
    metadata: { size: pdf.size, type: 'pdf' },
  };
}
```

## Post-Export Quality Checks

```typescript
interface QualityCheck {
  name: string;
  check: (context: ExportContext) => Promise<QualityCheckResult>;
  severity: 'error' | 'warning' | 'info';
}

const POST_EXPORT_CHECKS: QualityCheck[] = [
  {
    name: 'file_size_validation',
    check: validateFileSize,
    severity: 'error',
  },
  {
    name: 'table_of_contents_completeness',
    check: validateTOC,
    severity: 'warning',
  },
  {
    name: 'metadata_accuracy',
    check: validateMetadata,
    severity: 'error',
  },
];

async function validateFileSize(
  context: ExportContext,
): Promise<QualityCheckResult> {
  const epub = context.cache.get('epub') as Blob;

  if (!epub) {
    return {
      passed: false,
      message: 'EPUB file not found',
    };
  }

  const maxSize = 50 * 1024 * 1024; // 50MB

  if (epub.size > maxSize) {
    return {
      passed: false,
      message: `EPUB file exceeds maximum size (${formatBytes(epub.size)} > ${formatBytes(maxSize)})`,
    };
  }

  return {
    passed: true,
    message: `File size: ${formatBytes(epub.size)}`,
  };
}
```

## Batch Export

```typescript
class BatchExporter {
  async exportBatch(
    novels: Novel[],
    options: BatchExportOptions,
  ): Promise<BatchExportResult> {
    const results: Map<string, ExportResult> = new Map();

    if (options.parallel) {
      const exports = novels.map(novel => this.exportSingle(novel, options));

      const exportResults = await Promise.all(exports);

      novels.forEach((novel, index) => {
        results.set(novel.id, exportResults[index]);
      });
    } else {
      for (const novel of novels) {
        const result = await this.exportSingle(novel, options);
        results.set(novel.id, result);
      }
    }

    return {
      total: novels.length,
      successful: Array.from(results.values()).filter(r => r.success).length,
      failed: Array.from(results.values()).filter(r => !r.success).length,
      results,
    };
  }
}
```

## Progress Reporting

```typescript
class ProgressTracker {
  private listeners: ProgressListener[] = [];
  private progress: Map<string, StepProgress> = new Map();

  subscribe(listener: ProgressListener): void {
    this.listeners.push(listener);
  }

  unsubscribe(listener: ProgressListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  updateProgress(stepId: string, progress: StepProgress): void {
    this.progress.set(stepId, progress);

    this.listeners.forEach(listener => {
      listener.onProgress(stepId, progress);
    });
  }

  getOverallProgress(): OverallProgress {
    const steps = Array.from(this.progress.values());
    const completed = steps.filter(s => s.status === 'completed').length;

    return {
      totalSteps: steps.length,
      completedSteps: completed,
      percentage: (completed / steps.length) * 100,
      currentStep: steps.find(s => s.status === 'in_progress')?.name,
    };
  }
}
```

## Performance Optimization

- Parallelize independent steps
- Cache intermediate results
- Stream large file operations
- Use Web Workers for file generation

## Testing

```typescript
describe('export-pipeline', () => {
  it('executes pipeline successfully', async () => {
    const pipeline = createTestPipeline();
    const context = createTestContext();
    const executor = new ExportPipelineExecutor();

    const result = await executor.execute(pipeline, context);

    expect(result.status).toBe('completed');
    expect(result.completedSteps.size).toBe(pipeline.steps.length);
  });

  it('handles step failures gracefully', async () => {
    const pipeline = createPipelineWithFailingStep();
    const context = createTestContext();
    const executor = new ExportPipelineExecutor();

    const result = await executor.execute(pipeline, context);

    expect(result.status).toBe('failed');
    expect(result.failedAt).toBeDefined();
  });
});
```

## Integration

- EPUB generation for file creation
- Platform integration for submission
- Publishing standards for validation
