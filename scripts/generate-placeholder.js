import sharp from 'sharp';
import fs from 'fs-extra';
import path from 'path';
import { globby } from 'globby';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../public/images');
const PLACEHOLDER_DIR = path.join(__dirname, '../placeholder');
const DEST_DIR = path.join(__dirname, '../placeholder/images');
const DIST_DIR = path.join(__dirname, '../dist');
const DIST_IMAGES_DIR = path.join(DIST_DIR, 'images');

// Light gray background & text color
const BG_COLOR = '#b0b0b0';
const TEXT_COLOR = '#000000';

/**
 * Copy files from dist directory excluding images folder
 * @returns {Promise<void>}
 */
async function copyDistFiles() {
  try {
    console.log('📂 Starting file copy from dist directory...');

    // Get all files from dist directory excluding the images folder
    const files = await globby(['**/*', '!images/**'], {
      cwd: DIST_DIR,
      dot: true,
      gitignore: true,
    });

    // Copy each file to the placeholder directory
    for (const file of files) {
      const srcFile = path.join(DIST_DIR, file);
      const destFile = path.join(PLACEHOLDER_DIR, file);

      // Ensure the destination directory exists
      await fs.ensureDir(path.dirname(destFile));

      // Copy the file
      await fs.copy(srcFile, destFile);
      console.log(`📄 Copied: ${file}`);
    }

    console.log('✅ File copy completed successfully');
  } catch (error) {
    console.error('❌ Error copying files:', error.message);
    throw error; // Re-throw to handle in the main function
  }
}

/**
 * Copy SVG files from dist/images to placeholder/images
 * @returns {Promise<void>}
 */
async function copySvgFiles() {
  try {
    console.log('🔄 Starting SVG file copy from dist/images directory...');

    // Check if dist/images directory exists
    if (!(await fs.pathExists(DIST_IMAGES_DIR))) {
      console.warn(
        '⚠️  dist/images directory does not exist, skipping SVG copy'
      );
      return;
    }

    // Get all SVG files from dist/images directory
    const svgFiles = await globby(['**/*.svg'], {
      cwd: DIST_IMAGES_DIR,
      dot: true,
      gitignore: true,
    });

    console.log(`📊 Found ${svgFiles.length} SVG files to copy`);

    // Copy each SVG file to the placeholder/images directory
    for (const file of svgFiles) {
      const srcFile = path.join(DIST_IMAGES_DIR, file);
      const destFile = path.join(DEST_DIR, file);

      // Ensure the destination directory exists
      await fs.ensureDir(path.dirname(destFile));

      // Copy the file
      await fs.copy(srcFile, destFile);
      console.log(`📄 Copied SVG: ${file}`);
    }

    console.log('✅ SVG file copy completed successfully');
  } catch (error) {
    console.error('❌ Error copying SVG files:', error.message);
    throw error; // Re-throw to handle in the main function
  }
}

/**
 * Create placeholder as WebP
 * @param {string} inputFile - Path to input image file
 * @param {string} outputFile - Path to output WebP file
 * @returns {Promise<void>}
 */
async function generatePlaceholder(inputFile, outputFile) {
  try {
    const img = sharp(inputFile);
    const meta = await img.metadata();
    const width = meta.width || 800;
    const height = meta.height || 600;
    const label = `${width}x${height}`;

    // SVG overlay with centered size text
    const svg = `
      <svg width="${width}" height="${height}">
        <rect width="100%" height="100%" fill="${BG_COLOR}" />
        <text x="50%" y="50%"
              font-size="${Math.round(Math.min(width, height) / 5)}"
              dominant-baseline="middle"
              text-anchor="middle"
              fill="${TEXT_COLOR}"
              font-family="sans-serif">
          ${label}
        </text>
      </svg>`;

    // Generate a WebP file
    await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputFile);

    console.log(`🖼️  Placeholder generated: ${path.basename(outputFile)}`);
  } catch (error) {
    console.error(
      `❌ Error generating placeholder for ${inputFile}:`,
      error.message
    );
    throw error;
  }
}

/**
 * Generate all placeholder images
 * @returns {Promise<void>}
 */
async function generatePlaceholders() {
  try {
    console.log('🔄 Starting placeholder image generation...');

    // Ensure the destination directory exists
    await fs.ensureDir(DEST_DIR);

    const files = await globby(
      [`${SRC_DIR}/**/*.{jpg,jpeg,png,gif,tiff,bmp,webp}`],
      {
        absolute: true,
        gitignore: true,
      }
    );

    console.log(`📊 Found ${files.length} images to process`);

    for (const file of files) {
      const relPath = path.relative(SRC_DIR, file);
      const destDir = path.join(DEST_DIR, path.dirname(relPath));
      await fs.ensureDir(destDir);

      const base = path.basename(relPath, path.extname(relPath));
      const outFile = path.join(destDir, `${base}.webp`);

      await generatePlaceholder(file, outFile);
    }

    console.log('✅ Placeholder generation completed successfully');
  } catch (error) {
    console.error('❌ Error generating placeholders:', error.message);
    throw error;
  }
}

// Main execution function
(async () => {
  try {
    console.log('🚀 Starting script execution...');

    // Prepare placeholder directory
    await fs.ensureDir(PLACEHOLDER_DIR);
    // Remove all files in PLACEHOLDER_DIR
    await fs.emptyDir(PLACEHOLDER_DIR);
    console.log('🗑️  Cleaned placeholder directory');

    // Step 1: Copy files from dist directory excluding images folder
    await copyDistFiles();

    // Step 2: Generate placeholder images
    await generatePlaceholders();

    // Step 3: Copy SVG files from dist/images to placeholder/images
    await copySvgFiles();

    console.log('✨ All operations completed successfully');
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
})();
