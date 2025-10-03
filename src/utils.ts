import { DecalPrompt, HelmetType } from './types';

export const fileToBase64 = (file: File): Promise<{mimeType: string, data: string, previewUrl: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
      const data = result.split(',')[1];
      resolve({ mimeType, data, previewUrl: result });
    };
    reader.onerror = (error) => reject(error);
  });
};

export const decalPromptToText = (prompt: DecalPrompt, lang: 'vi' | 'en', preserveFinish: boolean, avoidZones: boolean): string => {
  const constraints = [];
  if (preserveFinish) constraints.push(lang === 'vi' ? 'Giữ nguyên hình dáng và vật liệu của nón bảo hiểm' : 'Keep helmet shape/material');
  if (avoidZones) constraints.push(lang === 'vi' ? 'tránh các vùng kính và khe thông gió' : 'avoid visor & vents');
  if (preserveFinish) constraints.push(lang === 'vi' ? 'bảo toàn hiệu ứng phản chiếu ánh sáng' : 'preserve reflections');
  
  const constraintText = constraints.length > 0 ? constraints.join(', ') + '.' : (lang === 'vi' ? 'Không có' : 'None');

  if (lang === 'vi') {
    return `[Chủ đề decal]: ${prompt.theme}
[Mô-típ]: ${prompt.motifs}
[Dòng chảy họa tiết]: ${prompt.flow}
[Bảng màu HEX]: ${prompt.palette}
[Mật độ]: ${prompt.density}
[Hiệu ứng bề mặt]: ${prompt.finish}
[Chữ]: ${prompt.typography}
[Tính cách]: ${prompt.mood}
[Ràng buộc]: ${constraintText}`;
  }
  return `[Decal Theme]: ${prompt.theme}
[Motifs]: ${prompt.motifs}
[Pattern Flow]: ${prompt.flow}
[Palette HEX]: ${prompt.palette}
[Density]: ${prompt.density}
[Finish Cues]: ${prompt.finish}
[Typography]: ${prompt.typography}
[Mood/Style Adjectives]: ${prompt.mood}
[Constraints]: ${constraintText}`;
};

export const parsePromptText = (text: string): DecalPrompt => {
    const prompt: any = { theme: '', motifs: '', flow: '', palette: '', density: '', finish: '', typography: '', mood: '' };
    const lines = text.split('\n');
    lines.forEach(line => {
        const match = line.match(/\[(.*?)\]:\s*(.*)/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim();
            switch(key) {
                case 'Decal Theme': case 'Chủ đề decal': prompt.theme = value; break;
                case 'Motifs': case 'Mô-típ': prompt.motifs = value; break;
                case 'Pattern Flow': case 'Dòng chảy họa tiết': prompt.flow = value; break;
                case 'Palette HEX': case 'Bảng màu HEX': prompt.palette = value; break;
                case 'Density': case 'Mật độ': prompt.density = value; break;
                case 'Finish Cues': case 'Hiệu ứng bề mặt': prompt.finish = value; break;
                case 'Typography': case 'Chữ': prompt.typography = value; break;
                case 'Mood/Style Adjectives': case 'Tính cách': prompt.mood = value; break;
            }
        }
    });
    return prompt as DecalPrompt;
};

export const getHelmetProfileInstructions = (type: HelmetType | null, lang: 'vi' | 'en'): string => {
    if (!type) return '';
    const instructions = {
        'half-face': {
            en: "INSTRUCTION: This is a half-face helmet. The decal must not cover the open face area. Keep the design on the helmet shell.",
            vi: "HƯỚNG DẪN: Đây là nón bảo hiểm nửa đầu. Decal không được che phủ vùng mặt hở. Giữ thiết kế trên vỏ nón."
        },
        'open-face': {
            en: "INSTRUCTION: This is an open-face (3/4) helmet. Avoid applying the decal over the face opening, visor hinge, and any snaps.",
            vi: "HƯỚNG DẪN: Đây là nón bảo hiểm 3/4. Tránh áp decal lên vùng mặt hở, khớp kính và các nút bấm."
        },
        'fullface': {
            en: "INSTRUCTION: This is a full-face helmet. The decal must not cover the visor, visor hinge, vents, or the chin bar's lower edge.",
            vi: "HƯỚNG DẪN: Đây là nón bảo hiểm full-face. Decal không được che phủ kính, khớp kính, khe thông gió, hoặc cạnh dưới của cằm."
        },
        'cross-mx': {
            en: "INSTRUCTION: This is a motocross/MX helmet. The decal must not cover the goggle port, peak/visor, or the prominent chin bar vents.",
            vi: "HƯỚg DẪN: Đây là nón bảo hiểm cào cào/MX. Decal không được che phủ cổng kính, lưỡi trai/mái che, hoặc các khe thông gió lớn ở cằm."
        }
    };
    return `\n\n${instructions[type][lang]}`;
};

const extractHexCodes = (text: string): string[] => {
    if (!text) return [];
    const regex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
    return text.match(regex) || [];
};

export const generateProPrompt = (
  prompt: DecalPrompt, 
  helmetType: HelmetType, 
  lang: 'vi' | 'en',
  preserveFinish: boolean,
): string => {
  // --- Data Extraction & Defaults ---
  const hexCodes = extractHexCodes(prompt.palette);
  const palette = {
      base_hex_1: hexCodes[0] || '#1A1A1A',
      base_hex_2: hexCodes[1] || '#EAEAEA',
      grey_hex_1: hexCodes[2] || '#808080',
      grey_hex_2: hexCodes[3] || '#BEBEBE',
      // If accent colors are missing, reuse base colors or neutral grays
      // This prevents introducing unexpected colors like blue or orange.
      accent_hex_1: hexCodes[4] || hexCodes[0] || '#444444',
      accent_hex_2: hexCodes[5] || hexCodes[1] || '#AAAAAA',
  };
  
  const hasTypography = prompt.typography && !/none|không có/i.test(prompt.typography);

  // --- Language-specific Snippets ---
  const helmetModifiersEn: Record<HelmetType, string> = {
      'half-face': 'Half-face: open ear/strap visible; keep rim clean; preserve strap area.',
      'open-face': 'Open-face (3/4): wide face opening; clean rim; avoid front opening.',
      'fullface': 'Full-face: one-piece shell with solid jawline (non-modular; no flip-up lines); right visor hinge visible.',
      'cross-mx': 'Cross/MX: peak/roost visor present; open face (no goggles by default); emphasize side vents & peak surfaces.',
  };

  const helmetModifiersVi: Record<HelmetType, string> = {
      'half-face': 'Nửa đầu: thấy tai/quai; giữ sạch viền; bảo toàn vùng quai.',
      'open-face': '3/4: mặt mở rộng; viền sạch; tránh vùng mở phía trước.',
      'fullface': 'Full-face: vỏ liền khối, cằm cứng (không phải loại lật); thấy bản lề kính phải.',
      'cross-mx': 'Cào cào/MX: có lưỡi trai; mặt mở (mặc định không có kính); nhấn mạnh khe gió bên & bề mặt lưỡi trai.',
  };

  const typographyEn = hasTypography
    ? `${prompt.typography}, placement right side, size 15mm; keep clear space 5mm; stripes must not cut through text`
    : 'none';
    
  const typographyVi = hasTypography
    ? `${prompt.typography}, vị trí right side, cỡ 15 mm, chừa trống 5 mm, không để sọc cắt chữ`
    : 'không';
  
  const finishCue = prompt.finish;

  // --- Template Generation ---
  if (lang === 'en') {
      return `[Decal Theme] ${prompt.theme} (e.g., abstract / stripes / geometric / floral / flame), sporty/urban high-tech.

[Motifs] ${prompt.motifs} (e.g., asymmetric racing stripes, chevrons, interlocking polygons, micro-texture/halftone in secondary zones).

[Composition & Hierarchy]
Primary focal: right side around visor hinge / rear centerline / crown sweep.
Secondary: jawline band.
Tertiary accents: small vents.
Coverage ratio: Primary 45%, Secondary 25%, Accents 10-15%, Negative space 15-20%.

[Pattern Flow & Panel Map]
Directional wrap: rear → crown → right side, crossing diagonals ↗/↘.
Panel anchoring: align edges to shell seams/trim; keep seams continuous across crown/rear; avoid visor & vents.
Asymmetry allowed; do not mirror left/right.

[Palette HEX]
Base: ${palette.base_hex_1}, ${palette.base_hex_2}; greys: ${palette.grey_hex_1}, ${palette.grey_hex_2}; accents (≤ 20%): ${palette.accent_hex_1}, ${palette.accent_hex_2}.
Value plan: base 15–30%, mid 40–60%, accents 80–95% luminance.

[Density] ${prompt.density || 'balanced'} (minimal / balanced / dense); keep negative space around visor, vents, and hardware.

[Finish Cues] ${finishCue} (matte ink / semi-matte / metallic flake / pearlescent). Respect shell highlights; decals non-gloss unless specified.

[Typography] ${typographyEn} (e.g., none / short generic word, modern sans-serif, placement right side, size 15mm; keep clear space 5mm; stripes must not cut through text).

[Mood/Style Adjectives] ${prompt.mood} (aggressive, aerodynamic, modern, high-tech, dynamic).

[Helmet Type Modifiers]
${helmetModifiersEn[helmetType]}

[View & Lighting] right profile 90°; The helmet is isolated on a solid, seamless, professional studio-style neutral white background (#FFFFFF). The background must be completely opaque, with no transparency, textures, or gradients. Lighting should be soft and even, typical of a product photoshoot, with no hard shadows cast onto the background.

[Constraints] keep helmet shape/material; avoid visor & vents; preserve reflections; edge-anchored geometry; UV continuity; no brands unless specified.`;
  }

  // Vietnamese version
  return `[Chủ đề] ${prompt.theme} (trừu tượng/sọc/hình học/hoa văn/lửa…), chất thể thao–công nghệ.
[Họa tiết] ${prompt.motifs} (ví dụ sọc đua bất đối xứng, mũi tên chevron, đa giác lồng ghép, micro-texture ở vùng phụ).

[Bố cục & Phân cấp]
Chính: bên phải quanh bản lề kính. Thứ cấp: dải viền hàm. Phụ: khe gió nhỏ.
Tỉ lệ phủ: Chính 45%, Thứ cấp 25%, Phụ 10-15%, Vùng nghỉ 15-20%.

[Dòng chảy & Bản đồ mảng] Hướng rear → crown → right side; bám mép nhựa/đường ráp; nối mượt qua đỉnh/lưng; không vào kính/khe gió; bất đối xứng, không lật gương.

[Bảng màu HEX] Nền: ${palette.base_hex_1}, ${palette.base_hex_2}; xám: ${palette.grey_hex_1}, ${palette.grey_hex_2}; nhấn (≤ 20%): ${palette.accent_hex_1}, ${palette.accent_hex_2}.
Độ sáng: nền 15–30%, trung 40–60%, nhấn 80–95%.

[Mật độ] ${prompt.density || 'cân bằng'}; giữ vùng trống quanh kính & khe gió.
[Bề mặt] ${finishCue}; decal không bóng nếu không yêu cầu.
[Chữ] ${typographyVi} (không/có chữ ngắn, sans-serif, vị trí right side, cỡ 15 mm, chừa trống 5 mm, không để sọc cắt chữ).
[Loại mũ] ${helmetModifiersVi[helmetType]}.
[Góc & Ánh sáng] right profile 90°; Mũ bảo hiểm được tách biệt trên nền trắng trung tính (#FFFFFF) đồng nhất, liền mạch, theo phong cách studio chuyên nghiệp. Nền phải hoàn toàn không trong suốt, không có hoạ tiết hay gradient. Ánh sáng phải dịu và đều, như trong buổi chụp ảnh sản phẩm, không có bóng đổ gắt trên nền.
[Ràng buộc] giữ hình khối/vật liệu, tránh kính & khe gió, giữ highlight, bám mép, liên tục UV, không thương hiệu nếu không chỉ định.`;
};

export const getTimestamp = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}`;
};
