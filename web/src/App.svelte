<script lang="ts">
  import { onMount } from 'svelte';
  import { onNuiEvent } from './lib/nui';
  import { initShell } from './lib/stores.svelte';
  import { setClipboard } from './utils/setClipboard';

  // Feature components mount here as each phase lands. The React App.tsx rendered all
  // nine unconditionally and let each one decide whether it was visible; same approach,
  // since every feature is driven by its own NUI action.
  onMount(() => {
    const offShell = initShell();
    const offClipboard = onNuiEvent<string>('setClipboard', setClipboard);

    return () => {
      offShell();
      offClipboard();
    };
  });
</script>

<!--
  Phase 0: shell only. Still to mount, in order:
    Phase 1  Notifications, TextUI, Progressbar, CircleProgressbar
    Phase 2  AlertDialog, ContextMenu, InputDialog
    Phase 3  ListMenu, RadialMenu
    Phase 4  SkillCheck
    Phase 5  Dev panel (browser only)
-->
