import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreDiagnostic } from './diagnostic-score.mjs';

const fill = (a, b, c, d) => [...a, ...b, ...c, ...d];

test('clear lowest section wins, no secondary', () => {
  const r = scoreDiagnostic(fill([8, 8, 8], [3, 3, 3], [8, 8, 8], [9, 9, 9]));
  assert.equal(r.primary.idx, 1);
  assert.equal(r.secondary, null);
  assert.equal(r.tied, false);
});

test('materially close runner-up is reported as secondary', () => {
  const r = scoreDiagnostic(fill([5, 5, 5], [5, 5, 6], [9, 9, 9], [9, 9, 9]));
  assert.equal(r.primary.idx, 0);
  assert.equal(r.secondary.idx, 1);
});

test('tie on totals breaks on lowest single answer, not on order', () => {
  // FM1 and FM4 both total 15; FM4 holds a 1, so FM4 is primary.
  const r = scoreDiagnostic(fill([5, 5, 5], [9, 9, 9], [9, 9, 9], [1, 7, 7]));
  assert.equal(r.primary.idx, 3);
  assert.equal(r.secondary.idx, 0);
  assert.equal(r.tieBrokenBy, 'lowest_answer');
});

test('full tie falls back to buyer-journey order and says so', () => {
  const r = scoreDiagnostic(fill([9, 9, 9], [9, 9, 9], [4, 5, 6], [6, 5, 4]));
  assert.equal(r.primary.idx, 2);
  assert.equal(r.secondary.idx, 3);
  assert.equal(r.tieBrokenBy, 'journey_order');
});

test('all twelve identical answers', () => {
  const r = scoreDiagnostic(new Array(12).fill(5));
  assert.equal(r.primary.idx, 0);
  assert.equal(r.secondary.idx, 1);
  assert.equal(r.tieBrokenBy, 'journey_order');
});

test('incomplete or invalid answers return null', () => {
  assert.equal(scoreDiagnostic(new Array(11).fill(5)), null);
  assert.equal(scoreDiagnostic([...new Array(11).fill(5), null]), null);
  assert.equal(scoreDiagnostic([...new Array(11).fill(5), 11]), null);
});
