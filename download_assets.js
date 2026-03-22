const fs = require('fs');
const path = require('path');

const jsonPath = 'C:/Users/nived/.gemini/antigravity/brain/fc987427-e51a-4f03-adf1-7f3396e89c69/.system_generated/steps/58/output.txt';
const assetsDir = 'c:/codingprojects/Curdrice/assets';

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
let markdown = '\n## Generated Designs\n\n';

async function main() {
  for (const screen of data.screens) {
    const title = screen.title.replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/ /g, '_');
    const filename = `${title}.png`;
    const dest = path.join(assetsDir, filename);
    console.log(`Downloading ${filename}...`);
    try {
      const res = await fetch(screen.screenshot.downloadUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      fs.writeFileSync(dest, Buffer.from(arrayBuffer));
      markdown += `![${screen.title}](./assets/${filename})\n\n`;
    } catch(e) {
      console.error(`Error downloading ${filename}: ${e.message}`);
    }
  }
  
  const taskPath = 'c:/codingprojects/Curdrice/TASK.md';
  // Check if ## Generated Designs already exists
  const taskContent = fs.readFileSync(taskPath, 'utf8');
  if (!taskContent.includes('## Generated Designs')) {
      fs.appendFileSync(taskPath, markdown);
  }
  console.log('Done!');
}

main();
