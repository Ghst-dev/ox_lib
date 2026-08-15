/**
 * Date/time conversions for InputDialog.
 *
 * The wire format for `date`, `date-range` and `time` rows is a **millisecond
 * timestamp** (an array of two for a range), not a Date or a string — Mantine's pickers
 * were wrapped specifically to convert on the way in and out. Native inputs speak
 * `YYYY-MM-DD` and `HH:mm`, so the same conversion happens here.
 *
 * Everything is local-time on purpose. `new Date('2026-08-15')` parses as UTC midnight,
 * which lands on the previous day for anyone west of Greenwich; building the Date from
 * parts avoids that.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** ms timestamp -> `YYYY-MM-DD` for <input type="date">. */
export function toDateInput(ts?: number | null): string {
  if (ts === undefined || ts === null || Number.isNaN(ts)) return '';
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** `YYYY-MM-DD` -> ms timestamp at local midnight. */
export function fromDateInput(value: string): number | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).getTime();
}

/** ms timestamp -> `HH:mm` for <input type="time">. */
export function toTimeInput(ts?: number | null): string {
  if (ts === undefined || ts === null || Number.isNaN(ts)) return '';
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * `HH:mm` -> ms timestamp. A time on its own has no date, so it is anchored to today —
 * which is what the Mantine TimeInput did with its internal Date.
 */
export function fromTimeInput(value: string): number | null {
  if (!value) return null;
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m).getTime();
}
