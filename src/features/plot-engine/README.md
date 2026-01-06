# AI Plot Engine

> **Intelligent plot analysis, generation, and management powered by AI**

The Plot Engine provides writers with advanced AI-powered tools to analyze story
structure, detect plot holes, visualize character relationships, and generate
plot suggestions.

---

## 📚 Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [Components](#components)
- [Services](#services)
- [Usage Guide](#usage-guide)
- [Best Practices](#best-practices)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## ✨ Features

### 1. **Plot Analysis** 📊

Comprehensive analysis of your story's plot structure:

- Story arc visualization with tension curves
- Pacing analysis across chapters
- Plot point identification
- Narrative flow assessment

### 2. **Plot Hole Detection** 🔍

Intelligent detection of story inconsistencies:

- Timeline contradictions
- Character behavior inconsistencies
- Logical plot errors
- Unresolved plot threads
- Foreshadowing tracking

### 3. **Character Graph** 👥

Visual relationship mapping:

- Character relationship networks
- Relationship strength analysis
- Evolution tracking over time
- Centrality and importance scores

### 4. **Story Arc Visualization** 📈

Data-driven story structure insights:

- Three-act structure mapping
- Tension curve visualization
- Pacing charts
- Chapter-by-chapter analysis

### 5. **Plot Generation** ✨

AI-powered plot creation:

- Genre-specific plot generation
- Customizable story parameters
- Act and plot point suggestions
- Conflict and resolution ideas

---

## 🚀 Quick Start

### Prerequisites

- A project with at least one chapter
- (Optional) Defined characters for better analysis

### Basic Usage

```typescript
import { PlotEngineDashboard } from '@/features/plot-engine';

function MyComponent() {
  return (
    <PlotEngineDashboard
      projectId="your-project-id"
    />
  );
}
```

### Step-by-Step Guide

1. **Navigate to Plot Engine**
   - Open your project
   - Click on "Plot Engine" in the navigation

2. **Run Analysis**
   - Go to the "Overview" tab
   - Click "Analyze Plot"
   - Wait for analysis to complete

3. **Review Results**
   - **Overview**: See overall plot quality score
   - **Story Arc**: View tension and pacing charts
   - **Characters**: Explore relationship networks
   - **Plot Holes**: Review detected issues
   - **Generator**: Create new plot suggestions

---

## 🧩 Components

### PlotEngineDashboard

Main dashboard with tabbed interface.

**Props:**

```typescript
interface PlotEngineDashboardProps {
  projectId: string;
  onGeneratePlot?: (
    request: PlotGenerationRequest,
  ) => Promise<PlotGenerationResult>;
}
```

**Features:**

- Tab navigation (Overview, Story Arc, Characters, Plot Holes, Generator)
- Loading states with skeletons
- Error boundaries for resilience

---

### PlotAnalyzer

Analyzes plot structure and quality.

**Props:**

```typescript
interface PlotAnalyzerProps {
  projectId: string;
  onAnalyze?: (result: AnalysisResult) => void;
}
```

**What it does:**

- Fetches chapters and characters
- Analyzes story structure
- Detects plot holes
- Builds character graph
- Calculates quality score

**Usage:**

```typescript
<PlotAnalyzer
  projectId="project-123"
  onAnalyze={(result) => console.log('Analysis:', result)}
/>
```

---

### StoryArcVisualizer

Visualizes story structure with charts.

**Props:**

```typescript
interface StoryArcVisualizerProps {
  storyArc: StoryArc;
  plotStructure?: PlotStructure;
  onPlotPointClick?: (point: PlotPoint) => void;
  onPlotPointsReorder?: (points: PlotPoint[]) => void;
}
```

**Features:**

- Tension curve line chart
- Pacing bar chart
- Three-act structure breakdown
- Interactive plot points
- Responsive design

---

### CharacterGraphView

Displays character relationships as a network.

**Props:**

```typescript
interface CharacterGraphViewProps {
  characterGraph: CharacterGraph;
  onNodeClick?: (characterId: string) => void;
  onRelationshipClick?: (relationship: CharacterRelationship) => void;
}
```

**Features:**

- Visual network graph
- Relationship type indicators
- Strength visualization
- Evolution tracking
- Detailed relationship cards

---

### PlotHoleDetectorView

Shows detected plot holes and issues.

**Props:**

```typescript
interface PlotHoleDetectorViewProps {
  analysis: PlotHoleAnalysis;
  onDismissHole?: (holeId: string) => void;
  onFixHole?: (holeId: string) => void;
}
```

**Features:**

- Severity-based filtering
- Type-based filtering
- Search functionality
- Suggested fixes
- Dismissal tracking

---

### PlotGenerator

Generates plot suggestions using AI.

**Props:**

```typescript
interface PlotGeneratorProps {
  projectId: string;
  onPlotGenerated?: (plot: PlotStructure) => void;
}
```

**Features:**

- Genre selection
- Target length customization
- Act count options
- Conflict type selection
- AI-powered generation

---

## 🔧 Services

### plotAnalysisService

**Functions:**

- `analyzePlot(request: PlotAnalysisRequest): Promise<AnalysisResult>`

Analyzes story structure, identifies plot points, calculates tension/pacing.

---

### plotHoleDetector

**Functions:**

- `detectPlotHoles(projectId, chapters, characters): Promise<PlotHoleAnalysis>`

Detects timeline issues, character inconsistencies, logical errors, unresolved
threads.

**Algorithms:**

- Timeline analysis with date extraction
- Character trait tracking
- Logical contradiction detection
- Foreshadowing identification

---

### characterGraphService

**Functions:**

- `buildCharacterGraph(projectId, chapters, characters): Promise<CharacterGraph>`
- `getCharacterRelationships(characterId, graph): CharacterRelationship[]`
- `getStrongestRelationships(graph, limit?): CharacterRelationship[]`
- `detectRelationshipChanges(relationship): RelationshipEvolution`

Builds relationship networks, tracks evolution, calculates importance.

---

### plotGenerationService

**Functions:**

- `generatePlot(request: PlotGenerationRequest): Promise<PlotGenerationResult>`

Generates AI-powered plot structures with acts, scenes, and suggestions.

---

### plotStorageService

**Functions:**

- `savePlotAnalysis(analysis): Promise<void>`
- `getPlotAnalysis(projectId): Promise<AnalysisResult | null>`
- `savePlotStructure(structure): Promise<void>`
- `getPlotStructure(projectId): Promise<PlotStructure | null>`

Persists analysis results and plot structures.

---

## 📖 Usage Guide

### Analyzing Your Story

1. **Prepare Your Content**
   - Write at least 3-5 chapters (~1000 words each)
   - Define main characters
   - Add character descriptions and traits

2. **Run Analysis**

   ```typescript
   const { analyze, result, isAnalyzing } = usePlotAnalysis();

   await analyze({
     projectId: 'project-123',
     includeCharacterGraph: true,
     detectPlotHoles: true,
   });
   ```

3. **Interpret Results**
   - **Score 90-100**: Excellent structure
   - **Score 70-89**: Good with minor issues
   - **Score 50-69**: Needs improvement
   - **Score <50**: Significant issues detected

### Fixing Plot Holes

1. **Review Detected Issues**
   - Check severity (critical → minor)
   - Read descriptions and affected chapters

2. **Follow Suggestions**
   - Each plot hole includes a suggested fix
   - Click "Fix" to jump to relevant chapter

3. **Re-analyze**
   - After making changes, re-run analysis
   - Verify issues are resolved

### Generating Plot Ideas

1. **Set Parameters**

   ```typescript
   const request: PlotGenerationRequest = {
     projectId: 'project-123',
     premise: 'A detective investigates a mysterious case',
     genre: 'mystery',
     targetLength: 20, // chapters
     actCount: 3,
     conflictType: 'external',
     tone: 'dark',
   };
   ```

2. **Generate**

   ```typescript
   const { generate, result } = usePlotGeneration();
   const plotResult = await generate(request);
   ```

3. **Review & Iterate**
   - Examine generated acts and scenes
   - Use as inspiration or starting point
   - Regenerate with different parameters

---

## 🎯 Best Practices

### For Better Analysis

1. **Write Complete Chapters**
   - Aim for 1000+ words per chapter
   - Include dialogue and action
   - Maintain consistent character voices

2. **Define Characters**
   - Add descriptions, traits, goals
   - Define relationships explicitly
   - Track character development

3. **Maintain Consistency**
   - Keep timeline clear (dates, seasons)
   - Track character appearances
   - Resolve plot threads

### Performance Tips

1. **Use Lazy Loading**

   ```typescript
   import { LazyPlotEngineDashboard } from '@/features/plot-engine';
   ```

2. **Batch Operations**
   - Analyze after multiple chapters written
   - Don't analyze on every keystroke

3. **Cache Results**
   - Results are automatically cached
   - Re-analysis only when content changes

---

## 📚 API Reference

### Types

```typescript
// Analysis Result
interface AnalysisResult {
  projectId: string;
  storyArc: StoryArc;
  plotHoleAnalysis: PlotHoleAnalysis;
  characterGraph: CharacterGraph;
  qualityScore: number;
  analyzedAt: Date;
}

// Story Arc
interface StoryArc {
  tension: TensionPoint[];
  pacing: PacingPoint[];
  structure: '3-act' | '5-act' | 'hero-journey' | 'custom';
}

// Plot Hole
interface PlotHole {
  id: string;
  type: PlotHoleType;
  severity: 'critical' | 'major' | 'moderate' | 'minor';
  title: string;
  description: string;
  affectedChapters: string[];
  suggestedFix?: string;
  confidence: number;
}

// Character Relationship
interface CharacterRelationship {
  id: string;
  character1Id: string;
  character2Id: string;
  type: RelationshipType;
  strength: number; // 0-10
  evolution: RelationshipEvolution[];
  isReciprocal: boolean;
}
```

### Hooks

```typescript
// Plot Analysis
const { analyze, result, isAnalyzing, error } = usePlotAnalysis();

// Plot Generation
const { generate, result, isGenerating, error } = usePlotGeneration();

// Character Graph
const { graph, relationships, isLoading } = useCharacterGraph(projectId);
```

---

## 🔍 Troubleshooting

### Analysis Not Running

**Problem**: Analyze button doesn't work

**Solutions:**

- Check if project has chapters
- Verify API keys are configured
- Check browser console for errors

---

### Poor Quality Score

**Problem**: Analysis shows low score

**Reasons:**

- Timeline inconsistencies
- Character behavior changes
- Unresolved plot threads
- Pacing issues

**Solutions:**

- Review plot holes tab
- Fix critical issues first
- Re-analyze after changes

---

### Slow Performance

**Problem**: Analysis takes too long

**Solutions:**

- Reduce chapter count for testing
- Use lazy loading
- Check network connection
- Verify AI provider status

---

### Missing Character Relationships

**Problem**: Character graph is empty

**Solutions:**

- Define characters in project
- Ensure characters appear in chapters
- Use character names consistently
- Re-analyze after adding content

---

## 🛠️ Development

### Running Tests

```bash
# Unit tests
npm test -- src/features/plot-engine

# Integration tests
npm test -- src/features/plot-engine/services/__tests__

# E2E tests
npm run test:e2e -- plot-engine
```

### Building

```bash
# Development
npm run dev

# Production
npm run build
```

---

## 📄 License

Part of Novelist.ai - See LICENSE file for details.

---

## 🤝 Contributing

See CONTRIBUTING.md for guidelines.

---

## 📞 Support

- Issues: GitHub Issues
- Docs: /docs
- Community: Discord

---

**Built with ❤️ for writers by writers**
