import JSZip from 'jszip';
import packageJsonRaw from '../package.json?raw';
import tsconfigRaw from '../tsconfig.json?raw';
import viteConfigRaw from '../vite.config.ts?raw';
import indexHtmlRaw from '../index.html?raw';
import readmeRaw from '../README.md?raw';
import deployGuideRaw from '../NETLIFY_DEPLOY_GUIDE_MYANMAR.txt?raw';
import gitignoreRaw from '../.gitignore?raw';
import imagesReadmeRaw from '../public/images/README.txt?raw';
import mainTsxRaw from './main.tsx?raw';
import indexCssRaw from './index.css?raw';
import portfolioDataRaw from './portfolioData.ts?raw';
import slideTransitionsRaw from './SlideTransitions.tsx?raw';
import supplyChainVisualsRaw from './SupplyChainVisuals.tsx?raw';
import imageStorageRaw from './imageStorage.ts?raw';
import appTsxRaw from './App.tsx?raw';
import { BUNDLED_IMAGES } from './bundledImages';

const DEFAULT_IMAGE_FILES = [
  'cert_adcamp.jpg',
  'cert_gee.jpg',
  'cert_hypen.png',
  'cert_nlp.jpg',
  'cert_simplilearn.jpg',
  'cert_thekap.jpg',
  'cert_unilever.jpg',
  'cert_yaymal_adv.jpg',
  'cert_yaymal_basic.jpg',
  'evidence_ib_head.jpg',
  'evidence_shell_director.jpg',
  'evidence_shell.jpg',
  'exp_photo_aim.jpg',
  'exp_photo_helix.png',
  'exp_photo_tutor.png',
  'hero_arms_crossed_cutout.png',
  'hero_arms_crossed_portrait.png',
  'hero_portrait_raw.png',
  'hero_suit_cutout.png',
  'hero_suit_portrait.jpg',
  'hero-portrait.png',
  'lead_photo_council.jpg',
  'lead_photo_enervon.jpg',
  'lead_photo_gee.jpg',
  'lead_photo_hypen.png',
  'lead_photo_redcross.jpg',
  'lead_photo_tt_president.png',
];

export async function downloadFullProjectZip(customImages: Record<string, string> = {}): Promise<void> {
  const zip = new JSZip();

  // Root configuration and documentation
  zip.file('package.json', packageJsonRaw);
  zip.file('tsconfig.json', tsconfigRaw);
  zip.file('vite.config.ts', viteConfigRaw);
  zip.file('index.html', indexHtmlRaw);
  zip.file('README.md', readmeRaw);
  zip.file('NETLIFY_DEPLOY_GUIDE_MYANMAR.txt', deployGuideRaw);
  zip.file('.gitignore', gitignoreRaw);

  // public/images
  zip.file('public/images/README.txt', imagesReadmeRaw);

  // Source files
  zip.file('src/main.tsx', mainTsxRaw);
  zip.file('src/index.css', indexCssRaw);
  zip.file('src/portfolioData.ts', portfolioDataRaw);
  zip.file('src/SlideTransitions.tsx', slideTransitionsRaw);
  zip.file('src/SupplyChainVisuals.tsx', supplyChainVisualsRaw);
  zip.file('src/imageStorage.ts', imageStorageRaw);
  zip.file('src/App.tsx', appTsxRaw);

  // Prepare bundled images mapping
  const exportImages: Record<string, string> = { ...BUNDLED_IMAGES, ...customImages };

  const heroPic =
    exportImages['hero_portrait_raw'] ||
    exportImages['hero_arms_crossed_portrait'] ||
    exportImages['hero_suit_portrait'];
  if (heroPic) {
    exportImages['hero_portrait_raw'] = heroPic;
    exportImages['hero_arms_crossed_portrait'] = heroPic;
    exportImages['hero_suit_portrait'] = heroPic;
    exportImages['hero_arms_crossed_cutout'] = heroPic;
    exportImages['hero_suit_cutout'] = heroPic;
  }

  const shellPic =
    exportImages['evidence_shell'] ||
    exportImages['evidence_shell_director'];
  if (shellPic) {
    exportImages['evidence_shell'] = shellPic;
    exportImages['evidence_shell_director'] = shellPic;
  }

  // Handle custom image uploads: convert base64 data URLs to files in public/images
  for (const [key, val] of Object.entries(exportImages)) {
    if (typeof val === 'string' && val.startsWith('data:image/')) {
      const match = val.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
      if (match) {
        const rawExt = match[1].toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        const b64Data = match[2];
        const filename = `${key}.${ext}`;
        zip.file(`public/images/${filename}`, b64Data, { base64: true });
        exportImages[key] = `/images/${filename}`;
      }
    }
  }

  const bundledImagesContent = `/**
 * Bundled Static Image Assets for Netlify & Public Production
 * Clean static paths pointing to public/images/
 */

export type BundledImagesRegistry = Record<string, string>;

export const BUNDLED_IMAGES: BundledImagesRegistry = ${JSON.stringify(exportImages, null, 2)};

export function getBundledImage(key: string): string | undefined {
  return BUNDLED_IMAGES[key];
}
`;
  zip.file('src/bundledImages.ts', bundledImagesContent);

  // Fetch and include existing public static images if available in browser
  await Promise.all(
    DEFAULT_IMAGE_FILES.map(async (filename) => {
      try {
        const res = await fetch(`/images/${filename}`);
        if (res.ok) {
          const blob = await res.blob();
          zip.file(`public/images/${filename}`, blob);
        }
      } catch {
        // Silently skip if asset cannot be fetched
      }
    })
  );

  // Also include projectZip.ts in src/
  const selfContent = `import JSZip from 'jszip';

export async function downloadFullProjectZip(customImages: Record<string, string> = {}): Promise<void> {
  // Download helper for production
  console.log('Project zip created with custom images:', Object.keys(customImages).length);
}
`;
  zip.file('src/projectZip.ts', selfContent);

  // Generate ZIP and trigger browser download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'hein-htet-aung-portfolio.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}
