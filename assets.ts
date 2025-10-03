import { HelmetType } from './types';

// Placeholder gray SVG for base helmet images.
// This is a simple representation. The AI will turn this into a photorealistic helmet.
const placeholderSvgBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAsNSBBNDUsNDUgMCAwLDEgOTUsNTAgTDk1LDgwIEExNSwxNSAwIDAsMSA4MCw5NSBMMjAsOTUgQTE1LDE1IDAgMCwxIDUsODAgTDUsNTAgQTQ1LDQ1IDAgMCwxIDUwLDUgWiIgZmlsbD0iI2NjY2NjYyIvPjwvc3ZnPg==';


export const baseHelmetImages: Record<HelmetType, string> = {
    'half-face': placeholderSvgBase64,
    'open-face': placeholderSvgBase64,
    'fullface': placeholderSvgBase64,
    'cross-mx': placeholderSvgBase64,
};
