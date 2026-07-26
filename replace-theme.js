const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'apps/web/src/pages');

const replacements = {
  'bg-ivory-100': 'bg-transparent',
  'bg-slate-950': 'bg-midnight-200',
  'text-slate-900': 'text-white',
  'text-slate-800': 'text-slate-200',
  'text-slate-700': 'text-slate-300',
  'text-slate-600': 'text-slate-400',
  'bg-white/40': 'bg-white/5',
  'bg-white/50': 'bg-white/5',
  'bg-white/60': 'bg-white/10',
  'bg-white/70': 'bg-white/10',
  'bg-white': 'bg-midnight-100',
  'border-slate-200': 'border-white/10',
  'border-slate-300': 'border-white/10',
  'border-indigo-100': 'border-cyan-500/30',
  'border-indigo-200': 'border-cyan-500/50',
  'text-indigo-600': 'text-cyan-400',
  'text-indigo-700': 'text-cyan-300',
  'bg-indigo-50': 'bg-cyan-500/10',
  'bg-indigo-600': 'bg-cyan-600',
  'hover:bg-indigo-700': 'hover:bg-cyan-500',
  'shadow-indigo-600/25': 'shadow-cyan-500/25',
  'shadow-indigo-600/20': 'shadow-cyan-500/20',
  'shadow-[0_8px_30px_rgb(0,0,0,0.04)]': 'shadow-[0_8px_30px_rgb(0,0,0,0.4)]',
  'bg-slate-50': 'bg-midnight-100',
  'from-indigo-600': 'from-cyan-400',
  'to-mint-500': 'to-blue-500'
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      for (const [search, replace] of Object.entries(replacements)) {
        // Simple string replace all (doesn't handle word boundaries perfectly but good enough for tailwind classes here)
        const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        if (regex.test(content)) {
          content = content.replace(regex, replace);
          modified = true;
        }
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
      }
    }
  });
}

processDirectory(directoryPath);
console.log('Done');
