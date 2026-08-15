<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../../lib/nui';
  import { scaleFade, scaleFadeOut } from '../../../lib/transitions';
  import { getIconPath } from '../../../lib/icon';
  import { isIconUrl } from '../../../utils/isIconUrl';
  import { locale } from '../../../lib/stores.svelte';
  import Icon from '../../../lib/Icon.svelte';
  import type { RadialMenuItem } from '../../../typings';

  /**
   * Sector geometry is carried over from the React build unchanged — the angles, the 1px
   * gap, the 0.65 icon radius and the rotate(90) on the root svg all interlock, and
   * "improving" any one of them skews the whole wheel.
   *
   * Note there is no `refreshItems` handler: the React build listened for that action,
   * but radial.lua never sends it.
   */

  const PAGE_ITEMS = 6;
  const SIZE = 350 * 1.1025;

  const degToRad = (deg: number) => deg * (Math.PI / 180);

  let visible = $state(false);
  let items = $state<RadialMenuItem[]>([]);
  let sub = $state(false);
  let page = $state(1);

  /** Where this page's slice starts in the full item list. Pages overlap by one, because
      the last slot on a full page is taken by the "More" entry. */
  const pageOffset = $derived(PAGE_ITEMS * (page - 1) - (page - 1));

  const pageItems = $derived.by(() => {
    if (items.length <= PAGE_ITEMS) return items;

    const end = PAGE_ITEMS * page - page + 1;
    const slice = items.slice(pageOffset, end);

    if (end < items.length) {
      slice[slice.length - 1] = { icon: 'ellipsis-h', label: locale.ui.more, isMore: true };
    }

    return slice;
  });

  function splitLines(text: string, maxCharPerLine = 15): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let line = words[0];

    for (let i = 1; i < words.length; i++) {
      if (line.length + words[i].length + 1 <= maxCharPerLine) line += ' ' + words[i];
      else {
        lines.push(line);
        line = words[i];
      }
    }

    lines.push(line);
    return lines;
  }

  const fontSize = (text: string) => (text.length > 20 ? 10 : text.length > 15 ? 12 : 13);

  /**
   * Paging hides the wheel, asks Lua whether the transition may proceed, and only then
   * shows the next page. radialTransition waits 100ms and answers false if the menu was
   * closed meanwhile, which is what stops a submenu opening over nothing.
   */
  async function changePage(increment?: boolean) {
    visible = false;

    const didTransition = await fetchNui<boolean>('radialTransition');
    if (!didTransition) return;

    visible = true;
    page = increment ? page + 1 : page - 1;
  }

  async function onSector(item: RadialMenuItem, index: number) {
    if (item.isMore) {
      await changePage(true);
      return;
    }

    fetchNui('radialClick', page === 1 ? index : pageOffset + index);
  }

  async function onCentre() {
    if (page > 1) {
      await changePage();
      return;
    }

    if (sub) {
      fetchNui('radialBack');
      return;
    }

    visible = false;
    fetchNui('radialClose');
  }

  async function onContextMenu(event: MouseEvent) {
    event.preventDefault();
    if (page > 1) await changePage();
    else if (sub) fetchNui('radialBack');
  }

  const offOpen = onNuiEvent<{ items: RadialMenuItem[]; sub?: boolean; option?: string } | false>(
    'openRadialMenu',
    (data) => {
      // `false` is the close signal, also used to blank the wheel mid-transition.
      if (!data) {
        visible = false;
        return;
      }

      let initialPage = 1;

      if (data.option) {
        const found = data.items.findIndex((item) => item.menu === data.option);
        if (found >= 0) initialPage = Math.floor(found / PAGE_ITEMS) + 1;
      }

      items = data.items;
      sub = data.sub ?? false;
      page = initialPage;
      visible = true;
    },
  );

  onDestroy(offOpen);
</script>

<div class="wrapper" oncontextmenu={onContextMenu} role="none">
  {#if visible}
    <div class="stage" in:scaleFade out:scaleFadeOut>
      <svg width="{SIZE}px" height="{SIZE}px" viewBox="0 0 350 350" transform="rotate(90)">
        <g transform="translate(175, 175)">
          <circle r="175" class="backdrop" />
        </g>

        {#each pageItems as item, index (index)}
          {@const pieAngle = 360 / (pageItems.length < 3 ? 3 : pageItems.length)}
          {@const angle = degToRad(pieAngle / 2 + 90)}
          {@const gap = 1}
          {@const radius = 175 * 0.65 - gap}
          {@const sinAngle = Math.sin(angle)}
          {@const cosAngle = Math.cos(angle)}
          {@const lines = splitLines(item.label, 15)}
          {@const iconX = 175 + sinAngle * radius}
          {@const iconY = 175 + cosAngle * radius + (lines.length > 3 ? 3 : 0)}
          {@const iconW = Math.min(Math.max(item.iconWidth || 50, 0), 100)}
          {@const iconH = Math.min(Math.max(item.iconHeight || 50, 0), 100)}
          {@const glyph = typeof item.icon === 'string' && isIconUrl(item.icon)
            ? null
            : getIconPath(item.icon)}

          <g
            class="sector"
            role="button"
            tabindex="-1"
            transform="rotate(-{index * pieAngle} 175 175) translate({sinAngle * gap}, {cosAngle *
              gap})"
            onclick={() => onSector(item, index)}
            onkeydown={(e) => e.key === 'Enter' && onSector(item, index)}
          >
            <path
              d="M175.01,175.01 l{175 - gap},0 A175.01,175.01 0 0,0 {175 +
                (175 - gap) * Math.cos(-degToRad(pieAngle))}, {175 +
                (175 - gap) * Math.sin(-degToRad(pieAngle))} z"
            />
            <g transform="rotate({index * pieAngle - 90} {iconX} {iconY})" pointer-events="none">
              {#if glyph}
                <svg
                  x={iconX - 14.5}
                  y={iconY - 17.5}
                  width="30"
                  height="30"
                  viewBox="0 0 {glyph.width} {glyph.height}"
                >
                  <path d={glyph.path} fill="currentColor" />
                </svg>
              {:else}
                <image
                  href={item.icon as string}
                  width={iconW}
                  height={iconH}
                  x={iconX - iconW / 2}
                  y={iconY - iconH / 2 - iconH / 4}
                />
              {/if}
              <text
                x={iconX}
                y={iconY + (lines.length > 2 ? 15 : 28)}
                text-anchor="middle"
                font-size={fontSize(item.label)}
                pointer-events="none"
                lengthAdjust="spacingAndGlyphs"
              >
                {#each lines as line, i}
                  <tspan x={iconX} dy={i === 0 ? 0 : '1.2em'}>{line}</tspan>
                {/each}
              </text>
            </g>
          </g>
        {/each}

        <g
          transform="translate(175, 175)"
          role="button"
          tabindex="-1"
          onclick={onCentre}
          onkeydown={(e) => e.key === 'Enter' && onCentre()}
        >
          <circle r="28" class="centre" />
        </g>
      </svg>

      <!-- Outside the rotated svg so the glyph stays upright. -->
      <div class="centre-icon">
        <Icon icon={!sub && page < 2 ? 'xmark' : 'arrow-rotate-left'} size="28px" />
      </div>
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .stage {
    position: relative;
    pointer-events: auto;
  }

  svg {
    overflow: visible;
  }

  .backdrop {
    fill: var(--color-surface);
  }

  .sector {
    fill: var(--color-surface);
    color: var(--color-white);
    outline: none;
  }

  .sector:hover {
    fill: var(--color-primary);
    cursor: pointer;
  }

  .sector text {
    fill: var(--color-white);
    stroke-width: 0;
  }

  /* On hover the sector turns accent, so its contents flip to the dark base colour to
     stay legible. */
  .sector:hover text,
  .sector:hover path {
    fill: var(--color-bg);
  }

  .sector:hover > g > svg > path {
    fill: var(--color-bg);
  }

  .centre {
    fill: var(--color-primary);
    stroke: var(--color-surface);
    stroke-width: 4;
  }
  .centre:hover {
    cursor: pointer;
    fill: var(--color-accent-deep);
  }

  .centre-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    color: var(--color-bg);
  }
</style>
