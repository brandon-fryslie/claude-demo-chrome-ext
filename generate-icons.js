const fs = require('fs');

// SVG template for icons
function createSVG(size) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.6}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">C</text>
</svg>`;
}

// Create SVG files
fs.writeFileSync('icon16.svg', createSVG(16));
fs.writeFileSync('icon48.svg', createSVG(48));
fs.writeFileSync('icon128.svg', createSVG(128));

console.log('SVG icons created!');
console.log('To convert to PNG, install sharp: npm install sharp');
console.log('Then run: node convert-icons.js');
