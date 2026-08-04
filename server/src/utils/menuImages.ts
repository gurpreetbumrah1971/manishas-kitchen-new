import fs from 'fs';
import path from 'path';

const palette = [
  ['#fff7ed', '#c2410c', '#fed7aa'],
  ['#fefce8', '#a16207', '#fde68a'],
  ['#f0fdf4', '#15803d', '#bbf7d0'],
  ['#eff6ff', '#1d4ed8', '#bfdbfe'],
  ['#fdf2f8', '#be185d', '#fbcfe8'],
  ['#f5f3ff', '#6d28d9', '#ddd6fe'],
];

export const menuImageUrl = (name: string) =>
  `/api/menu-image/${encodeURIComponent(name)}.svg`;

export const slugifyMenuImageName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const realisticFileOverrides: Record<string, string> = {
  'Single Egg Burjee + 2 Butter Pav': 'egg-burji-realistic.png',
  'Double Egg Burjee + 4 Butter Pav': 'egg-burji-realistic.png',
  'Single Egg Omelet + 2 Butter Pav': 'egg-omelet-realistic.png',
  'Double Omelet + 4 Butter Pav': 'egg-omelet-realistic.png',
  'Egg Burji + 2 Pav (Single)': 'egg-burji-realistic.png',
  'Egg Burji + 2 Pav (Double)': 'egg-burji-realistic.png',
  'Egg Omelet + 2 Pav (Single)': 'egg-omelet-realistic.png',
  'Egg Omelet + 2 Pav (Double)': 'egg-omelet-realistic.png',
  'Aloo Frankie': 'aloo-paratha-realistic.png',
  'Paneer Frankie': 'paneer-paratha-realistic.png',
  'Paneer Pakoda': 'paneer-paratha-realistic.png',
  'Moong Daal Chilla': 'uttapam-realistic.png',
};

const generatedAssetDir = path.resolve(__dirname, '../../../assets/food/generated');

export const generatedMenuAssetUrl = (name: string) => {
  const slug = slugifyMenuImageName(name);
  const realisticFile = realisticFileOverrides[name] || `${slug}-realistic.png`;
  const svgFile = `${slug}.svg`;
  const useRealistic = fs.existsSync(path.join(generatedAssetDir, realisticFile));
  return `/food/generated/${useRealistic ? realisticFile : svgFile}`;
};

export const renderMenuImageSvg = (name: string) => {
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const [bg, accent, soft] = palette[hash % palette.length];
  const words = name.replace(/\s*\([^)]*\)/g, '').split(/\s+/).filter(Boolean);
  const lineOne = words.slice(0, 2).join(' ');
  const lineTwo = words.slice(2, 5).join(' ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400" role="img" aria-label="${escapeXml(name)}">
  <rect width="600" height="400" fill="${bg}"/>
  <circle cx="470" cy="70" r="130" fill="${soft}" opacity="0.8"/>
  <circle cx="120" cy="340" r="110" fill="${soft}" opacity="0.55"/>
  <ellipse cx="300" cy="205" rx="178" ry="92" fill="#ffffff" stroke="${accent}" stroke-width="10"/>
  <ellipse cx="300" cy="205" rx="126" ry="56" fill="${soft}"/>
  <circle cx="250" cy="190" r="22" fill="${accent}" opacity="0.85"/>
  <circle cx="305" cy="220" r="28" fill="${accent}" opacity="0.7"/>
  <circle cx="360" cy="188" r="18" fill="${accent}" opacity="0.55"/>
  <path d="M170 92c45 12 87 12 126 0M180 111c38 10 72 10 103 0" fill="none" stroke="${accent}" stroke-width="12" stroke-linecap="round" opacity="0.65"/>
  <text x="300" y="320" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" fill="${accent}">${escapeXml(lineOne)}</text>
  ${lineTwo ? `<text x="300" y="358" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="600" fill="${accent}" opacity="0.86">${escapeXml(lineTwo)}</text>` : ''}
</svg>`;
};

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
