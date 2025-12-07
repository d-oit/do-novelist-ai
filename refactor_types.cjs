
const fs = require('fs');
const path = require('path');

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

const srcDir = path.resolve('src');
let count = 0;

walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    // Regex for imports from root types with single or double quotes
    // Matches ../types, ../../types, etc.
    const regex = /from ['"](\.\.\/)+types['"]/g;
    
    if (regex.test(content)) {
      const newContent = content.replace(regex, "from '@/types'");
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Updated: ${filePath}`);
      count++;
    }
  }
});

console.log(`Total files updated: ${count}`);
