<script lang="ts">
  import Icon from '../../lib/Icon.svelte';
  import ColorField from './ColorField.svelte';
  import DateField from './DateField.svelte';
  import { toTimeInput, fromTimeInput } from './datetime';

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

  // `precision` is Mantine's decimal-places option; with no explicit step it implies one.
  const numberStep = $derived(row.step ?? (row.precision ? 1 / 10 ** row.precision : 1));

  function step(direction: 1 | -1) {
    const next = (Number(value) || 0) + numberStep * direction;
    const clamped = Math.min(
      Math.max(next, row.min ?? -Infinity),
      row.max ?? Infinity,
    );

    // Floating-point steps accumulate error (0.1 + 0.2), so the result is rounded back to
    // the precision the step implies.
    const decimals = row.precision ?? (String(numberStep).split('.')[1]?.length ?? 0);
    value = Number(clamped.toFixed(decimals));
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
    <!-- Chromium's native spinners cannot be themed — they are a shadow-DOM control that
         ignores everything but width, and they render as a light-mode artefact against a
         dark panel. Hidden below, with themed steppers in their place. -->
    <div class="number-field">
      <input
        id="row-{row.label}"
        class="control"
        type="number"
        bind:value
        min={row.min}
        max={row.max}
        step={numberStep}
        placeholder={row.placeholder}
        disabled={row.disabled}
      />
      <div class="steppers">
        <button type="button" disabled={row.disabled} onclick={() => step(1)} aria-label="Increment">
          <Icon icon="chevron-up" size="9px" />
        </button>
        <button type="button" disabled={row.disabled} onclick={() => step(-1)} aria-label="Decrement">
          <Icon icon="chevron-down" size="9px" />
        </button>
      </div>
    </div>
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
    <ColorField id="row-{row.label}" bind:value format={row.format} disabled={row.disabled} />
  {:else if row.type === 'date' || row.type === 'date-range'}
    <DateField
      id="row-{row.label}"
      bind:value
      range={row.type === 'date-range'}
      format={row.format ?? 'DD/MM/YYYY'}
      min={row.min}
      max={row.max}
      clearable={row.clearable}
      disabled={row.disabled}
    />
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

  /* Number field: native spinners removed, themed steppers overlaid. */
  .number-field {
    position: relative;
  }

  .number-field .control {
    padding-right: 30px;
    appearance: textfield;
  }

  .number-field .control::-webkit-outer-spin-button,
  .number-field .control::-webkit-inner-spin-button {
    appearance: none;
    margin: 0;
  }

  .steppers {
    position: absolute;
    top: 1px;
    right: 1px;
    bottom: 1px;
    display: flex;
    flex-direction: column;
    width: 22px;
    border-left: 1px solid var(--color-border);
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
    overflow: hidden;
  }

  .steppers button {
    display: grid;
    place-items: center;
    flex: 1;
    background: var(--color-surface-2);
    color: var(--color-gray);
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
  }

  .steppers button:hover:not(:disabled) {
    background: var(--primary-glow);
    color: var(--color-primary);
  }

  .steppers button:first-child {
    border-bottom: 1px solid var(--color-border);
  }

  .steppers button:disabled {
    opacity: 0.5;
  }

  .area {
    resize: vertical;
    font-family: inherit;
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

</style>
