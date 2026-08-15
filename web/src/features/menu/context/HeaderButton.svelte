<script lang="ts">
  import Icon from '../../../lib/Icon.svelte';
  import type { IconProp } from '../../../lib/icon';

  let {
    icon,
    canClose,
    iconSize = '16px',
    onclick,
  }: {
    icon: IconProp | string;
    canClose?: boolean;
    iconSize?: string;
    onclick: () => void;
  } = $props();

  // `canClose === false` disables the close button rather than hiding it, so the menu
  // still looks the same shape — matching the React HeaderButton.
  const disabled = $derived(canClose === false);
</script>

<button class="header-btn" class:disabled {disabled} {onclick} aria-label="menu action">
  <Icon {icon} size={iconSize} />
</button>

<style>
  .header-btn {
    display: grid;
    place-items: center;
    flex: 1 15%;
    align-self: stretch;
    padding: 2px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--surface-panel);
    color: var(--color-white);
    transition:
      opacity var(--dur-base) var(--ease-out),
      border-color var(--dur-fast) var(--ease-out);
  }

  .header-btn:hover:not(.disabled) {
    opacity: 0.88;
    border-color: var(--primary-glow-border);
  }

  .header-btn.disabled {
    color: var(--color-dim);
    cursor: unset;
  }
</style>
