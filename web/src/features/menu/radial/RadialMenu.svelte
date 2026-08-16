<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../../lib/nui';
  import { scaleFade, scaleFadeOut } from '../../../lib/transitions';
  import { getIconNodes } from '../../../lib/icon';
  import { ICON_ATTRS, ICON_VIEWBOX } from '../../../lib/icons';
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

  /**
   * The viewBox is a fixed 350 unit square and every coordinate below is in those units.
   * On-screen size is CSS only (`--radial-size`), so the wheel can be resized without
   * touching a single number in the geometry.
   */
  const VIEWBOX = 350;

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
      <svg width={VIEWBOX} height={VIEWBOX} viewBox="0 0 350 350" transform="rotate(90)">
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
            : getIconNodes(item.icon)}

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
                <!-- Same 30x30 box and offsets as before, so nothing in the sector layout
                     shifts; only the contents changed from one filled path to a list of
                     stroked elements over a 24 unit box. -->
                <svg
                  x={iconX - 14.5}
                  y={iconY - 17.5}
                  width="30"
                  height="30"
                  viewBox="0 0 {ICON_VIEWBOX} {ICON_VIEWBOX}"
                  {...ICON_ATTRS}
                >
                  {#each glyph as [tag, attrs], i (i)}
                    <svelte:element this={tag} {...attrs} />
                  {/each}
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

      <!-- Outside the rotated svg so the glyph stays upright. Sized as a fraction of the
           wheel (28 of 350 viewBox units) so it tracks --radial-size. -->
      <div class="centre-icon">
        <Icon
          icon={!sub && page < 2 ? 'xmark' : 'arrow-rotate-left'}
          size="calc(var(--radial-size) * 0.08)"
        />
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

    /*
     * On-screen diameter. The only size knob -- the svg, the centre glyph and everything
     * derived from the viewBox scale off this one value.
     *
     * Was a hardcoded 386px, which is a large object to drop over the middle of the
     * screen and was fixed regardless of resolution. Viewport-relative with a floor and a
     * ceiling instead: ~280px at 1080p, and it will not shrink to unreadable on a short
     * window or balloon on a tall one.
     */
    --radial-size: clamp(220px, 26vh, 300px);
  }

  svg {
    display: block;
    width: var(--radial-size);
    height: var(--radial-size);
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
    /* Flips both the label and the glyph to the dark base colour — see below. */
    color: var(--color-bg);
    cursor: pointer;
  }

  /*
   * currentColor rather than a literal, so the hover rule above is the single place the
   * sector's contents change colour.
   *
   * This replaces a pair of descendant selectors that reached in to set `fill` on the label
   * and the icon path. That approach was fragile twice over: an earlier version of the
   * selector also matched the wedge itself and painted the whole sector near-black, and
   * `fill` on Lucide's stroked geometry would flood the glyph solid rather than colour it.
   *
   * Nothing needs to target the icon at all now. Its <svg> carries fill="none" and
   * stroke="currentColor" as presentation attributes, which beat the fill inherited from
   * .sector, so driving `color` is sufficient and cannot leak into the wedge.
   */
  .sector text {
    fill: currentColor;
    stroke-width: 0;
  }

  /*
   * Both fills are literals with no var() and no color-mix(), and that is deliberate.
   *
   * `fill` is an inherited SVG property whose initial value is black. Any failure to
   * resolve — an undefined custom property, a color function the runtime does not
   * support — invalidates the declaration and the circle falls back to black. The centre
   * glyph is painted --color-bg, i.e. near-black by design, so the moment that happens
   * the button turns into a black disc with an invisible icon rather than showing
   * anything obviously broken. It has failed that way twice: once on --color-accent-deep,
   * a token left over from the palette that preceded the Ghostbase port.
   *
   * These are --color-primary (#22d3ee) and the same hue lightened, resolved ahead of
   * time. Keep them in step with the palette by hand; the failure mode is worse than the
   * duplication.
   */
  .centre {
    fill: #22d3ee;
    stroke: var(--color-surface);
    stroke-width: 4;
  }

  .centre:hover {
    cursor: pointer;
    fill: #67e8f9;
  }

  /*
   * grid + place-items, not a bare block.
   *
   * As a block this establishes an inline formatting context, so its height came from the
   * line box — the 24px line-height plus baseline alignment of the inline-flex icon —
   * giving a 34px box around a 28px glyph. translate(-50%, -50%) then centred the box,
   * leaving the glyph sitting 3px above the circle it is supposed to sit inside. A grid
   * container has no line box, so the wrapper hugs the glyph exactly.
   */
  .centre-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    display: grid;
    place-items: center;
    transform: translate(-50%, -50%);
    pointer-events: none;
    color: var(--color-bg);
  }
</style>
