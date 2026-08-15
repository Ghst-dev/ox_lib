<script lang="ts">
  import Icon from '../../lib/Icon.svelte';
  import { toDateInput, fromDateInput, toTimeInput, fromTimeInput } from './datetime';

  /**
   * One row of an input dialog. Mantine supplied rich controls for the last four types;
   * these are native equivalents, which CEF renders fine and which theme cleanly. Known
   * gaps are called out inline rather than silently dropped.
   */

  let {
    row,
    value = $bindable(),
    invalid = false,
  }: { row: any; value: any; invalid?: boolean } = $props();

  const options = $derived(
    (row.options ?? []).map((o: any) => (o.label ? o : { ...o, label: o.value })),
  );

  function onMultiSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const selected = [...select.selectedOptions].map((o) => o.value);

    // maxSelectedValues is enforced by dropping the overflow rather than by disabling the
    // remaining options, which is what MultiSelect did.
    value = row.maxSelectedValues ? selected.slice(0, row.maxSelectedValues) : selected;

    // The DOM has to be pushed back into line by hand when the overflow is dropped.
    // Binding the `selected` *attribute* would not do it: once the user has interacted,
    // the attribute only reflects defaultSelected, so the clipped option would stay
    // highlighted while the value behind it says otherwise.
    for (const option of select.options) {
      option.selected = (value as string[]).includes(option.value);
    }
  }

  let revealPassword = $state(false);

  // date-range carries two timestamps; keep them addressable without losing the pair.
  const rangeStart = $derived(Array.isArray(value) ? value[0] : null);
  const rangeEnd = $derived(Array.isArray(value) ? value[1] : null);

  function setRange(index: 0 | 1, input: string) {
    const next: (number | null)[] = Array.isArray(value) ? [...value] : [null, null];
    next[index] = fromDateInput(input);
    value = next;
  }
</script>

<div class="field" class:invalid>
  {#if row.type !== 'checkbox'}
    <label class="label" for="row-{row.label}">
      {#if row.icon}<Icon icon={row.icon} color={row.iconColor} size="13px" />{/if}
      <span>{row.label}</span>
      {#if row.required}<span class="asterisk">*</span>{/if}
    </label>
    {#if row.description}
      <p class="description">{row.description}</p>
    {/if}
  {/if}

  {#if row.type === 'input'}
    <div class="with-affix">
      <input
        id="row-{row.label}"
        class="control"
        type={row.password && !revealPassword ? 'password' : 'text'}
        bind:value
        placeholder={row.placeholder}
        minlength={row.min}
        maxlength={row.max}
        disabled={row.disabled}
      />
      {#if row.password}
        <button
          class="affix"
          type="button"
          onclick={() => (revealPassword = !revealPassword)}
          aria-label="toggle visibility"
        >
          <Icon icon={revealPassword ? 'eye-slash' : 'eye'} size="14px" />
        </button>
      {/if}
    </div>
  {:else if row.type === 'checkbox'}
    <label class="checkbox">
      <input type="checkbox" bind:checked={value} disabled={row.disabled} />
      <span>{row.label}{#if row.required}<span class="asterisk">*</span>{/if}</span>
    </label>
  {:else if row.type === 'select'}
    <select id="row-{row.label}" class="control" bind:value disabled={row.disabled}>
      <!-- `clearable` becomes an empty option; a native select always has a selection. -->
      {#if row.clearable || value === undefined}
        <option value={undefined}>{row.placeholder ?? ''}</option>
      {/if}
      {#each options as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  {:else if row.type === 'multi-select'}
    <select
      id="row-{row.label}"
      class="control multi"
      multiple
      onchange={onMultiSelect}
      disabled={row.disabled}
    >
      {#each options as option}
        <option value={option.value} selected={Array.isArray(value) && value.includes(option.value)}>
          {option.label}
        </option>
      {/each}
    </select>
  {:else if row.type === 'number'}
    <input
      id="row-{row.label}"
      class="control"
      type="number"
      bind:value
      min={row.min}
      max={row.max}
      step={row.step ?? (row.precision ? 1 / 10 ** row.precision : undefined)}
      placeholder={row.placeholder}
      disabled={row.disabled}
    />
  {:else if row.type === 'slider'}
    <div class="slider-row">
      <span class="bound">{row.min ?? 0}</span>
      <input
        id="row-{row.label}"
        class="range"
        type="range"
        bind:value
        min={row.min ?? 0}
        max={row.max ?? 100}
        step={row.step ?? 1}
        disabled={row.disabled}
      />
      <span class="bound">{row.max ?? 100}</span>
      <span class="slider-value">{value}</span>
    </div>
  {:else if row.type === 'color'}
    <!-- Native colour input is hex-only. `format` (rgb/hsl/alpha variants) is not
         honoured; the value is always #rrggbb. -->
    <input
      id="row-{row.label}"
      class="control color"
      type="color"
      bind:value
      disabled={row.disabled}
    />
  {:else if row.type === 'date'}
    <input
      id="row-{row.label}"
      class="control"
      type="date"
      value={toDateInput(value)}
      min={row.min ? toDateInput(new Date(row.min).getTime()) : undefined}
      max={row.max ? toDateInput(new Date(row.max).getTime()) : undefined}
      disabled={row.disabled}
      onchange={(e) => (value = fromDateInput(e.currentTarget.value))}
    />
  {:else if row.type === 'date-range'}
    <!-- No native range picker exists, so this is two date inputs over one value pair. -->
    <div class="range-row">
      <input
        class="control"
        type="date"
        value={toDateInput(rangeStart)}
        disabled={row.disabled}
        onchange={(e) => setRange(0, e.currentTarget.value)}
      />
      <span class="dash">–</span>
      <input
        class="control"
        type="date"
        value={toDateInput(rangeEnd)}
        disabled={row.disabled}
        onchange={(e) => setRange(1, e.currentTarget.value)}
      />
    </div>
  {:else if row.type === 'time'}
    <!-- `format: '12'` is not honoured: the native control follows the OS locale. -->
    <input
      id="row-{row.label}"
      class="control"
      type="time"
      value={toTimeInput(value)}
      disabled={row.disabled}
      onchange={(e) => (value = fromTimeInput(e.currentTarget.value))}
    />
  {:else if row.type === 'textarea'}
    <textarea
      id="row-{row.label}"
      class="control area"
      bind:value
      placeholder={row.placeholder}
      rows={row.min ?? 3}
      minlength={row.minLength}
      maxlength={row.maxLength}
      disabled={row.disabled}
    ></textarea>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-label);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    font-weight: 500;
    color: var(--color-dim);
  }

  .asterisk {
    color: var(--color-danger);
  }

  .description {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-gray);
  }

  .control {
    width: 100%;
    padding: 8px 12px;
    background: var(--surface-sunken);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    color: var(--color-white);
    font-size: var(--text-sm);
    transition: border-color var(--dur-fast) var(--ease-out);
  }
  .control:focus {
    border-color: rgba(34, 211, 238, 0.5);
    box-shadow: var(--ring-accent);
    outline: none;
  }
  .control:disabled {
    opacity: 0.5;
  }

  .field.invalid .control {
    border-color: var(--color-danger);
  }

  .with-affix {
    position: relative;
  }
  .affix {
    position: absolute;
    top: 50%;
    right: 8px;
    transform: translateY(-50%);
    color: var(--color-gray);
  }

  .multi {
    min-height: 96px;
  }

  .area {
    resize: vertical;
    font-family: inherit;
  }

  .color {
    height: 36px;
    padding: 4px;
  }

  .checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--text-sm);
  }
  .checkbox input {
    accent-color: var(--color-primary);
  }

  .slider-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .range {
    flex: 1;
    accent-color: var(--color-primary);
  }
  .bound,
  .slider-value {
    font-size: var(--text-meta);
    color: var(--color-dim);
    font-family: var(--font-mono);
  }
  .slider-value {
    min-width: 3ch;
    text-align: right;
    color: var(--color-primary);
  }

  .range-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dash {
    color: var(--color-dim);
  }
</style>
