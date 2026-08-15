<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../lib/nui';
  import { renderMarkdown } from '../../lib/markdown';
  import { scaleFade, scaleFadeOut } from '../../lib/transitions';
  import { locale } from '../../lib/stores.svelte';
  import type { AlertProps } from '../../typings';

  let opened = $state(false);
  let data = $state<AlertProps>({ header: '', content: '' });

  // Mantine's modal size scale, which is what the `size` field refers to.
  const SIZES: Record<string, string> = {
    xs: '320px',
    sm: '380px',
    md: '440px',
    lg: '620px',
    xl: '780px',
  };

  /** Resolves lib.alertDialog's promise with 'cancel' | 'confirm'. */
  function close(button: 'cancel' | 'confirm') {
    opened = false;
    fetchNui('closeAlert', button);
  }

  const offOpen = onNuiEvent<AlertProps>('sendAlert', (payload) => {
    data = payload;
    opened = true;
  });

  // lib.closeAlertDialog() closes the window from Lua and settles the promise there, so
  // this path must NOT post closeAlert back or the promise resolves twice.
  const offClose = onNuiEvent('closeAlertDialog', () => {
    opened = false;
  });

  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape' && opened) close('cancel');
  }

  onDestroy(() => {
    offOpen();
    offClose();
  });
</script>

<svelte:window onkeydown={onKey} />

{#if opened}
  <!-- Clicking the backdrop deliberately does nothing: the React modal set
       closeOnClickOutside={false}, so the only ways out are the buttons or Escape. -->
  <div class="scrim" class:centered={data.centered} in:scaleFade out:scaleFadeOut>
    <div class="dialog" role="dialog" aria-modal="true" style:width={SIZES[data.size ?? 'md']}>
      <h2 class="header">{@html renderMarkdown(data.header)}</h2>

      <div class="content" class:scroll={data.overflow}>
        {@html renderMarkdown(data.content)}
      </div>

      <div class="actions">
        {#if data.cancel}
          <button class="btn" onclick={() => close('cancel')}>
            {data.labels?.cancel || locale.ui.cancel}
          </button>
        {/if}
        <button class="btn" class:primary={data.cancel} onclick={() => close('confirm')}>
          {data.labels?.confirm || locale.ui.confirm}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 5vh 16px;
    background: var(--scrim);
    pointer-events: auto;
  }
  .scrim.centered {
    align-items: center;
  }

  .dialog {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 100%;
    max-height: 90vh;
    padding: 20px;
    background: var(--surface-panel);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: inset 0 1px 0 var(--edge-highlight), var(--shadow-panel);
    color: var(--color-white);
  }

  .header {
    font-size: var(--text-subheading);
    font-weight: 600;
    line-height: var(--leading-heading);
  }
  .header :global(p) {
    margin: 0;
  }

  .content {
    color: var(--color-gray);
    line-height: var(--leading-body);
  }
  /* `overflow` picks whether the body scrolls inside the dialog or the dialog grows. */
  .content.scroll {
    overflow-y: auto;
  }
  .content :global(p) {
    margin: 0;
  }
  .content :global(p + p),
  .content :global(ul),
  .content :global(table) {
    margin-top: 8px;
  }
  .content :global(img) {
    max-width: 100%;
    max-height: 100%;
  }
  .content :global(a) {
    color: var(--color-primary);
  }
  .content :global(code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--color-surface-2);
    padding: 0.1em 0.35em;
    border-radius: var(--radius-sm);
  }
  .content :global(table) {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);
  }
  .content :global(th),
  .content :global(td) {
    border: 1px solid var(--color-border);
    padding: 4px 8px;
    text-align: left;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .btn {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: var(--color-surface-2);
    color: var(--color-white);
    font-size: var(--text-sm);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
    transition:
      opacity var(--dur-base) var(--ease-out),
      transform var(--dur-base) var(--ease-out);
  }
  .btn:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }
  .btn:active {
    transform: translateY(0);
  }

  /* Only highlighted when there is a cancel button to distinguish it from. The tint is
     composited over .btn's surface rather than replacing it — replacing left the
     confirm button more transparent than the cancel beside it. */
  .btn.primary {
    background: color-mix(in srgb, var(--color-primary) 14%, var(--color-surface-2));
    border-color: var(--primary-glow-border);
    color: var(--color-primary);
  }
</style>
