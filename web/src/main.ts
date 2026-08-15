import { mount } from 'svelte';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';
import { fab } from '@fortawesome/free-brands-svg-icons';
// Supplies the fa-spin / fa-beat / fa-shake keyframes that iconAnimation relies on. The
// React binding used to inject this itself; with core-only rendering it is imported.
import '@fortawesome/fontawesome-svg-core/styles.css';
import App from './App.svelte';
import { isEnvBrowser } from './lib/nui';
import './app.css';

// All three packs, as the React build did. Consumers pass bare icon names from Lua
// ("car", "circle-check"), which only resolve if the whole library is registered.
library.add(fas, far, fab);

// Give the browser a visible backdrop -- NUI pages are transparent by design, which makes
// them invisible against a white page during `pnpm dev`.
if (isEnvBrowser()) {
  document.documentElement.classList.add('nui-browser');
}

const app = mount(App, { target: document.getElementById('root')! });

export default app;
