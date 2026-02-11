import sharp from 'sharp';
import fs from 'fs-extra';
import { globby } from 'globby';
import path from 'path';
import { fileURLToPath } from 'url';
import { optimize } from 'svgo';

// Maximum dimensions for images
const MAX_WIDTH = 1920;
const MAX_HEIGHT = 1080;
const QUALITY = 85;
const GENERATE_FALLBACK = false;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src/images');
const DEST_DIR = path.join(__dirname, '../public/images');

// Allowed video file extensions
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.avi', '.mkv']);

/**
 * Remove all files in a directory except video files
 */
async function cleanDirectoryExceptVideos(dir) {
  try {
    const files = await fs.readdir(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      try {
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          // Recursively clean subdirectories
          await cleanDirectoryExceptVideos(filePath);

          // Remove empty directories
          const remaining = await fs.readdir(filePath);
          if (remaining.length === 0) {
            await fs.remove(filePath);
            console.log(`🗑️ Removed empty directory: ${filePath}`);
          }
        } else {
          const ext = path.extname(file).toLowerCase();
          if (!VIDEO_EXTENSIONS.has(ext)) {
            await fs.remove(filePath);
            console.log(`🗑️ Deleted: ${filePath}`);
          } else {
            console.log(`✅ Preserved video: ${filePath}`);
          }
        }
      } catch (err) {
        console.error(`❌ Error processing ${filePath}:`, err);
      }
    }
  } catch (err) {
    console.error(`❌ Failed to read directory ${dir}:`, err);
  }
}

(async () => {
  await fs.ensureDir(DEST_DIR);

  // // Remove all files in DEST_DIR (including SVGs)
  // await fs.emptyDir(DEST_DIR);

  // Custom clean (preserve video files)
  console.log(`🚀 Cleaning directory (preserve videos): ${DEST_DIR}`);
  await cleanDirectoryExceptVideos(DEST_DIR);

  // Convert all images in SRC_DIR (except svg) to webp, 100 quality, no resize
  const allRasterFiles = await globby([`${SRC_DIR}/**/*.*`], {
    absolute: true,
    gitignore: true,
    expandDirectories: {
      extensions: ['jpg', 'jpeg', 'png', 'gif', 'tiff', 'bmp'],
    },
  });

  for (const file of allRasterFiles) {
    const ext = path.extname(file).toLowerCase();
    if (ext === '.svg' || ext === '.webp') continue; // skip SVGs and WEBPs
    const relPath = path.relative(SRC_DIR, file);
    const destDir = path.join(SRC_DIR, path.dirname(relPath));
    await fs.ensureDir(destDir);

    const baseName = path.basename(file, ext);
    const destWebp = path.join(destDir, `${baseName}.webp`);
    try {
      // Apply max dimensions while maintaining aspect ratio
      await sharp(file)
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: false,
        })
        .webp({ quality: 100 })
        .toFile(destWebp);
      console.log(`Converted (no resize, 100 quality): ${destWebp}`);
      await fs.remove(file);
      console.log(`Deleted original: ${file}`);
    } catch (err) {
      console.error(`Failed to convert ${file}:`, err);
    }
  }

  // Optimize and copy SVGs
  const svgFiles = await globby([`${SRC_DIR}/**/*.svg`]);
  for (const file of svgFiles) {
    const relPath = path.relative(SRC_DIR, file);
    const destPath = path.join(DEST_DIR, relPath);
    await fs.ensureDir(path.dirname(destPath));

    // Read and optimize SVG
    const svgContent = await fs.readFile(file, 'utf8');
    const optimized = optimize(svgContent, { path: file });
    await fs.writeFile(destPath, optimized.data, 'utf8');
    console.log(`Optimized & copied SVG: ${destPath}`);

    // Generate PNG fallback with 3x size (guarded by GENERATE_FALLBACK)
    if (GENERATE_FALLBACK) {
      try {
        const baseName = path.basename(relPath, '.svg');
        // Get original SVG dimensions and convert to PNG with 1x and 2x sizes
        const svgBuffer = Buffer.from(optimized.data);
        const svgImage = sharp(svgBuffer);
        const metadata = await svgImage.metadata();

        // Use original SVG dimensions as base size
        const originalWidth = metadata.width || 100; // fallback to 100 if width not detected
        const originalHeight = metadata.height || 100; // fallback to 100 if height not detected

        // Generate 1x PNG fallback
        const png1xPath = path.join(
          DEST_DIR,
          path.dirname(relPath),
          `${baseName}@1x.png`
        );
        // Apply max dimensions
        const finalWidth1x = Math.min(originalWidth, MAX_WIDTH);
        const finalHeight1x = Math.min(originalHeight, MAX_HEIGHT);

        await svgImage
          .clone()
          .resize(finalWidth1x, finalHeight1x, {
            fit: 'inside',
            withoutEnlargement: false,
          })
          .png({ quality: 95 })
          .toFile(png1xPath);
        console.log(
          `Generated PNG fallback (1x): ${png1xPath} (${finalWidth1x}x${finalHeight1x})`
        );

        // Generate 2x PNG fallback
        const png2xPath = path.join(
          DEST_DIR,
          path.dirname(relPath),
          `${baseName}@2x.png`
        );
        // Apply max dimensions for 2x size
        const width2x = originalWidth * 2;
        const height2x = originalHeight * 2;
        const finalWidth2x = Math.min(width2x, MAX_WIDTH);
        const finalHeight2x = Math.min(height2x, MAX_HEIGHT);

        await svgImage
          .clone()
          .resize(finalWidth2x, finalHeight2x, {
            fit: 'inside',
            withoutEnlargement: false,
          })
          .png({ quality: 95 })
          .toFile(png2xPath);
        console.log(
          `Generated PNG fallback (2x): ${png2xPath} (${finalWidth2x}x${finalHeight2x})`
        );
      } catch (err) {
        console.error(`Failed to generate PNG fallback for ${file}:`, err);
      }
    }
  }

  // Process raster images
  const files = await globby([
    `${SRC_DIR}/**/*.{jpg,jpeg,png,gif,tiff,bmp,webp}`,
  ]);
  for (const file of files) {
    const relPath = path.relative(SRC_DIR, file);
    const fileName = path.basename(relPath, path.extname(relPath));
    // const fileExt = path.extname(relPath);
    const destDir = path.join(DEST_DIR, path.dirname(relPath));
    await fs.ensureDir(destDir);

    const image = sharp(file);
    const metadata = await image.metadata();
    let { width, height } = metadata;

    let exportSizes;
    let originalSuffix;
    let baseName;

    // Check if filename has -HD suffix
    if (fileName.endsWith('-HD')) {
      // Remove -HD suffix
      baseName = fileName.slice(0, -3);
      // Treat as @2x, export only @1x (2/3)
      exportSizes = [
        {
          suffix: '@1x',
          width: Math.round((width * 2) / 3),
          height: Math.round((height * 2) / 3),
        },
      ];
      originalSuffix = '@2x';
    } else {
      // Treat as @3x, export @1x (1/3), @2x (2/3), original as @3x
      baseName = fileName;
      exportSizes = [
        {
          suffix: '@1x',
          width: Math.round(width / 3),
          height: Math.round(height / 3),
        },
        {
          suffix: '@2x',
          width: Math.round((width * 2) / 3),
          height: Math.round((height * 2) / 3),
        },
      ];
      originalSuffix = '@3x';
    }

    // Check for -FPNG suffix and remove it from baseName
    const shouldUsePNG =
      fileName.endsWith('-FPNG') || baseName.endsWith('-FPNG');
    if (baseName.endsWith('-FPNG')) {
      baseName = baseName.slice(0, -5);
    }

    // Export original as @2x or @3x with max dimensions
    const originalWebpPath = path.join(
      destDir,
      `${baseName}${originalSuffix}.webp`
    );
    await image
      .clone()
      .resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: false,
      })
      .webp({ quality: QUALITY })
      .toFile(originalWebpPath);
    console.log(`Exported: ${originalWebpPath}`);

    if (GENERATE_FALLBACK) {
      const fallbackExt = shouldUsePNG ? 'png' : 'jpg';
      const originalFallbackPath = path.join(
        destDir,
        `${baseName}${originalSuffix}.${fallbackExt}`
      );
      const resizedImage = image.clone().resize(MAX_WIDTH, MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: false,
      });

      if (fallbackExt === 'png') {
        await resizedImage
          .png({ quality: QUALITY })
          .toFile(originalFallbackPath);
      } else {
        await resizedImage
          .jpeg({ quality: QUALITY })
          .toFile(originalFallbackPath);
      }
      console.log(`Exported: ${originalFallbackPath}`);
    }

    // Export resized versions
    for (const {
      suffix,
      width: targetWidth,
      height: targetHeight,
    } of exportSizes) {
      // WebP
      const webpPath = path.join(destDir, `${baseName}${suffix}.webp`);
      // Calculate dimensions that respect both the target size and max dimensions
      const finalWidth = Math.min(targetWidth, MAX_WIDTH);
      const finalHeight = Math.min(targetHeight, MAX_HEIGHT);

      await image
        .resize(finalWidth, finalHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: QUALITY })
        .toFile(webpPath);
      console.log(`Exported: ${webpPath}`);

      // Fallback: only for 1x and 2x (guarded by GENERATE_FALLBACK)
      if (GENERATE_FALLBACK && (suffix === '@1x' || suffix === '@2x')) {
        const fallbackExt = shouldUsePNG ? 'png' : 'jpg';
        const fallbackPath = path.join(
          destDir,
          `${baseName}${suffix}.${fallbackExt}`
        );
        // Calculate dimensions that respect both the target size and max dimensions
        const finalWidth = Math.min(targetWidth, MAX_WIDTH);
        const finalHeight = Math.min(targetHeight, MAX_HEIGHT);

        let fallbackSharp = image.clone().resize(finalWidth, finalHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        });
        if (fallbackExt === 'png') {
          await fallbackSharp.png({ quality: QUALITY }).toFile(fallbackPath);
        } else {
          await fallbackSharp.jpeg({ quality: QUALITY }).toFile(fallbackPath);
        }
        console.log(`Exported: ${fallbackPath}`);
      }
    }
  }
})();
