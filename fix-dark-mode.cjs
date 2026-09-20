const fs = require('fs');
const path = require('path');
function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      content = content.replace(/text-charcoal(?! dark:text-gray-100)/g, 'text-charcoal dark:text-gray-100');
      // match bg-white but NOT bg-white/something
      content = content.replace(/bg-white(?!\/| dark:bg-gray-800)/g, 'bg-white dark:bg-gray-800');
      content = content.replace(/border-gray-100(?! dark:border-gray-800)/g, 'border-gray-100 dark:border-gray-800');
      content = content.replace(/border-gray-200(?! dark:border-gray-700)/g, 'border-gray-200 dark:border-gray-700');
      content = content.replace(/border-gray-50(?! dark:border-gray-800)/g, 'border-gray-50 dark:border-gray-800');
      content = content.replace(/bg-gray-50(?! dark:bg-gray-800)/g, 'bg-gray-50 dark:bg-gray-800');
      content = content.replace(/bg-gray-100(?! dark:bg-gray-800)/g, 'bg-gray-100 dark:bg-gray-800');
      content = content.replace(/bg-gray-200(?! dark:bg-gray-700)/g, 'bg-gray-200 dark:bg-gray-700');
      content = content.replace(/text-muted(?! dark:text-gray-400)/g, 'text-muted dark:text-gray-400');
      fs.writeFileSync(fullPath, content);
    }
  }
}
walk('./src/pages');
