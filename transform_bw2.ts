import * as fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts}');

const replacements = [
  // Fix double dark or weird artifacts
  { p: /bg-white dark:bg-slate-50 dark:bg-\[#161233\]/g, r: 'bg-white dark:bg-[#161233]' },
  { p: /dark:bg-white\/15 hover:text-slate-900/g, r: 'dark:hover:bg-white/15 dark:hover:text-white' },

  // Let's modify the buttons to ensure that the primary button in light mode (bg-black) has text-white instead of something else
  { p: /bg-black dark:bg-gradient-to-([a-z]+) dark:from-indigo-([^ ]+) dark:to-purple-[^ ]+(.*?)text-([^ ]+)/g, r: 'bg-black dark:bg-gradient-to-$1 dark:from-indigo-$2 dark:to-purple-500$3text-white' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(rep => {
    content = content.replace(rep.p, rep.r);
  });
  content = content.replace(/bg-black\s+dark:bg-gradient-to-r\s+dark:from-indigo-500\s+dark:to-purple-500(.*?)text-\S+/g, 'bg-black dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500$1text-white');
  content = content.replace(/bg-slate-50 dark:bg-\[#070514\]/g, 'bg-[#f4f4f5] dark:bg-[#070514]');
  
  content = content.replace(/bg-black\/5 dark:bg-white\/5/g, 'bg-[#e4e4e7] dark:bg-white/5');
  content = content.replace(/bg-black\/10 dark:bg-white\/10/g, 'bg-[#d4d4d8] dark:bg-white/10');
  content = content.replace(/bg-black\/15 dark:bg-white\/15/g, 'bg-[#a1a1aa] dark:bg-white/15');
  content = content.replace(/border-black\/10 dark:border-white\/10/g, 'border-[#d4d4d8] dark:border-white/10');
  content = content.replace(/border-black\/5 dark:border-white\/5/g, 'border-[#e4e4e7] dark:border-white/5');

  fs.writeFileSync(file, content);
  console.log(`Processed ${file}`);
});
