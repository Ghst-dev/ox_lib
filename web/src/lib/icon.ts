/**
 * Icon and style types shared by the typings.
 *
 * These used to come from `components/LibIcon.tsx` (the React FontAwesome wrapper),
 * `@mantine/core` and `react`. The React bindings are gone, but the *types* are part of
 * ox_lib's public API — consumers pass `icon = 'car'` and `iconAnimation = 'spin'` from
 * Lua — so they are preserved here verbatim.
 */

import { findIconDefinition, type IconProp } from '@fortawesome/fontawesome-svg-core';

export type { IconProp };

/**
 * Raw path data for an icon, for use *inside* an SVG.
 *
 * The radial menu draws its icons as children of one big <svg>, where Icon.svelte's
 * wrapping <span> cannot go. This pulls the geometry straight out of the registered
 * definition instead: `def.icon` is [width, height, ligatures, unicode, pathData].
 */
export function getIconPath(
  icon: IconProp | string,
): { width: number; height: number; path: string } | null {
  const lookup =
    typeof icon === 'string'
      ? { prefix: 'fas' as const, iconName: icon as any }
      : Array.isArray(icon)
        ? { prefix: icon[0] as any, iconName: icon[1] as any }
        : (icon as any);

  const def = findIconDefinition(lookup);
  if (!def) return null;

  const [width, height, , , path] = def.icon;

  return {
    width,
    height,
    // Duotone icons carry two paths; the last is the primary layer.
    path: Array.isArray(path) ? path[path.length - 1] : path,
  };
}

/** The nine FontAwesome animations LibIcon exposed. Names are unchanged. */
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
