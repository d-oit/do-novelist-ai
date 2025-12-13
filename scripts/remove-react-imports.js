#!/usr/bin/env node

/**
 * Remove unnecessary React imports
 * Automatically removes React imports from files that only use React.FC
 */

import { readFileSync, writeFileSync } from 'fs';

// Files that use React.memo, React.forwardRef, etc. - skip these
const SKIP_FILES = [
  'src/features/characters/components/CharacterGrid.tsx',
  'src/features/analytics/components/AnalyticsDashboardRefactored.tsx',
  'src/features/projects/components/ProjectDashboard.tsx',
  'src/components/ProjectDashboard.tsx',
  'src/components/error-boundary.tsx',
  'src/components/ActionCard.tsx',
  'src/components/AgentConsole.tsx',
  'src/components/ui/MetricCard.tsx',
  'src/components/ui/Card.tsx',
  'src/components/ProjectStats.tsx',
  'src/components/GoapVisualizer.tsx',
  'src/app/App.tsx',
  'src/index.tsx',
  'src/contexts/UserContext.tsx',
];

// Files to process
const FILES_TO_FIX = [
  'src/features/characters/components/CharacterFilters.tsx',
  'src/features/characters/components/CharacterEditor.tsx',
  'src/features/characters/components/CharacterCard.tsx',
  'src/features/characters/components/CharacterManager.tsx',
  'src/features/characters/components/CharacterGrid.tsx',
  'src/features/analytics/components/GoalsManager.tsx',
  'src/features/analytics/components/AnalyticsContent.tsx',
  'src/features/analytics/components/AnalyticsDashboardRefactored.tsx',
  'src/features/editor/components/BookViewer.tsx',
  'src/features/editor/components/ChapterEditor.tsx',
  'src/features/editor/components/PublishPanel.tsx',
  'src/features/generation/components/BookViewer.tsx',
  'src/features/timeline/components/TimelineView.tsx',
  'src/features/timeline/components/TimelineCanvas.tsx',
  'src/features/publishing/components/PublishPanel.tsx',
  'src/features/publishing/components/PublishView.tsx',
  'src/features/publishing/components/PublishingDashboard.tsx',
  'src/features/publishing/components/PublishingSetup.tsx',
  'src/features/writing-assistant/components/WritingAnalyticsDashboard.tsx',
  'src/features/writing-assistant/components/WritingAssistantPanel.tsx',
  'src/features/world-building/components/LocationManager.tsx',
  'src/features/world-building/components/WorldBuildingDashboard.tsx',
  'src/features/world-building/components/CultureManager.tsx',
  'src/features/projects/components/ProjectDashboard.tsx',
  'src/features/gamification/components/GamificationDashboard.tsx',
  'src/components/error-boundary.tsx',
  'src/components/layout/MainLayout.tsx',
  'src/components/ProjectDashboard.tsx',
  'src/components/ProjectDashboardOptimized.tsx',
];

function removeReactImports(filePath, content) {
  let modified = false;
  const lines = content.split('\n');

  // Check if file uses React.memo, React.forwardRef, React.createContext
  const usesReactFeatures = /React\.(memo|forwardRef|createContext|useCallback|useMemo|useEffect|useState|useContext)/.test(content);

  if (usesReactFeatures || SKIP_FILES.includes(filePath)) {
    return { content, modified, reason: 'uses React features' };
  }

  const newLines = [];
  let hasReactImport = false;
  let hasReactFC = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for React.FC usage
    if (line.includes('React.FC')) {
      hasReactFC = true;
    }

    // Check for React import
    const reactImportMatch = line.match(/^import\s+React(\s*,\s*\{([^}]+)\})?\s+from\s+['"]react['"]/);

    if (reactImportMatch) {
      hasReactImport = true;
      modified = true;

      const hasNamedImports = reactImportMatch[1] !== undefined;
      const namedImports = reactImportMatch[2];

      if (!hasNamedImports) {
        // Just `import React from 'react'` - convert to type import
        // Check if we need FC
        if (hasReactFC) {
          newLines.push(`import type { FC } from 'react';`);
        }
        // Otherwise skip the import entirely
      } else {
        // Has named imports like `import React, { useState, useEffect } from 'react'`
        const importList = namedImports.split(',').map(s => s.trim()).filter(s => s);

        // Filter out React itself
        const filteredImports = importList.filter(s => s !== 'React');

        // Add FC if needed
        if (hasReactFC && !filteredImports.includes('FC')) {
          filteredImports.push('FC');
        }

        if (filteredImports.length > 0) {
          // Add FC as a type import if it's there
          const hasFC = filteredImports.includes('FC');
          const nonFcImports = filteredImports.filter(s => s !== 'FC');

          if (hasFC && nonFcImports.length > 0) {
            // Mix of value and type imports - keep value imports and add type FC
            newLines.push(`import { ${nonFcImports.join(', ')}, type FC } from 'react';`);
          } else if (hasFC) {
            // Only FC import
            newLines.push(`import type { FC } from 'react';`);
          } else {
            // Only value imports
            newLines.push(`import { ${filteredImports.join(', ')} } from 'react';`);
          }
        } else if (hasFC) {
          // Only FC import
          newLines.push(`import type { FC } from 'react';`);
        }
        // Otherwise skip the import entirely
      }

      continue;
    }

    newLines.push(line);
  }

  // Replace React.FC with FC
  if (hasReactFC) {
    const newContent = newLines.join('\n').replace(/React\.FC/g, 'FC');
    return { content: newContent, modified: true, reason: 'removed React import' };
  }

  return { content: newLines.join('\n'), modified, reason: hasReactImport ? 'removed React import' : 'no React import' };
}

async function processFiles() {
  console.log('🔧 Removing unnecessary React imports...\n');

  const results = { processed: 0, fixed: 0, errors: 0, skipped: 0 };
  const fixedFiles = [];
  const skippedFiles = [];

  for (const file of FILES_TO_FIX) {
    try {
      results.processed++;

      if (SKIP_FILES.includes(file)) {
        results.skipped++;
        skippedFiles.push(file);
        console.log(`⏭️  ${file} (uses React features)`);
        continue;
      }

      const content = readFileSync(file, 'utf8');
      const result = removeReactImports(file, content);

      if (result.modified) {
        writeFileSync(file, result.content, 'utf8');
        results.fixed++;
        fixedFiles.push(file);
        console.log(`✅ ${file}`);
      } else {
        console.log(`⏭️  ${file} (${result.reason})`);
      }
    } catch (error) {
      results.errors++;
      console.log(`❌ ${file}: ${error.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${results.processed}`);
  console.log(`   Files fixed: ${results.fixed}`);
  console.log(`   Files skipped: ${results.skipped}`);
  console.log(`   Errors: ${results.errors}`);

  if (fixedFiles.length > 0) {
    console.log(`\n🎉 Fixed React imports in:`);
    fixedFiles.forEach(file => console.log(`   ${file}`));

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review changes: git diff`);
    console.log(`   2. Run linter: npm run lint`);
    console.log(`   3. Run tests: npm run test`);
  }

  if (skippedFiles.length > 0) {
    console.log(`\n⏭️  Skipped files (use React features):`);
    skippedFiles.forEach(file => console.log(`   ${file}`));
  }

  if (results.errors > 0) {
    process.exit(1);
  }
}

processFiles();
