// Farbpaletten der Farbversuche (Ist / V1 wörtlich / V2 angepasst) und der Überschreib-CSS-Generator.
// Die App wird NICHT geändert: das CSS wird per page.addStyleTag nach dem App-CSS eingefügt.
export const GOLD = { hell: '#D9B46A', dunkel: '#E5C886' }

const light = {
  bg: '#F4F6F8', card: '#FFFFFF', card2: '#F1F5F9', text: '#1E293B', text2: '#64748B',
  sep: 'rgba(30,41,59,0.14)', segBg: 'rgba(100,116,139,0.14)', segActive: '#FFFFFF',
  tabbar: 'rgba(255,255,255,0.86)', backdrop: 'rgba(15,23,42,0.4)',
  expense: '#DC2626', expenseText: '#DC2626', warn: '#D97706', warnText: '#B45309',
  deleteBg: '#DC2626', toastBg: '#1E293B', toastAction: '#34D399', inactiveTab: '#94A3B8', chrome: '#F4F6F8',
}
const dark = {
  bg: '#0F172A', card: '#1E293B', card2: '#273449', text: '#F1F5F9', text2: '#94A3B8',
  sep: 'rgba(148,163,184,0.22)', segBg: 'rgba(148,163,184,0.20)', segActive: '#334155',
  tabbar: 'rgba(30,41,59,0.86)', backdrop: 'rgba(0,0,0,0.6)',
  expense: '#F87171', expenseText: '#F87171', warn: '#FBBF24', warnText: '#FBBF24',
  deleteBg: '#DC2626', toastBg: '#273449', toastAction: '#34D399', inactiveTab: '#94A3B8', chrome: '#0F172A',
}

export const PALETTES = {
  V1: {
    hell: { ...light, link: '#10B981', btnBg: '#10B981', btnText: '#FFFFFF', tabActive: '#10B981', income: '#10B981', incomeText: '#10B981', ok: '#10B981', okText: '#10B981',
      switchOn: '#10B981', tile1: ['#10B981', '#FFFFFF'], tile2: ['#1E293B', '#FFFFFF'], tile3: [GOLD.hell, '#1E293B'], icon: 'emerald' },
    dunkel: { ...dark, link: '#10B981', btnBg: '#10B981', btnText: '#FFFFFF', tabActive: '#10B981', income: '#10B981', incomeText: '#10B981', ok: '#10B981', okText: '#10B981',
      switchOn: '#10B981', tile1: ['#10B981', '#FFFFFF'], tile2: ['#334155', '#F1F5F9'], tile3: [GOLD.dunkel, '#0F172A'], icon: 'emerald' },
  },
  V2: {
    hell: { ...light, text2: '#5B6B80', link: '#047857', btnBg: '#1E293B', btnText: '#FFFFFF', tabActive: '#1E293B', income: '#059669', incomeText: '#047857', ok: '#059669', okText: '#047857',
      switchOn: '#059669', inactiveTab: '#64748B', tile1: ['#1E293B', '#FFFFFF'], tile2: ['#059669', '#FFFFFF'], tile3: ['#64748B', '#FFFFFF'], icon: 'slate-gold' },
    // Dunkel: zwei Knopf-Varianten, siehe btnVariant (gewählt: Smaragd-Knopf; V2b = heller Knopf als Alternative)
    dunkel: { ...dark, link: '#34D399', btnBg: '#34D399', btnText: '#0F172A', tabActive: '#F1F5F9', income: '#34D399', incomeText: '#34D399', ok: '#34D399', okText: '#34D399',
      switchOn: '#059669', tile1: ['#334155', '#F1F5F9'], tile2: ['#059669', '#FFFFFF'], tile3: ['#64748B', '#FFFFFF'], icon: 'slate-gold' },
  },
}
export const V2_DARK_EMERALD_BTN = { btnBg: '#F1F5F9', btnText: '#0F172A' } // Alternative: heller Knopf (V2b)

export function overrideCSS(p) {
  return `
html:root[data-theme] {
  --bg:${p.bg}; --card:${p.card}; --card-2:${p.card2}; --text:${p.text}; --text-2:${p.text2}; --sep:${p.sep};
  --accent:${p.link}; --income:${p.income}; --income-text:${p.incomeText}; --expense:${p.expense}; --expense-text:${p.expenseText};
  --ok:${p.ok}; --ok-text:${p.okText}; --warn:${p.warn}; --warn-text:${p.warnText};
  --tabbar-bg:${p.tabbar}; --backdrop:${p.backdrop}; --seg-bg:${p.segBg}; --seg-active:${p.segActive}; --delete-bg:${p.deleteBg};
}
/* Stellen mit hart codierten Farben bzw. Rollen, die --accent in der App gleichzeitig als Link und als Knopf nutzt */
html:root[data-theme] .btn:not(.secondary):not(.danger), html:root[data-theme] .fab, html:root[data-theme] .confirm-actions button.primary, html:root[data-theme] .pill-btn { background:${p.btnBg}; color:${p.btnText}; }
html:root[data-theme] .tab { color:${p.inactiveTab}; }
html:root[data-theme] .tab[aria-current='page'] { color:${p.tabActive}; }
html:root[data-theme] .menu-icon.blue { background:${p.tile1[0]}; color:${p.tile1[1]}; }
html:root[data-theme] .menu-icon.green { background:${p.tile2[0]}; color:${p.tile2[1]}; }
html:root[data-theme] .menu-icon.orange { background:${p.tile3[0]}; color:${p.tile3[1]}; }
html:root[data-theme] .field input.switch:checked { background:${p.switchOn}; }
html:root[data-theme] .toast { background:${p.toastBg}; }
html:root[data-theme] .toast button { color:${p.toastAction}; }
html:root[data-theme] .text-btn { color:${p.link}; }
html:root[data-theme] .lock-icon, html:root[data-theme] .a-top img { box-shadow:none; }
`
}

// Icon-Varianten (SVG der Waage aus design/sperrbildschirm/scripts/build-mockups.mjs)
const SCALE = (stroke, fill) => `<g transform="translate(28.8 33) scale(1.35)" fill="none" stroke="${stroke}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="32" cy="10" r="2.6" fill="${stroke}" stroke="none"/><path d="M32 13v37M13 19h38M21 53h22"/><path d="M13 19 6 37M13 19l7 18M51 19l-7 18M51 19l7 18"/><path d="M5 37h16a8 6.5 0 0 1-16 0zM43 37h16a8 6.5 0 0 1-16 0z" fill="${fill}"/></g>`
export function iconSVG(kind) {
  const bg = kind === 'emerald' ? '#10B981' : '#1E293B'
  const fg = kind === 'emerald' ? '#FFFFFF' : GOLD.hell
  return `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 144 144"><rect width="144" height="144" rx="32" fill="${bg}"/>${SCALE(fg, fg)}</svg>`
}
