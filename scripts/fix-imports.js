#!/usr/bin/env node

/**
 * Import Optimization Script
 * Automatically fixes common import patterns and organization
 *
 * Usage: 
 *   node scripts/fix-imports.js
 *   npm run fix:imports
 */

import { readFileSync, writeFileSync } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative, extname, dirname, resolve } from 'path';

// Configuration
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

/**
 * Check if a file should be ignored
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
 * Get all TypeScript/JavaScript files recursively
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
 * Fix relative import paths to use alias paths
 */
function toPosix(p) {
  return p.split('/').join('/');
}

function fixRelativeImports(content, filePath) {
  const lines = content.split('\n');
  let modified = false;

  const fileDir = dirname(filePath);
  // const projectRoot = resolve('.');
  const srcRoot = resolve('src');

  const fixedLines = lines.map(line => {
    // Match import statements with relative paths
    const importMatch = line.match(/^(\s*import.*from\s+['"])(\.{1,2}\/[^'";]+)(['"];?\s*)$/);

    if (importMatch) {
      const [, prefix, importPath, suffix] = importMatch;

      // Resolve absolute path of the target import
      const resolvedAbs = resolve(fileDir, importPath);

      // Map only imports that resolve under src/
      if (resolvedAbs.startsWith(srcRoot)) {
        // Compute path after src/
        const relFromSrc = toPosix(relative(srcRoot, resolvedAbs).replace(/\\/g, '/'));

        // Choose alias
        const alias = relFromSrc.startsWith('shared/') ? '@shared/' : '@/' ;
        const aliasPath = alias + relFromSrc;
        modified = true;
        return `${prefix}${aliasPath}${suffix}`;
      }
    }

    return line;
  });

  return { content: fixedLines.join('\n'), modified };
}

/**
 * Organize imports according to our ESLint rules
 */
function organizeImports(content) {
  const lines = content.split('\n');
  
  // Find import block
  let importStart = -1;
  let importEnd = -1;
  const imports = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('import ') || line.startsWith('import{') || line.match(/^import\s*\{/)) {
      if (importStart === -1) importStart = i;
      imports.push({
        line: lines[i],
        original: i,
        group: getImportGroup(line),
        module: extractModuleName(line)
      });
    } else if (importStart !== -1 && line === '') {
      // Empty line after imports - continue collecting
      continue;
    } else if (importStart !== -1 && !line.startsWith('//') && line.length > 0) {
      // Non-import line found, end of import block
      importEnd = i;
      break;
    }
  }
  
  if (imports.length === 0) return { content, modified: false };
  
  // Sort imports by group and alphabetically
  const sortedImports = imports.sort((a, b) => {
    if (a.group !== b.group) {
      return a.group - b.group;
    }
    return a.module.localeCompare(b.module);
  });
  
  // Check if order changed
  const orderChanged = !sortedImports.every((imp, index) => 
    imp.original === imports[index].original
  );
  
  if (orderChanged) {
    modified = true;
    
    // Group imports with blank lines between groups
    const organizedLines = [];
    let currentGroup = -1;
    
    sortedImports.forEach(imp => {
      if (imp.group !== currentGroup) {
        if (organizedLines.length > 0) {
          organizedLines.push(''); // Add blank line between groups
        }
        currentGroup = imp.group;
      }
      organizedLines.push(imp.line);
    });
    
    // Replace import block
    const beforeImports = lines.slice(0, importStart);
    const afterImports = lines.slice(importEnd === -1 ? imports[imports.length - 1].original + 1 : importEnd);
    
    // Add blank line after imports if not present
    if (afterImports.length > 0 && afterImports[0].trim() !== '') {
      organizedLines.push('');
    }
    
    const newContent = [
      ...beforeImports,
      ...organizedLines,
      ...afterImports
    ].join('\n');
    
    return { content: newContent, modified: true };
  }
  
  return { content, modified: false };
}

/**
 * Get import group priority (lower number = higher priority)
 */
function getImportGroup(line) {
  const moduleMatch = line.match(/from\s+['"]([^'"]+)['"]/);
  if (!moduleMatch) return 999;
  
  const module = moduleMatch[1];
  
  // Built-in modules (node:, path, fs, etc.)
  if (module.startsWith('node:') || ['path', 'fs', 'url', 'util', 'crypto', 'os'].includes(module)) {
    return 0;
  }
  
  // External packages (no relative paths, no @ alias)
  if (!module.startsWith('.') && !module.startsWith('@/') && !module.startsWith('@shared')) {
    return 1;
  }
  
  // Internal alias imports (@/, @shared)
  if (module.startsWith('@/') || module.startsWith('@shared')) {
    return 2;
  }
  
  // Parent directory imports (../)
  if (module.startsWith('../')) {
    return 3;
  }
  
  // Sibling imports (./)
  if (module.startsWith('./')) {
    return 4;
  }
  
  return 5; // Other/index imports
}

/**
 * Extract module name for sorting
 */
function extractModuleName(line) {
  const match = line.match(/from\s+['"]([^'"]+)['"]/);
  return match ? match[1] : '';
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let result = { content, modified: false };
    
    // Apply fixes
    const relativeFixResult = fixRelativeImports(result.content, filePath);
    if (relativeFixResult.modified) {
      result = relativeFixResult;
    }
    
    const organizeResult = organizeImports(result.content);
    if (organizeResult.modified) {
      result = organizeResult;
    }
    
    // Write back if modified
    if (result.modified) {
      writeFileSync(filePath, result.content, 'utf8');
      return { path: relative('.', filePath), fixed: true };
    }
    
    return { path: relative('.', filePath), fixed: false };
  } catch (error) {
    return { path: relative('.', filePath), error: error.message };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔧 Fixing imports...\n');
  
  const results = { processed: 0, fixed: 0, errors: 0 };
  const fixedFiles = [];
  const errorFiles = [];
  
  try {
    const files = await getAllFiles('src');
    
    for (const file of files) {
      const result = await processFile(file);
      results.processed++;
      
      if (result.error) {
        results.errors++;
        errorFiles.push(result);
        console.log(`❌ ${result.path}: ${result.error}`);
      } else if (result.fixed) {
        results.fixed++;
        fixedFiles.push(result.path);
        console.log(`✅ ${result.path}`);
      } else {
        console.log(`⏭️  ${result.path}`);
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
      console.log(`   2. Run linter: npm run lint:fix`);
      console.log(`   3. Run tests: npm run test`);
    }
    
    if (errorFiles.length > 0) {
      console.log(`\n⚠️  Files with errors:`);
      errorFiles.forEach(file => console.log(`   ${file.path}: ${file.error}`));
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main();