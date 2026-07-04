export const THEME_SETTINGS_KEY = 'theme_settings';

export const THEME_GOOGLE_FONTS = [
  'Albert Sans',
  'Alegreya',
  'Anton',
  'Archivo',
  'Barlow',
  'Bebas Neue',
  'Bitter',
  'Cabin',
  'Cardo',
  'Cormorant Garamond',
  'Crimson Pro',
  'DM Sans',
  'DM Serif Display',
  'EB Garamond',
  'Exo 2',
  'Figtree',
  'Fira Sans',
  'Fraunces',
  'Gentium Book Plus',
  'Hind',
  'IBM Plex Sans',
  'Inter',
  'Inter Tight',
  'Josefin Sans',
  'Karla',
  'Lato',
  'Lexend',
  'Libre Baskerville',
  'Literata',
  'Lora',
  'Manrope',
  'Merriweather',
  'Montserrat',
  'Mulish',
  'Newsreader',
  'Noto Sans',
  'Noto Serif',
  'Nunito',
  'Nunito Sans',
  'Onest',
  'Open Sans',
  'Oswald',
  'Outfit',
  'Overpass',
  'Playfair Display',
  'Plus Jakarta Sans',
  'Poppins',
  'PT Serif',
  'Public Sans',
  'Quicksand',
  'Raleway',
  'Red Hat Display',
  'Righteous',
  'Roboto',
  'Rubik',
  'Sora',
  'Source Sans 3',
  'Source Serif 4',
  'Space Grotesk',
  'Spectral',
  'Titillium Web',
  'Ubuntu',
  'Vollkorn',
  'Work Sans',
];

export const THEME_SYSTEM_FONTS = [
  'system-ui',
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
];

export const THEME_FONT_OPTIONS = [...THEME_GOOGLE_FONTS, ...THEME_SYSTEM_FONTS];

const SERIF_FONT_PATTERN = /alegreya|bitter|cardo|cormorant|crimson|dm serif|eb garamond|fraunces|garamond|gentium|georgia|libre baskerville|literata|lora|merriweather|newsreader|noto serif|playfair|pt serif|source serif|spectral|times new roman|vollkorn/i;

export const THEME_ELEMENT_KEYS = ['body', 'p', 'h1', 'h2', 'h3', 'button'];

const HEX_COLOR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const CSS_SIZE = /^(\d+(\.\d+)?)(px|rem|em|pt|%)$/;

function defaultElementStyles(overrides = {}) {
  return {
    fontSize: '',
    fontWeight: '',
    color: '',
    backgroundColor: '',
    lineHeight: '',
    letterSpacing: '',
    marginBottom: '',
    borderRadius: '',
    paddingX: '',
    paddingY: '',
    ...overrides,
  };
}

export function getDefaultThemeSettings() {
  return {
    typography: {
      googleFont: 'Inter',
    },
    colorSet: {
      primary: '#4f46e5',
      secondary: '#64748b',
      accent: '#0ea5e9',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#0f172a',
      textMuted: '#64748b',
      border: '#e2e8f0',
      success: '#16a34a',
      danger: '#dc2626',
    },
    elements: {
      body: defaultElementStyles({
        fontSize: '16px',
        color: '#0f172a',
        backgroundColor: '#ffffff',
        lineHeight: '1.5',
      }),
      p: defaultElementStyles({
        fontSize: '16px',
        color: '#334155',
        lineHeight: '1.625',
        marginBottom: '1rem',
      }),
      h1: defaultElementStyles({
        fontSize: '2.25rem',
        fontWeight: '700',
        color: '#0f172a',
        lineHeight: '1.2',
        marginBottom: '1rem',
      }),
      h2: defaultElementStyles({
        fontSize: '1.875rem',
        fontWeight: '700',
        color: '#0f172a',
        lineHeight: '1.25',
        marginBottom: '0.875rem',
      }),
      h3: defaultElementStyles({
        fontSize: '1.5rem',
        fontWeight: '600',
        color: '#0f172a',
        lineHeight: '1.3',
        marginBottom: '0.75rem',
      }),
      button: defaultElementStyles({
        fontSize: '14px',
        fontWeight: '500',
        color: '#ffffff',
        backgroundColor: '#4f46e5',
        lineHeight: '1.25',
        borderRadius: '0.5rem',
        paddingX: '1.25rem',
        paddingY: '0.625rem',
      }),
    },
  };
}

function normalizeColor(value, fallback = '') {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  if (HEX_COLOR.test(raw)) return raw.length === 4 ? expandShortHex(raw) : raw;
  return fallback;
}

function expandShortHex(hex) {
  const h = hex.slice(1);
  return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`;
}

function normalizeSize(value, fallback = '') {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  return CSS_SIZE.test(raw) ? raw : fallback;
}

function normalizeString(value, fallback = '') {
  const raw = String(value ?? '').trim();
  return raw || fallback;
}

function normalizeElementStyles(raw, defaults) {
  return {
    fontSize: normalizeSize(raw?.fontSize, defaults.fontSize),
    fontWeight: normalizeString(raw?.fontWeight, defaults.fontWeight),
    color: normalizeColor(raw?.color, defaults.color),
    backgroundColor: normalizeColor(raw?.backgroundColor, defaults.backgroundColor),
    lineHeight: normalizeString(raw?.lineHeight, defaults.lineHeight),
    letterSpacing: normalizeString(raw?.letterSpacing, defaults.letterSpacing),
    marginBottom: normalizeSize(raw?.marginBottom, defaults.marginBottom),
    borderRadius: normalizeSize(raw?.borderRadius, defaults.borderRadius),
    paddingX: normalizeSize(raw?.paddingX, defaults.paddingX),
    paddingY: normalizeSize(raw?.paddingY, defaults.paddingY),
  };
}

function resolveGoogleFont(raw, defaults) {
  const candidate = String(raw?.typography?.googleFont ?? '').trim();
  if (candidate && THEME_FONT_OPTIONS.includes(candidate)) {
    return candidate;
  }

  for (const key of THEME_ELEMENT_KEYS) {
    const legacy = String(raw?.elements?.[key]?.fontFamily ?? '').trim();
    if (legacy && THEME_FONT_OPTIONS.includes(legacy)) {
      return legacy;
    }
  }

  return defaults.typography.googleFont;
}

export function normalizeThemeSettings(raw) {
  const defaults = getDefaultThemeSettings();
  const colorSet = { ...defaults.colorSet };
  for (const key of Object.keys(colorSet)) {
    colorSet[key] = normalizeColor(raw?.colorSet?.[key], defaults.colorSet[key]);
  }

  const typography = {
    googleFont: resolveGoogleFont(raw, defaults),
  };

  const elements = {};
  for (const key of THEME_ELEMENT_KEYS) {
    elements[key] = normalizeElementStyles(raw?.elements?.[key], defaults.elements[key]);
  }

  return { typography, colorSet, elements };
}

export function validateThemeSettingsPayload(body) {
  if (!body || typeof body !== 'object') {
    return { valid: false, message: 'missingPayload' };
  }

  const normalized = normalizeThemeSettings(body);
  return { valid: true, data: normalized };
}

export function formatThemeFontFamily(value) {
  const name = String(value ?? '').trim();
  if (!name) return '';

  if (name === 'system-ui') return 'system-ui, sans-serif';

  const quoted = name.includes(' ') ? `"${name}"` : name;
  const stack = SERIF_FONT_PATTERN.test(name) ? 'serif' : 'sans-serif';
  return `${quoted}, ${stack}`;
}

export function collectGoogleFontFamilies(theme) {
  const normalized = normalizeThemeSettings(theme);
  const font = normalized.typography?.googleFont;
  if (font && THEME_GOOGLE_FONTS.includes(font)) {
    return [font];
  }
  return [];
}

/** CSS custom properties for :root */
export function buildThemeCssVariables(theme) {
  const normalized = normalizeThemeSettings(theme);
  const vars = {};
  const globalFont = formatThemeFontFamily(normalized.typography.googleFont);

  for (const [key, value] of Object.entries(normalized.colorSet)) {
    vars[`--theme-color-${key}`] = value;
  }

  if (globalFont) {
    vars['--theme-font-family'] = globalFont;
  }

  for (const [element, styles] of Object.entries(normalized.elements)) {
    if (globalFont) {
      vars[`--theme-${element}-font-family`] = globalFont;
    }

    for (const [prop, value] of Object.entries(styles)) {
      if (!value) continue;
      const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
      vars[`--theme-${element}-${cssProp}`] = value;
    }
  }

  return vars;
}
