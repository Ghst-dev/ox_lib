<script lang="ts">
  import { onMount } from 'svelte';
  import { onNuiEvent } from './lib/nui';
  import { initShell } from './lib/stores.svelte';
  import { setClipboard } from './utils/setClipboard';

  import Notifications from './features/notifications/Notifications.svelte';
  import TextUI from './features/textui/TextUI.svelte';
  import Progressbar from './features/progress/Progressbar.svelte';
  import CircleProgressbar from './features/progress/CircleProgressbar.svelte';

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

<!--
  Still to mount:
    Phase 2  AlertDialog, ContextMenu, InputDialog
    Phase 3  ListMenu, RadialMenu
    Phase 4  SkillCheck
    Phase 5  Dev panel (browser only)
-->
