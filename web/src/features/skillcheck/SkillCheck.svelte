<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
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

  /**
   * The wheel scales up on tall displays. This was a CSS media query setting `r`, `cx` and
   * `cy` as CSS geometry properties — but those require units, and unitless values are
   * silently invalid, which collapsed every circle to r=0 and rendered nothing but the key
   * box. Driving the attributes from a matchMedia query keeps the numbers unitless where
   * the arc maths needs them and avoids the CSS-geometry trap entirely.
   */
  let tall = $state(false);

  onMount(() => {
    const query = window.matchMedia('(min-height: 1440px)');
    tall = query.matches;

    const update = () => (tall = query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });

  const R = $derived(tall ? 65 : 50);
  const STROKE = $derived(tall ? 10 : 8);
  const INDICATOR_STROKE = $derived(tall ? 18 : 16);
  const INDICATOR_GAP = $derived(tall ? 5 : 3);
  const DASH = $derived(2 * Math.PI * R);
  /** Arc length of the hit window, in the same units as the dash array. */
  const AREA_OFFSET = $derived(DASH - (Math.PI * R * offset) / 180);
</script>

<svelte:window onkeydown={onKeydown} />

{#if visible}
  <svg class="wheel" width="500" height="500" viewBox="0 0 500 500">
    <circle class="track" cx="250" cy="250" r={R} stroke-width={STROKE} stroke-dasharray={DASH} />
    <circle
      class="area"
      cx="250"
      cy="250"
      r={R}
      stroke-width={STROKE}
      stroke-dasharray={DASH}
      stroke-dashoffset={AREA_OFFSET}
      transform="rotate({angle}, 250, 250)"
    />
    <circle
      class="indicator"
      cx="250"
      cy="250"
      r={R}
      stroke-width={INDICATOR_STROKE}
      stroke-dasharray={DASH}
      stroke-dashoffset={DASH - INDICATOR_GAP}
      transform="rotate({indicatorAngle}, 250, 250)"
    />
  </svg>
  <div class="key" class:tall>{key.toUpperCase()}</div>
{/if}

<style>
  /* Geometry is set as SVG attributes, not CSS. `r`/`cx`/`cy` are CSS geometry properties
     that require units; unitless values are invalid and silently collapse the circle. */
  .wheel {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  .wheel circle {
    fill: transparent;
  }

  .track {
    stroke: var(--color-surface-2);
  }

  .area {
    stroke: var(--color-primary);
  }

  .indicator {
    stroke: var(--color-danger);
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

  .key.tall {
    width: 30px;
    height: 30px;
    font-size: 22px;
  }
</style>
