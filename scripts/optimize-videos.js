import fs from 'fs-extra';
import { globby } from 'globby';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.join(__dirname, '../src/images');
const DEST_DIR = path.join(__dirname, '../public/images');

(async () => {
  // Process MP4 video files for hero background sections
  const videoFiles = await globby([`${SRC_DIR}/**/*.mp4`]);
  for (const file of videoFiles) {
    const relPath = path.relative(SRC_DIR, file);
    const fileName = path.basename(relPath, path.extname(relPath));
    const destDir = path.join(DEST_DIR, path.dirname(relPath));
    await fs.ensureDir(destDir);

    // Create both standard and mobile-optimized versions
    const outputPath = path.join(destDir, `${fileName}.mp4`);
    const outputPathMobile = path.join(destDir, `${fileName}-mobile.mp4`);
    // Create fallback image path for first frame extraction
    const fallbackImagePath = path.join(destDir, `${fileName}-poster.webp`);
    const fallbackImagePathMobile = path.join(
      destDir,
      `${fileName}-mobile-poster.webp`
    );

    // Import ffmpeg modules
    const ffmpeg = (await import('fluent-ffmpeg')).default;
    const ffmpegStatic = (await import('ffmpeg-static')).default;

    // Set ffmpeg path
    ffmpeg.setFfmpegPath(ffmpegStatic);

    // Set ffprobe path - using the same binary for both
    // This is a workaround since ffprobe is included in the ffmpeg binary
    ffmpeg.setFfprobePath(ffmpegStatic);

    console.log(`Optimizing hero background video: ${file}`);

    // Skip metadata extraction since ffprobe is causing issues
    // We'll use a more direct approach with scaling filters that maintain aspect ratio
    console.log(`Processing video: ${file} (maintaining aspect ratio)`);

    // Create a promise to handle the ffmpeg process for standard version
    await new Promise((resolve, reject) => {
      ffmpeg(file)
        // Use simpler options that are guaranteed to work
        .videoCodec('libx264')
        .outputOptions([
          '-preset medium',
          '-crf 23',
          '-movflags faststart',
          '-pix_fmt yuv420p',
        ])
        .noAudio() // Remove audio
        .size('?x1080') // Max height 1080px, maintain aspect ratio
        .output(outputPath)
        .on('end', () => {
          console.log(`Hero video optimized: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Failed to optimize hero video ${file}:`, err);
          reject(err);
        })
        .run();
    });

    // Create mobile-optimized version with reduced resolution
    await new Promise((resolve, reject) => {
      ffmpeg(file)
        // Use simpler options that are guaranteed to work
        .videoCodec('libx264')
        .outputOptions([
          '-preset medium',
          '-crf 26', // Higher compression for mobile
          '-movflags faststart',
          '-pix_fmt yuv420p',
        ])
        .noAudio() // Remove audio
        .size('?x720') // Max height 720px, maintain aspect ratio
        .output(outputPathMobile)
        .on('end', () => {
          console.log(`Mobile hero video optimized: ${outputPathMobile}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`Failed to optimize mobile hero video ${file}:`, err);
          reject(err);
        })
        .run();
    });

    // Extract first frame from standard video for fallback image
    await new Promise((resolve, reject) => {
      ffmpeg(outputPath)
        .screenshots({
          timestamps: ['00:00:00.000'],
          filename: path.basename(fallbackImagePath),
          folder: path.dirname(fallbackImagePath),
          size: '?x1080', // Match video dimensions
        })
        .on('end', () => {
          console.log(
            `Extracted first frame as fallback image: ${fallbackImagePath}`
          );
          resolve();
        })
        .on('error', (err) => {
          console.error(
            `Failed to extract first frame from ${outputPath}:`,
            err
          );
          reject(err);
        });
    });

    // Extract first frame from mobile video for fallback image
    await new Promise((resolve, reject) => {
      ffmpeg(outputPathMobile)
        .screenshots({
          timestamps: ['00:00:00.000'],
          filename: path.basename(fallbackImagePathMobile),
          folder: path.dirname(fallbackImagePathMobile),
          size: '?x720', // Match mobile video dimensions
        })
        .on('end', () => {
          console.log(
            `Extracted first frame as mobile fallback image: ${fallbackImagePathMobile}`
          );
          resolve();
        })
        .on('error', (err) => {
          console.error(
            `Failed to extract first frame from ${outputPathMobile}:`,
            err
          );
          reject(err);
        });
    });

    console.log(`Completed optimization for ${fileName}`);
  }
})();
