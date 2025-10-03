import { HelmetType } from './types';

// Placeholder transparent PNG for base helmet images.
// This is a minimal 1x1 pixel image. The AI will turn this into a photorealistic helmet.
const placeholderPngBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';


export const baseHelmetImages: Record<HelmetType, string> = {
    'half-face': placeholderPngBase64,
    'open-face': placeholderPngBase64,
    'fullface': placeholderPngBase64,
    'cross-mx': placeholderPngBase64,
};
