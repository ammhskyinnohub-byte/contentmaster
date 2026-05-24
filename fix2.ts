import * as fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/components/*.tsx');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-slate-900/g, 'bg-black');
  content = content.replace(/text-slate-900/g, 'text-black');
  content = content.replace(/hover:text-slate-900/g, 'hover:text-black');
  content = content.replace(/hover:bg-slate-800/g, 'hover:bg-black/90');
  content = content.replace(/border-slate-900/g, 'border-black');
  content = content.replace(/ring-slate-900/g, 'ring-black');
  
  if (file.includes('HistoryList.tsx') || file.includes('CmsAdmin.tsx')) {
    content = content.replace(/bg-white\/\[0\.03\] backdrop-blur-xl/g, 'bg-white dark:bg-white/[0.03] backdrop-blur-xl');
    content = content.replace(/bg-black\/\[0\.03\] dark:bg-white\/\[0\.03\]/g, 'bg-white dark:bg-white/[0.03]');
  }

  fs.writeFileSync(file, content);
});
