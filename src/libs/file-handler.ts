import sharp from 'sharp';

export function base64ToBlob(base64: string, contentType: string) {
  const byteCharacters = atob(base64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  return blob;
}

export async function blobToBuffer(blob: Blob) {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export async function compressImage(image: Blob) {
  if (!['image/jpeg', 'image/gif', 'image/png'].includes(image.type)) {
    throw new Error('Cannot compress non-image blob');
  }
  try {
    const buffer = await blobToBuffer(image);
    const compressedBuffer = await sharp(buffer)
      .webp({ quality: 80 })
      .toBuffer();
    const compressedBlob = new Blob([compressedBuffer], { type: 'image/webp' });

    return compressedBlob;
  } catch (err) {
    console.log('Compress image failed', err);
    throw err;
  }
}
