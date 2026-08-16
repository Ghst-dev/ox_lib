/**
 * Icon and style types shared by the typings.
 *
 * These originally came from `components/LibIcon.tsx` (the React FontAwesome wrapper),
 * `@mantine/core` and `react`. The React bindings went first; FontAwesome itself has now
 * gone too, replaced by Lucide (see lib/icons.ts). The *types* remain part of ox_lib's
 * public API — consumers pass `icon = 'car'` and `iconAnimation = 'spin'` from Lua — so
 * they are preserved, with `IconProp` declared here rather than imported.
 */

import { resolveIcon, type IconNode } from './icons';

export type { IconNode };

/**
 * What Lua may send where an icon is expected.
 *
 * FontAwesome's own `IconProp` was a union of ~2000 string literals, which is the only
 * reason the typings needed to import from it. Since the value is runtime data crossing
 * the NUI boundary, that union never constrained anything a consumer could get wrong at
 * compile time — it only coupled every typing file to the icon library.
 *
 * The shapes accepted are unchanged: a bare name, a `[prefix, name]` pair, or the
 * `{ prefix, iconName }` table ox_lib documents. Class strings ('fa-solid fa-car') also
 * arrive in practice and are handled by normaliseIconName.
 */
export type IconProp = string | [string, string] | { prefix?: string; iconName: string };

/**
 * Drawable geometry for an icon, for use *inside* an existing SVG.
 *
 * The radial menu draws its icons as children of one big <svg>, where Icon.svelte's
 * wrapping <span> cannot go.
 *
 * This replaces `getIconPath`, which returned a single `d` string because a FontAwesome
 * icon is one filled path. A Lucide icon is a list of stroked elements over a 24 unit box,
 * so callers must iterate and must colour via `stroke`, not `fill`.
 */
export function getIconNodes(icon: IconProp | string): IconNode | null {
  return resolveIcon(icon);
}

/**
 * The nine animations LibIcon exposed. Names are unchanged, and they remain part of the
 * Lua-facing API.
 *
 * These used to be FontAwesome utility classes, with the keyframes supplied by
 * `@fortawesome/fontawesome-svg-core/styles.css`. That stylesheet went with the dependency,
 * so Icon.svelte now defines the keyframes itself.
 */
export type IconAnimation =
  | 'spin'
  | 'spinPulse'
  | 'spinReverse'
  | 'pulse'
  | 'beat'
  | 'fade'
  | 'beatFade'
  | 'bounce'
  | 'shake';

/**
 * A style table sent from Lua. ox_lib documents these as CSS-in-JS, so keys arrive
 * camelCased (`backgroundColor`, not `background-color`) — they were fed straight to
 * React/Mantine. Replaces Mantine's `Sx` and `React.CSSProperties`.
 */
export type StyleObject = Record<string, string | number>;
