import { defineConfig } from 'astro/config';
import { site } from './site.config.mjs';

export default defineConfig({
  site: site.origin,
  base: site.base,
  trailingSlash: 'always',
  compressHTML: true,
});
