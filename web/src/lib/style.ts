import type { StyleObject } from './icon';

/**
 * Turn a Lua-supplied style table into an inline style string.
 *
 * Keys arrive camelCased because they were written for React/Mantine, so they are
 * converted to CSS casing here.
 *
 * Nested values are dropped. Mantine's `Sx` allowed a selector as a key —
 * `{ '.description': { color: 'red' } }` — which has no inline-style equivalent;
 * emitting it would produce `.description:[object Object]`. Anything a consumer passes
 * in that form silently has no effect, which is a real (if narrow) behaviour difference
 * from the React build.
 */
export function inlineStyle(style?: StyleObject): string {
  if (!style) return '';

  return Object.entries(style)
    .filter(([, value]) => typeof value === 'string' || typeof value === 'number')
    .map(([key, value]) => `${key.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${value}`)
    .join(';');
}
