import heic2any from 'heic2any';

function isHeicFile(file) {
  if (!file) return false;
  const type = (file.type ?? '').toLowerCase();
  const name = (file.name ?? '').toLowerCase();
  return (
    type === 'image/heic'
    || type === 'image/heif'
    || name.endsWith('.heic')
    || name.endsWith('.heif')
  );
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

async function convertHeicToJpeg(file) {
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

/**
 * Returns a preview URL suitable for <img src> on mobile Safari (incl. iPhone HEIC camera).
 * @returns {{ url: string, revoke: () => void }}
 */
export async function createDisplayableImagePreview(file) {
  if (!file) {
    return { url: '', revoke: () => {} };
  }

  let previewBlob = file;

  if (isHeicFile(file)) {
    try {
      previewBlob = await convertHeicToJpeg(file);
    } catch {
      // Fall through to data URL attempt below.
    }
  }

  const blobUrl = URL.createObjectURL(previewBlob);
  const canRenderBlob = await probeImageUrl(blobUrl);

  if (canRenderBlob) {
    return {
      url: blobUrl,
      revoke: () => URL.revokeObjectURL(blobUrl),
    };
  }

  URL.revokeObjectURL(blobUrl);

  try {
    const dataUrl = await readFileAsDataUrl(previewBlob);
    if (dataUrl && await probeImageUrl(dataUrl)) {
      return { url: dataUrl, revoke: () => {} };
    }
  } catch {
    // ignore
  }

  if (isHeicFile(file)) {
    try {
      const converted = await convertHeicToJpeg(file);
      const dataUrl = await readFileAsDataUrl(converted);
      if (dataUrl) {
        return { url: dataUrl, revoke: () => {} };
      }
    } catch {
      // ignore
    }
  }

  return { url: '', revoke: () => {} };
}

function probeImageUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0 && img.naturalHeight > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

export { isHeicFile, convertHeicToJpeg };
