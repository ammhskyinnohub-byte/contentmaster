import * as fs from 'fs';
import { globSync } from 'glob';

const files = globSync('src/**/*.{tsx,ts}');

const replacements = [
  { p: /bg-gradient-to-r from-indigo-500 to-purple-500/g, r: 'bg-black dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500' },
  { p: /bg-gradient-to-br from-indigo-500 to-purple-500/g, r: 'bg-black dark:bg-gradient-to-br dark:from-indigo-500 dark:to-purple-500' },
  
  { p: /bg-indigo-500(?!\/)(?! dark:)/g, r: 'bg-black dark:bg-indigo-500' },
  { p: /bg-indigo-600(?!\/)(?! dark:)/g, r: 'bg-slate-800 dark:bg-indigo-600' },
  { p: /bg-indigo-500\/10/g, r: 'bg-black/[0.04] dark:bg-indigo-500/10' },
  { p: /bg-indigo-500\/15/g, r: 'bg-black/[0.06] dark:bg-indigo-500/15' },
  { p: /bg-indigo-500\/20/g, r: 'bg-black/[0.08] dark:bg-indigo-500/20' },
  { p: /bg-indigo-500\/30/g, r: 'bg-black/[0.12] dark:bg-indigo-500/30' },
  { p: /bg-indigo-500\/\[0\.03\]/g, r: 'bg-black/[0.02] dark:bg-indigo-500/[0.03]' },

  { p: /bg-purple-500\/10/g, r: 'bg-black/[0.04] dark:bg-purple-500/10' },
  { p: /bg-purple-500\/20/g, r: 'bg-black/[0.08] dark:bg-purple-500/20' },

  { p: /text-indigo-200/g, r: 'text-slate-400 dark:text-indigo-200' },
  { p: /text-indigo-300/g, r: 'text-slate-900 dark:text-indigo-300' },
  { p: /text-indigo-400([^/a-zA-Z0-9])/g, r: 'text-black dark:text-indigo-400$1' },
  { p: /text-indigo-500([^/a-zA-Z0-9])/g, r: 'text-black dark:text-indigo-500$1' },
  
  { p: /bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent/g, r: 'text-black dark:bg-gradient-to-r dark:from-indigo-400 dark:to-purple-400 dark:bg-clip-text dark:text-transparent' },
  { p: /bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent/g, r: 'text-black dark:bg-gradient-to-r dark:from-indigo-300 dark:to-purple-400 dark:bg-clip-text dark:text-transparent' },
  
  { p: /text-purple-400([^/a-zA-Z0-9])/g, r: 'text-black dark:text-purple-400$1' },

  { p: /border-indigo-500(\s|")/g, r: 'border-black dark:border-indigo-500$1' },
  { p: /border-indigo-500\/5/g, r: 'border-black/5 dark:border-indigo-500/5' },
  { p: /border-indigo-500\/10/g, r: 'border-black/10 dark:border-indigo-500/10' },
  { p: /border-indigo-500\/20/g, r: 'border-black/20 dark:border-indigo-500/20' },
  { p: /border-indigo-500\/30/g, r: 'border-black/30 dark:border-indigo-500/30' },
  
  { p: /border-purple-500\/20/g, r: 'border-black/20 dark:border-purple-500/20' },

  { p: /ring-indigo-500(\s|")/g, r: 'ring-black dark:ring-indigo-500$1' },
  { p: /ring-indigo-500\/20/g, r: 'ring-black/20 dark:ring-indigo-500/20' },

  { p: /shadow-indigo-500\/10/g, r: 'shadow-black/10 dark:shadow-indigo-500/10' },
  { p: /shadow-indigo-500\/20/g, r: 'shadow-black/20 dark:shadow-indigo-500/20' },

  { p: /text-emerald-300/g, r: 'text-emerald-700 dark:text-emerald-300' },
  { p: /text-emerald-400/g, r: 'text-emerald-600 dark:text-emerald-400' },
  { p: /text-sky-300/g, r: 'text-sky-700 dark:text-sky-300' },
  { p: /text-sky-400/g, r: 'text-sky-600 dark:text-sky-400' },
  { p: /text-amber-300/g, r: 'text-amber-700 dark:text-amber-300' },
  { p: /text-amber-400/g, r: 'text-amber-600 dark:text-amber-400' },
  { p: /text-rose-300/g, r: 'text-rose-700 dark:text-rose-300' },
  { p: /text-rose-400/g, r: 'text-rose-600 dark:text-rose-400' },
  { p: /text-blue-300/g, r: 'text-blue-700 dark:text-blue-300' },
  { p: /text-pink-300/g, r: 'text-pink-700 dark:text-pink-300' },

  // bg colors
  { p: /bg-amber-500\/10/g, r: 'bg-amber-500/[0.05] dark:bg-amber-500/10' },
  { p: /border-amber-500\/20/g, r: 'border-amber-500/20 dark:border-amber-500/20' },
  { p: /bg-sky-500\/10/g, r: 'bg-sky-500/[0.05] dark:bg-sky-500/10' },
  { p: /border-sky-500\/20/g, r: 'border-sky-500/20 dark:border-sky-500/20' },
  { p: /bg-emerald-500\/10/g, r: 'bg-emerald-500/[0.05] dark:bg-emerald-500/10' },
  { p: /border-emerald-500\/20/g, r: 'border-emerald-500/20 dark:border-emerald-500/20' },
  
  // Specific fix for select background
  { p: /bg-\[#161233\]/g, r: 'bg-slate-50 dark:bg-[#161233]' },
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  replacements.forEach(rep => {
    content = content.replace(rep.p, rep.r);
  });
  
  fs.writeFileSync(file, content);
  console.log(`Processed ${file}`);
});
