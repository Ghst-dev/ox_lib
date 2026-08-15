/**
 * Replaces the React LocaleProvider / ConfigProvider.
 *
 * Both are tiny pieces of shared state, so they are plain rune-backed objects rather
 * than context — any component can import them directly.
 */

import { fetchNui, onNuiEvent, debugData } from './nui';

export interface Locale {
  language: string;
  ui: {
    cancel: string;
    close: string;
    confirm: string;
    more: string;
  };
}

/**
 * UI strings, pushed by `resource/locale/client.lua` in response to the `init` callback.
 * Defaults are English rather than empty: if the handshake ever fails, buttons still read
 * as buttons instead of rendering blank.
 */
export const locale = $state<Locale>({
  language: 'English',
  ui: {
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    more: 'More...',
  },
});

/**
 * `getConfig` returns Mantine's `{ primaryColor, primaryShade }`, which means nothing now
 * that the theme comes from CSS tokens. The call is still made and the result still
 * accepted, because dropping it would leave `RegisterNUICallback('getConfig')` in
 * resource/client.lua unanswered — the values are simply ignored.
 */
export const config = $state<{ primaryColor: string; primaryShade: number }>({
  primaryColor: 'blue',
  primaryShade: 6,
});

/** Wire up the locale listener and run the startup handshake. Call once, from the root. */
export function initShell(): () => void {
  const off = onNuiEvent<Locale>('setLocale', (data) => {
    locale.language = data.language;
    Object.assign(locale.ui, data.ui);
  });

  // `init` is what makes locale/client.lua push `setLocale` back at us. Without it every
  // label in the UI renders empty in game.
  fetchNui('init').catch(() => {});
  fetchNui<typeof config>('getConfig')
    .then((data) => data && Object.assign(config, data))
    .catch(() => {});

  return off;
}

debugData([
  {
    action: 'setLocale',
    data: {
      language: 'English',
      ui: { cancel: 'Cancel', close: 'Close', confirm: 'Confirm', more: 'More...' },
    },
  },
]);
