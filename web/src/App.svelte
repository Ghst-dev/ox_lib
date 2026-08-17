<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import { onNuiEvent, isEnvBrowser } from './lib/nui';
  import { initShell } from './lib/stores.svelte';
  import { setClipboard } from './utils/setClipboard';

  import Notifications from './features/notifications/Notifications.svelte';
  import TextUI from './features/textui/TextUI.svelte';
  import Progressbar from './features/progress/Progressbar.svelte';
  import CircleProgressbar from './features/progress/CircleProgressbar.svelte';
  import AlertDialog from './features/dialog/AlertDialog.svelte';
  import InputDialog from './features/dialog/InputDialog.svelte';
  import ContextMenu from './features/menu/context/ContextMenu.svelte';
  import ListMenu from './features/menu/list/ListMenu.svelte';
  import RadialMenu from './features/menu/radial/RadialMenu.svelte';
  import SkillCheck from './features/skillcheck/SkillCheck.svelte';

  /**
   * The dev harness, loaded dynamically so that it does not ship.
   *
   * `isEnvBrowser()` alone was not enough, and the difference is invisible until you look in
   * the bundle. A static `import DevPanel from './features/dev/DevPanel.svelte'` is resolved
   * at build time whatever the guard says, so the component and every debug payload it
   * references were bundled and merely never rendered — ox_lib was shipping its own test
   * drawer, and a fake police locker dialog, to every player who downloaded the resource.
   *
   * `import.meta.env.DEV` is what fixes it: Vite substitutes the literal `false` in a
   * production build, so Rollup drops the branch and everything reachable only from it. The
   * check, from web/:
   *
   *     pnpm build && grep -c "Developer drawer" build/assets/*.js
   *
   * It should find nothing.
   */
  let DevPanel = $state<Component | null>(null);

  if (import.meta.env.DEV && isEnvBrowser()) {
    void import('./features/dev/DevPanel.svelte').then((module) => (DevPanel = module.default));
  }

  // Every feature mounts unconditionally and decides for itself whether it is visible,
  // exactly as App.tsx did — each one is driven by its own NUI action.
  onMount(() => {
    const offShell = initShell();
    const offClipboard = onNuiEvent<string>('setClipboard', setClipboard);

    return () => {
      offShell();
      offClipboard();
    };
  });
</script>

<Progressbar />
<CircleProgressbar />
<Notifications />
<TextUI />
<AlertDialog />
<InputDialog />
<ContextMenu />
<ListMenu />
<RadialMenu />
<SkillCheck />

{#if DevPanel}
  <DevPanel />
{/if}
