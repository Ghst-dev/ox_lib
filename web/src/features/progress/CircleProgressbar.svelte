<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../lib/nui';
  import { scaleFade, scaleFadeOut } from '../../lib/transitions';
  import type { CircleProgressbarProps } from '../../typings';

  /** See Progressbar.svelte for why `progressComplete` must always fire. */

  let visible = $state(false);
  let value = $state(0);
  let label = $state('');
  let duration = $state(0);
  let position = $state<'middle' | 'bottom'>('middle');
  let showPercent = $state(true);
  let ticker: ReturnType<typeof setInterval> | undefined;

  function stopTicker() {
    if (ticker) clearInterval(ticker);
    ticker = undefined;
  }

  const offCircle = onNuiEvent<CircleProgressbarProps>('circleProgress', (data) => {
    // Re-entrancy guard from the React build: a second circleProgress while one is on
    // screen is ignored rather than restarting the ring mid-action.
    if (visible) return;

    visible = true;
    value = 0;
    label = data.label || '';
    duration = data.duration;
    position = data.position || 'middle';
    showPercent = data.percent ?? true;

    stopTicker();
    ticker = setInterval(() => {
      value += 1;
      if (value >= 100) stopTicker();
    }, data.duration * 0.01);
  });

  const offCancel = onNuiEvent('progressCancel', () => {
    stopTicker();
    // The React build parked the readout at 99 on cancel so it never reads as a completed
    // 100% for the frame before it disappears.
    value = 99;
    visible = false;
  });

  onDestroy(() => {
    offCircle();
    offCancel();
    stopTicker();
  });

  // r=33.5 inside a 90px box with a 7px stroke, matching the React ring.
  const R = 33.5;
  const CIRCUMFERENCE = 2 * Math.PI * R;
</script>

<div class="wrapper" class:middle={position === 'middle'}>
  {#if visible}
    <div
      class="stack"
      in:scaleFade
      out:scaleFadeOut
      onoutroend={() => fetchNui('progressComplete')}
    >
      <svg class="ring" width="90" height="90" viewBox="0 0 90 90">
        <circle class="track" cx="45" cy="45" r={R} />
        <circle
          class="value"
          cx="45"
          cy="45"
          r={R}
          style:stroke-dasharray={CIRCUMFERENCE}
          style:stroke-dashoffset={CIRCUMFERENCE}
          style:animation-duration="{duration}ms"
          onanimationend={() => (visible = false)}
        />
        {#if showPercent}
          <text class="value-text" x="45" y="45" dominant-baseline="central" text-anchor="middle">
            {value}%
          </text>
        {/if}
      </svg>
      {#if label}
        <p class="label">{label}</p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .wrapper {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 20%;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }
  .wrapper.middle {
    height: 100%;
  }

  .stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .ring {
    /* Start the sweep at 12 o'clock rather than 3. */
    transform: rotate(-90deg);
  }

  .track {
    fill: none;
    stroke: var(--color-surface-2);
    stroke-width: 7;
  }

  .value {
    fill: none;
    stroke: var(--color-primary);
    stroke-width: 7;
    stroke-linecap: round;
    animation: ring-fill linear forwards;
  }

  @keyframes ring-fill {
    to {
      stroke-dashoffset: 0;
    }
  }

  .value-text {
    /* Cancel the parent rotation so the readout stays upright. */
    transform: rotate(90deg);
    transform-origin: 45px 45px;
    fill: var(--color-white);
    font-family: var(--font-mono);
    font-size: 16px;
    font-variant-numeric: tabular-nums;
  }

  .label {
    text-align: center;
    color: var(--color-white);
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  }
</style>
