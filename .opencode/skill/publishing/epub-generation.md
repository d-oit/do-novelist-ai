# EPUB Generation

## Core Concepts

EPUB 3.0 generation for eBook publishing with proper structure, metadata, and
styling.

## EPUB Structure

```typescript
interface EPUBPackage {
  identifier: string;
  title: string;
  language: string;
  creator: string;
  subjects: string[];
  description: string;
  publisher: string;
  date: Date;
  rights: string;
  coverImage?: string;
}
```

## Package OPF (Open Packaging Format)

```typescript
interface OPFDocument {
  metadata: OPFMetadata;
  manifest: OPFManifest;
  spine: OPFSpine;
  guide?: OPFGuide;
}

interface OPFMetadata {
  titles: OPFMetadataTitle[];
  creators: OPFMetadataCreator[];
  subjects: OPFMetadataSubject[];
  descriptions: string[];
  publishers: OPFMetadataPublisher[];
  dates: OPFMetadataDate[];
  identifiers: OPFMetadataIdentifier[];
  metas: OPFMetadataMeta[];
}
```

## EPUB Generation Pipeline

```typescript
class EPUBGenerator {
  async generateEPUB(novel: Novel, options: EPUBOptions): Promise<Blob> {
    const zip = new JSZip();

    // Add required files
    await this.addMimetype(zip);
    await this.addContainer(zip, options);
    await this.addPackage(zip, novel, options);

    // Add content files
    await this.addContent(zip, novel);

    // Add resources
    await this.addStyles(zip, options.styles);
    await this.addImages(zip, novel.images);
    await this.addFonts(zip, options.fonts);

    // Add NCX navigation
    await this.addNCX(zip, novel);

    return zip.generateAsync({ type: 'blob' });
  }

  private async addMimetype(zip: JSZip): Promise<void> {
    await zip.file('mimetype', 'application/epub+zip', {
      compression: 'DEFLATE',
      compressionOptions: { level: 0 },
    });
  }

  private async addContainer(zip: JSZip, options: EPUBOptions): Promise<void> {
    const container = `
      <?xml version="1.0"?>
      <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
        <rootfiles>
          <rootfile full-path="OEBPS/content.opf"
                    media-type="application/oebps-package+xml"/>
        </rootfiles>
      </container>
    `;

    await zip.file('META-INF/container.xml', container.trim());
  }
}
```

## Table of Contents (TOC)

```typescript
interface TOCEntry {
  id: string;
  title: string;
  href: string;
  children?: TOCEntry[];
  playOrder: number;
}

function generateTOC(novel: Novel): TOCEntry {
  const entries: TOCEntry[] = novel.chapters.map((chapter, index) => ({
    id: `chapter-${index}`,
    title: chapter.title,
    href: `chapter-${index}.xhtml`,
    playOrder: index,
  }));

  return {
    id: 'toc',
    title: 'Table of Contents',
    href: 'nav.xhtml',
    playOrder: -1,
    children: entries,
  };
}
```

## Content Generation

```typescript
async function generateChapterXHTML(chapter: Chapter): Promise<string> {
  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE html>
    <html xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <title>${escapeXml(chapter.title)}</title>
        <link rel="stylesheet" type="text/css" href="styles.css"/>
      </head>
      <body>
        <h1>${escapeXml(chapter.title)}</h1>
        ${chapter.content
          .map(paragraph => `<p>${escapeXml(paragraph)}</p>`)
          .join('\n')}
      </body>
    </html>
  `;
}
```

## Metadata Management

```typescript
interface EPUBMetadata {
  title: string;
  subtitle?: string;
  author: string;
  authorSort?: string;
  publisher: string;
  publishedDate: Date;
  isbn?: string;
  language: string;
  series?: string;
  seriesIndex?: number;
  description: string;
  keywords: string[];
  rights: string;
  coverImage?: string;
}

function generateOPFMetadata(metadata: EPUBMetadata): string {
  return `
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
      <dc:identifier id="bookid">${metadata.isbn || 'urn:uuid:' + uuid()}</dc:identifier>
      <dc:title>${metadata.title}</dc:title>
      ${metadata.subtitle ? `<dc:title id="subtitle">${metadata.subtitle}</dc:title>` : ''}
      <dc:creator id="creator">${metadata.author}</dc:creator>
      ${metadata.authorSort ? `<meta refines="#creator" property="file-as">${metadata.authorSort}</meta>` : ''}
      <dc:publisher>${metadata.publisher}</dc:publisher>
      <dc:date>${formatDate(metadata.publishedDate)}</dc:date>
      <dc:language>${metadata.language}</dc:language>
      <dc:description>${metadata.description}</dc:description>
      ${metadata.series ? `<meta property="belongs-to-collection" refines="#bookid">${metadata.series}</meta>` : ''}
      ${metadata.seriesIndex ? `<meta property="group-position" refines="#bookid">${metadata.seriesIndex}</meta>` : ''}
    </metadata>
  `;
}
```

## Performance Optimization

- Stream large files during generation
- Compress images before adding to ZIP
- Cache generated CSS
- Use efficient XML serialization
- Parallelize content file generation

## Testing

```typescript
describe('epub-generator', () => {
  it('generates valid EPUB structure', async () => {
    const generator = new EPUBGenerator();
    const epub = await generator.generateEPUB(testNovel, testOptions);

    const zip = await JSZip.loadAsync(epub);
    expect(zip.file('mimetype')).toBeTruthy();
    expect(zip.file('META-INF/container.xml')).toBeTruthy();
  });

  it('includes all required metadata', async () => {
    const generator = new EPUBGenerator();
    const epub = await generator.generateEPUB(testNovel, testOptions);

    const zip = await JSZip.loadAsync(epub);
    const content = await zip.file('OEBPS/content.opf')?.async('text');
    expect(content).toContain(testNovel.metadata.title);
    expect(content).toContain(testNovel.metadata.author);
  });
});
```

## Integration

- Cover generation for cover images
- Publishing platform validation
- Writing-assistant for content formatting
