# Export Enhancements Implementation Plan

**Date**: 2026-01-13  
**Priority**: HIGH (#1)  
**Estimated Effort**: 25-35 hours  
**Database**: Turso DB (local + cloud)

---

## Goal

Enhance the publishing/export feature with professional-grade PDF export,
multiple export profiles, batch export for series, and export history tracking
via Turso DB.

---

## Current State Analysis

### Existing Infrastructure

- ✅ `epubService.ts` (210 LOC) - EPUB 3.0 generation using JSZip
- ✅ `PublishPanel.tsx` - Export UI with format selection
- ✅ Cover image support (base64 PNG)
- ✅ Chapter content with markdown→HTML conversion
- ✅ Drop caps styling option

### Gaps Identified

- ❌ No PDF export (only EPUB exists)
- ❌ No export profiles (KDP, IngramSpark)
- ❌ No batch export for series
- ❌ No export history tracking
- ❌ No print-ready formatting (trim size, bleed)

---

## Proposed Changes

### src/features/publishing/services/

#### [NEW] [pdfService.ts](file:///d:/git/do-novelist-ai/src/features/publishing/services/pdfService.ts)

PDF generation service using browser-native canvas + PDF library.

**Key Functions**:

```typescript
generatePDF(project: Project, options: PDFOptions): Promise<Blob>

interface PDFOptions {
  profile: 'kdp' | 'ingram' | 'lulu' | 'custom';
  trimSize: '5x8' | '6x9' | '5.5x8.5' | 'a5' | 'custom';
  bleed?: number; // inches, default 0.125
  margins: { top: number; bottom: number; inner: number; outer: number };
  fontSize: number;
  fontFamily: 'serif' | 'sans-serif';
  includePageNumbers: boolean;
  tocStyle: 'classic' | 'modern' | 'minimal';
}
```

**Dependencies**: jsPDF or @react-pdf/renderer (~50KB)

---

#### [NEW] [exportProfileService.ts](file:///d:/git/do-novelist-ai/src/features/publishing/services/exportProfileService.ts)

Pre-configured export profiles for major platforms.

**Profiles**: | Profile | Trim Size | Bleed | Margins | Notes |
|---------|-----------|-------|---------|-------| | Amazon KDP | 6x9" | 0.125" |
0.5" inner | Paperback standard | | IngramSpark | 6x9" | 0.125" | 0.75" inner |
Print-on-demand | | Lulu | 5.5x8.5" | 0" | 0.5" | Trade paperback | | Draft | A4
| 0" | 1" | Review draft |

---

#### [NEW] [exportHistoryService.ts](file:///d:/git/do-novelist-ai/src/features/publishing/services/exportHistoryService.ts)

Export history tracking with Turso DB.

**Turso Schema**:

```sql
CREATE TABLE export_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  project_id TEXT NOT NULL REFERENCES projects(id),
  format TEXT NOT NULL, -- 'epub' | 'pdf' | 'mobi' | 'docx'
  profile TEXT, -- 'kdp' | 'ingram' | null
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  chapter_count INTEGER NOT NULL,
  word_count INTEGER NOT NULL,
  exported_at TEXT NOT NULL DEFAULT (datetime('now')),
  exported_by TEXT, -- user identifier
  settings JSON, -- full export settings snapshot
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_export_history_project ON export_history(project_id);
CREATE INDEX idx_export_history_date ON export_history(exported_at);
```

---

#### [MODIFY] [epubService.ts](file:///d:/git/do-novelist-ai/src/features/publishing/services/epubService.ts)

Extend with profile support and metadata.

**Changes**:

- Add `EPUBOptions` interface with profile settings
- Add ISBN/metadata support
- Improve CSS templates per profile
- Add export history logging

---

### src/features/publishing/components/

#### [NEW] [ExportProfileSelector.tsx](file:///d:/git/do-novelist-ai/src/features/publishing/components/ExportProfileSelector.tsx)

UI for selecting export profiles with preview.

**Features**:

- Visual preview of trim size
- Profile comparison table
- Custom settings override
- Platform-specific tips

---

#### [NEW] [ExportHistoryPanel.tsx](file:///d:/git/do-novelist-ai/src/features/publishing/components/ExportHistoryPanel.tsx)

View and re-download past exports.

**Features**:

- List of past exports with date/format
- Re-export with same settings
- Compare versions
- Delete old exports

---

#### [MODIFY] [PublishPanel.tsx](file:///d:/git/do-novelist-ai/src/features/publishing/components/PublishPanel.tsx)

Integrate new export options.

**Changes**:

- Add PDF format option
- Integrate ExportProfileSelector
- Add "Export as Series" batch option
- Show export history link

---

### src/lib/database/schemas/

#### [NEW] [exportHistorySchema.ts](file:///d:/git/do-novelist-ai/src/lib/database/schemas/exportHistorySchema.ts)

Drizzle schema for export history.

```typescript
export const exportHistory = sqliteTable('export_history', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  format: text('format').notNull(),
  profile: text('profile'),
  fileName: text('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  chapterCount: integer('chapter_count').notNull(),
  wordCount: integer('word_count').notNull(),
  exportedAt: text('exported_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  exportedBy: text('exported_by'),
  settings: text('settings', { mode: 'json' }),
});
```

---

## Implementation Phases

### Phase 1: PDF Export (10-12 hours)

- [ ] Research PDF library (jsPDF vs @react-pdf/renderer)
- [ ] Create `pdfService.ts` with basic generation
- [ ] Add trim size and margin support
- [ ] Implement page numbers and TOC
- [ ] Add tests

### Phase 2: Export Profiles (6-8 hours)

- [ ] Create `exportProfileService.ts`
- [ ] Define KDP, IngramSpark, Lulu profiles
- [ ] Create `ExportProfileSelector.tsx` component
- [ ] Integrate with PublishPanel
- [ ] Add tests

### Phase 3: Export History (5-8 hours)

- [ ] Create Drizzle schema
- [ ] Run Turso migration
- [ ] Create `exportHistoryService.ts`
- [ ] Create `ExportHistoryPanel.tsx`
- [ ] Add React Query hooks
- [ ] Add tests

### Phase 4: Batch Export (4-6 hours)

- [ ] Add series detection logic
- [ ] Implement multi-project export
- [ ] Create ZIP bundle for batch downloads
- [ ] Add progress indicator
- [ ] Add tests

---

## Verification Plan

### Automated Tests

```bash
npm run test -- publishing
vitest run src/features/publishing/services/__tests__/pdfService.test.ts
vitest run src/features/publishing/services/__tests__/exportHistoryService.test.ts
```

### Manual Verification

1. Export PDF with KDP profile → Open in Adobe Reader
2. Export EPUB → Validate with epubcheck
3. Verify export history saves to Turso
4. Test batch export with 3-book series
5. Verify print-ready bleed on PDF

---

## Dependencies

| Package        | Size  | Purpose            | Status       |
| -------------- | ----- | ------------------ | ------------ |
| jsPDF          | ~80KB | PDF generation     | To install   |
| JSZip          | ~45KB | Batch ZIP bundling | ✅ Installed |
| @libsql/client | -     | Turso DB           | ✅ Installed |

---

## Risk Assessment

| Risk                    | Impact | Mitigation             |
| ----------------------- | ------ | ---------------------- |
| PDF library bundle size | Medium | Lazy load on export    |
| Print quality issues    | High   | Test with actual print |
| Turso sync conflicts    | Low    | Use optimistic locking |

---

## Success Metrics

- ✅ PDF export generates valid 6x9" document
- ✅ 4 export profiles available
- ✅ Export history persists in Turso
- ✅ Batch export ZIP < 10s for 3 books
- ✅ All tests passing
