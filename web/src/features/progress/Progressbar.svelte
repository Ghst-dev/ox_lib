<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../lib/nui';
  import { scaleFade, scaleFadeOut } from '../../lib/transitions';
  import type { ProgressbarProps } from '../../typings';

  /**
   * `progressComplete` is the important part of this component.
   *
   * lib.progressBar blocks on `while progress ~= nil do Wait(0) end`, and only the
   * progressComplete callback sets `progress = nil` (resource/interface/client/progress.lua:289).
   * If it is not posted once the bar has gone away — whether it finished or was cancelled —
   * every later progress call on that client hangs forever. It fires from the exit
   * transition, so both paths funnel through it.
   */

  let visible = $state(false);
  let label = $state('');
  let duration = $state(0);

  const offProgress = onNuiEvent<ProgressbarProps>('progress', (data) => {
    label = data.label;
    duration = data.duration;
    visible = true;
  });

  const offCancel = onNuiEvent('progressCancel', () => {
    visible = false;
  });

  onDestroy(() => {
    offProgress();
    offCancel();
  });
</script>

<div class="wrapper">
  {#if visible}
    <div
      class="frame"
      in:scaleFade
      out:scaleFadeOut
      onoutroend={() => fetchNui('progressComplete')}
    >
      <!-- Base label, dimmed. The filling bar carries a second, brighter copy clipped to
           its own width, so the text lights up as the action completes. -->
      <span class="label base">{label}</span>
      <div class="bar" style:animation-duration="{duration}ms" onanimationend={() => (visible = false)}>
        <span class="label fill">{label}</span>
      </div>
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

  .frame {
    position: relative;
    width: 350px;
    height: 45px;
    border-radius: var(--radius-md);
    background: var(--surface-panel);
    border: 1px solid var(--color-border);
    box-shadow: inset 0 1px 0 var(--edge-highlight), var(--shadow-panel);
    overflow: hidden;
  }

  /*
   * --color-action, not --color-primary: the palette reserves it for live moments and
   * names fill animations as the example. A bar filling is the canonical one.
   *
   * The fill is mixed onto the panel's own surface rather than into `transparent`.
   * Mixing into transparent yields 22% alpha, which over an already-translucent panel
   * washed out to the point that only the leading edge read as anything — the bar
   * looked broken rather than subtle.
   */
  .bar {
    position: absolute;
    inset: 0;
    width: 0;
    background: color-mix(in srgb, var(--color-action) 26%, var(--surface-panel));
    border-right: 2px solid var(--color-action);
    box-shadow: 0 0 8px var(--action-glow);
    overflow: hidden;
    animation: progress-fill linear forwards;
  }

  @keyframes progress-fill {
    from {
      width: 0;
    }
    to {
      width: 100%;
    }
  }

  .label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    /* Fixed to the container's width so the copy inside the bar stays aligned with the
       one behind it as the bar grows — otherwise the text would slide. */
    width: 350px;
    padding: 0 8px;
    font-size: var(--text-subheading);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .base {
    color: var(--color-dim);
  }

  .fill {
    color: var(--color-white);
  }
</style>
