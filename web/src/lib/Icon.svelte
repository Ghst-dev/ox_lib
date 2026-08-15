<script lang="ts">
  import { icon as buildIcon } from '@fortawesome/fontawesome-svg-core';
  import type { IconProp, IconAnimation } from './icon';
  import { isIconUrl } from '../utils/isIconUrl';

  /**
   * Replaces components/LibIcon.tsx.
   *
   * FontAwesome's core is framework-agnostic — only the React binding went away. `icon()`
   * resolves against the library registered in main.ts and returns SVG markup, which is
   * generated from a fixed icon set rather than from the payload, so `{@html}` is safe
   * here. An unknown name resolves to null and renders nothing, matching the React
   * component's behaviour.
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
    fixedWidth?: boolean;
    class?: string;
  } = $props();

  // FontAwesome ships the keyframes for these in its stylesheet, imported by main.ts.
  const ANIMATION_CLASS: Record<IconAnimation, string> = {
    spin: 'fa-spin',
    spinPulse: 'fa-spin-pulse',
    spinReverse: 'fa-spin fa-spin-reverse',
    pulse: 'fa-pulse',
    beat: 'fa-beat',
    fade: 'fa-fade',
    beatFade: 'fa-beat-fade',
    bounce: 'fa-bounce',
    shake: 'fa-shake',
  };

  const asUrl = $derived(typeof icon === 'string' && isIconUrl(icon) ? icon : null);

  /**
   * `icon()` from the core resolves an IconLookup — it does not accept a bare name. The
   * React `<FontAwesomeIcon>` normalised strings internally, which is why dropping it
   * silently produced empty icons until this was added.
   *
   * ox_lib accepts both forms from Lua (see NotifyProps): a plain name, defaulting to the
   * solid set, or a `{ prefix, name }` table that arrives here as a two-element array.
   */
  function toLookup(value: IconProp | string): any {
    if (typeof value === 'string') return { prefix: 'fas', iconName: value };
    if (Array.isArray(value)) return { prefix: value[0], iconName: value[1] };
    if (value && typeof value === 'object') {
      if ('icon' in value) return value; // already a full IconDefinition
      if ('iconName' in value) {
        return (value as any).prefix ? value : { prefix: 'fas', iconName: (value as any).iconName };
      }
    }
    return null;
  }

  const svg = $derived.by(() => {
    if (!icon || asUrl) return null;

    const lookup = toLookup(icon);
    if (!lookup) return null;

    const classes: string[] = [];
    if (fixedWidth) classes.push('fa-fw');
    if (animation) classes.push(...ANIMATION_CLASS[animation].split(' '));

    return buildIcon(lookup, { classes })?.html?.[0] ?? null;
  });
</script>

{#if asUrl}
  <img class={className} src={asUrl} alt="" style:width={size} style:height={size} />
{:else if svg}
  <span class="ghst-icon {className}" style:color style:font-size={size}>
    {@html svg}
  </span>
{/if}

<style>
  .ghst-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .ghst-icon :global(svg) {
    width: 1em;
    height: 1em;
  }
</style>
