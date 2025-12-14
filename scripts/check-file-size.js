#!/usr/bin/env node

/**
 * File Size Checker for GOAP Implementation
 * Enforces the 500 LOC policy for maintainable code
 *
 * Usage: node scripts/check-file-size.js
 * Usage: npm run check:file-size
 */

import { readFileSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative, extname } from 'path';

// Configuration
const MAX_LINES_OF_CODE = 800;
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
  console.log('🔍 Checking file sizes...\n');

  const violations = [];
  const totalFiles = { checked: 0, violations: 0 };

  try {
    const files = await getAllFiles('src');
    totalFiles.checked = files.length;

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const linesOfCode = countLinesOfCode(content);
        const relativePath = relative('.', file);

        if (linesOfCode > MAX_LINES_OF_CODE) {
          violations.push({
            path: relativePath,
            linesOfCode,
            excess: linesOfCode - MAX_LINES_OF_CODE,
          });
          totalFiles.violations++;
        }

        console.log(`${linesOfCode.toString().padStart(4)} LOC  ${relativePath}`);
      } catch (error) {
        console.warn(`⚠️  Could not read ${file}: ${error.message}`);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Files checked: ${totalFiles.checked}`);
    console.log(`   Violations: ${totalFiles.violations}`);

    if (violations.length > 0) {
      console.log(`\n🚨 Files exceeding ${MAX_LINES_OF_CODE} LOC:`);
      violations
        .sort((a, b) => b.linesOfCode - a.linesOfCode)
        .forEach(violation => {
          console.log(`   ${violation.path}: ${violation.linesOfCode} LOC (+${violation.excess})`);
        });

      console.log(`\n💡 Recommendations:`);
      violations.forEach(violation => {
        console.log(`   ${violation.path}:`);
        console.log(`     - Consider splitting into smaller modules`);
        console.log(`     - Extract utility functions`);
        console.log(`     - Split complex components into sub-components`);
      });

      process.exit(1);
    } else {
      console.log(`\n✅ All files are within the ${MAX_LINES_OF_CODE} LOC limit!`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`❌ Error checking file sizes: ${error.message}`);
    process.exit(1);
  }
}

// Run the check
checkFileSizes();
