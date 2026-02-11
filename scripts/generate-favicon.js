import {
  // FaviconSettings,
  // MasterIcon,
  IconTransformationType,
  generateFaviconFiles,
  generateFaviconHtml,
} from '@realfavicongenerator/generate-favicon';
import {
  getNodeImageAdapter,
  loadAndConvertToSvg,
} from '@realfavicongenerator/image-adapter-node';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_ICON = path.join(__dirname, '../src/favicon/favicon.svg');
const OUTPUT_DIR = path.join(__dirname, '../public');
const PARTIALS_DIR = path.join(__dirname, '../src/partials');

// const SRC_ICON = '../src/favicon/favicon.svg';
// const OUTPUT_DIR = '../public';

const imageAdapter = await getNodeImageAdapter();

let masterIcon;
try {
  masterIcon = {
    icon: await loadAndConvertToSvg(SRC_ICON),
  };
  console.log('SVG loaded successfully.');
} catch (err) {
  console.error('Error loading SVG:', err);
  process.exit(1);
}

const faviconSettings = {
  icon: {
    desktop: {
      regularIconTransformation: {
        type: IconTransformationType.None,
      },
      darkIconType: 'none',
    },
    touch: {
      transformation: {
        type: IconTransformationType.Background,
        backgroundColor: '#ffffff',
        backgroundRadius: 0,
        imageScale: 0.7,
      },
      appTitle: 'Bricknet',
    },
    webAppManifest: {
      transformation: {
        type: IconTransformationType.Background,
        backgroundColor: '#ffffff',
        backgroundRadius: 0,
        imageScale: 0.5,
      },
      backgroundColor: '#ffffff',
      themeColor: '#ffffff',
      name: 'Bricknet',
      shortName: 'Bricknet',
    },
  },
  path: '/',
};

// Ensure output directory exists
await fs.ensureDir(OUTPUT_DIR);

// Generate favicon files
let files;
try {
  files = await generateFaviconFiles(masterIcon, faviconSettings, imageAdapter);
  if (typeof files !== 'object' || files === null) {
    console.error('generateFaviconFiles did not return an object:', files);
    process.exit(1);
  }
  console.log('Favicon files generated successfully.');
} catch (err) {
  console.error('Error generating favicon files:', err);
  process.exit(1);
}

// Write each file to the output directory
for (const [name, contents] of Object.entries(files)) {
  const filePath = path.join(OUTPUT_DIR, name);
  await fs.writeFile(filePath, contents);
  console.log(`Generated: ${filePath}`);
}

// Generate HTML markup
const html = await generateFaviconHtml(faviconSettings);

const htmlPath = path.join(PARTIALS_DIR, 'favicon-meta.html');
if (html && Array.isArray(html.markups)) {
  const markupString = html.markups.join('\n');
  await fs.writeFile(htmlPath, markupString);
  console.log(`Generated HTML markup: ${htmlPath}`);
} else {
  console.error('generateFaviconHtml did not return valid HTML:', html);
  process.exit(1);
}
