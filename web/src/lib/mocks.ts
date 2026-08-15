/**
 * Canned `fetchNui` responses for browser development.
 *
 * Most NUI callbacks are fire-and-forget, but a few are awaited and their return value
 * changes what the UI does next. Without these the browser harness cannot exercise those
 * paths at all — `radialTransition` was the one that surfaced it: changePage awaits it
 * and bails when it is falsy, so radial paging simply did nothing outside the game.
 *
 * Only consulted when running outside CEF; in game the real callback always answers.
 */
export const nuiMocks: Record<string, unknown | ((data?: unknown) => unknown)> = {
  /** radial.lua waits 100ms and returns false if the menu closed meanwhile. */
  radialTransition: true,

  /** Mantine leftovers the config store accepts and ignores. */
  getConfig: { primaryColor: 'blue', primaryShade: 6 },
};
