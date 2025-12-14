#!/usr/bin/env node

/**
 * Fix relative parent imports
 * Converts '../' imports to use @/ or @shared/ aliases
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, resolve, dirname, relative, extname } from 'path';

const ALLOWED_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
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
];

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

function fixRelativeImports(content, filePath) {
  const lines = content.split('\n');
  let modified = false;

  const fileDir = dirname(filePath);
  const srcRoot = resolve('src');

  const fixedLines = lines.map(line => {
    // Match relative parent imports: ../something or ../something/path
    const importMatch = line.match(
      /^(\s*import\s+(?:type\s+)?(?:{[^}]*}\s+from\s+)?['"])(\.{1,2}\/[^'";]+)(['"];?\s*)$/,
    );

    if (importMatch) {
      const [, prefix, importPath, suffix] = importMatch;

      // Skip if it's not a parent directory import
      if (!importPath.startsWith('../')) {
        return line;
      }

      // Resolve absolute path of the target import
      const resolvedAbs = resolve(fileDir, importPath);

      // Map only imports that resolve under src/
      if (resolvedAbs.startsWith(srcRoot)) {
        // Compute path after src/
        const relFromSrc = relative(srcRoot, resolvedAbs).replace(/\\/g, '/');

        // Map to the root alias '@/' for all src paths to keep imports consistent
        const aliasPath = '@/' + relFromSrc;

        modified = true;
        return `${prefix}${aliasPath}${suffix}`;
      }
    }

    return line;
  });

  return { content: fixedLines.join('\n'), modified };
}

async function processFiles() {
  console.log('🔧 Fixing relative parent imports...\n');

  const files = await getAllFiles('src');

  const results = { processed: 0, fixed: 0, errors: 0 };
  const fixedFiles = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf8');
      const result = fixRelativeImports(content, file);

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
    console.log(`\n🎉 Fixed imports in:`);
    fixedFiles.forEach(file => console.log(`   ${file}`));

    console.log(`\n💡 Next steps:`);
    console.log(`   1. Review changes: git diff`);
    console.log(`   2. Run linter: npm run lint`);
  }

  if (results.errors > 0) {
    process.exit(1);
  }
}

processFiles();
