/** Map an accuracy (0–1) to a semantic tone used for bars and chips. */
export function toneFor(accuracy, attempted = true) {
  if (!attempted) return 'neutral';
  if (accuracy < 0.4) return 'danger';
  if (accuracy < 0.6) return 'warning';
  return 'good';
}

export function toneLabel(tone) {
  return { danger: 'Needs work', warning: 'Getting there', good: 'Solid', neutral: 'Not started' }[tone];
}

/** Topic summaries arrive as a bullet-ish string (sometimes an array). Normalise to lines. */
export function summaryLines(summary) {
  if (!summary) return [];
  const list = Array.isArray(summary) ? summary : String(summary).split(/\n+/);
  return list
    .map((l) => String(l).replace(/^\s*(?:[-*•‣–]|\d+[.)])\s*/, '').trim())
    .filter(Boolean);
}
