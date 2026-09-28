const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dist = path.join(root, 'dist');

fs.mkdirSync(dist, { recursive: true });

const dirsToCopy = ['css', 'js'];
const filesToCopy = ['index.html', 'package.json', 'README.md', '.nojekyll'];

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

for (const dir of dirsToCopy) {
  copyDir(path.join(root, dir), path.join(dist, dir));
}

for (const file of filesToCopy) {
  const srcPath = path.join(root, file);
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, path.join(dist, file));
  }
}

console.log('Build complete: dist/ ready for GitHub Pages');
