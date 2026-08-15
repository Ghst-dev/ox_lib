<script lang="ts">
  import { fetchNui } from '../../../lib/nui';
  import { renderMarkdown } from '../../../lib/markdown';
  import Icon from '../../../lib/Icon.svelte';
  import { isIconUrl } from '../../../utils/isIconUrl';
  import type { Option } from '../../../typings';

  let { entry }: { entry: [string, Option] } = $props();

  const key = $derived(entry[0]);
  const button = $derived(entry[1]);

  /**
   * The key is sent back verbatim. context.lua turns a numeric key into a 1-based Lua
   * index (`id += 1`) and leaves string keys alone, so the raw Object.entries key is
   * exactly what it expects — do not coerce it here.
   */
  function activate() {
    if (button.disabled || button.readOnly) return;

    if (button.menu) {
      fetchNui('openContext', { id: button.menu, back: false });
      return;
    }

    fetchNui('clickContext', key);
  }

  // An array-shaped options table gives numeric keys; those have no meaningful title to
  // fall back on, so a titleless entry in an array renders description-only.
  const showTitle = $derived(!!button.title || Number.isNaN(Number(key)));
  const arrow = $derived((button.menu || button.arrow) && button.arrow !== false);
  const hasHover = $derived(!button.disabled && !!(button.metadata || button.image));

  const metadataList = $derived.by(() => {
    const meta = button.metadata;
    if (!meta) return [];

    if (Array.isArray(meta)) {
      return meta.map((item: any) =>
        typeof item === 'string'
          ? { label: item, value: undefined, progress: undefined, colorScheme: undefined }
          : {
              label: item.label,
              value: item.value ?? '',
              progress: item.progress,
              colorScheme: item.colorScheme,
            },
      );
    }

    return Object.entries(meta).map(([label, value]) => ({
      label,
      value,
      progress: undefined,
      colorScheme: undefined,
    }));
  });

  let hovered = $state(false);
  let hoverAt = $state({ top: 0, left: 0 });
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let rowEl: HTMLDivElement;

  function openHover() {
    if (!hasHover) return;

    // 200ms delay, as the Mantine HoverCard had — without it, dragging the cursor down a
    // long menu flashes a card for every row it crosses.
    hoverTimer = setTimeout(() => {
      // Measured and positioned fixed rather than absolute: the options list is a
      // scroll container, and a scroll container clips on both axes regardless of what
      // overflow-x says, so an absolutely-positioned card would be cut off at the menu's
      // right edge.
      const rect = rowEl.getBoundingClientRect();
      hoverAt = { top: rect.top, left: rect.right + 8 };
      hovered = true;
    }, 200);
  }

  function closeHover() {
    clearTimeout(hoverTimer);
    hovered = false;
  }
</script>

<div
  class="row"
  role="none"
  bind:this={rowEl}
  onmouseenter={openHover}
  onmouseleave={closeHover}
>
  <button
    class="option"
    class:disabled={button.disabled}
    class:read-only={button.readOnly}
    disabled={button.disabled}
    onclick={activate}
  >
    <div class="body">
      {#if showTitle}
        <div class="title-row">
          {#if button.icon}
            <span class="icon-slot">
              {#if typeof button.icon === 'string' && isIconUrl(button.icon)}
                <img class="icon-image" src={button.icon} alt="" />
              {:else}
                <Icon
                  icon={button.icon}
                  color={button.iconColor}
                  animation={button.iconAnimation}
                  size="18px"
                />
              {/if}
            </span>
          {/if}
          <span class="title">{@html renderMarkdown(button.title || key)}</span>
        </div>
      {/if}

      {#if button.description}
        <div class="description">{@html renderMarkdown(button.description)}</div>
      {/if}

      {#if button.progress !== undefined}
        <div class="bar">
          <span
            style:width="{button.progress}%"
            style:background={button.colorScheme || 'var(--color-primary)'}
          ></span>
        </div>
      {/if}
    </div>

    {#if arrow}
      <span class="arrow"><Icon icon="chevron-right" size="14px" /></span>
    {/if}
  </button>

  {#if hovered}
    <div class="hover-card" style:top="{hoverAt.top}px" style:left="{hoverAt.left}px">
      {#if button.image}
        <img class="hover-image" src={button.image} alt="" />
      {/if}
      {#each metadataList as meta}
        <p class="meta">
          {meta.value !== undefined ? `${meta.label}: ${meta.value}` : meta.label}
        </p>
        {#if meta.progress !== undefined}
          <div class="bar">
            <span
              style:width="{meta.progress}%"
              style:background={meta.colorScheme || button.colorScheme || 'var(--color-primary)'}
            ></span>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
</div>

<style>
  .row {
    position: relative;
  }

  .option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    width: 100%;
    padding: 10px;
    text-align: left;
    background: var(--surface-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-white);
    transition:
      border-color var(--dur-fast) var(--ease-out),
      background var(--dur-fast) var(--ease-out);
  }

  /* Composited over the option's own surface, not substituted for it. --primary-glow is
     an 8%-alpha tint; assigning it to `background` throws away the 92%-opaque panel
     underneath and the game shows through the row you are pointing at. */
  .option:hover:not(.disabled):not(.read-only) {
    border-color: var(--primary-glow-border);
    background: color-mix(in srgb, var(--color-primary) 12%, var(--surface-panel));
  }

  .option.disabled {
    color: var(--color-dim);
  }

  /* readOnly rows are informational: they stay in the list and keep their styling, but
     do not respond to the cursor. */
  .option.read-only {
    cursor: unset;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .icon-slot {
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    flex: none;
  }

  .icon-image {
    max-width: 25px;
  }

  .title {
    overflow-wrap: break-word;
    min-width: 0;
  }
  .title :global(p) {
    margin: 0;
  }

  .description {
    font-size: var(--text-sm);
    color: var(--color-gray);
  }
  .option.disabled .description {
    color: var(--color-dim);
  }
  .description :global(p) {
    margin: 0;
  }

  .bar {
    height: 6px;
    border-radius: var(--radius-full);
    background: var(--color-surface-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
  }

  .arrow {
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    flex: none;
    color: var(--color-gray);
  }

  /* Metadata popover. Anchored to the row's right edge like Mantine's right-start, but
     positioned fixed against a measured rect so the options scroller cannot clip it. */
  .hover-card {
    position: fixed;
    z-index: 10;
    width: max-content;
    max-width: 256px;
    padding: 10px;
    background: var(--surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-panel);
    color: var(--color-white);
    font-size: var(--text-sm);
    pointer-events: none;
  }

  .hover-image {
    max-width: 100%;
    border-radius: var(--radius-sm);
    margin-bottom: 6px;
  }

  .meta {
    margin: 0;
  }
</style>
