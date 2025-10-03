import { DecalPrompt, HelmetType } from './types';

export const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(',')[0].split(':')[1].split(';')[0];
      const data = result.split(',')[1];
      resolve({ mimeType, data });
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

const baseHelmetGenerationPrompts: Record<HelmetType, { en: string; vi: string }> = {
  'half-face': {
    en: 'Clean half-face motorcycle helmet, right profile (90°), camera on the left of helmet, strap & buckle visible, completely smooth shell with no visor hinges, mounting points, or hardware visible, no branding or text, neutral black shell #111, smooth gloss finish, accurate proportions. The helmet is isolated on a solid, seamless, professional studio-style neutral white background (#FFFFFF). The background must be completely opaque, with no transparency, textures, or gradients. Lighting should be soft and even, typical of a product photoshoot, with no hard shadows cast onto the background. Not left-facing, do not mirror, product shot, high-res.',
    vi: 'Mũ bảo hiểm nửa đầu (half-face), nhìn hông phải (90°), máy ảnh ở bên trái mũ, quai & khóa nhìn rõ, vỏ trơn hoàn toàn, không có bản lề kính, điểm gắn hay bất kỳ phần cứng nào, không logo/chữ, vỏ đen trung tính #111, bề mặt bóng, tỷ lệ chuẩn. Mũ bảo hiểm được tách biệt trên nền trắng trung tính (#FFFFFF) đồng nhất, liền mạch, theo phong cách studio chuyên nghiệp. Nền phải hoàn toàn không trong suốt, không có hoạ tiết hay gradient. Ánh sáng phải dịu và đều, như trong buổi chụp ảnh sản phẩm, không có bóng đổ gắt trên nền. Không nhìn trái, không lật ảnh, ảnh sản phẩm độ phân giải cao.'
  },
  'open-face': {
    en: "URGENT: Generate an open-face (three-quarter) motorcycle helmet ONLY. CRITICAL CONSTRAINT: This helmet has ABSOLUTELY NO CHIN BAR. The jaw and chin area must be completely open and visible. The helmet shell covers the ears and back of the head, and its bottom edge stops above the jawline. This is a classic '3/4' style helmet. Right profile view (90°), neutral black shell #111, gloss finish, no branding. The helmet is isolated on a solid, seamless, professional studio-style neutral white background (#FFFFFF). The background must be completely opaque, with no transparency, textures, or gradients. Lighting should be soft and even, typical of a product photoshoot, with no hard shadows cast onto the background. REPEAT: DO NOT generate a full-face helmet or any helmet with a chin bar. Crisp product shot, not left-facing, no mirroring.",
    vi: "KHẨN CẤP: Chỉ tạo mũ bảo hiểm open-face (mũ 3/4). RÀNG BUỘC TỐI QUAN TRỌNG: Mũ này TUYỆT ĐỐI KHÔNG CÓ ỐP CẰM. Vùng cằm và hàm phải hoàn toàn để hở và có thể nhìn thấy. Vỏ mũ che tai và gáy, và cạnh dưới của nó dừng lại ở phía trên đường viền hàm. Đây là kiểu mũ '3/4' cổ điển. Nhìn từ hông phải (90°), vỏ màu đen trung tính #111, bề mặt bóng, không có logo. Mũ bảo hiểm được tách biệt trên nền trắng trung tính (#FFFFFF) đồng nhất, liền mạch, theo phong cách studio chuyên nghiệp. Nền phải hoàn toàn không trong suốt, không có hoạ tiết hay gradient. Ánh sáng phải dịu và đều, như trong buổi chụp ảnh sản phẩm, không có bóng đổ gắt trên nền. LẶP LẠI: KHÔNG tạo mũ full-face hay bất kỳ mũ nào có ốp cằm. Ảnh sản phẩm sắc nét, không nhìn trái, không lật ảnh."
  },
  'fullface': {
    en: 'A very specific type of helmet: a full-face motorcycle helmet with a one-piece shell. CRITICAL: The helmet MUST have a solid, non-removable chin bar that is an integral, fixed part of the shell structure. There should be no visible seams, lines, or mechanisms indicating a flip-up or modular front. Right profile view (90°), clear visor, right-side visor hinge visible, no logos or text, neutral black shell #111, gloss finish, accurate geometry. The helmet is isolated on a solid, seamless, professional studio-style neutral white background (#FFFFFF). The background must be completely opaque, with no transparency, textures, or gradients. Lighting should be soft and even, typical of a product photoshoot, with no hard shadows cast onto the background. This is NOT a modular helmet. Not left-facing, do not mirror, high-res product shot.',
    vi: 'Một loại mũ bảo hiểm rất cụ thể: mũ full-face với vỏ liền khối một mảnh. QUAN TRỌNG: Mũ BẮT BUỘC phải có ốp cằm cứng, không thể tháo rời, là một phần cố định, liền khối của cấu trúc vỏ. Không được có bất kỳ đường nối, khe hở hay cơ cấu nào cho thấy đây là mũ lật cằm hay mũ modular. Nhìn từ hông phải (90°), kính trong, thấy bản lề kính bên phải, không logo/chữ, vỏ đen #111, bề mặt bóng, hình học chuẩn xác. Mũ bảo hiểm được tách biệt trên nền trắng trung tính (#FFFFFF) đồng nhất, liền mạch, theo phong cách studio chuyên nghiệp. Nền phải hoàn toàn không trong suốt, không có hoạ tiết hay gradient. Ánh sáng phải dịu và đều, như trong buổi chụp ảnh sản phẩm, không có bóng đổ gắt trên nền. Đây KHÔNG PHẢI là mũ lật cằm (modular). Không nhìn trái, không lật ảnh, ảnh sản phẩm độ phân giải cao.'
  },
  'cross-mx': {
    en: 'Motocross (MX) helmet with peak/visor and open face (no goggles), right profile (90°), peak orientation and side vents visible, no branding, neutral black #111, semi-matte finish. The helmet is isolated on a solid, seamless, professional studio-style neutral white background (#FFFFFF). The background must be completely opaque, with no transparency, textures, or gradients. Lighting should be soft and even, typical of a product photoshoot, with no hard shadows cast onto the background. Product shot, not left-facing, no mirroring.',
    vi: 'Mũ motocross (MX) có lưỡi trai và mặt mở (không kèm kính bảo hộ), nhìn hông phải (90°), thấy rõ lưỡi trai và khe thoáng bên hông, không logo, vỏ đen #111, bề mặt bán mờ. Mũ bảo hiểm được tách biệt trên nền trắng trung tính (#FFFFFF) đồng nhất, liền mạch, theo phong cách studio chuyên nghiệp. Nền phải hoàn toàn không trong suốt, không có hoạ tiết hay gradient. Ánh sáng phải dịu và đều, như trong buổi chụp ảnh sản phẩm, không có bóng đổ gắt trên nền. Ảnh sản phẩm, không nhìn trái, không lật ảnh.'
  }
};

export const getBaseHelmetGenerationPrompt = (type: HelmetType, lang: 'vi' | 'en'): string => {
  return baseHelmetGenerationPrompts[type][lang];
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

export const getHelmetTypeConstraintPrompt = (type: HelmetType, lang: 'vi' | 'en'): string => {
    const constraints = {
        'half-face': {
            en: "CRITICAL CONSTRAINT: The helmet MUST be a half-face helmet. It has NO chin bar and NO fixed visor. The face is completely open from the chin upwards.",
            vi: "RÀNG BUỘC TỐI QUAN TRỌNG: Mũ BẮT BUỘC phải là mũ bảo hiểm nửa đầu. Mũ KHÔNG CÓ ốp cằm và KHÔNG CÓ kính che cố định. Phần mặt phải hoàn toàn mở từ cằm trở lên."
        },
        'open-face': {
            en: "CRITICAL CONSTRAINT: The helmet MUST be an open-face (3/4) helmet. It has NO chin bar. The shell covers the ears and back of the head, but the face area is open.",
            vi: "RÀNG BUỘC TỐI QUAN TRỌNG: Mũ BẮT BUỘC phải là mũ bảo hiểm 3/4 (open-face). Mũ KHÔNG CÓ ốp cằm. Vỏ mũ che tai và sau gáy, nhưng vùng mặt phải để hở."
        },
        'fullface': {
            en: "CRITICAL CONSTRAINT: The helmet MUST be a full-face helmet. It MUST have a solid, non-removable chin bar as an integral part of the shell.",
            vi: "RÀNG BUỘC TỐI QUAN TRỌNG: Mũ BẮT BUỘC phải là mũ bảo hiểm full-face. Mũ BẮT BUỘC phải có ốp cằm cứng, không thể tháo rời, là một phần liền khối của vỏ."
        },
        'cross-mx': {
            en: "CRITICAL CONSTRAINT: The helmet MUST be a motocross (MX) helmet. It MUST have a prominent, elongated chin bar and a large peak/visor on top. The face area is open for goggles.",
            vi: "RÀNG BUỘC TỐI QUAN TRỌNG: Mũ BẮT BUỘC phải là mũ bảo hiểm cào cào (MX). Mũ BẮT BUỘC phải có ốp cằm nhô ra rõ rệt và một lưỡi trai/mái che lớn ở trên. Vùng mặt phải để hở để đeo kính."
        }
    };
    return `\n\n${constraints[type][lang]}`;
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