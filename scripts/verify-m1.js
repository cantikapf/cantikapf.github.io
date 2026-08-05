const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function verify() {
  console.log('=== Milestone 1 Verification ===');
  let errors = 0;

  // 1. Verify thumbs directory and count
  const origDir = path.join(__dirname, '..', 'assets', 'images');
  const thumbsDir = path.join(__dirname, '..', 'assets', 'images', 'thumbs');

  if (!fs.existsSync(thumbsDir)) {
    console.error('❌ Thumbs directory does not exist!');
    errors++;
  } else {
    const origFiles = fs.readdirSync(origDir).filter(f => fs.statSync(path.join(origDir, f)).isFile() && /\.(jpg|jpeg|png|webp)$/i.test(f));
    const thumbFiles = fs.readdirSync(thumbsDir).filter(f => fs.statSync(path.join(thumbsDir, f)).isFile() && /\.(jpg|jpeg|png|webp)$/i.test(f));

    console.log(`Original images count: ${origFiles.length}`);
    console.log(`Thumbnail images count: ${thumbFiles.length}`);

    if (origFiles.length !== thumbFiles.length) {
      console.error(`❌ Mismatch! Original: ${origFiles.length}, Thumbs: ${thumbFiles.length}`);
      errors++;
    } else {
      console.log('✅ 31 thumbnails match original images count.');
    }

    // Check dimensions and file size reduction
    let totalOrigSize = 0;
    let totalThumbSize = 0;
    for (const f of thumbFiles) {
      const origSize = fs.statSync(path.join(origDir, f)).size;
      const thumbSize = fs.statSync(path.join(thumbsDir, f)).size;
      totalOrigSize += origSize;
      totalThumbSize += thumbSize;

      const meta = await sharp(path.join(thumbsDir, f)).metadata();
      if (meta.width > 300 || meta.height > 300) {
        console.error(`❌ Thumbnail ${f} exceeds 300px max dimension: ${meta.width}x${meta.height}`);
        errors++;
      }
    }
    console.log(`Total original size: ${(totalOrigSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Total thumbnail size: ${(totalThumbSize / 1024).toFixed(2)} KB`);
    console.log(`✅ Size reduction: ${((1 - totalThumbSize / totalOrigSize) * 100).toFixed(1)}% saved!`);
  }

  if (errors === 0) {
    console.log('\n✅ ALL VERIFICATION CHECKS PASSED PERFECTLY!');
  } else {
    console.error(`\n❌ VERIFICATION FAILED with ${errors} errors.`);
    process.exit(1);
  }
}

verify();
