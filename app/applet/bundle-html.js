const fs = require('fs');
const path = require('path');

const assetDir = path.join(__dirname, 'android/app/src/main/assets');
const htmlPath = path.join(assetDir, 'index.html');
const cssPath = path.join(assetDir, 'assets', 'index-Dyanmf60.css');
const jsPath = path.join(assetDir, 'assets', 'index-CT_tG1kZ.js');

let html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const js = fs.readFileSync(jsPath, 'utf8');

html = html.replace(/<link[^>]*rel="stylesheet"[^>]*>/gi, `<style>\n${css}\n</style>`);
html = html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/gi, `<script>\n${js}\n</script>`);

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Successfully bundled into single index.html');
