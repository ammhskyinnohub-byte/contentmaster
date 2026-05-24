import * as fs from 'fs';

const filePath = 'src/components/HistoryList.tsx';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/bg-white dark:bg-white dark:bg-white\/\[0\.03\]/g, 'bg-white dark:bg-white/[0.03]');
content = content.replace(/hover:text-black dark:text-white/g, 'dark:hover:text-white hover:text-black');

fs.writeFileSync(filePath, content);
