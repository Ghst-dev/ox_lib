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

  const GROUPS: { label: string; actions: [string, () => void][] }[] = [
    {
      label: 'Dialogs',
      actions: [
        ['Input dialog', debug.debugInput],
        ['Alert dialog', debug.debugAlert],
      ],
    },
    {
      label: 'Menus',
      actions: [
        ['Context menu', debug.debugContext],
        ['List menu', debug.debugMenu],
        ['Radial menu', debug.debugRadial],
      ],
    },
    {
      label: 'Feedback',
      actions: [
        ['Notifications', debug.debugNotification],
        ['Progress bar', debug.debugProgressbar],
        ['Progress circle', debug.debugCircleProgressbar],
        ['Text UI', debug.debugTextUI],
        ['Skill check', debug.debugSkillCheck],
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
    {#each GROUPS as group}
      <p class="group-label">{group.label}</p>
      {#each group.actions as [label, run]}
        <button class="action" onclick={run}>{label}</button>
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

  .note {
    margin-top: auto;
    padding-top: 12px;
    font-size: var(--text-meta);
    color: var(--color-dim);
  }
</style>
