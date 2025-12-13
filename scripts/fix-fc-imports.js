#!/usr/bin/env node

/**
 * Fix missing FC imports
 * Adds missing FC imports to files that use FC without importing it
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';

const ALLOWED_EXTENSIONS = ['.ts', '.tsx'];
const IGNORE_PATTERNS = [
  'node_modules/',
  'dist/',
  'build/',
  '.cache/',
  'coverage/',
  '.git/',
  'scripts/',
];

function shouldIgnore(filePath) {
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.endsWith('/')) {
      return filePath.includes(pattern);
    }
    return filePath.includes(pattern);
  });
}

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

function addFCImport(content) {
  const lines = content.split('\n');

  // Check if FC is used
  const usesFC = /[^a-zA-Z]FC<[^>]+>/.test(content);
  if (!usesFC) {
    return { content, modified: false, reason: 'FC not used' };
  }

  // Check if FC is already imported
  const hasFCImport = /import\s+(?:type\s+)?{[^}]*FC[^}]*}\s+from\s+['"]react['"]/.test(content);
  if (hasFCImport) {
    return { content, modified: false, reason: 'FC already imported' };
  }

  let modified = false;
  const newLines = [];
  let reactImportIndex = -1;

  // Find React import
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for React import
    if (line.match(/^import\s+(?:type\s+)?{[^}]*}\s+from\s+['"]react['"]/)) {
      reactImportIndex = i;
      break;
    }
  }

  if (reactImportIndex !== -1) {
    // Add FC to existing React import
    for (let i = 0; i < lines.length; i++) {
      if (i === reactImportIndex) {
        const line = lines[i];
        const match = line.match(/^import\s+(type\s+)?{([^}]+)}\s+from\s+['"]react['"]/);

        if (match) {
          const isTypeImport = match[1] !== undefined;
          const importList = match[2].split(',').map(s => s.trim()).filter(s => s);

          // Add FC
          if (!importList.includes('FC')) {
            importList.push('FC');

            if (isTypeImport) {
              newLines.push(`import type { ${importList.join(', ')} } from 'react';`);
            } else {
              newLines.push(`import { ${importList.join(', ')} } from 'react';`);
            }
            modified = true;
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(lines[i]);
      }
    }
  } else {
    // No React import found, add one at the top
    newLines.push(`import { FC } from 'react';`);
    newLines.push('');
    newLines.push(...lines);
    modified = true;
  }

  return { content: newLines.join('\n'), modified, reason: 'FC import added' };
}

async function processFiles() {
  console.log('🔧 Adding missing FC imports...\n');

  const files = await getAllFiles('src');

  const results = { processed: 0, fixed: 0, errors: 0 };
  const fixedFiles = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const result = addFCImport(content);

      if (result.modified) {
        writeFileSync(file, result.content, 'utf8');
        results.fixed++;
        fixedFiles.push(file);
        console.log(`✅ ${file}`);
      }

      results.processed++;
    } catch (error) {
      results.errors++;
      console.log(`❌ ${file}: ${error.message}`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${results.processed}`);
  console.log(`   Files fixed: ${results.fixed}`);
  console.log(`   Errors: ${results.errors}`);

  if (fixedFiles.length > 0) {
    console.log(`\n🎉 Added FC imports to:`);
    fixedFiles.forEach(file => console.log(`   ${file}`));
  }

  if (results.errors > 0) {
    process.exit(1);
  }
}

processFiles();
