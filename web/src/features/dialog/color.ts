/**
 * Colour conversion for the input dialog's `color` row.
 *
 * ox_lib's IColorInput carries a `format` of hex | hexa | rgb | rgba | hsl | hsla, and
 * the value returned to Lua has to be a string in that format. Mantine's ColorInput did
 * this; the native <input type="color"> could not — it is hex-only, and it delegates to
 * an OS colour chooser that has nowhere to draw over a fullscreen game.
 */

export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla';

export interface Hsva {
  h: number; // 0-360
  s: number; // 0-1
  v: number; // 0-1
  a: number; // 0-1
}

interface Rgb {
  r: number; // 0-255
  g: number;
  b: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);
const hex2 = (n: number) => Math.round(n).toString(16).padStart(2, '0');

export function hsvToRgb({ h, s, v }: Omit<Hsva, 'a'>): Rgb {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}

export function rgbToHsv({ r, g, b }: Rgb): Omit<Hsva, 'a'> {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;

  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === rr) h = 60 * (((gg - bb) / d) % 6);
    else if (max === gg) h = 60 * ((bb - rr) / d + 2);
    else h = 60 * ((rr - gg) / d + 4);
  }

  return { h: (h + 360) % 360, s: max === 0 ? 0 : d / max, v: max };
}

function rgbToHsl({ r, g, b }: Rgb) {
  const rr = r / 255;
  const gg = g / 255;
  const bb = b / 255;

  const max = Math.max(rr, gg, bb);
  const min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;

  let h = 0;
  let s = 0;

  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    if (max === rr) h = 60 * (((gg - bb) / d) % 6);
    else if (max === gg) h = 60 * ((bb - rr) / d + 2);
    else h = 60 * ((rr - gg) / d + 4);
  }

  return { h: (h + 360) % 360, s, l };
}

/**
 * Parse any of the six supported formats, plus 3- and 4-digit hex shorthand. Falls back
 * to opaque white rather than throwing — a malformed default from Lua should not take the
 * whole dialog down.
 */
export function parseColor(input?: string): Hsva {
  const fallback: Hsva = { h: 0, s: 0, v: 1, a: 1 };
  if (!input || typeof input !== 'string') return fallback;

  const value = input.trim().toLowerCase();

  if (value.startsWith('#')) {
    let hex = value.slice(1);

    // #rgb / #rgba shorthand
    if (hex.length === 3 || hex.length === 4) {
      hex = hex
        .split('')
        .map((c) => c + c)
        .join('');
    }

    if (hex.length !== 6 && hex.length !== 8) return fallback;

    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1;

    if ([r, g, b].some(Number.isNaN)) return fallback;
    return { ...rgbToHsv({ r, g, b }), a };
  }

  const nums = value.match(/[\d.]+/g)?.map(Number);
  if (!nums || nums.length < 3) return fallback;

  if (value.startsWith('hsl')) {
    // Round-trip through rgb so the picker only ever holds hsv internally.
    const [h, sPct, lPct] = nums;
    const s = sPct / 100;
    const l = lPct / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    const [r, g, b] =
      h < 60
        ? [c, x, 0]
        : h < 120
          ? [x, c, 0]
          : h < 180
            ? [0, c, x]
            : h < 240
              ? [0, x, c]
              : h < 300
                ? [x, 0, c]
                : [c, 0, x];

    return {
      ...rgbToHsv({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 }),
      a: nums[3] ?? 1,
    };
  }

  return { ...rgbToHsv({ r: nums[0], g: nums[1], b: nums[2] }), a: nums[3] ?? 1 };
}

/** Render an hsva as the string shape the row asked for. */
export function formatColor(hsva: Hsva, format: ColorFormat = 'hex'): string {
  const rgb = hsvToRgb(hsva);
  const r = Math.round(rgb.r);
  const g = Math.round(rgb.g);
  const b = Math.round(rgb.b);
  const a = Math.round(clamp(hsva.a, 0, 1) * 100) / 100;

  switch (format) {
    case 'hexa':
      return `#${hex2(r)}${hex2(g)}${hex2(b)}${hex2(a * 255)}`;
    case 'rgb':
      return `rgb(${r}, ${g}, ${b})`;
    case 'rgba':
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    case 'hsl': {
      const { h, s, l } = rgbToHsl({ r, g, b });
      return `hsl(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }
    case 'hsla': {
      const { h, s, l } = rgbToHsl({ r, g, b });
      return `hsla(${Math.round(h)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%, ${a})`;
    }
    default:
      return `#${hex2(r)}${hex2(g)}${hex2(b)}`;
  }
}

/** Opaque CSS colour for swatches, ignoring alpha. */
export function toCss(hsva: Hsva): string {
  const { r, g, b } = hsvToRgb(hsva);
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}
