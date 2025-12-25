import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Script location:', __filename);
console.log('__dirname:', __dirname);
console.log('CDN_FILES_DIR:', path.join(__dirname, '../cdn-files'));
console.log('Exists:', require('fs').existsSync(path.join(__dirname, '../cdn-files')));
