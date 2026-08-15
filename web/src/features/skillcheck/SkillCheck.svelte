<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../lib/nui';
  import type { GameDifficulty } from '../../typings';

  /**
   * Timed skill check. An indicator sweeps a full circle in 2000ms / speedMultiplier; the
   * player has to press the shown key while it is inside the highlighted arc.
   *
   * No consumer on this server calls lib.skillCheck today — only ox_lib's own demo — but
   * the contract is implemented in full so nothing hangs if one starts. `skillCheckOver`
   * is what resolves the Lua promise, so every exit path has to post it exactly once.
   */

  const BASE_DURATION_MS = 2000;
  const DIFFICULTY_OFFSETS = { easy: 50, medium: 40, hard: 25 } as const;
  const SPEED = { easy: 1, medium: 1.5, hard: 1.75 } as const;

  let visible = $state(false);
  let angle = $state(0);
  let offset = $state(50);
  let indicatorAngle = $state(-90);
  let key = $state('e');
  let keys = $state<string[] | undefined>(undefined);
  let multiplier = $state(1);

  // The sequence being played, when `difficulty` arrived as an array.
  let sequence: GameDifficulty[] = [];
  let sequenceIndex = 0;
  let inputs: string[] | undefined;

  let frame: number | null = null;
  let startTime: number | null = null;
  let completed = false;

  const randomAngle = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

  const offsetFor = (d: GameDifficulty) =>
    typeof d === 'object' ? d.areaSize : DIFFICULTY_OFFSETS[d];

  const speedFor = (d: GameDifficulty) =>
    typeof d === 'object' ? d.speedMultiplier : SPEED[d];

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }

  function applyRound(difficulty: GameDifficulty) {
    const size = offsetFor(difficulty);

    offset = size;
    multiplier = speedFor(difficulty);
    // Never starts within the first 120° so the player always has reaction time.
    angle = -90 + randomAngle(120, 360 - size);
    key = (inputs ? inputs[Math.floor(Math.random() * inputs.length)] : 'e').toLowerCase();

    indicatorAngle = -90;
    startTime = null;
    completed = false;

    stop();
    frame = requestAnimationFrame(tick);
  }

  function tick(time: number) {
    if (completed) return;
    if (startTime === null) startTime = time;

    const speed = Math.max(multiplier || 0, 0.0001);
    const progress = Math.min((time - startTime) / (BASE_DURATION_MS / speed), 1);

    indicatorAngle = -90 + progress * 360;

    // A full sweep with no press is a miss.
    if (indicatorAngle + 90 >= 360) {
      completed = true;
      stop();
      finish(false);
      return;
    }

    frame = requestAnimationFrame(tick);
  }

  /** Advances the sequence, or ends the check and resolves Lua's promise. */
  function finish(success: boolean) {
    if (!success || sequence.length === 0 || sequenceIndex >= sequence.length - 1) {
      visible = false;
      stop();
      fetchNui('skillCheckOver', success);
      return;
    }

    sequenceIndex++;
    applyRound(sequence[sequenceIndex]);
  }

  function onKeydown(event: KeyboardEvent) {
    if (!visible || completed) return;

    // Non-Latin layouts report a localised e.key, so the physical code is used instead —
    // otherwise a Greek or Cyrillic keyboard could never match 'e'.
    const CAPITAL_HETA = 880;
    let pressed = event.key.toLowerCase();

    if (event.key.charCodeAt(0) >= CAPITAL_HETA) {
      if (event.code.startsWith('Key') && event.code.length === 4) pressed = event.code.charAt(3);
      else if (event.code.startsWith('Digit') && event.code.length === 6) pressed = event.code.charAt(5);
      pressed = pressed.toLowerCase();
    }

    // Keys outside the allowed set are ignored rather than counted as a miss.
    if (keys && !keys.includes(pressed)) return;

    completed = true;
    stop();

    const inArc = indicatorAngle >= angle && indicatorAngle <= angle + offset;
    finish(pressed === key && inArc);
  }

  const offStart = onNuiEvent<{ difficulty: GameDifficulty | GameDifficulty[]; inputs?: string[] }>(
    'startSkillCheck',
    (data) => {
      sequence = Array.isArray(data.difficulty) ? data.difficulty : [];
      sequenceIndex = 0;
      inputs = data.inputs;
      keys = data.inputs?.map((input) => input.toLowerCase());

      visible = true;
      applyRound(Array.isArray(data.difficulty) ? data.difficulty[0] : data.difficulty);
    },
  );

  const offCancel = onNuiEvent('skillCheckCancel', () => {
    completed = true;
    visible = false;
    stop();
    fetchNui('skillCheckOver', false);
  });

  onDestroy(() => {
    offStart();
    offCancel();
    stop();
  });
</script>

<svelte:window onkeydown={onKeydown} />

{#if visible}
  <svg class="wheel" style:--sc-offset={offset}>
    <circle class="track" />
    <circle class="area" transform="rotate({angle}, 250, 250)" />
    <circle class="indicator" transform="rotate({indicatorAngle}, 250, 250)" />
  </svg>
  <div class="key">{key.toUpperCase()}</div>
{/if}

<style>
  /* Geometry lives in CSS so the 1440px breakpoint can scale the whole wheel by changing
     two variables, exactly as the Mantine media query did. */
  .wheel {
    --sc-r: 50;
    --sc-dash: 314.1592653589793; /* 2 * pi * 50 */
    --sc-stroke: 8;
    --sc-indicator-stroke: 16;
    --sc-indicator-gap: 3;

    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    height: 500px;
  }

  @media (min-height: 1440px) {
    .wheel {
      --sc-r: 65;
      --sc-dash: 408.4070449666731; /* 2 * pi * 65 */
      --sc-stroke: 10;
      --sc-indicator-stroke: 18;
      --sc-indicator-gap: 5;
    }
  }

  .wheel circle {
    r: var(--sc-r);
    cx: 250;
    cy: 250;
    fill: transparent;
    stroke-dasharray: var(--sc-dash);
  }

  .track {
    stroke: var(--color-surface-2);
    stroke-width: var(--sc-stroke);
  }

  /* Arc length for `offset` degrees at the current radius. */
  .area {
    stroke: var(--color-primary);
    stroke-width: var(--sc-stroke);
    stroke-dashoffset: calc(
      var(--sc-dash) - (3.141592653589793 * var(--sc-r) * var(--sc-offset)) / 180
    );
  }

  .indicator {
    stroke: var(--color-danger);
    stroke-width: var(--sc-indicator-stroke);
    stroke-dashoffset: calc(var(--sc-dash) - var(--sc-indicator-gap));
  }

  .key {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    background: var(--color-surface-2);
    border-radius: 5px;
    font-size: 16px;
    font-weight: 500;
    color: var(--color-white);
  }

  @media (min-height: 1440px) {
    .key {
      width: 30px;
      height: 30px;
      font-size: 22px;
    }
  }
</style>
