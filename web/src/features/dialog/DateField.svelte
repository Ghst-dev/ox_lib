<script lang="ts">
  import dayjs from 'dayjs';
  import Icon from '../../lib/Icon.svelte';
  import Calendar from './Calendar.svelte';

  /**
   * Replaces <input type="date">. The native control cannot be themed, and `date-range`
   * has no native equivalent at all — it was two inputs sitting next to each other.
   *
   * The wire format is unchanged: a millisecond timestamp, or a pair of them for a range.
   */

  let {
    value = $bindable(),
    range = false,
    format = 'DD/MM/YYYY',
    min,
    max,
    clearable = false,
    disabled = false,
    id,
  }: {
    value: any;
    range?: boolean;
    format?: string;
    min?: string;
    max?: string;
    clearable?: boolean;
    disabled?: boolean;
    id?: string;
  } = $props();

  let open = $state(false);
  let anchor: HTMLDivElement;
  let popover = $state<HTMLDivElement | undefined>();
  let at = $state({ top: 0, left: 0 });
  let focusMonth = $state(Date.now());

  const start = $derived(range && Array.isArray(value) ? value[0] : null);
  const end = $derived(range && Array.isArray(value) ? value[1] : null);

  const label = $derived.by(() => {
    const fmt = (ts?: number | null) => (ts ? dayjs(ts).format(format) : '');

    if (range) {
      if (!start && !end) return '';
      return `${fmt(start)} – ${fmt(end)}`;
    }

    return typeof value === 'number' ? fmt(value) : '';
  });

  function toggle() {
    if (disabled) return;

    // Fixed against a measured rect, like the colour picker — the dialog's row list is a
    // scroll container and would otherwise clip the calendar.
    const rect = anchor.getBoundingClientRect();
    at = { top: rect.bottom + 6, left: rect.left };
    focusMonth = (range ? start : value) || Date.now();
    open = !open;
  }

  function pick(ts: number) {
    if (!range) {
      value = ts;
      open = false;
      return;
    }

    // First click starts a new range; the second closes it, ordered so the earlier date is
    // always first regardless of which end was clicked.
    if (start == null || end != null) {
      value = [ts, null];
      return;
    }

    value = ts < start ? [ts, start] : [start, ts];
    open = false;
  }

  function clear(event: MouseEvent) {
    event.stopPropagation();
    value = range ? [null, null] : undefined;
  }
</script>

<svelte:window
  onpointerdown={(e) => {
    if (!open) return;
    const target = e.target as Node;
    if (anchor?.contains(target) || popover?.contains(target)) return;
    open = false;
  }}
/>

<div class="date-field" bind:this={anchor}>
  <button {id} type="button" class="trigger" {disabled} onclick={toggle}>
    <Icon icon="calendar" size="13px" />
    <span class="label" class:placeholder={!label}>{label || format}</span>
    {#if clearable && label}
      <span
        class="clear"
        role="button"
        tabindex="0"
        aria-label="Clear"
        onclick={clear}
        onkeydown={(e) => e.key === 'Enter' && clear(e as unknown as MouseEvent)}
      >
        <Icon icon="xmark" size="11px" />
      </span>
    {/if}
  </button>
</div>

{#if open}
  <div class="popover" bind:this={popover} style:top="{at.top}px" style:left="{at.left}px">
    <Calendar
      bind:focus={focusMonth}
      selected={range ? null : (value ?? null)}
      rangeStart={start}
      rangeEnd={end}
      min={min ? new Date(min).getTime() : null}
      max={max ? new Date(max).getTime() : null}
      onpick={pick}
    />
  </div>
{/if}

<style>
  .date-field {
    width: 100%;
  }

  .trigger {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 12px;
    min-height: 34px;
    background: var(--surface-sunken);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-white);
    font-size: var(--text-sm);
    text-align: left;
    transition: border-color var(--dur-fast) var(--ease-out);
  }
  .trigger:hover:not(:disabled) {
    border-color: var(--color-border-strong, var(--color-border));
  }
  .trigger:disabled {
    opacity: 0.5;
  }

  .label {
    flex: 1;
    font-variant-numeric: tabular-nums;
  }
  .placeholder {
    color: var(--color-dim);
  }

  .clear {
    display: grid;
    place-items: center;
    color: var(--color-dim);
  }
  .clear:hover {
    color: var(--color-white);
  }

  .popover {
    position: fixed;
    z-index: 200;
    padding: 10px;
    background: var(--surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-panel);
  }
</style>
