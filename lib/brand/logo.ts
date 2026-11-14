export const LOGO_GRADIENT = { from: "#FFD9C7", to: "#EE7AA3" } as const;

const DEFS =
  '<defs><linearGradient id="kb1" x1="0" y1="0" x2="1" y2="1">' +
  `<stop offset="0" stop-color="${LOGO_GRADIENT.from}"/>` +
  `<stop offset="1" stop-color="${LOGO_GRADIENT.to}"/>` +
  "</linearGradient></defs>";

const ART =
  '<path d="M20 80c0-23 18-42 40-42s40 19 40 42c0 8-6 13-14 13H34c-8 0-14-5-14-13z" fill="#FFF8F2"/>' +
  '<path d="M50 41c3-7 7-10 10-10s7 3 10 10" fill="none" stroke="#F0C3B2" stroke-width="3.5" stroke-linecap="round"/>' +
  '<path d="M43 67c2.5 3 7.5 3 10 0M67 67c2.5 3 7.5 3 10 0" fill="none" stroke="#2B1B22" stroke-width="3.6" stroke-linecap="round"/>' +
  '<path d="M55 76c3 2.4 7 2.4 10 0" fill="none" stroke="#2B1B22" stroke-width="3" stroke-linecap="round"/>' +
  '<circle cx="40" cy="76" r="4.5" fill="#FF9EB5" opacity="0.75"/>' +
  '<circle cx="80" cy="76" r="4.5" fill="#FF9EB5" opacity="0.75"/>' +
  '<path d="M93 14l3.4 9.6 9.6 3.4-9.6 3.4L93 40l-3.4-9.6L80 27l9.6-3.4z" fill="#FFC94A"/>';

function svg(background: string, art: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${DEFS}${background}${art}</svg>`;
}

const ROUNDED_BG = '<rect width="120" height="120" rx="27" fill="url(#kb1)"/>';
const SQUARE_BG = '<rect width="120" height="120" fill="url(#kb1)"/>';

export const LOGO_SVG_ROUNDED = svg(ROUNDED_BG, ART);
export const LOGO_SVG_SQUARE = svg(SQUARE_BG, ART);
export const LOGO_SVG_MASKABLE = svg(
  SQUARE_BG,
  `<g transform="translate(12 12) scale(0.8)">${ART}</g>`,
);
