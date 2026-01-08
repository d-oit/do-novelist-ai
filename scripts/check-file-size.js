#!/usr/bin/env node

/**
 * File Size Checker for GOAP Implementation
 *
 * Policy:
 * - Warn when a file exceeds 450 LOC
 * - Fail CI when a file exceeds 500 LOC
 *
 * Usage: node scripts/check-file-size.js
 * Usage: npm run check:file-size
 */

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

import { readFileSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative, extname } from 'path';

// Configuration
const WARN_LINES_OF_CODE = 550;
const MAX_LINES_OF_CODE = 600;
const ALLOWED_VIOLATIONS = new Set([
  // Production files exceeding 600 LOC limit (to be refactored)
  'src/features/plot-engine/services/plotGenerationService.ts', // 1061 LOC - high priority refactoring
  'src/features/publishing/services/publishingAnalyticsService.ts', // 712 LOC
  'src/lib/character-validation.ts', // 690 LOC
  'src/features/writing-assistant/services/grammarSuggestionService.ts', // 634 LOC
  // Test files exceeding 600 LOC limit
  'src/features/plot-engine/services/__tests__/rag-end-to-end.test.ts', // 935 LOC
  'src/features/plot-engine/services/__tests__/plotGenerationService.integration.test.ts', // 839 LOC
  'src/features/plot-engine/services/__tests__/plotGenerationService.test.ts', // 795 LOC
  'src/features/plot-engine/services/__tests__/plotStorageService.test.ts', // 706 LOC
]);

const IGNORE_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  '.cache/',
  'coverage/',
  '.git/',
  '*.min.js',
  '*.bundle.js',
  'src/assets/',
  'src/index.css',
  'src/styles.css',
];

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

/**
 * Check if a file should be ignored based on patterns
 */
function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      return filePath.includes(pattern);
    }
    if (pattern.startsWith('*.')) {
      return filePath.endsWith(pattern.substring(1));
    }
    return filePath.includes(pattern);
  });
}

/**
 * Count lines of code (excluding empty lines and comments)
 */
function countLinesOfCode(content) {
  const lines = content.split('\n');
  let codeLines = 0;
  let inBlockComment = false;

  for (let line of lines) {
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) continue;

    // Handle block comments
    if (trimmed.startsWith('/*') || trimmed.includes('/*')) {
      inBlockComment = true;
    }
    if (trimmed.includes('*/')) {
      inBlockComment = false;
    }
    if (inBlockComment) continue;

    // Skip single-line comments
    if (trimmed.startsWith('//')) continue;

    // Count as code line
    codeLines++;
  }

  return codeLines;
}

/**
 * Recursively get all files in a directory
 */
async function getAllFiles(dir, fileList = []) {
  const files = await readdir(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stats = await stat(filePath);

    if (stats.isDirectory()) {
      await getAllFiles(filePath, fileList);
    } else {
      if (shouldIgnore(filePath)) continue;

      const ext = extname(filePath);
      if (ALLOWED_EXTENSIONS.includes(ext)) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

/**
 * Check file sizes and report violations
 */
async function checkFileSizes() {
  writeStdout('🔍 Checking file sizes...\n');

  const warnings = [];
  const violations = [];
  const totalFiles = { checked: 0, warnings: 0, violations: 0 };

  try {
    const files = await getAllFiles('src');
    totalFiles.checked = files.length;

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const linesOfCode = countLinesOfCode(content);
        const relativePath = relative('.', file).split('\\').join('/');

        if (linesOfCode > MAX_LINES_OF_CODE) {
          if (!ALLOWED_VIOLATIONS.has(relativePath)) {
            violations.push({
              path: relativePath,
              linesOfCode,
              excess: linesOfCode - MAX_LINES_OF_CODE,
            });
            totalFiles.violations++;
          }
        } else if (linesOfCode > WARN_LINES_OF_CODE) {
          warnings.push({
            path: relativePath,
            linesOfCode,
            excess: linesOfCode - WARN_LINES_OF_CODE,
          });
          totalFiles.warnings++;
        }

        const status =
          linesOfCode > MAX_LINES_OF_CODE ? '❌' : linesOfCode > WARN_LINES_OF_CODE ? '⚠️ ' : '   ';

        writeStdout(`${status}${linesOfCode.toString().padStart(4)} LOC  ${relativePath}`);
      } catch (error) {
        writeStderr(`⚠️  Could not read ${file}: ${error.message}`);
      }
    }

    writeStdout(`\n📊 Summary:`);
    writeStdout(`   Files checked: ${totalFiles.checked}`);
    writeStdout(`   Warnings (> ${WARN_LINES_OF_CODE} LOC): ${totalFiles.warnings}`);
    writeStdout(`   Violations (> ${MAX_LINES_OF_CODE} LOC): ${totalFiles.violations}`);

    const realWarnings = warnings.filter(w => !ALLOWED_VIOLATIONS.has(w.path));

    if (realWarnings.length > 0) {
      writeStdout(`\n⚠️  Files exceeding ${WARN_LINES_OF_CODE} LOC (warning):`);
      realWarnings
        .sort((a, b) => b.linesOfCode - a.linesOfCode)
        .forEach(warning => {
          writeStdout(`   ${warning.path}: ${warning.linesOfCode} LOC (+${warning.excess})`);
        });
    }

    if (ALLOWED_VIOLATIONS.size > 0) {
      writeStdout(`\nℹ️  Allowed violations (tracked in plans/FILE-SIZE-VIOLATIONS.md):`);
      [...ALLOWED_VIOLATIONS].sort().forEach(path => writeStdout(`   - ${path}`));
    }

    if (violations.length > 0) {
      writeStdout(`\n🚨 Files exceeding ${MAX_LINES_OF_CODE} LOC (failure):`);
      violations
        .sort((a, b) => b.linesOfCode - a.linesOfCode)
        .forEach(violation => {
          writeStdout(`   ${violation.path}: ${violation.linesOfCode} LOC (+${violation.excess})`);
        });

      writeStdout(`\n💡 Recommendations:`);
      violations.forEach(violation => {
        writeStdout(`   ${violation.path}:`);
        writeStdout(`     - Consider splitting into smaller modules`);
        writeStdout(`     - Extract utility functions`);
        writeStdout(`     - Split complex components into sub-components`);
      });

      process.exit(1);
    }

    writeStdout(`\n✅ No files exceed ${MAX_LINES_OF_CODE} LOC.`);
    process.exit(0);
  } catch (error) {
    writeStderr(`❌ Error checking file sizes: ${error.message}`);
    process.exit(1);
  }
}

// Run the check
checkFileSizes();
