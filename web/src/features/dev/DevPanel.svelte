<script lang="ts">
  import Icon from '../../lib/Icon.svelte';
  import { scaleFade, scaleFadeOut } from '../../lib/transitions';
  import * as debug from './payloads';

  /**
   * Browser-only test drawer. App.svelte mounts it behind isEnvBrowser(), and debugData
   * no-ops in production, so nothing here can reach a player.
   *
   * This is the only practical way to iterate on the UI without launching the game.
   */

  let open = $state(false);

  /**
   * Keep the drawer open after firing something.
   *
   * Off by default, and that default is the whole point. The drawer is docked top-left and
   * so is the list menu — firing it from here covered it completely, so the one feature you
   * could not review in the harness was the one the harness was mostly used for. Closing on
   * fire means a click shows you the thing you asked for; the launcher brings the drawer
   * straight back.
   *
   * Pinning it is still wanted for the payloads that stack rather than replace, where the
   * point is to fire several in a row and watch them queue up.
   */
  let pinned = $state(false);

  function run(action: () => void): void {
    action();
    if (!pinned) open = false;
  }

  const GROUPS: { label: string; actions: [string, () => void][] }[] = [
    {
      label: 'Dialogs',
      actions: [
        ['Input dialog', debug.debugInput],
        ['Alert dialog', debug.debugAlert],
        ['Alert, no cancel', debug.debugAlertBare],
      ],
    },
    {
      label: 'Menus',
      actions: [
        ['Context menu', debug.debugContext],
        ['List menu', debug.debugMenu],
        ['List menu, 40 items', debug.debugMenuLong],
        ['List menu, empty', debug.debugMenuEmpty],
        ['Context, empty', debug.debugContextEmpty],
        ['Radial menu', debug.debugRadial],
      ],
    },
    {
      label: 'Feedback',
      actions: [
        ['Notifications', debug.debugNotification],
        ['Notification shapes', debug.debugNotificationShapes],
        ['All eight positions', debug.debugNotificationPositions],
        ['Progress bar', debug.debugProgressbar],
        ['Progress circle', debug.debugCircleProgressbar],
        ['Text UI', debug.debugTextUI],
        ['Text UI, next position', debug.debugTextUIPositions],
        ['Skill check', debug.debugSkillCheck],
        ['Skill check, slow', debug.debugSkillCheckSlow],
      ],
    },
    {
      // Lua interrupting the player, which is a different path from the player dismissing
      // the same thing — and the path with no button of its own to click.
      label: 'Closed by Lua',
      actions: [
        ['Close menu', debug.debugCloseMenu],
        ['Hide context', debug.debugHideContext],
        ['Close alert', debug.debugCloseAlert],
        ['Close input', debug.debugCloseInput],
        ['Cancel progress', debug.debugProgressCancel],
        ['Cancel skill check', debug.debugSkillCheckCancel],
        ['Hide text UI', debug.debugTextUIHide],
      ],
    },
  ];
</script>

<button class="launcher" onclick={() => (open = !open)} title="Developer drawer">
  <Icon icon={open ? 'xmark' : 'wrench'} size="20px" />
</button>

{#if open}
  <aside class="drawer" in:scaleFade out:scaleFadeOut>
    <h2 class="heading">Developer drawer</h2>
    <label class="pin">
      <input type="checkbox" bind:checked={pinned} />
      Keep open after firing
    </label>

    {#each GROUPS as group}
      <p class="group-label">{group.label}</p>
      {#each group.actions as [label, action]}
        <button class="action" onclick={() => run(action)}>{label}</button>
      {/each}
    {/each}
    <p class="note">Browser only — never mounted in game.</p>
  </aside>
{/if}

<style>
  .launcher {
    position: absolute;
    right: 50px;
    bottom: 50px;
    display: grid;
    place-items: center;
    width: 50px;
    height: 50px;
    border-radius: var(--radius-full);
    background: var(--color-warn);
    color: var(--color-bg);
    box-shadow: var(--shadow-panel);
    pointer-events: auto;
    z-index: 100;
  }

  .drawer {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 280px;
    padding: 20px;
    overflow-y: auto;
    background: var(--surface-panel);
    border-right: 1px solid var(--color-border);
    box-shadow: var(--shadow-panel);
    pointer-events: auto;
    z-index: 100;
  }

  .heading {
    font-size: var(--text-subheading);
    font-weight: 600;
    margin-bottom: 6px;
  }

  .group-label {
    margin: 10px 0 2px;
    font-size: var(--text-label);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--color-dim);
  }

  .action {
    width: 100%;
    padding: 8px 12px;
    text-align: left;
    background: var(--color-surface-2);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-white);
    font-size: var(--text-sm);
    transition:
      opacity var(--dur-base) var(--ease-out),
      transform var(--dur-base) var(--ease-out);
  }
  .action:hover {
    opacity: 0.88;
    transform: translateY(-1px);
  }

  .pin {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-meta);
    color: var(--color-dim);
  }

  .note {
    margin-top: auto;
    padding-top: 12px;
    font-size: var(--text-meta);
    color: var(--color-dim);
  }
</style>
