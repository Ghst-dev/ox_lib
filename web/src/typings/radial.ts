import type { IconProp } from '../lib/icon';

export interface RadialMenuItem {
  icon: string | IconProp;
  label: string;
  isMore?: boolean;
  menu?: string;
  iconWidth?: number;
  iconHeight?: number;
}
