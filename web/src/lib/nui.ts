/**
 * NUI bridge.
 *
 * ox_lib's wire protocol is `{ action, data }` — note this differs from the
 * `{ type, payload }` used by ghst_template. Every `action` string here has to match
 * `resource/interface/client/*.lua` exactly; a typo fails silently, which is the main
 * hazard in this rewrite.
 */

import { nuiMocks } from './mocks';

// Capture the real fetch before it is taken away below.
const realFetch = window.fetch;

/** True when running in a normal browser rather than the game's CEF instance. */
export const isEnvBrowser = (): boolean => !(window as any).invokeNative;

/**
 * Kept from the React implementation: once the page has what it needs, remove its
 * ability to make arbitrary network requests, so a compromised NUI page cannot phone
 * home. Only applied in game — nulling these in a browser breaks Vite's dev client.
 */
if (!isEnvBrowser()) {
  // @ts-expect-error deliberately removing the global
  window.fetch = () => {};
  // @ts-expect-error deliberately removing the global
  window.XMLHttpRequest = window.fetch;
}

/** Resource name, used to address the NUI callback endpoint. */
const resourceName = (): string =>
  (window as any).GetParentResourceName?.() ?? 'nui-frame-app';

/**
 * POST to a `RegisterNUICallback` endpoint and return its `cb(...)` value.
 *
 * In a plain browser there is no CEF to answer, and the request resolves to a DNS
 * failure that Chromium logs regardless of whether the promise is caught. Since the dev
 * harness drives the UI with `debugData` rather than round-trips, short-circuit instead
 * — it keeps the dev console readable, which matters when the console is how you spot a
 * mistyped action name.
 */
export async function fetchNui<T = any>(eventName: string, data?: unknown): Promise<T> {
  if (isEnvBrowser()) {
    const mock = nuiMocks[eventName];
    const value = typeof mock === 'function' ? mock(data) : mock;

    console.debug(`[nui] fetchNui("${eventName}") skipped — not running in CEF`, data, '->', value);
    return value as T;
  }

  const resp = await realFetch(`https://${resourceName()}/${eventName}`, {
    method: 'post',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify(data),
  });

  return resp.json();
}

interface NuiMessage<T = unknown> {
  action: string;
  data: T;
}

/**
 * Subscribe to a `SendNUIMessage` action. Returns an unsubscribe function, so it can be
 * returned directly from `$effect` or `onMount`.
 */
export function onNuiEvent<T = any>(action: string, handler: (data: T) => void): () => void {
  const listener = (event: MessageEvent<NuiMessage<T>>) => {
    if (event.data?.action === action) handler(event.data.data);
  };

  window.addEventListener('message', listener);
  return () => window.removeEventListener('message', listener);
}

interface DebugEvent<T = unknown> {
  action: string;
  data: T;
}

/**
 * Fire inbound NUI messages at ourselves, so the UI can be driven in a browser with no
 * game running. No-ops in the game and in production builds.
 */
export function debugData<T>(events: DebugEvent<T>[], timer = 1000): void {
  if (!import.meta.env.DEV || !isEnvBrowser()) return;

  for (const event of events) {
    setTimeout(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          data: { action: event.action, data: event.data },
        }),
      );
    }, timer);
  }
}
