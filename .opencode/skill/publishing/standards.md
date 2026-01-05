# Publishing Standards

## Core Concepts

Publishing standards, compliance requirements, and best practices for eBook
distribution.

## EPUB 3.0 Standards

### Required Files

```
mimetype (uncompressed)
META-INF/container.xml
OEBPS/content.opf
OEBPS/nav.xhtml (navigation document)
OEBPS/toc.ncx (NCX for backward compatibility)
OEBPS/[content files]
OEBPS/styles.css
```

### Package Document (OPF)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" xmlns="http://www.idpf.org/2007/opf"
         unique-identifier="bookid"
         prefix="ibooks: http://vocabulary.itunes.apple.com/rdf/ibooks/vocabulary-extensions-1.0/">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:12345678-1234-5678-1234-567812345678</dc:identifier>
    <dc:title>Book Title</dc:title>
    <dc:creator>Author Name</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>2026-01-05</dc:date>
    <meta property="dcterms:modified">2026-01-05T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" properties="nav"/>
    <item id="toc" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="chapter1" href="chapter1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine toc="toc">
    <itemref idref="chapter1"/>
  </spine>
</package>
```

### Navigation Document

```xml
<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:epub="http://www.idpf.org/2007/ops"
      epub:prefix="z3998: http://www.daisy.org/z3998/2012/vocab/structure/#">
  <head>
    <title>Table of Contents</title>
  </head>
  <body>
    <nav epub:type="toc">
      <h1>Table of Contents</h1>
      <ol>
        <li><a href="chapter1.xhtml">Chapter 1</a></li>
        <li><a href="chapter2.xhtml">Chapter 2</a></li>
      </ol>
    </nav>
  </body>
</html>
```

## Platform-Specific Standards

### Amazon KDP Requirements

```typescript
interface KDPStandards {
  cover: {
    minWidth: 2500;
    minHeight: 1563;
    aspectRatio: { min: 1.6; max: 2.0 };
    format: ['TIFF', 'JPG', 'PDF'];
    colorSpace: 'sRGB';
  };
  content: {
    format: ['EPUB', 'MOBI', 'KPF', 'DOCX', 'PDF'];
    maxFileSize: 650; // MB
    descriptionLength: { min: 50; max: 4000 };
  };
  metadata: {
    required: ['title', 'author', 'description', 'language', 'categories'];
    optional: ['publisher', 'publicationDate', 'series', 'seriesIndex', 'isbn'];
  };
}
```

### Google Play Books Requirements

```typescript
interface GooglePlayStandards {
  content: {
    format: ['EPUB 3.0'];
    maxFileSize: 50; // MB
    validationLevel: 'EPUBCheck';
  };
  cover: {
    minWidth: 1400;
    minHeight: 2100;
    format: ['JPG', 'PNG'];
    aspectRatio: '2:3';
  };
  metadata: {
    required: ['title', 'author', 'description', 'language', 'isbn'];
    categories: 'BISAC required';
  };
}
```

### Apple Books Requirements

```typescript
interface AppleBooksStandards {
  content: {
    format: ['EPUB 3.0'];
    maxFileSize: 2; // GB
    validationLevel: 'EPUBCheck + Books Validator';
  };
  cover: {
    minWidth: 1400;
    minHeight: 1400;
    format: ['PNG', 'JPEG'];
    aspectRatio: '1:1.6';
  };
  metadata: {
    required: ['title', 'author', 'description', 'language'];
    recommended: ['publisher', 'publicationDate', 'isbn', 'categories'];
  };
}
```

## Accessibility Standards (WCAG 2.1 AA)

### Semantic Markup

```html
<!-- Good: Proper heading hierarchy -->
<h1>Chapter Title</h1>
<h2>Section Title</h2>
<p>Content...</p>

<!-- Bad: Skipping heading levels -->
<h1>Chapter Title</h1>
<h3>Section Title</h3>
<!-- Should be h2 -->
```

### ARIA Attributes

```html
<nav aria-label="Table of Contents">
  <ol>
    <li><a href="chapter1.xhtml">Chapter 1</a></li>
  </ol>
</nav>
```

### Reading Order

```typescript
interface ReadingOrderValidation {
  checkReadingOrder(document: Document): ValidationResult {
    const issues: ValidationIssue[] = [];

    // Check for proper heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading) => {
      const level = parseInt(heading.tagName[1]);

      if (level > previousLevel + 1) {
        issues.push({
          type: 'heading_hierarchy',
          message: `Heading level jumps from ${previousLevel} to ${level}`,
        });
      }

      previousLevel = level;
    });

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
```

## Metadata Standards

### Dublin Core Metadata

```typescript
interface DublinCoreMetadata {
  'dc:title': string;
  'dc:creator': string;
  'dc:subject': string[];
  'dc:description': string;
  'dc:publisher': string;
  'dc:contributor': string[];
  'dc:date': string;
  'dc:type': string;
  'dc:format': string;
  'dc:identifier': string;
  'dc:source': string;
  'dc:language': string;
  'dc:relation': string;
  'dc:coverage': string;
  'dc:rights': string;
}
```

### ISBN Standards

```typescript
function validateISBN(isbn: string): ISBNValidation {
  const cleaned = isbn.replace(/[-\s]/g, '');

  // ISBN-10
  if (cleaned.length === 10) {
    const checkDigit = calculateISBN10CheckDigit(cleaned);
    if (checkDigit === cleaned[9]) {
      return { isValid: true, type: 'ISBN-10' };
    }
  }

  // ISBN-13
  if (
    (cleaned.length === 13 && cleaned.startsWith('978')) ||
    cleaned.startsWith('979')
  ) {
    const checkDigit = calculateISBN13CheckDigit(cleaned);
    if (checkDigit === cleaned[12]) {
      return { isValid: true, type: 'ISBN-13' };
    }
  }

  return { isValid: false, error: 'Invalid ISBN format or check digit' };
}
```

## Content Validation

### EPUBCheck Validation

```typescript
async function runEPUBCheck(epub: Blob): Promise<EPUBCheckResult> {
  const issues: ValidationIssue[] = [];

  // Check for required files
  const zip = await JSZip.loadAsync(epub);

  const requiredFiles = [
    'mimetype',
    'META-INF/container.xml',
    'OEBPS/content.opf',
  ];

  for (const file of requiredFiles) {
    if (!zip.file(file)) {
      issues.push({
        type: 'missing_file',
        message: `Required file missing: ${file}`,
        severity: 'error',
      });
    }
  }

  // Validate OPF structure
  const opf = await zip.file('OEBPS/content.opf')?.async('text');
  if (opf) {
    const opfIssues = validateOPFStructure(opf);
    issues.push(...opfIssues);
  }

  return {
    isValid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
    warnings: issues.filter(i => i.severity === 'warning'),
    errors: issues.filter(i => i.severity === 'error'),
  };
}
```

## Performance Optimization

- Validate files during generation, not after
- Use streaming validation for large files
- Cache validation results
- Implement incremental validation

## Testing

```typescript
describe('publishing-standards', () => {
  it('validates ISBN-13 format', () => {
    const result = validateISBN('978-3-16-148410-0');
    expect(result.isValid).toBe(true);
    expect(result.type).toBe('ISBN-13');
  });

  it('detects invalid ISBN', () => {
    const result = validateISBN('123-4-56-789012-3');
    expect(result.isValid).toBe(false);
  });

  it('validates EPUB structure', async () => {
    const epub = await createValidEPUB();
    const result = await runEPUBCheck(epub);

    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
```

## Integration

- EPUB generation for standard compliance
- Platform integration for platform-specific rules
- Export workflows for validation
