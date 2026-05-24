import * as fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts}');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Base backgrounds
  content = content.replace(/bg-slate-50 dark:bg-\[#070514\]/g, 'bg-white dark:bg-[#070514]');
  
  // Cards and panels (which had bg-black/5 or similar)
  content = content.replace(/bg-white\/\[0\.03\] backdrop-blur-xl/g, 'bg-white dark:bg-white/[0.03] backdrop-blur-xl');
  content = content.replace(/bg-black\/\[0\.03\] dark:bg-white\/\[0\.03\]/g, 'bg-white dark:bg-white/[0.03]');
  
  // Navbar specific background
  content = content.replace(/bg-white dark:bg-\[#0c0a1f\]\/75/g, 'bg-white/80 dark:bg-[#0c0a1f]/75');
  
  // Text colors for high contrast minimalism
  content = content.replace(/text-slate-900/g, 'text-black');
  content = content.replace(/text-slate-800/g, 'text-black/80');
  content = content.replace(/text-slate-700/g, 'text-black/70');
  
  // Buttons that were bg-black in light mode but got weird tracking
  content = content.replace(/bg-black dark:bg-gradient-to-(r|br) dark:from-indigo-500 dark:to-purple-500(.*?)text-([A-Za-z0-9/]+)/g, 'bg-black dark:bg-gradient-to-$1 dark:from-indigo-500 dark:to-purple-500$2text-white');
  
  // Fix weird artifacting in buttons and text
  content = content.replace(/text-black dark:text-white dark:text-white/g, 'text-black dark:text-white');
  content = content.replace(/text-white dark:text-white/g, 'text-white');

  fs.writeFileSync(file, content);
  console.log(`Processed ${file} for pure black and white theme`);
});
