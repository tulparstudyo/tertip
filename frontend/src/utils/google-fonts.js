/** Google Fonts + sistem yazı tipleri kataloğu */

export const GOOGLE_FONTS = [
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

export const SYSTEM_FONTS = [
  'system-ui',
  'Georgia',
  'Times New Roman',
  'Arial',
  'Helvetica',
];

const SERIF_PATTERN = /alegreya|bitter|cardo|cormorant|crimson|dm serif|eb garamond|fraunces|garamond|gentium|georgia|libre baskerville|literata|lora|merriweather|newsreader|noto serif|playfair|pt serif|source serif|spectral|times new roman|vollkorn/i;

export function isGoogleFont(name) {
  return GOOGLE_FONTS.includes(String(name ?? '').trim());
}

export function formatFontFamilyCss(name) {
  const value = String(name ?? '').trim();
  if (!value) return '';

  if (value === 'system-ui') return 'system-ui, sans-serif';

  const quoted = value.includes(' ') ? `"${value}"` : value;
  const stack = SERIF_PATTERN.test(value) ? 'serif' : 'sans-serif';
  return `${quoted}, ${stack}`;
}

export function collectThemeFontFamilies(theme) {
  if (!theme?.elements) return [];
  return [
    ...new Set(
      Object.values(theme.elements)
        .map((styles) => styles?.fontFamily)
        .filter(Boolean),
    ),
  ];
}

export function collectGoogleFontFamilies(theme) {
  const font = String(theme?.typography?.googleFont ?? '').trim();
  if (font && isGoogleFont(font)) return [font];

  return collectThemeFontFamilies(theme).filter(isGoogleFont);
}

let linkEl = null;

function buildGoogleFontsUrl(families) {
  const query = families
    .map((family) => {
      const encoded = encodeURIComponent(family).replace(/%20/g, '+');
      return `family=${encoded}:wght@400;500;600;700`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

/** Seçili Google Fonts ailelerini tek stylesheet ile yükler. */
export function loadGoogleFonts(families) {
  const requested = [...new Set((families ?? []).filter(isGoogleFont))];
  if (!requested.length) return;

  const href = buildGoogleFontsUrl(requested);

  if (!linkEl) {
    linkEl = document.createElement('link');
    linkEl.rel = 'stylesheet';
    linkEl.id = 'tertip-google-fonts';
    document.head.appendChild(linkEl);
  }

  if (linkEl.href !== href) {
    linkEl.href = href;
  }
}

export function ensureGoogleFontsPreconnect() {
  if (document.getElementById('tertip-google-fonts-preconnect')) return;

  for (const [href, crossOrigin] of [
    ['https://fonts.googleapis.com', false],
    ['https://fonts.gstatic.com', true],
  ]) {
    const link = document.createElement('link');
    link.id = href.includes('gstatic') ? 'tertip-google-fonts-preconnect-gstatic' : 'tertip-google-fonts-preconnect';
    link.rel = 'preconnect';
    link.href = href;
    if (crossOrigin) link.crossOrigin = '';
    document.head.appendChild(link);
  }
}
