import { HelmetType } from './types';

// Placeholder gray SVG for base helmet images.
// This is a simple representation. The AI will turn this into a photorealistic helmet.
const placeholderSvgBase64 = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2VlZSIvPjxwYXRoIGQ9Ik0yNTYgNzBDMTU0LjggNzAgNzIgMTUzLjYgNzIgMjU2YzAgMTAyLjQgODIuOCAxODYgMTg0IDE4NnMxODQtODMuNiAxODQtMTg2QzQ0MCAxNTMuNiAzNTcuMiA3MCAyNTYgNzB6bTAgMzQ0Yy04Ni44IDAtMTU4LTcwLjItMTU4LTE1 bodiceaxNjkuMiA5OCAyNTYgOThzMTU4IDcwLjIgMTU4IDE1OFMzNDIuOCA0MTQgMjU2IDQxNHoiIGZpbGw9IiNjY2MiLz48L3N2Zz4=';

export const baseHelmetImages: Record<HelmetType, string> = {
    'half-face': placeholderSvgBase64,
    'open-face': placeholderSvgBase64,
    'fullface': placeholderSvgBase64,
    'cross-mx': placeholderSvgBase64,
};
