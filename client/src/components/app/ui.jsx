import React from 'react';

/*
 * "Workbench" design system for the signed-in app.
 * Warm paper background, black ink, hairline borders, lime accent,
 * serif display type (font-display) and small mono labels (font-mono).
 *
 * Tokens
 *   paper   #F4F1EA  (page background, set by AppLayout)
 *   surface #FFFDF8  (panels)
 *   line    #E3DED3  (1px borders / dividers)
 *   ink     #141414  (text, primary buttons, dark panels)
 *   muted   #6B6760  (body text)   faint #9A958B (meta text)
 *   green   #0d5b46  (accent, from the landing page)   pale #9fe3c9 (accent on ink panels)
 *   amber   #F5B83D  coral #FF6B4A (warnings / damage / replace)
 */

export const cx = (...c) => c.filter(Boolean).join(' ');

/** Standard panel: surface, hairline border, modest radius. */
export const Panel = ({ as: Tag = 'section', className = '', children, ...rest }) => (
  <Tag className={cx('min-w-0 rounded-2xl border border-[#E3DED3] bg-[#FFFDF8]', className)} {...rest}>
    {children}
  </Tag>
);

/** Ink panel for the one highlight per page. */
export const InkPanel = ({ as: Tag = 'section', className = '', children, ...rest }) => (
  <Tag className={cx('min-w-0 rounded-2xl bg-[#141414] text-[#FFFDF8]', className)} {...rest}>
    {children}
  </Tag>
);

/** Small mono label, e.g. section eyebrows and table headings. */
export const Label = ({ className = '', children }) => (
  <p className={cx('font-mono text-[11px] uppercase tracking-[0.14em] text-[#9A958B]', className)}>{children}</p>
);

/** Serif page heading. Pass `italic` text as children for emphasis, e.g. <em>. */
export const PageTitle = ({ eyebrow, title, intro, actions }) => (
  <div className="flex flex-col gap-4 border-b border-[#E3DED3] pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0">
      {eyebrow && <Label>{eyebrow}</Label>}
      <h1 className="mt-2 font-display text-[2.6rem] leading-[1.02] tracking-tight text-[#141414] sm:text-[3.4rem]">{title}</h1>
      {intro && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#6B6760]">{intro}</p>}
    </div>
    {actions && <div className="flex flex-shrink-0 flex-wrap gap-2">{actions}</div>}
  </div>
);

const verdictTone = {
  REPAIR: 'bg-[#0d5b46] text-white',
  EITHER: 'bg-[#F5B83D]/25 text-[#7A5200]',
  REPLACE: 'bg-[#FF6B4A]/15 text-[#B23A1E]',
};

export const VerdictBadge = ({ verdict, className = '' }) => (
  <span className={cx('inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider', verdictTone[verdict] || 'bg-[#EFEBE2] text-[#6B6760]', className)}>
    {verdict}
  </span>
);

/* Class strings for native elements (buttons, links, inputs). */
export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#141414] px-4 py-2.5 text-sm font-medium text-[#FFFDF8] transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50',
  accent:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-[#0d5b46] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#0a4a39] disabled:cursor-not-allowed disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-4 py-2.5 text-sm font-medium text-[#141414] transition hover:border-[#141414]/30 disabled:cursor-not-allowed disabled:opacity-50',
  ghost: 'inline-flex items-center gap-1.5 text-sm font-medium text-[#141414] underline-offset-4 hover:underline',
};

export const field =
  'w-full rounded-lg border border-[#E3DED3] bg-[#FFFDF8] px-3.5 py-2.5 text-[15px] text-[#141414] placeholder:text-[#9A958B] focus:border-[#141414] focus:outline-none focus:ring-2 focus:ring-[#0d5b46]/15';

export const fieldLabel = 'mb-1.5 block text-sm font-medium text-[#141414]';

/** Chip / toggle. */
export const chip = (selected) =>
  cx(
    'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs transition',
    selected ? 'border-[#141414] bg-[#141414] text-[#FFFDF8]' : 'border-[#E3DED3] bg-[#FFFDF8] text-[#6B6760] hover:border-[#141414]/40 hover:text-[#141414]'
  );
