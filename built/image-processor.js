import sharp from 'sharp';
/**
 * Convert to WebP
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export async function convertToWebp(path, width, height, quality = 85) {
    return convertSharpToWebp(await sharp(path), width, height, quality);
}
export async function convertSharpToWebp(sharp, width, height, quality = 85) {
    const data = await sharp
        .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
    })
        .rotate()
        .webp({
        quality,
    })
        .toBuffer();
    return {
        data,
        ext: 'webp',
        type: 'image/webp',
    };
}
