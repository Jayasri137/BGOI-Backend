const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo'
]);

function getMediaFileCategory(mimetype) {
  if (IMAGE_MIME_TYPES.has(mimetype)) return 'image';
  if (VIDEO_MIME_TYPES.has(mimetype)) return 'video';
  return 'document';
}

async function compressImageIfNeeded(inputPath, originalName, mimetype) {
  const inputStats = fs.statSync(inputPath);
  if (!IMAGE_MIME_TYPES.has(mimetype) || mimetype === 'image/gif') {
    return {
      path: inputPath,
      filename: path.basename(inputPath),
      size: inputStats.size,
      compressed: false
    };
  }

  const metadata = await sharp(inputPath).metadata();
  const shouldCompress = inputStats.size > 1024 * 1024 || (metadata.width && metadata.width > 1600) || (metadata.height && metadata.height > 1600);

  if (!shouldCompress) {
    return {
      path: inputPath,
      filename: path.basename(inputPath),
      size: inputStats.size,
      compressed: false
    };
  }

  const baseName = path.basename(originalName, path.extname(originalName)).replace(/[^a-zA-Z0-9-_]+/g, '-');
  const targetDir = path.dirname(inputPath);
  const outputBasePath = path.join(targetDir, `${Date.now()}-${baseName}.webp`);
  const targetSizeBytes = 2 * 1024 * 1024;

  let finalPath = inputPath;
  let finalSize = inputStats.size;
  let compressed = false;

  for (let quality = 82; quality >= 60; quality -= 8) {
    const tempPath = `${outputBasePath}-${quality}.webp`;
    await sharp(inputPath)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality })
      .toFile(tempPath);

    const tempStats = fs.statSync(tempPath);
    if (tempStats.size <= targetSizeBytes || quality === 60) {
      finalPath = tempPath;
      finalSize = tempStats.size;
      compressed = true;
      break;
    }

    fs.unlinkSync(tempPath);
  }

  if (compressed && finalPath !== inputPath) {
    fs.unlinkSync(inputPath);
    return {
      path: finalPath,
      filename: path.basename(finalPath),
      size: finalSize,
      compressed: true
    };
  }

  return {
    path: inputPath,
    filename: path.basename(inputPath),
    size: inputStats.size,
    compressed: false
  };
}

module.exports = {
  getMediaFileCategory,
  compressImageIfNeeded
};
