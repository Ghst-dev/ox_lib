import { mount } from 'svelte';
import App from './App.svelte';
import { isEnvBrowser } from './lib/nui';
import './app.css';

// Give the browser a visible backdrop -- NUI pages are transparent by design, which makes
// them invisible against a white page during `pnpm dev`.
if (isEnvBrowser()) {
  document.documentElement.classList.add('nui-browser');
}

const app = mount(App, { target: document.getElementById('root')! });

export default app;
