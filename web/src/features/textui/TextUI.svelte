<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent } from '../../lib/nui';
  import { renderMarkdown } from '../../lib/markdown';
  import { scaleFade, scaleFadeOut } from '../../lib/transitions';
  import { inlineStyle } from '../../lib/style';
  import Icon from '../../lib/Icon.svelte';
  import type { TextUiProps } from '../../typings';

  let visible = $state(false);
  let data = $state<TextUiProps>({ text: '', position: 'right-center' });

  const offShow = onNuiEvent<TextUiProps>('textUi', (payload) => {
    data = { ...payload, position: payload.position ?? 'right-center' };
    visible = true;
  });

  const offHide = onNuiEvent('textUiHide', () => {
    visible = false;
  });

  onDestroy(() => {
    offShow();
    offHide();
  });

  const inline = $derived(inlineStyle(data.style));
</script>

<div class="wrapper {data.position ?? 'right-center'}">
  {#if visible}
    <div class="panel" style={inline} in:scaleFade out:scaleFadeOut>
      {#if data.icon}
        <Icon
          icon={data.icon}
          animation={data.iconAnimation}
          color={data.iconColor}
          size="18px"
          class={data.alignIcon === 'top' ? 'align-top' : 'align-center'}
        />
      {/if}
      <div class="text">{@html renderMarkdown(data.text)}</div>
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: absolute;
    inset: 0;
    display: flex;
    pointer-events: none;
  }

  /* Four positions, matching TextUiPosition. The name reads axis-second ('right-center'
     is centred vertically on the right edge), which is the opposite order to the
     notification positions — kept as-is because it is the public API. */
  .top-center {
    align-items: flex-start;
    justify-content: center;
  }
  .bottom-center {
    align-items: flex-end;
    justify-content: center;
  }
  .right-center {
    align-items: center;
    justify-content: flex-end;
  }
  .left-center {
    align-items: center;
    justify-content: flex-start;
  }

  .panel {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: var(--text-base);
    padding: 12px;
    margin: 8px;
    /* Ambient tier: this is drawn over live gameplay, never over a dimmed scene. See the
       ambient block in theme/tokens.css -- a white edge so it does not vanish into a night
       sky, and a 10px shadow so it does not smear across daylight concrete. The inset glass
       highlight goes with the focused tier; the white border already does that lifting. */
    background: var(--surface-ambient);
    border: 1px solid var(--border-ambient);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-ambient);
    color: var(--color-white);
  }

  .container :global(.align-top) {
    align-self: flex-start;
  }
  .container :global(.align-center) {
    align-self: center;
  }

  .text :global(p) {
    margin: 0;
  }
  .text :global(p + p) {
    margin-top: 4px;
  }
  .text :global(code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--color-surface-2);
    padding: 0.1em 0.35em;
    border-radius: var(--radius-sm);
  }
  /* GFM tables show up in textUI often enough to be worth styling. */
  .text :global(table) {
    border-collapse: collapse;
  }
  .text :global(th),
  .text :global(td) {
    border: 1px solid var(--color-border);
    padding: 2px 8px;
    text-align: left;
  }
</style>
