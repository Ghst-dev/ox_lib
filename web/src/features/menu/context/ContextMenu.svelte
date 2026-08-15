<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../../lib/nui';
  import { renderMarkdown } from '../../../lib/markdown';
  import { scaleFade, scaleFadeOut } from '../../../lib/transitions';
  import ContextButton from './ContextButton.svelte';
  import HeaderButton from './HeaderButton.svelte';
  import type { ContextMenuProps } from '../../../typings';

  let visible = $state(false);
  let menu = $state<ContextMenuProps>({ title: '', options: {} });

  const entries = $derived(Object.entries(menu.options ?? {}));

  function closeContext() {
    // canClose === false makes the menu sticky: no Escape, no close button.
    if (menu.canClose === false) return;
    visible = false;
    fetchNui('closeContext');
  }

  /** `back: true` lets context.lua fire the menu's onBack handler before reopening. */
  function goBack() {
    fetchNui('openContext', { id: menu.menu, back: true });
  }

  const offShow = onNuiEvent<ContextMenuProps>('showContext', async (data) => {
    // Swapping straight to a submenu would cut the exit transition; the React build
    // waited 100ms between hiding the old menu and showing the new one.
    if (visible) {
      visible = false;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    menu = data;
    visible = true;
  });

  const offHide = onNuiEvent('hideContext', () => {
    visible = false;
  });

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && visible) closeContext();
  }

  onDestroy(() => {
    offShow();
    offHide();
  });
</script>

<svelte:window onkeydown={onKey} />

<div class="anchor">
  {#if visible}
    <div class="menu" role="menu" tabindex="-1" in:scaleFade out:scaleFadeOut>
      <div class="header">
        {#if menu.menu}
          <HeaderButton icon="chevron-left" iconSize="16px" onclick={goBack} />
        {/if}
        <div class="title-box">
          <div class="title">{@html renderMarkdown(menu.title)}</div>
        </div>
        <HeaderButton
          icon="xmark"
          iconSize="18px"
          canClose={menu.canClose}
          onclick={closeContext}
        />
      </div>

      <div class="options">
        {#each entries as entry (entry[0])}
          <ContextButton {entry} />
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  /* Fixed placement carried over from the React build so muscle memory survives. */
  .anchor {
    position: absolute;
    top: 15%;
    right: 25%;
    width: 320px;
    height: 580px;
  }

  .menu {
    display: flex;
    flex-direction: column;
    height: 100%;
    pointer-events: auto;
  }

  .header {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 6px;
    margin-bottom: 10px;
  }

  .title-box {
    flex: 1 85%;
    background: var(--surface-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    box-shadow: inset 0 1px 0 var(--edge-highlight);
  }

  .title {
    padding: 6px;
    text-align: center;
    color: var(--color-white);
  }
  .title :global(p) {
    margin: 0;
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 3px;
    flex: 1;
    overflow-y: auto;
    /* No overflow-x escape hatch is possible here: per the CSS overflow spec, giving one
       axis a non-visible value computes the other to auto as well. That is why the
       metadata hover cards are positioned fixed against a measured rect rather than
       absolutely inside the row — otherwise this scroller would clip them. */
  }
</style>
