<script lang="ts">
  import { parseColor, formatColor, toCss, type ColorFormat, type Hsva } from './color';

  /**
   * Replaces <input type="color">, which delegates to an OS colour chooser — a dialog
   * that has nowhere to draw over a fullscreen game, so the field was effectively dead
   * in CEF. This is a self-contained saturation/hue/alpha picker that also honours the
   * row's `format`, which the native control could never do (it is hex-only).
   */

  let {
    value = $bindable(),
    format = 'hex',
    disabled = false,
    id,
  }: {
    value: string | undefined;
    format?: ColorFormat;
    disabled?: boolean;
    id?: string;
  } = $props();

  const withAlpha = $derived(format === 'hexa' || format === 'rgba' || format === 'hsla');

  // hsva is the source of truth while the picker is open. `value` is written from it, not
  // read back into it, so dragging cannot fight its own formatted output.
  let hsva = $state<Hsva>(parseColor(value));
  let open = $state(false);
  let anchor: HTMLDivElement;
  let popover = $state<HTMLDivElement | undefined>();
  let at = $state({ top: 0, left: 0 });
  // Seeded from `value` alone — referencing the `format` prop in a $state initialiser
  // would capture only its first value. An untouched field stays undefined, matching the
  // other optional row types.
  let text = $state(value ?? '');

  function commit() {
    value = formatColor(hsva, format);
    text = value;
  }

  function openPicker() {
    if (disabled) return;

    // Fixed against a measured rect: the dialog's rows are a scroll container, and a
    // scroll container clips on both axes whatever overflow-x says.
    const rect = anchor.getBoundingClientRect();
    at = { top: rect.bottom + 6, left: rect.left };
    hsva = parseColor(value);
    open = !open;
  }

  /**
   * Saturation/value pad — x is saturation, y is value (inverted).
   *
   * Move and release are tracked on the window rather than the pad, so a drag keeps
   * working once the cursor leaves the pad and simply clamps at the edges. That is what
   * anyone expects from a colour picker; pad-scoped listeners drop the drag the moment
   * you overshoot.
   */
  function dragPad(event: PointerEvent) {
    const pad = event.currentTarget as HTMLDivElement;
    const rect = pad.getBoundingClientRect();

    const apply = (e: PointerEvent) => {
      hsva.s = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      hsva.v = 1 - Math.min(Math.max((e.clientY - rect.top) / rect.height, 0), 1);
      commit();
    };

    apply(event);

    const move = (e: PointerEvent) => apply(e);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  }

  function onText(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    text = next;
    hsva = parseColor(next);
    value = formatColor(hsva, format);
  }

  const swatch = $derived(toCss(hsva));
</script>

<!--
  The popover is rendered outside the anchor (fixed, so the dialog's scroller cannot clip
  it), so it has to be excluded from the outside-click test explicitly. Testing the anchor
  alone treated every press on the pad as a press outside and shut the picker before a
  drag could start.
-->
<svelte:window
  onpointerdown={(e) => {
    if (!open) return;
    const target = e.target as Node;
    if (anchor?.contains(target) || popover?.contains(target)) return;
    open = false;
  }}
/>

<div class="color-field" bind:this={anchor}>
  <button
    class="swatch-btn"
    type="button"
    {disabled}
    onclick={openPicker}
    aria-label="Pick a colour"
  >
    <span class="swatch" style:background={swatch} style:opacity={hsva.a}></span>
  </button>
  <input {id} class="text" value={text} oninput={onText} {disabled} spellcheck="false" />
</div>

{#if open}
  <div class="popover" bind:this={popover} style:top="{at.top}px" style:left="{at.left}px">
    <div
      class="pad"
      style:background="linear-gradient(to top, #000, transparent),
        linear-gradient(to right, #fff, hsl({hsva.h} 100% 50%))"
      onpointerdown={dragPad}
      role="slider"
      tabindex="0"
      aria-label="Saturation and brightness"
      aria-valuenow={Math.round(hsva.s * 100)}
    >
      <span class="thumb" style:left="{hsva.s * 100}%" style:top="{(1 - hsva.v) * 100}%"></span>
    </div>

    <input
      class="slider hue"
      type="range"
      min="0"
      max="360"
      step="1"
      bind:value={hsva.h}
      oninput={commit}
      aria-label="Hue"
    />

    {#if withAlpha}
      <input
        class="slider alpha"
        type="range"
        min="0"
        max="1"
        step="0.01"
        style:--solid={swatch}
        bind:value={hsva.a}
        oninput={commit}
        aria-label="Alpha"
      />
    {/if}
  </div>
{/if}

<style>
  .color-field {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .swatch-btn {
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    flex: none;
    padding: 4px;
    background: var(--surface-sunken);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  .swatch-btn:disabled {
    opacity: 0.5;
  }

  .swatch {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: 3px;
  }

  .text {
    flex: 1;
    min-width: 0;
    padding: 8px 12px;
    background: var(--surface-sunken);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-white);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }
  .text:focus {
    border-color: rgba(34, 211, 238, 0.5);
    box-shadow: var(--ring-accent);
    outline: none;
  }

  .popover {
    position: fixed;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 220px;
    padding: 10px;
    background: var(--surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-panel);
  }

  .pad {
    position: relative;
    height: 130px;
    border-radius: var(--radius-sm);
    cursor: crosshair;
    touch-action: none;
  }

  .thumb {
    position: absolute;
    width: 12px;
    height: 12px;
    margin: -6px 0 0 -6px;
    border: 2px solid #fff;
    border-radius: var(--radius-full);
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }

  .slider {
    width: 100%;
    height: 12px;
    appearance: none;
    border-radius: var(--radius-full);
    outline: none;
  }

  .hue {
    background: linear-gradient(
      to right,
      #f00 0%,
      #ff0 17%,
      #0f0 33%,
      #0ff 50%,
      #00f 67%,
      #f0f 83%,
      #f00 100%
    );
  }

  /* Checkerboard under a transparent-to-solid ramp, so alpha reads as alpha. */
  .alpha {
    background:
      linear-gradient(to right, transparent, var(--solid)),
      repeating-conic-gradient(#666 0% 25%, #999 0% 50%) 0 0 / 10px 10px;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    width: 14px;
    height: 14px;
    border: 2px solid #fff;
    border-radius: var(--radius-full);
    background: transparent;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.5);
    cursor: pointer;
  }
</style>
