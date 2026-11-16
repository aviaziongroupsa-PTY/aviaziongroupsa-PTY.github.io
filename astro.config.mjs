// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://aviaziongroupsa-pty.github.io',
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
    // La CSP no admite <script> en línea: los scripts siempre salen como archivo en /_astro/.
    build: { assetsInlineLimit: 0 }
  }
});
