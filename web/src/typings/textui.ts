import type { IconProp, IconAnimation, StyleObject } from '../lib/icon';

export type TextUiPosition = 'right-center' | 'left-center' | 'top-center' | 'bottom-center';

export interface TextUiProps {
  text: string;
  position?: TextUiPosition;
  icon?: IconProp;
  iconColor?: string;
  iconAnimation?: IconAnimation;
  style?: StyleObject;
  alignIcon?: 'top' | 'center';
}
