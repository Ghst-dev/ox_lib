/**
 * Icon and style types shared by the typings.
 *
 * These used to come from `components/LibIcon.tsx` (the React FontAwesome wrapper),
 * `@mantine/core` and `react`. The React bindings are gone, but the *types* are part of
 * ox_lib's public API — consumers pass `icon = 'car'` and `iconAnimation = 'spin'` from
 * Lua — so they are preserved here verbatim.
 */

import type { IconProp } from '@fortawesome/fontawesome-svg-core';

export type { IconProp };

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
