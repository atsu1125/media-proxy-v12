/// <reference types="node" />
import sharp from 'sharp';
export type IImage = {
    data: Buffer;
    ext: string | null;
    type: string;
};
/**
 * Convert to WebP
 *   with resize, remove metadata, resolve orientation, stop animation
 */
export declare function convertToWebp(path: string, width: number, height: number, quality?: number): Promise<IImage>;
export declare function convertSharpToWebp(sharp: sharp.Sharp, width: number, height: number, quality?: number): Promise<IImage>;
