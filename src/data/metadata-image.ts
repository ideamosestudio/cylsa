import images from '../generated/images.json';
import { siteUrl } from '../../site.config.mjs';

type ImageVariants = Record<string, { variants: { width: number; src: string }[] }>;
export function metadataImage(path: string): string {
  const key = path.replace(/^\//, '');
  const versions = (images as ImageVariants)[key]?.variants;
  const asset = versions?.find(v => v.width >= 1200) ?? versions?.at(-1);
  return new URL(asset?.src ?? key, siteUrl).href;
}
