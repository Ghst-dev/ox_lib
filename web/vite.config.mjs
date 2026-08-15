import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig({
  // Tailwind v4 needs no config file -- the theme is declared in src/theme/tokens.css.
  plugins: [tailwindcss(), svelte()],
  // Relative asset paths -- NUI's Chromium loads the page from nui://, not a web root.
  base: './',
  server: {
    port: 3000,
  },
  build: {
    // Must stay 'build': fxmanifest.lua declares `ui_page 'web/build/index.html'` and
    // globs `web/build/**/*` in files{}. Renaming this to 'dist' ships a resource with
    // no UI, and the failure is silent until someone opens a menu in game.
    outDir: 'build',
    target: 'esnext',
  },
});
