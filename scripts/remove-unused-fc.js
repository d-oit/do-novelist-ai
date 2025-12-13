#!/usr/bin/env node

/**
 * Remove unused FC imports
 * Removes FC from imports in files that don't actually use FC
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

function removeStandaloneFC(content) {
  const lines = content.split('\n');
  let modified = false;

  // Check if there's a standalone FC import: import { FC } from 'react';
  const hasStandaloneFC = lines.some(line => {
    const trimmed = line.trim();
    return trimmed === "import { FC } from 'react';" || trimmed === 'import { FC } from "react";';
  });

  if (!hasStandaloneFC) {
    return { content, modified: false, reason: 'no standalone FC import' };
  }

  // Check if FC is actually used
  const usesFC = /[^a-zA-Z]FC<[^>]+>/.test(content);

  if (!usesFC) {
    // Remove the standalone FC import line
    const newLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed !== "import { FC } from 'react';" && trimmed !== 'import { FC } from "react";';
    });
    modified = true;
    return { content: newLines.join('\n'), modified, reason: 'removed standalone FC import' };
  }

  return { content, modified: false, reason: 'FC is used' };
}

async function processFiles() {
  console.log('🔧 Removing unused FC imports...\n');

  const files = await getAllFiles('src');

  const results = { processed: 0, fixed: 0, errors: 0 };
  const fixedFiles = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const result = removeStandaloneFC(content);

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
    console.log(`\n🎉 Removed unused FC imports from:`);
    fixedFiles.forEach(file => console.log(`   ${file}`));
  }

  if (results.errors > 0) {
    process.exit(1);
  }
}

processFiles();
