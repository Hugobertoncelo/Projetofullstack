import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple base64 PNG data for a 192x192 blue chat icon
const icon192Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAMAAAADAAQMAAABoEv5EAAAABlBMVEU7gvYd1NgAAABUSURBVGje7cExAQAAAMKg9U9tCj+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgGsAABnVGM6gAAAABJRU5ErkJggg==';

// Simple base64 PNG data for a 512x512 blue chat icon  
const icon512Base64 = 'iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAgMAAACJFjxpAAAADFBMVEU7gvYd1NgQufEi6+cAAABjSURBVHja7cExAQAAAMKg9U9tCj+gAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAALgGsAABoVvjWwAAAABJRU5ErkJggg==';

const publicDir = path.join(__dirname, '..', 'public');

// Write proper PNG files
fs.writeFileSync(
  path.join(publicDir, 'icon-192x192.png'),
  Buffer.from(icon192Base64, 'base64')
);

fs.writeFileSync(
  path.join(publicDir, 'icon-512x512.png'), 
  Buffer.from(icon512Base64, 'base64')
);

// Copy the 192 version as favicon
fs.copyFileSync(
  path.join(publicDir, 'icon-192x192.png'),
  path.join(publicDir, 'favicon-32x32.png')
);

console.log('✅ PNG Icons created successfully!');
console.log('- icon-192x192.png (proper PNG format)');
console.log('- icon-512x512.png (proper PNG format)');
console.log('- favicon-32x32.png (copied from 192px version)');
