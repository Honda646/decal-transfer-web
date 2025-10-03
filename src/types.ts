export type HelmetState = {
  file: File | null;
  previewUrl: string | null;
};

export type HelmetType = 'half-face' | 'open-face' | 'fullface' | 'cross-mx';

export type DecalPrompt = {
  theme: string;
  motifs: string;
  flow: string;
  palette: string;
  density: string;
  finish: string;
  typography: string;
  mood: string;
};

export type StyleId = 'line-sketch' | 'watercolor' | 'marker' | 'neon';
export type ActiveTab = 'single' | 'full-view' | 'style';

// FullView is now a single composite image
export type FullViewResult = string | null;


export const initialHelmetState: HelmetState = { file: null, previewUrl: null };
export const initialDecalPrompt: DecalPrompt = {
  theme: '', motifs: '', flow: '', palette: '', density: '', finish: '', typography: '', mood: ''
};
