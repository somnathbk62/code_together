const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const svg2img = require('svg2img');

// Convert SVG to PNG
function convertSvgToPng(svgPath, pngPath, width, height) {
  const svgContent = fs.readFileSync(svgPath, 'utf8');
  
  svg2img(svgContent, { width: width, height: height }, (error, buffer) => {
    if (error) {
      console.error('Error converting SVG to PNG:', error);
      return;
    }
    
    fs.writeFileSync(pngPath, buffer);
    console.log(`Converted ${svgPath} to ${pngPath}`);
  });
}

// Convert the logo
convertSvgToPng('public/code_together_logo.svg', 'public/code_together_logo.png', 512, 512);
convertSvgToPng('public/code_together_logo_with_text.svg', 'public/code_together_logo_with_text.png', 512, 512);
