import * as fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/components/*.tsx');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-black\/\[0\.03\] dark:bg-white dark:bg-white\/\[0\.03\]/g, 'bg-white dark:bg-white/[0.03]');
  content = content.replace(/bg-white dark:bg-slate-50 dark:bg-\[#161233\]/g, 'bg-white dark:bg-[#161233]');
  
  content = content.replace(/bg-black dark:bg-indigo-500 hover:bg-slate-800 dark:bg-indigo-600/g, 'bg-black dark:bg-indigo-500 hover:bg-black/80 dark:hover:bg-indigo-600');
  
  fs.writeFileSync(file, content);
});
