
const fs = require('fs');
const path = require('path');

const rootTypesPath = path.resolve(__dirname, 'types.ts').toLowerCase();
const srcDir = path.resolve(__dirname, 'src');

console.log(`Target Root Types Path: ${rootTypesPath}`);

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(path.join(dir, f));
    }
  });
}

function resolveImport(fileDir, importPath) {
  if (importPath.startsWith('.')) {
    return path.resolve(fileDir, importPath).toLowerCase();
  }
  return null;
}

let count = 0;

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let fileDir = path.dirname(filePath);
    let changed = false;

    const regex = /(from\s+['"])([^'"]+)(['"])/g;

    let newContent = content.replace(regex, (match, prefix, importPath, suffix) => {
      const resolved = resolveImport(fileDir, importPath);
      
      if (resolved) {
        // Check if it matches types.ts
        if (resolved === rootTypesPath || resolved + '.ts' === rootTypesPath) {
             console.log(`Replacing import in ${path.relative(__dirname, filePath)}: ${importPath} -> @/types`);
             changed = true;
             return `${prefix}@/types${suffix}`;
        }
      }
      return match;
    });

    if (changed) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      count++;
    }
  }
});

console.log(`Total files updated: ${count}`);
