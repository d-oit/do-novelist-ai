# Publishing Feature

The Publishing feature handles exporting novels to various formats (EPUB, PDF,
MOBI) and provides analytics for tracking reader engagement and platform
performance.

## Overview

The Publishing feature helps authors:

- 📤 **Export Formats** - Export to EPUB, PDF, MOBI, DOCX
- 📚 **Platform Integration** - Publish to multiple platforms
- 📊 **Analytics** - Track reader engagement and sales
- 🎨 **Cover Design** - Integrate custom cover art
- 📝 **Metadata Management** - ISBN, categories, keywords
- ✅ **Quality Checks** - Pre-publish validation
- 🔄 **Version Control** - Manage published versions
- 💰 **Revenue Tracking** - Monitor earnings across platforms

## Architecture

```
publishing/
├── components/              # UI Components
│   ├── PublishingDashboard.tsx     # Main dashboard
│   ├── PublishingSetup.tsx         # Platform setup wizard
│   ├── PublishPanel.tsx            # Quick publish panel
│   ├── PublishView.tsx             # Publish view
│   ├── PublishingMetadataForm.tsx  # Metadata editor
│   ├── CoverGenerator.tsx          # Cover creation
│   ├── PlatformCard.tsx            # Platform status card
│   ├── PlatformStatusGrid.tsx      # Multi-platform view
│   ├── MetricsOverview.tsx         # Analytics overview
│   ├── FeedbackWidget.tsx          # Reader feedback
│   ├── DetailedFeedbackModal.tsx   # Feedback details
│   └── AlertsSection.tsx           # Publishing alerts
│
├── hooks/                   # React Hooks
│   └── usePublishingAnalytics.ts   # Analytics hook
│
├── services/                # Business Logic
│   ├── epubService.ts              # EPUB generation
│   └── publishingAnalyticsService.ts # Analytics service
│
└── types/                   # TypeScript Types
    └── index.ts                    # Publishing types
```

## Key Components

### PublishingDashboard

Main dashboard for managing all publishing activities.

**Features**:

- Platform connection status
- Recent publications
- Analytics overview
- Revenue summary
- Reader feedback
- Publishing alerts
- Quick actions

**Usage**:

```tsx
import { PublishingDashboard } from '@/features/publishing';

<PublishingDashboard
  projectId={projectId}
  onPublishClick={() => openPublishDialog()}
/>;
```

---

### PublishPanel

Quick publish panel for exporting and publishing.

**Features**:

- Format selection (EPUB, PDF, MOBI, DOCX)
- Export preview
- Metadata editing
- Platform selection
- Cover upload
- One-click publish
- Download exports

**Usage**:

```tsx
import { PublishPanel } from '@/features/publishing';

<PublishPanel
  projectId={projectId}
  onExport={(format, file) => downloadFile(file)}
  onPublish={(platform, metadata) => publishToPlatform(platform, metadata)}
  availableFormats={['epub', 'pdf', 'mobi', 'docx']}
/>;
```

**Export Formats**:

- **EPUB**: Industry standard eBook format
- **PDF**: Print-ready or eBook PDF
- **MOBI**: Kindle format (legacy)
- **DOCX**: Microsoft Word format
- **HTML**: Web-ready format
- **Markdown**: Plain text with formatting

---

### PublishingMetadataForm

Form for editing book metadata (title, author, ISBN, etc.).

**Features**:

- Title and subtitle
- Author information
- ISBN assignment
- Categories and genres
- Keywords and tags
- Description/blurb
- Language and copyright
- Pricing information

**Usage**:

```tsx
import { PublishingMetadataForm } from '@/features/publishing';

<PublishingMetadataForm
  projectId={projectId}
  initialMetadata={metadata}
  onSave={metadata => saveMetadata(metadata)}
  validateISBN={true}
/>;
```

**Metadata Structure**:

```typescript
interface PublishingMetadata {
  title: string;
  subtitle?: string;
  author: string;
  coAuthors?: string[];
  isbn?: string;
  categories: string[]; // BISAC categories
  keywords: string[];
  description: string;
  language: string;
  copyright: string;
  publishDate?: Date;
  price?: {
    amount: number;
    currency: string;
  };
  coverUrl?: string;
}
```

---

### PlatformStatusGrid

Grid view of all connected publishing platforms.

**Features**:

- Platform connection status
- Last publish date
- Version published
- Platform-specific metrics
- Quick publish button
- Platform settings

**Usage**:

```tsx
import { PlatformStatusGrid } from '@/features/publishing';

<PlatformStatusGrid
  projectId={projectId}
  platforms={['kdp', 'draft2digital', 'ingramspark', 'smashwords']}
  onPublish={platform => publishTo(platform)}
/>;
```

**Supported Platforms**:

- 📖 **Amazon KDP** - Kindle Direct Publishing
- 📚 **Draft2Digital** - Multi-platform distributor
- 🏢 **IngramSpark** - Print and digital distribution
- 📱 **Smashwords** - eBook distribution
- 🌐 **Wattpad** - Online reading platform
- 📓 **Royal Road** - Web serial platform
- 🎯 **Direct** - Self-hosted/website

---

### MetricsOverview

Overview of publishing analytics and performance.

**Features**:

- Total downloads/sales
- Revenue by platform
- Reader ratings
- Page reads (KU/KENP)
- Geographic distribution
- Trend charts
- Period comparison

**Usage**:

```tsx
import { MetricsOverview } from '@/features/publishing';

<MetricsOverview
  projectId={projectId}
  timeRange="30d" // '7d' | '30d' | '90d' | 'all'
  platforms={['kdp', 'draft2digital']}
/>;
```

**Metrics Tracked**:

- **Downloads/Sales**: Total units sold
- **Revenue**: Earnings by platform
- **Page Reads**: KU/KENP pages read
- **Ratings**: Average rating and count
- **Reviews**: Review count and sentiment
- **Rankings**: Best seller ranks
- **Conversion**: Click-to-purchase rate

---

## Hooks API

### usePublishingAnalytics

Comprehensive publishing analytics hook.

```typescript
const {
  // Data
  analytics, // Current analytics data
  isLoading, // Loading state
  error, // Error state

  // Metrics
  totalSales, // Total units sold
  totalRevenue, // Total earnings
  averageRating, // Average reader rating
  totalReviews, // Total review count

  // By Platform
  platformMetrics, // Metrics per platform
  topPlatform, // Best performing platform

  // Trends
  salesTrend, // Sales over time
  revenueTrend, // Revenue over time
  ratingTrend, // Rating over time

  // Actions
  refreshAnalytics, // Reload analytics
  exportReport, // Export analytics report
  setTimeRange, // Change time period

  // Filters
  timeRange, // Current time range
  platforms, // Selected platforms
  setPlatforms, // Update platforms
} = usePublishingAnalytics(projectId);
```

**Example - View Analytics**:

```typescript
const { analytics, totalSales, totalRevenue, platformMetrics, salesTrend } =
  usePublishingAnalytics(projectId);

console.log(`Total Sales: ${totalSales} units`);
console.log(`Total Revenue: $${totalRevenue.toFixed(2)}`);

// Platform breakdown
platformMetrics.forEach(platform => {
  console.log(
    `${platform.name}: ${platform.sales} sales, $${platform.revenue}`,
  );
});

// Sales trend
console.log('Last 7 days:', salesTrend.slice(-7));
```

---

## Services

### epubService

Generates EPUB files from project content.

```typescript
import { epubService } from '@/features/publishing';

// Generate EPUB
const epubBlob = await epubService.generateEPUB({
  projectId,
  metadata: {
    title: 'My Novel',
    author: 'J. Smith',
    language: 'en',
    isbn: '978-1-234567-89-0',
  },
  chapters: chapterIds,
  coverImage: coverUrl,
  includeTableOfContents: true,
  includeCopyright: true,
});

// Download EPUB
const url = URL.createObjectURL(epubBlob);
const a = document.createElement('a');
a.href = url;
a.download = 'my-novel.epub';
a.click();

// Validate EPUB
const validation = await epubService.validateEPUB(epubBlob);
if (!validation.isValid) {
  console.error('EPUB errors:', validation.errors);
}
```

**EPUB Features**:

- ✅ EPUB 3.0 compliant
- ✅ Embedded fonts
- ✅ Table of contents (NCX + NAV)
- ✅ Cover image
- ✅ Chapter navigation
- ✅ Metadata (Dublin Core)
- ✅ Responsive layout
- ✅ Image optimization

---

### publishingAnalyticsService

Tracks and aggregates publishing metrics.

```typescript
import { publishingAnalyticsService } from '@/features/publishing';

// Get analytics
const analytics = await publishingAnalyticsService.getAnalytics({
  projectId,
  startDate: new Date('2024-01-01'),
  endDate: new Date(),
  platforms: ['kdp', 'draft2digital'],
});

// Record sale
await publishingAnalyticsService.recordSale({
  projectId,
  platform: 'kdp',
  quantity: 1,
  revenue: 2.99,
  currency: 'USD',
  date: new Date(),
});

// Get platform comparison
const comparison = await publishingAnalyticsService.comparePlatforms({
  projectId,
  platforms: ['kdp', 'draft2digital', 'smashwords'],
  metric: 'revenue', // or 'sales', 'ratings'
  timeRange: '30d',
});

// Export report
const reportPDF = await publishingAnalyticsService.exportReport({
  projectId,
  format: 'pdf', // or 'csv', 'xlsx'
  includeCharts: true,
  timeRange: 'all',
});
```

---

## Data Flow

### Export Flow

```
Project Content → Format Converter → Validation → File Generation → Download
       ↓
  Chapters + Metadata + Cover → EPUB/PDF/MOBI → File
```

### Publishing Flow

```
Project → Export → Metadata Form → Platform Selection → Upload → Published
                                           ↓
                                    Platform API
                                           ↓
                                   Publishing Complete
```

### Analytics Flow

```
Platform APIs → Data Sync → Aggregation → Database
                                 ↓
                         Analytics Dashboard
                                 ↓
                         Charts + Metrics
```

---

## Database Schema

### Publishing Metadata Table

```sql
CREATE TABLE publishing_metadata (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  author TEXT NOT NULL,
  isbn TEXT,
  categories JSON,
  keywords JSON,
  description TEXT,
  language TEXT DEFAULT 'en',
  copyright TEXT,
  cover_url TEXT,
  price_amount REAL,
  price_currency TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Publications Table

```sql
CREATE TABLE publications (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  version TEXT NOT NULL,
  format TEXT NOT NULL,     -- 'epub' | 'pdf' | 'mobi'
  status TEXT NOT NULL,      -- 'draft' | 'published' | 'unpublished'
  published_at INTEGER,
  metadata JSON,
  platform_id TEXT,          -- ID on external platform
  url TEXT,                  -- Public URL
  created_at INTEGER NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

### Publishing Analytics Table

```sql
CREATE TABLE publishing_analytics (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  date INTEGER NOT NULL,
  sales INTEGER DEFAULT 0,
  revenue REAL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  page_reads INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  rating REAL,
  reviews INTEGER DEFAULT 0,
  rank INTEGER,
  FOREIGN KEY (project_id) REFERENCES projects(id)
);

CREATE INDEX idx_analytics_date ON publishing_analytics(date);
CREATE INDEX idx_analytics_platform ON publishing_analytics(platform);
```

---

## Export Formats

### EPUB (Electronic Publication)

- **Use**: Standard eBook format
- **Platforms**: All major eBook platforms
- **Features**: Reflowable text, images, TOC
- **File Size**: ~500KB - 5MB

### PDF (Portable Document Format)

- **Use**: Print-ready or fixed-layout eBook
- **Platforms**: Universal
- **Features**: Fixed layout, fonts embedded
- **File Size**: ~2MB - 20MB

### MOBI (Mobipocket)

- **Use**: Legacy Kindle format
- **Platforms**: Amazon Kindle (older devices)
- **Features**: Similar to EPUB
- **File Size**: ~500KB - 5MB
- **Note**: Being phased out by Amazon (use EPUB instead)

### DOCX (Microsoft Word)

- **Use**: Editing, manuscript submissions
- **Platforms**: Desktop
- **Features**: Full formatting, comments
- **File Size**: ~100KB - 2MB

---

## Platform Integration

### Amazon KDP (Kindle Direct Publishing)

```typescript
const kdpConfig = {
  apiKey: process.env.KDP_API_KEY,
  marketplace: 'us', // or 'uk', 'de', etc.
  pricing: {
    us: { amount: 2.99, currency: 'USD' },
    uk: { amount: 1.99, currency: 'GBP' },
  },
  enrollment: {
    kdpSelect: true, // KU exclusive
    enableLending: true,
  },
};

// Publish to KDP
await publishingService.publishToKDP({
  projectId,
  metadata,
  epub: epubFile,
  config: kdpConfig,
});
```

### Draft2Digital

```typescript
const d2dConfig = {
  apiKey: process.env.D2D_API_KEY,
  channels: ['apple', 'kobo', 'barnes-noble', 'scribd'],
  pricing: {
    amount: 2.99,
    currency: 'USD',
  },
};

// Publish to D2D
await publishingService.publishToD2D({
  projectId,
  metadata,
  epub: epubFile,
  config: d2dConfig,
});
```

---

## Quality Checks

### Pre-Publishing Validation

**Content Checks**:

- ✅ All chapters have content
- ✅ Chapter order correct
- ✅ No placeholder text
- ✅ Images optimized
- ✅ Links functional

**Metadata Checks**:

- ✅ Title and author present
- ✅ Valid ISBN (if provided)
- ✅ Categories selected (2-3 recommended)
- ✅ Keywords provided (7 recommended)
- ✅ Description 150-4000 characters
- ✅ Cover meets platform requirements

**Format Checks**:

- ✅ EPUB passes EPUBCheck validation
- ✅ PDF page count correct
- ✅ File size within limits
- ✅ Fonts embedded properly
- ✅ Table of contents generated

---

## Testing

### Unit Tests

- `epubService.test.ts` - EPUB generation
- `publishingAnalyticsService.test.ts` - Analytics aggregation

### Integration Tests

- Full export workflow
- Platform API integration
- Analytics data sync

**Run Tests**:

```bash
# All publishing tests
npm run test -- publishing

# EPUB generation
vitest run src/features/publishing/services/__tests__/epubService.test.ts
```

---

## Performance Considerations

- **Lazy Loading**: Export generated on-demand
- **Caching**: Metadata cached for quick access
- **Async Processing**: Large exports processed in background
- **Image Optimization**: Cover and content images compressed

**Performance Targets**:

- EPUB generation (50 chapters): <10s
- PDF generation: <15s
- Analytics load: <2s
- Platform sync: <5s

---

## Configuration

### Environment Variables

```env
# Platform API Keys
KDP_API_KEY=your_key_here
DRAFT2DIGITAL_API_KEY=your_key_here
INGRAMSPARK_API_KEY=your_key_here

# Export Settings
MAX_EPUB_SIZE_MB=50
ENABLE_WATERMARK=false
DEFAULT_LANGUAGE=en

# Analytics
ANALYTICS_SYNC_INTERVAL=3600000  # 1 hour
ENABLE_REAL_TIME_UPDATES=true
```

### Publishing Limits

```typescript
const LIMITS = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxChapters: 1000,
  maxImageSize: 5 * 1024 * 1024, // 5MB per image
  maxCoverSize: 10 * 1024 * 1024, // 10MB
  minDescriptionLength: 150,
  maxDescriptionLength: 4000,
};
```

---

## Common Issues & Solutions

### Issue: EPUB validation errors

**Solution**: Check for unsupported HTML tags or malformed content

```typescript
const validation = await epubService.validateEPUB(epub);
validation.errors.forEach(error => {
  console.error(`Line ${error.line}: ${error.message}`);
});
```

### Issue: Cover image too large

**Solution**: Compress image before upload

```typescript
const compressedCover = await compressImage(coverFile, {
  maxWidth: 2400,
  maxHeight: 3600,
  quality: 0.85,
});
```

### Issue: Platform API rate limits

**Solution**: Implement retry with exponential backoff

```typescript
await retryWithBackoff(() => publishToKDP(data), {
  maxRetries: 3,
  baseDelay: 1000,
});
```

---

## Future Enhancements

- [ ] Print-on-demand integration (KDP Print, IngramSpark)
- [ ] Audiobook export (text-to-speech)
- [ ] Advanced formatting options (drop caps, chapter styles)
- [ ] Multi-book series management
- [ ] Pre-order scheduling
- [ ] Marketing material generation (press releases, blurbs)
- [ ] A/B testing for covers and descriptions
- [ ] Automated pricing optimization
- [ ] Reader segment analysis
- [ ] Cross-promotion recommendations

---

## Related Features

- **Editor** (`src/features/editor`) - Content source
- **Projects** (`src/features/projects`) - Project management
- **Characters** (`src/features/characters`) - Character export
- **World Building** (`src/features/world-building`) - World guide export

---

## Contributing

When modifying Publishing:

1. Test exports thoroughly on multiple devices
2. Validate EPUB/PDF compliance
3. Handle platform API changes gracefully
4. Secure API keys properly
5. Monitor export file sizes
6. Add comprehensive tests

---

## Resources

- [EPUB 3 Specification](https://www.w3.org/publishing/epub3/)
- [EPUBCheck Validator](https://github.com/w3c/epubcheck)
- [KDP Help & Documentation](https://kdp.amazon.com/en_US/help)
- [Draft2Digital API Docs](https://www.draft2digital.com/)

---

## License

Part of Novelist.ai - See root LICENSE file
