import { cubicIn, cubicOut } from 'svelte/easing';
import type { TransitionConfig } from 'svelte/transition';

/**
 * The framer-motion ScaleFade the React build wrapped most surfaces in, as a Svelte
 * transition. Values are the originals: scale 0.95 -> 1 with opacity, 200ms easing out on
 * enter, 100ms easing in on exit.
 *
 * Use as separate in:/out: so each direction keeps its own duration and easing:
 *
 *   <div in:scaleFade out:scaleFade={{ duration: 100, easing: cubicIn }}>
 */
export function scaleFade(
  _node: Element,
  { duration = 200, start = 0.95, easing = cubicOut } = {},
): TransitionConfig {
  return {
    duration,
    easing,
    css: (t) => `opacity: ${t}; transform: scale(${start + (1 - start) * t});`,
  };
}

/** Exit half of the pair, so callers do not have to import an easing function. */
export function scaleFadeOut(node: Element, { duration = 100 } = {}): TransitionConfig {
  return scaleFade(node, { duration, easing: cubicIn });
}

/**
 * Notification enter/exit. Unlike ScaleFade these slide, and the direction depends on
 * which screen edge the toast is docked to — a top-right toast leaves to the right, a
 * bottom-centre one leaves downwards.
 */
export function notificationIn(
  _node: Element,
  { position = 'top-right' }: { position?: string } = {},
): TransitionConfig {
  const from = position.includes('bottom') ? 30 : -30;

  return {
    duration: 200,
    easing: cubicOut,
    css: (t) => `opacity: ${t}; transform: translateY(${(1 - t) * from}px);`,
  };
}

export function notificationOut(
  _node: Element,
  { position = 'top-right' }: { position?: string } = {},
): TransitionConfig {
  let axis: 'X' | 'Y' = 'X';
  let to = 100;

  if (position.includes('right')) {
    axis = 'X';
    to = 100;
  } else if (position.includes('left')) {
    axis = 'X';
    to = -100;
  } else if (position === 'top-center' || position === 'top') {
    axis = 'Y';
    to = -100;
  } else if (position === 'bottom-center' || position === 'bottom') {
    axis = 'Y';
    to = 100;
  }

  return {
    duration: 400,
    easing: cubicIn,
    css: (t) => `opacity: ${t}; transform: translate${axis}(${(1 - t) * to}%);`,
  };
}
