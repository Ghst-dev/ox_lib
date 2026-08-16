import { mount } from 'svelte';
import App from './App.svelte';
import { isEnvBrowser } from './lib/nui';
import './app.css';

// No icon library registration. FontAwesome needed all three packs loaded up front because
// names arrive from Lua at runtime and could be anything; that cost 27 MB in node_modules
// and dominated a 1.81 MB bundle. lib/icons.ts is an explicit map of the names actually
// used instead, so each icon is a static import and the bundler keeps only those.
// The iconAnimation keyframes moved to lib/Icon.svelte with FontAwesome's stylesheet gone.

// Give the browser a visible backdrop -- NUI pages are transparent by design, which makes
// them invisible against a white page during `pnpm dev`.
if (isEnvBrowser()) {
  document.documentElement.classList.add('nui-browser');
}

const app = mount(App, { target: document.getElementById('root')! });

export default app;
