const fs = require('fs');
const path = require('path');

const docsDir = path.join(__dirname, 'docs');

function getFiles(dir, parentPath = '') {
  const items = fs.readdirSync(dir);
  let result = [];

  items
    .sort((a, b) => {
      const aFullPath = path.join(dir, a);
      const bFullPath = path.join(dir, b);

      const aIsDir = fs.statSync(aFullPath).isDirectory();
      const bIsDir = fs.statSync(bFullPath).isDirectory();

      if (aIsDir && !bIsDir) return -1;
      if (!aIsDir && bIsDir) return 1;
      return a.localeCompare(b, 'zh-Hans-CN', { numeric: true });
    })
    .forEach((item) => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      const relativePath = path.join(parentPath, item);

      if (stat.isDirectory()) {
        const subItems = getFiles(fullPath, relativePath);
        if (subItems.length > 0) {
          result.push({
            type: 'category',
            label: item,
            items: subItems,
            link: { type: 'generated-index' },
          });
        } else {
          console.warn(`Skipping empty category: ${item}`);
        }
      } else if (stat.isFile() && item.endsWith('.md')) {
        const id = relativePath.replace(/\\/g, '/').replace(/\.md$/, '');
        result.push(id);
      }
    });

  return result;
}

const sidebar = {
  docs: getFiles(docsDir),
};

const output = `module.exports = ${JSON.stringify(sidebar, null, 2)};`;

fs.writeFileSync(path.join(__dirname, 'sidebars1.js'), output);

console.log('sidebars1.js has been generated');
