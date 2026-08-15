<script lang="ts">
  import { onDestroy } from 'svelte';
  import { onNuiEvent, fetchNui } from '../../../lib/nui';
  import Icon from '../../../lib/Icon.svelte';
  import ListItem from './ListItem.svelte';
  import type { MenuSettings } from '../../../typings';

  /**
   * Keyboard-driven list menu. ox_inventory is the only consumer today.
   *
   * Indices on the wire are **0-based**; menu.lua adds 1 to each before handing them to
   * Lua (`data[1] += 1`). Do not pre-increment here.
   *
   * The React build drove the three outbound callbacks from useEffects debounced by
   * 100ms. They are scheduled directly from the interactions that cause them here, which
   * is the same observable behaviour — latest wins within 100ms — without the effect
   * having to guess why it re-ran.
   */

  let menu = $state<MenuSettings>({ position: 'top-left', title: '', items: [] });
  let visible = $state(false);
  let selected = $state(0);
  let indexStates = $state<Record<number, number>>({});
  let checkedStates = $state<Record<number, boolean>>({});
  let rows = $state<(HTMLDivElement | undefined)[]>([]);

  const timers: Record<string, ReturnType<typeof setTimeout> | undefined> = {};

  function debounce(key: string, fn: () => void, ms = 100) {
    clearTimeout(timers[key]);
    timers[key] = setTimeout(fn, ms);
  }

  const current = $derived(menu.items[selected]);

  /** Description shown for the selected row — from the current value when values are objects. */
  const description = $derived.by(() => {
    if (!current) return undefined;
    const values = current.values;
    if (Array.isArray(values)) {
      const value = values[indexStates[selected]];
      return typeof value === 'object' ? value.description : current.description;
    }
    return current.description;
  });

  function scheduleChangeSelected() {
    debounce('selected', () => {
      const item = menu.items[selected];
      if (!item) return;

      // Mirrors the React payload exactly, including its use of `item.checked`'s
      // truthiness rather than an undefined check. Both land the same way in Lua, since
      // `if data[2]` treats false and nil alike.
      fetchNui('changeSelected', [
        selected,
        item.values ? indexStates[selected] : item.checked ? checkedStates[selected] : null,
        item.values ? 'isScroll' : item.checked ? 'isCheck' : null,
      ]);
    });
  }

  function focusRow() {
    const el = rows[selected];
    el?.scrollIntoView({ block: 'nearest', inline: 'start' });
    el?.focus({ preventScroll: true });
  }

  function move(delta: number) {
    const count = menu.items.length;
    if (!count) return;
    selected = (selected + delta + count) % count;
    focusRow();
    scheduleChangeSelected();
  }

  function cycle(delta: number) {
    const item = menu.items[selected];
    if (!Array.isArray(item?.values)) return;

    // Both the row and the new value are captured now rather than read inside the
    // debounced callback. Reading them later retargets the callback at whatever is
    // selected 100ms on, so an ArrowRight followed quickly by an ArrowDown reported the
    // index change against the wrong row.
    const row = selected;
    const length = item.values.length;
    const next = (indexStates[row] + delta + length) % length;

    indexStates[row] = next;
    debounce('index', () => fetchNui('changeIndex', [row, next]));
  }

  function confirm() {
    const item = menu.items[selected];
    if (!item) return;

    // A checkbox row toggles instead of confirming — Enter never closes it.
    if (item.checked !== undefined && !item.values) {
      // Captured for the same reason as in cycle().
      const row = selected;
      const next = !checkedStates[row];

      checkedStates[row] = next;
      debounce('checked', () => fetchNui('changeChecked', [row, next]));
      return;
    }

    fetchNui('confirmSelected', [selected, indexStates[selected]]);
    if (item.close === undefined || item.close) visible = false;
  }

  function close(keyPressed?: string) {
    if (menu.canClose === false) return;
    visible = false;
    fetchNui('closeMenu', keyPressed);
  }

  function onKey(event: KeyboardEvent) {
    if (!visible) return;

    switch (event.code) {
      case 'ArrowDown':
        move(1);
        break;
      case 'ArrowUp':
        move(-1);
        break;
      case 'ArrowRight':
        cycle(1);
        break;
      case 'ArrowLeft':
        cycle(-1);
        break;
      case 'Enter':
        confirm();
        break;
      case 'Escape':
      case 'Backspace':
        close(event.code);
        break;
      default:
        return;
    }

    event.preventDefault();
  }

  const offSet = onNuiEvent<MenuSettings>('setMenu', (data) => {
    let start = data.startItemIndex ?? 0;
    if (start < 0) start = 0;
    else if (start >= data.items.length) start = data.items.length - 1;

    const nextIndex: Record<number, number> = {};
    const nextChecked: Record<number, boolean> = {};

    data.items.forEach((item, i) => {
      // defaultIndex is 1-based on the Lua side, so it is shifted down here.
      if (Array.isArray(item.values)) nextIndex[i] = (item.defaultIndex || 1) - 1;
      else if (item.checked !== undefined) nextChecked[i] = item.checked || false;
    });

    menu = { ...data, position: data.position ?? 'top-left' };
    selected = start;
    indexStates = nextIndex;
    checkedStates = nextChecked;
    rows = [];
    visible = true;

    // Fires on open too, as the React effect did — Lua's onSelected expects it.
    scheduleChangeSelected();
    setTimeout(focusRow, 0);
  });

  // Closed from Lua: force it shut and post nothing, since menu.lua has already cleared
  // its own state and called onClose.
  const offClose = onNuiEvent('closeMenu', () => {
    visible = false;
  });

  onDestroy(() => {
    offSet();
    offClose();
    for (const timer of Object.values(timers)) clearTimeout(timer);
  });
</script>

<svelte:window onkeydown={onKey} />

{#if visible}
  <div class="list-menu {menu.position ?? 'top-left'}">
    <div class="header">{menu.title}</div>

    <div class="items" role="listbox" tabindex="-1" aria-label={menu.title}>
      {#each menu.items as item, index (index)}
        {#if item.label}
          <ListItem
            {item}
            {index}
            scrollIndex={indexStates[index]}
            checked={checkedStates[index]}
            active={index === selected}
            bind:element={rows[index]}
          />
        {/if}
      {/each}
    </div>

    <!-- Only shown while there is more list below, matching the React condition. -->
    {#if menu.items.length > 6 && selected !== menu.items.length - 1}
      <div class="scroll-arrow"><Icon icon="chevron-down" size="20px" /></div>
    {/if}

    {#if description}
      <div class="tooltip">{description}</div>
    {/if}
  </div>
{/if}

<style>
  .list-menu {
    position: absolute;
    width: 384px;
    pointer-events: auto;
  }

  .top-left {
    top: 0;
    left: 0;
    margin: 5px 0 0 5px;
  }
  .top-right {
    top: 0;
    right: 1px;
    margin: 5px 5px 0 0;
  }
  .bottom-left {
    bottom: 1px;
    left: 1px;
    margin: 0 0 5px 5px;
  }
  .bottom-right {
    bottom: 1px;
    right: 1px;
    margin: 0 5px 5px 0;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;
    background: var(--surface-panel);
    border: 1px solid var(--color-border);
    border-bottom: none;
    border-radius: var(--radius-md) var(--radius-md) 0 0;
    font-size: var(--text-heading);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: var(--tracking-label);
    color: var(--color-white);
  }

  .items {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 415px;
    padding: 8px;
    overflow-y: auto;
    background: var(--surface-sunken);
    border: 1px solid var(--color-border);
    border-top: none;
    border-radius: 0 0 var(--radius-md) var(--radius-md);
  }

  .scroll-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 25px;
    background: var(--surface-panel);
    border: 1px solid var(--color-border);
    border-top: none;
    border-radius: 0 0 var(--radius-md) var(--radius-md);
    color: var(--color-gray);
  }

  .tooltip {
    margin-top: 6px;
    padding: 8px 10px;
    max-width: 350px;
    background: var(--surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-gray);
    font-size: var(--text-sm);
    white-space: normal;
  }
</style>
