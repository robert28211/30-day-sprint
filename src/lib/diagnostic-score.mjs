// Demand Collapse Diagnostic™ scoring. Pure functions so the tie rule is testable
// (node --test src/lib/diagnostic-score.test.mjs).
//
// Primary failure mode = the section with the LOWEST total (3 questions, 3 to 30).
//
// Tie rule, stated so it is never silent:
//   1. Lowest section total wins.
//   2. Tied totals: the section holding the lowest single answer wins. One answer
//      at 2 is a sharper breakdown than three answers at 6.
//   3. Still tied: the section earlier in the buyer journey wins (1 before 4).
//      Demand lost upstream never reaches the later stages, so it is investigated first.
// A secondary failure mode is reported when the next-lowest section is within
// CLOSE_MARGIN points of the primary, or tied with it.

export const FAILURE_MODES = [
  'Not Seen When the Decision Is Made',
  'Seen But Not Trusted',
  'Trusted But Still Compared',
  'Selected But No Action',
];

export const CLOSE_MARGIN = 2;

export function scoreDiagnostic(answers) {
  if (!Array.isArray(answers) || answers.length !== 12 || answers.some(v => !(v >= 1 && v <= 10))) {
    return null;
  }
  const sections = [0, 1, 2, 3].map(s => {
    const vals = answers.slice(s * 3, s * 3 + 3);
    return { idx: s, name: FAILURE_MODES[s], total: vals.reduce((a, b) => a + b, 0), lowest: Math.min(...vals) };
  });
  const ranked = [...sections].sort((a, b) =>
    a.total - b.total || a.lowest - b.lowest || a.idx - b.idx
  );
  const primary = ranked[0];
  const runnerUp = ranked[1];
  const tied = runnerUp.total === primary.total;
  const close = runnerUp.total - primary.total <= CLOSE_MARGIN;
  let tieBrokenBy = null;
  if (tied) tieBrokenBy = runnerUp.lowest !== primary.lowest ? 'lowest_answer' : 'journey_order';
  return {
    primary,
    secondary: close ? runnerUp : null,
    tied,
    tieBrokenBy,
    sections,
    total: sections.reduce((a, s) => a + s.total, 0),
  };
}
