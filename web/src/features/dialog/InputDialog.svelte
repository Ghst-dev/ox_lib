<script lang="ts">
  import { onDestroy } from 'svelte';
  import dayjs from 'dayjs';
  import { onNuiEvent, fetchNui } from '../../lib/nui';
  import { scaleFade, scaleFadeOut } from '../../lib/transitions';
  import { locale } from '../../lib/stores.svelte';
  import InputRow from './InputRow.svelte';
  import type { InputProps } from '../../typings';

  const SIZES: Record<string, string> = {
    xs: '320px',
    sm: '380px',
    md: '440px',
    lg: '620px',
    xl: '780px',
  };

  let visible = $state(false);
  let fields = $state<InputProps>({ heading: '', rows: [] });
  let values = $state<any[]>([]);
  let invalid = $state<boolean[]>([]);
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Mirrors the defaults the React build seeded its field array with. Note that date,
   * date-range and time all carry **timestamps**, and `default: true` means "now".
   */
  function initialValue(row: any) {
    if (row.type === 'checkbox') return row.checked ?? false;

    if (row.type === 'date' || row.type === 'date-range' || row.type === 'time') {
      if (row.default === true) return Date.now();
      if (Array.isArray(row.default)) return row.default.map((d: string) => new Date(d).getTime());
      return row.default ? new Date(row.default).getTime() : undefined;
    }

    if (row.type === 'slider') return row.default ?? row.min ?? 0;
    if (row.type === 'multi-select') return row.default ?? [];

    // Text rows start as '' rather than undefined so an untouched optional field comes
    // back as an empty string, which is what react-hook-form's register produced. Leaving
    // it undefined would serialise to null and reach Lua as nil instead.
    if (row.type === 'input' || row.type === 'textarea') return row.default ?? '';

    return row.default;
  }

  function isEmpty(value: any) {
    if (value === undefined || value === null || value === '') return true;
    if (Array.isArray(value)) return value.length === 0 || value.every((v) => v === null);
    return false;
  }

  const offOpen = onNuiEvent<InputProps>('openDialog', (data) => {
    clearTimeout(closeTimer);
    fields = data;
    values = data.rows.map(initialValue);
    invalid = data.rows.map(() => false);
    visible = true;
  });

  // Lua closed the dialog itself and already resolved the promise with nil, so this path
  // must not post inputData back.
  const offClose = onNuiEvent('closeInputDialog', () => close(true));

  /**
   * The 200ms delay is not cosmetic: it lets the exit transition finish before the
   * payload goes back, which is what the React build did. Posting immediately would tear
   * the dialog down mid-animation.
   */
  function close(dontPost = false) {
    visible = false;
    clearTimeout(closeTimer);

    closeTimer = setTimeout(() => {
      if (!dontPost) fetchNui('inputData');
    }, 200);
  }

  function submit(event: Event) {
    event.preventDefault();

    invalid = fields.rows.map((row: any, i: number) => !!row.required && isEmpty(values[i]));
    if (invalid.some(Boolean)) return;

    const payload = fields.rows.map((row: any, i: number) => {
      const value = values[i];

      // returnString swaps the timestamp for a formatted string, using the row's dayjs
      // format. This is why dayjs is still a dependency.
      if ((row.type === 'date' || row.type === 'date-range') && row.returnString) {
        if (value === undefined || value === null) return value;
        const fmt = row.format || 'DD/MM/YYYY';
        return Array.isArray(value)
          ? value.map((v: number | null) => (v ? dayjs(v).format(fmt) : v))
          : dayjs(value).format(fmt);
      }

      return value;
    });

    visible = false;
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => fetchNui('inputData', payload), 200);
  }

  function onKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !visible) return;
    if (fields.options?.allowCancel === false) return;
    close();
  }

  onDestroy(() => {
    offOpen();
    offClose();
    clearTimeout(closeTimer);
  });
</script>

<svelte:window onkeydown={onKey} />

{#if visible}
  <div class="scrim" in:scaleFade out:scaleFadeOut>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      style:width={SIZES[fields.options?.size ?? 'xs']}
    >
      <!-- The form carries display:contents so the dialog's own flex layout still applies
           to the heading/rows/actions. Keeping role="dialog" off the form avoids giving a
           non-interactive element an interactive role. -->
      <form onsubmit={submit}>
        <h2 class="heading">{fields.heading}</h2>

        <div class="rows">
          {#each fields.rows as row, i}
            <InputRow {row} bind:value={values[i]} invalid={invalid[i]} />
          {/each}
        </div>

        <div class="actions">
          <button
            type="button"
            class="btn"
            disabled={fields.options?.allowCancel === false}
            onclick={() => close()}
          >
            {locale.ui.cancel}
          </button>
          <button type="submit" class="btn primary">{locale.ui.confirm}</button>
        </div>
      </form>
    </div>
  </div>
{/if}

<style>
  .scrim {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 5vh 16px;
    background: var(--scrim);
    pointer-events: auto;
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

  form {
    display: contents;
  }

  .heading {
    font-size: var(--text-subheading);
    font-weight: 600;
    text-align: center;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 14px;
    overflow-y: auto;
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
  .btn:hover:not(:disabled) {
    opacity: 0.88;
    transform: translateY(-1px);
  }
  .btn:active:not(:disabled) {
    transform: translateY(0);
  }
  .btn:disabled {
    opacity: 0.4;
  }

  .btn.primary {
    background: var(--primary-glow);
    border-color: var(--primary-glow-border);
    color: var(--color-primary);
  }
</style>
