<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent } from '../../lib/nui';
  import { renderMarkdown } from '../../lib/markdown';
  import { notificationIn, notificationOut } from '../../lib/transitions';
  import { inlineStyle } from '../../lib/style';
  import Icon from '../../lib/Icon.svelte';
  import type { NotificationProps } from '../../typings';

  /**
   * Replaces react-hot-toast + the local patch that added the center-left / center-right
   * positions. All eight of the positions `resource/settings.lua` offers are implemented
   * here directly, so there is nothing left to patch.
   *
   * `lib.notify` strips the `sound` field before it reaches NUI and plays it with natives
   * (see resource/interface/client/notify.lua), so audio is not this component's problem.
   */

  const POSITIONS = [
    'top-left',
    'top-center',
    'top-right',
    'center-left',
    'center-right',
    'bottom-left',
    'bottom-center',
    'bottom-right',
  ] as const;

  type Position = (typeof POSITIONS)[number];

  interface Item {
    key: number;
    /** Caller-supplied id; a repeat of the same id refreshes the existing toast. */
    id?: string;
    position: Position;
    duration: number;
    showDuration: boolean;
    /** Bumped on refresh so the countdown ring restarts without replaying the entrance. */
    ringSeq: number;
    data: NotificationProps;
    icon?: string;
    iconColor: string;
    timer: ReturnType<typeof setTimeout>;
  }

  let items = $state<Item[]>([]);
  let nextKey = 0;

  // Mantine shade names mapped onto the theme. `inform` is v3's spelling of `info` and
  // still arrives from lib.defaultNotify.
  function defaultIconColor(type?: string): string {
    switch (type) {
      case 'error':
        return 'var(--color-danger)';
      case 'success':
        return 'var(--color-success)';
      case 'warning':
        return 'var(--color-warn)';
      default:
        return 'var(--color-primary)';
    }
  }

  function defaultIcon(type?: string): string {
    switch (type) {
      case 'error':
        return 'circle-xmark';
      case 'success':
        return 'circle-check';
      case 'warning':
        return 'circle-exclamation';
      default:
        return 'circle-info';
    }
  }

  /** `top` and `bottom` are the v3 spellings kept for backwards compatibility. */
  function normalisePosition(position?: string): Position {
    if (position === 'top') return 'top-center';
    if (position === 'bottom') return 'bottom-center';
    return (POSITIONS as readonly string[]).includes(position ?? '')
      ? (position as Position)
      : 'top-right';
  }

  function dismiss(key: number) {
    const index = items.findIndex((item) => item.key === key);
    if (index === -1) return;

    clearTimeout(items[index].timer);
    items.splice(index, 1);
  }

  const off = onNuiEvent<NotificationProps>('notify', (data) => {
    // Matches the React build: a toast with neither a title nor a description is dropped
    // rather than rendered as an empty box.
    if (!data.title && !data.description) return;

    const id = data.id?.toString();
    const duration = data.duration || 3000;
    const position = normalisePosition(data.position);
    const existing = id ? items.find((item) => item.id === id) : undefined;

    const fields = {
      id,
      position,
      duration,
      showDuration: data.showDuration ?? true,
      data,
      icon: (data.icon as string | undefined) ?? defaultIcon(data.type),
      iconColor: data.iconColor || defaultIconColor(data.type),
    };

    if (existing) {
      // Refresh in place. Re-keying the whole item would replay the entrance transition,
      // which reads as a flicker; only the ring is restarted.
      clearTimeout(existing.timer);
      Object.assign(existing, fields, {
        ringSeq: existing.ringSeq + 1,
        timer: setTimeout(() => dismiss(existing.key), duration),
      });
      return;
    }

    const key = nextKey++;
    items.push({ key, ringSeq: 0, ...fields, timer: setTimeout(() => dismiss(key), duration) });
  });

  onDestroy(() => {
    off();
    for (const item of items) clearTimeout(item.timer);
  });

  // r=17 with a 2px stroke inside a 38px box, matching the React ring's proportions.
  const RING_CIRCUMFERENCE = 2 * Math.PI * 17;
</script>

{#each POSITIONS as position (position)}
  {@const stack = items.filter((item) => item.position === position)}
  {#if stack.length}
    <div class="stack {position}">
      {#each stack as item (item.key)}
        <div
          class="toast"
          style={inlineStyle(item.data.style)}
          in:notificationIn={{ position }}
          out:notificationOut={{ position }}
        >
          {#if item.icon}
            <div
              class="icon-slot"
              class:align-top={item.data.alignIcon === 'top'}
              style:--ring-color={item.iconColor}
            >
              {#if item.showDuration}
                {#key item.ringSeq}
                  <svg class="countdown" width="38" height="38" viewBox="0 0 38 38">
                    <circle class="countdown-track" cx="19" cy="19" r="17" />
                    <circle
                      class="countdown-value"
                      cx="19"
                      cy="19"
                      r="17"
                      style:stroke-dasharray={RING_CIRCUMFERENCE}
                      style:animation-duration="{item.duration}ms"
                    />
                  </svg>
                {/key}
              {/if}
              <span class="icon-badge" class:bare={!item.showDuration}>
                <Icon
                  icon={item.icon}
                  animation={item.data.iconAnimation}
                  color={item.iconColor}
                  size="15px"
                />
              </span>
            </div>
          {/if}

          <div class="body">
            {#if item.data.title}
              <p class="title">{item.data.title}</p>
            {/if}
            {#if item.data.description}
              <div class="description" class:only={!item.data.title}>
                {@html renderMarkdown(item.data.description)}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {/if}
{/each}

<style>
  .stack {
    position: fixed;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 16px;
    /* Notifications are informational — they must never swallow a click meant for the
       game, even while something else has NUI focus. */
    pointer-events: none;
  }

  .top-left,
  .top-center,
  .top-right {
    top: 0;
  }
  .bottom-left,
  .bottom-center,
  .bottom-right {
    bottom: 0;
    /* Newest nearest the edge it entered from. */
    flex-direction: column-reverse;
  }
  .center-left,
  .center-right {
    top: 50%;
    transform: translateY(-50%);
  }

  .top-left,
  .bottom-left,
  .center-left {
    left: 0;
    align-items: flex-start;
  }
  .top-right,
  .bottom-right,
  .center-right {
    right: 0;
    align-items: flex-end;
  }
  .top-center,
  .bottom-center {
    left: 50%;
    transform: translateX(-50%);
    align-items: center;
  }

  .toast {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    width: 300px;
    padding: 12px;
    /* Ambient tier: this is drawn over live gameplay, never over a dimmed scene. See the
       ambient block in theme/tokens.css -- a white edge so it does not vanish into a night
       sky, and a 10px shadow so it does not smear across daylight concrete. The inset glass
       highlight goes with the focused tier; the white border already does that lifting. */
    background: var(--surface-ambient);
    border: 1px solid var(--border-ambient);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-ambient);
    color: var(--color-white);
  }

  .icon-slot {
    position: relative;
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    flex: none;
    align-self: center;
  }
  .icon-slot.align-top {
    align-self: flex-start;
  }

  .countdown {
    position: absolute;
    inset: 0;
    transform: rotate(-90deg);
  }
  .countdown-track {
    fill: none;
    stroke: var(--color-surface-2);
    stroke-width: 2;
  }
  .countdown-value {
    fill: none;
    stroke: var(--ring-color);
    stroke-width: 2;
    stroke-linecap: round;
    animation: ring-deplete linear forwards;
  }

  /* Drains clockwise over the toast's duration, so the ring doubles as the countdown. */
  @keyframes ring-deplete {
    from {
      stroke-dashoffset: 0;
    }
    to {
      stroke-dashoffset: -106.81;
    }
  }

  .icon-badge {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    background: color-mix(in srgb, var(--ring-color) 14%, transparent);
  }
  .icon-badge.bare {
    width: 32px;
    height: 32px;
  }

  .body {
    display: flex;
    flex-direction: column;
    min-width: 0;
    align-self: center;
  }

  .title {
    font-weight: 500;
    line-height: normal;
  }

  .description {
    font-size: var(--text-sm);
    color: var(--color-gray);
    line-height: normal;
  }
  .description.only {
    font-size: var(--text-base);
  }

  /* Markdown output. Descriptions are usually a single line, so the default block margins
     would look like padding bugs. */
  .description :global(p) {
    margin: 0;
  }
  .description :global(p + p) {
    margin-top: 4px;
  }
  .description :global(a) {
    color: var(--color-primary);
  }
  .description :global(code) {
    font-family: var(--font-mono);
    font-size: 0.9em;
    background: var(--color-surface-2);
    padding: 0.1em 0.35em;
    border-radius: var(--radius-sm);
  }
</style>
