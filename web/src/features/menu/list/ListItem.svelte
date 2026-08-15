<script lang="ts">
  import Icon from '../../../lib/Icon.svelte';
  import { isIconUrl } from '../../../utils/isIconUrl';
  import type { MenuItem } from '../../../typings';

  let {
    item,
    index,
    scrollIndex,
    checked,
    active,
    element = $bindable(),
  }: {
    item: MenuItem;
    index: number;
    scrollIndex: number;
    checked: boolean;
    active: boolean;
    element?: HTMLDivElement;
  } = $props();

  const currentValue = $derived.by(() => {
    if (!Array.isArray(item.values)) return null;
    const value = item.values[scrollIndex];
    return typeof value === 'object' ? value.label : value;
  });
</script>

<div class="row" class:active bind:this={element} tabindex={index} role="option" aria-selected={active}>
  {#if item.icon}
    <span class="icon">
      {#if typeof item.icon === 'string' && isIconUrl(item.icon)}
        <img src={item.icon} alt="" />
      {:else}
        <Icon
          icon={item.icon}
          color={item.iconColor}
          animation={item.iconAnimation}
          size="24px"
        />
      {/if}
    </span>
  {/if}

  {#if Array.isArray(item.values)}
    <!-- A scroll row: label above, current value below, with a position readout. -->
    <div class="stretch">
      <p class="sublabel">{item.label}</p>
      <p class="value">{currentValue}</p>
    </div>
    <div class="scroller">
      <Icon icon="chevron-left" size="14px" />
      <span class="count">{scrollIndex + 1}/{item.values.length}</span>
      <Icon icon="chevron-right" size="14px" />
    </div>
  {:else if item.checked !== undefined}
    <span class="stretch">{item.label}</span>
    <span class="checkbox" class:checked aria-hidden="true">
      {#if checked}<Icon icon="check" size="12px" />{/if}
    </span>
  {:else if item.progress !== undefined}
    <div class="stretch">
      <p class="progress-label">{item.label}</p>
      <div class="bar">
        <span
          style:width="{item.progress}%"
          style:background={item.colorScheme || 'var(--color-white)'}
        ></span>
      </div>
    </div>
  {:else}
    <span class="stretch">{item.label}</span>
  {/if}
</div>

<style>
  .row {
    display: flex;
    align-items: center;
    gap: 15px;
    height: 60px;
    padding: 0 12px 0 5px;
    background: var(--color-surface);
    border: 1px solid transparent;
    border-radius: var(--radius-md);
    scroll-margin: 8px;
    outline: none;
  }

  /* The selected row is the only affordance here — the menu is keyboard-driven, so it
     has to be unmistakable. */
  .row.active {
    background: var(--primary-glow);
    border-color: var(--primary-glow-border);
  }

  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex: none;
    color: var(--color-gray);
  }
  .icon img {
    max-width: 32px;
  }

  .stretch {
    flex: 1;
    min-width: 0;
  }

  .sublabel {
    margin: 0;
    color: var(--color-gray);
    text-transform: uppercase;
    font-size: var(--text-label);
    letter-spacing: var(--tracking-label);
  }

  .value {
    margin: 0;
  }

  .scroller {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--color-gray);
  }
  .count {
    text-transform: uppercase;
    font-size: var(--text-sm);
    font-variant-numeric: tabular-nums;
  }

  .checkbox {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    flex: none;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--surface-sunken);
    color: var(--color-bg);
  }
  .checkbox.checked {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }

  .progress-label {
    margin: 0 0 3px;
  }

  .bar {
    height: 8px;
    border-radius: var(--radius-full);
    background: var(--color-surface-2);
    overflow: hidden;
  }
  .bar span {
    display: block;
    height: 100%;
  }
</style>
