/**
 * scripts/generate-thumbs.js
 * Static thumbnail generator for CMS preview optimization.
 * Resizes all images in assets/images/ to max 300px width/height into assets/images/thumbs/.
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const inputDir = path.join(__dirname, '..', 'assets', 'images');
const outputDir = path.join(__dirname, '..', 'assets', 'images', 'thumbs');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.readdir(inputDir, async (err, files) => {
  if (err) {
    console.error('Error reading input directory:', err);
    process.exit(1);
  }

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    const fullPath = path.join(inputDir, file);
    const stat = fs.statSync(fullPath);
    return stat.isFile() && imageExtensions.includes(ext);
  });

  console.log(`Found ${imageFiles.length} image assets in assets/images/`);

  let count = 0;
  for (const file of imageFiles) {
    const inputPath = path.join(inputDir, file);
    const outputPath = path.join(outputDir, file);
    const ext = path.extname(file).toLowerCase();

    try {
      let pipeline = sharp(inputPath).resize(300, 300, {
        fit: 'inside',
        withoutEnlargement: true
      });

      if (ext === '.jpg' || ext === '.jpeg') {
        pipeline = pipeline.jpeg({ quality: 80 });
      } else if (ext === '.png') {
        pipeline = pipeline.png({ quality: 80, compressionLevel: 8 });
      } else if (ext === '.webp') {
        pipeline = pipeline.webp({ quality: 80 });
      }

      await pipeline.toFile(outputPath);
      count++;
      console.log(`[${count}/${imageFiles.length}] Generated thumbnail: assets/images/thumbs/${file}`);
    } catch (error) {
      console.error(`Failed to process ${file}:`, error);
    }
  }

  console.log(`✅ Successfully generated ${count} thumbnails in assets/images/thumbs/`);
});
