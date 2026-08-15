import type { IconProp, IconAnimation, StyleObject } from '../lib/icon';

/**
 * The eight positions ox_lib's settings menu offers — see `resource/settings.lua`.
 *
 * `center-left` and `center-right` are the two the React build could not do natively;
 * they came from a local patch to react-hot-toast. The Svelte notification component
 * implements all eight directly, so the patch is gone.
 */
export type NotificationPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'center-left'
  | 'center-right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export interface NotificationProps {
  style?: StyleObject;
  description?: string;
  title?: string;
  duration?: number;
  showDuration?: boolean;
  icon?: IconProp;
  iconColor?: string;
  iconAnimation?: IconAnimation;
  position?: NotificationPosition;
  id?: number | string;
  type?: string;
  alignIcon?: 'top' | 'center';
}
