<script lang="ts">
  import Icon from '../../lib/Icon.svelte';

  /**
   * Month grid used by DateField. Deliberately dumb: it renders a month and reports the
   * day that was picked, leaving single/range selection logic to the caller.
   *
   * All timestamps are local midnight, matching datetime.ts — parsing a date as UTC lands
   * on the previous day for anyone west of Greenwich.
   */

  let {
    focus = $bindable(),
    selected = null,
    rangeStart = null,
    rangeEnd = null,
    min,
    max,
    onpick,
  }: {
    /** Month currently displayed, as a timestamp anywhere inside it. */
    focus: number;
    selected?: number | null;
    rangeStart?: number | null;
    rangeEnd?: number | null;
    min?: number | null;
    max?: number | null;
    onpick: (ts: number) => void;
  } = $props();

  // Monday-first: this is a European server, and ox_lib ships no locale for week start.
  const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const startOfDay = (ts: number) => {
    const d = new Date(ts);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  };

  const view = $derived(new Date(focus));

  const grid = $derived.by(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);

    // getDay() is Sunday-based; shift so Monday is column 0.
    const lead = (first.getDay() + 6) % 7;
    const days: { ts: number; outside: boolean }[] = [];

    for (let i = 0; i < 42; i++) {
      const date = new Date(year, month, 1 - lead + i);
      days.push({ ts: date.getTime(), outside: date.getMonth() !== month });
    }

    return days;
  });

  const today = startOfDay(Date.now());

  function disabled(ts: number) {
    if (min != null && ts < startOfDay(min)) return true;
    if (max != null && ts > startOfDay(max)) return true;
    return false;
  }

  function inRange(ts: number) {
    if (rangeStart == null || rangeEnd == null) return false;
    const lo = Math.min(rangeStart, rangeEnd);
    const hi = Math.max(rangeStart, rangeEnd);
    return ts > lo && ts < hi;
  }

  const isEdge = (ts: number) =>
    ts === selected || ts === startOfDay(rangeStart ?? NaN) || ts === startOfDay(rangeEnd ?? NaN);

  function shiftMonth(delta: number) {
    focus = new Date(view.getFullYear(), view.getMonth() + delta, 1).getTime();
  }
</script>

<div class="calendar">
  <div class="nav">
    <button type="button" onclick={() => shiftMonth(-1)} aria-label="Previous month">
      <Icon icon="chevron-left" size="12px" />
    </button>
    <span class="month">{MONTHS[view.getMonth()]} {view.getFullYear()}</span>
    <button type="button" onclick={() => shiftMonth(1)} aria-label="Next month">
      <Icon icon="chevron-right" size="12px" />
    </button>
  </div>

  <div class="weekdays">
    {#each WEEKDAYS as day}<span>{day}</span>{/each}
  </div>

  <div class="days">
    {#each grid as cell (cell.ts)}
      <button
        type="button"
        class="day"
        class:outside={cell.outside}
        class:today={cell.ts === today}
        class:edge={isEdge(cell.ts)}
        class:between={inRange(cell.ts)}
        disabled={disabled(cell.ts)}
        onclick={() => onpick(cell.ts)}
      >
        {new Date(cell.ts).getDate()}
      </button>
    {/each}
  </div>
</div>

<style>
  .calendar {
    width: 232px;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .nav button {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-sm);
    color: var(--color-gray);
  }
  .nav button:hover {
    background: var(--color-surface-2);
    color: var(--color-white);
  }

  .month {
    font-size: var(--text-sm);
    font-weight: 500;
  }

  .weekdays,
  .days {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
  }

  .weekdays span {
    text-align: center;
    font-size: var(--text-meta);
    color: var(--color-dim);
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
    padding-bottom: 4px;
  }

  .day {
    height: 28px;
    border-radius: var(--radius-sm);
    font-size: var(--text-sm);
    color: var(--color-white);
    font-variant-numeric: tabular-nums;
  }
  .day:hover:not(:disabled) {
    background: var(--color-surface-2);
  }
  .day:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }

  .outside {
    color: var(--color-dim);
  }

  .today {
    box-shadow: inset 0 0 0 1px var(--color-border);
  }

  /* Both ends of a range, and the single selected day. */
  .edge {
    background: var(--color-primary);
    color: var(--color-bg);
    font-weight: 600;
  }
  .edge:hover:not(:disabled) {
    background: var(--color-primary);
  }

  .between {
    background: var(--primary-glow);
    border-radius: 0;
  }
</style>
