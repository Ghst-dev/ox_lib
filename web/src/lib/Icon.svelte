<script lang="ts">
  import { resolveIcon, ICON_ATTRS, ICON_VIEWBOX } from './icons';
  import type { IconProp, IconAnimation } from './icon';
  import { isIconUrl } from '../utils/isIconUrl';

  /**
   * Replaces components/LibIcon.tsx, and now the FontAwesome renderer that replaced it.
   *
   * A Lucide icon is plain data — a list of `[tag, attrs]` pairs — so this builds the SVG
   * with real elements rather than injecting markup. That removes the `{@html}` the
   * FontAwesome version needed, and with it the question of whether the string being
   * injected was trustworthy.
   *
   * ox_lib also accepts image URLs wherever an icon is expected, hence isIconUrl.
   */
  let {
    icon,
    animation,
    color,
    size = '1em',
    fixedWidth = true,
    class: className = '',
  }: {
    icon?: IconProp | string;
    animation?: IconAnimation;
    color?: string;
    size?: string;
    /**
     * Reserves a square box regardless of the glyph, so icons in a column line up. Named
     * for the FontAwesome utility it replaces (`fa-fw`).
     */
    fixedWidth?: boolean;
    class?: string;
  } = $props();

  const asUrl = $derived(typeof icon === 'string' && isIconUrl(icon) ? icon : null);
  const nodes = $derived(icon && !asUrl ? resolveIcon(icon) : null);
</script>

{#if asUrl}
  <img class={className} src={asUrl} alt="" style:width={size} style:height={size} />
{:else if nodes}
  <span
    class="ghst-icon {className}"
    class:fixed-width={fixedWidth}
    class:animated={!!animation}
    data-animation={animation}
    style:color
    style:font-size={size}
  >
    <svg viewBox="0 0 {ICON_VIEWBOX} {ICON_VIEWBOX}" {...ICON_ATTRS} aria-hidden="true">
      {#each nodes as [tag, attrs], index (index)}
        <svelte:element this={tag} {...attrs} />
      {/each}
    </svg>
  </span>
{/if}

<style>
  .ghst-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  /* No `vector-effect: non-scaling-stroke` here, deliberately. It would pin the stroke at
     2px at every size, which is heavy on a 12px icon and thin on a 32px one. Letting the
     stroke scale with the viewBox keeps it proportional — 1px at 12px, 2.7px at 32px —
     which is how Lucide's 2-on-24 geometry is meant to render. */
  .ghst-icon svg {
    width: 1em;
    height: 1em;
  }

  .fixed-width {
    width: 1.25em;
  }

  /*
   * The nine animations, previously supplied by FontAwesome's stylesheet.
   *
   * Kept on the same names because Lua sends them (`iconAnimation = 'spin'`). Timings
   * follow FontAwesome's defaults so nothing visibly changes speed.
   *
   * `pulse` is FontAwesome 5's stepped spin. FontAwesome 6 dropped it, so the existing
   * mapping to `fa-pulse` had already been doing nothing; it is implemented properly here.
   */
  .animated :global(svg) {
    animation-duration: 2s;
    animation-iteration-count: infinite;
    animation-timing-function: linear;
  }

  [data-animation='spin'] :global(svg) {
    animation-name: ghst-spin;
  }

  [data-animation='spinReverse'] :global(svg) {
    animation-name: ghst-spin;
    animation-direction: reverse;
  }

  [data-animation='spinPulse'] :global(svg),
  [data-animation='pulse'] :global(svg) {
    animation-name: ghst-spin;
    animation-duration: 1s;
    animation-timing-function: steps(8);
  }

  [data-animation='beat'] :global(svg) {
    animation-name: ghst-beat;
    animation-duration: 1s;
    animation-timing-function: ease-in-out;
  }

  [data-animation='fade'] :global(svg) {
    animation-name: ghst-fade;
    animation-duration: 1s;
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }

  [data-animation='beatFade'] :global(svg) {
    animation-name: ghst-beat-fade;
    animation-duration: 1s;
    animation-timing-function: cubic-bezier(0.4, 0, 0.6, 1);
  }

  [data-animation='bounce'] :global(svg) {
    animation-name: ghst-bounce;
    animation-duration: 1s;
    animation-timing-function: cubic-bezier(0.28, 0.84, 0.42, 1);
  }

  [data-animation='shake'] :global(svg) {
    animation-name: ghst-shake;
    animation-duration: 1s;
  }

  @keyframes ghst-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes ghst-beat {
    0%,
    90% {
      transform: scale(1);
    }
    45% {
      transform: scale(1.25);
    }
  }

  @keyframes ghst-fade {
    50% {
      opacity: 0.4;
    }
  }

  @keyframes ghst-beat-fade {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.125);
    }
  }

  @keyframes ghst-bounce {
    0%,
    10%,
    100% {
      transform: scale(1) translateY(0);
    }
    30% {
      transform: scale(1.05, 0.95) translateY(-0.5em);
    }
    50% {
      transform: scale(0.95, 1.05) translateY(0);
    }
    57% {
      transform: scale(1) translateY(-0.125em);
    }
  }

  @keyframes ghst-shake {
    0%,
    100% {
      transform: rotate(-15deg);
    }
    4%,
    24%,
    44% {
      transform: rotate(15deg);
    }
    12%,
    28%,
    36% {
      transform: rotate(-18deg);
    }
    20%,
    32% {
      transform: rotate(18deg);
    }
    56%,
    80% {
      transform: rotate(0deg);
    }
  }

  /* A spinning icon usually means "waiting", so it stays — slowed and without the
     vestibular triggers — rather than stopping outright and reading as frozen. */
  @media (prefers-reduced-motion: reduce) {
    .animated :global(svg) {
      animation-duration: 4s;
    }

    [data-animation='beat'] :global(svg),
    [data-animation='beatFade'] :global(svg),
    [data-animation='bounce'] :global(svg),
    [data-animation='shake'] :global(svg) {
      animation-name: ghst-fade;
    }
  }
</style>
