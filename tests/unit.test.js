/**
 * Unit tests for pure logic functions.
 *
 * Tests cover: scoring functions, score projection,
 * review velocity, gap matrix, key gap identification,
 * and total revenue leak helpers.
 */

import { describe, it, expect } from 'vitest';
import { scoreRating, scoreReviews, scorePhotos } from '../src/modules/audit.js';
import { buildMatrix, identifyKeyGaps } from '../src/modules/competitors.js';
import { totalRevenueLeak, scoreProjectionForTest } from '../src/modules/reportRenderer.js';

// ---------------------------------------------------------------------------
// Scoring functions (audit.js)
// ---------------------------------------------------------------------------

describe('scoreRating', () => {
  it('returns 15 for rating >= 4.0', () => {
    expect(scoreRating(4.0)).toBe(15);
    expect(scoreRating(4.5)).toBe(15);
    expect(scoreRating(5.0)).toBe(15);
  });
  it('returns 8 for rating 3.5–3.9', () => {
    expect(scoreRating(3.5)).toBe(8);
    expect(scoreRating(3.9)).toBe(8);
  });
  it('returns 0 for rating below 3.5', () => {
    expect(scoreRating(3.4)).toBe(0);
    expect(scoreRating(1.0)).toBe(0);
  });
  it('returns 0 for null/undefined', () => {
    expect(scoreRating(null)).toBe(0);
    expect(scoreRating(undefined)).toBe(0);
  });
});

describe('scoreReviews', () => {
  it('returns 15 for >= 50 reviews', () => {
    expect(scoreReviews(50)).toBe(15);
    expect(scoreReviews(500)).toBe(15);
  });
  it('returns 10 for 25–49 reviews', () => {
    expect(scoreReviews(25)).toBe(10);
    expect(scoreReviews(49)).toBe(10);
  });
  it('returns 5 for 10–24 reviews', () => {
    expect(scoreReviews(10)).toBe(5);
    expect(scoreReviews(24)).toBe(5);
  });
  it('returns 0 for fewer than 10 reviews', () => {
    expect(scoreReviews(9)).toBe(0);
    expect(scoreReviews(0)).toBe(0);
  });
  it('returns 0 for null', () => {
    expect(scoreReviews(null)).toBe(0);
  });
});

describe('scorePhotos', () => {
  it('returns 15 for >= 20 photos', () => {
    expect(scorePhotos(20)).toBe(15);
    expect(scorePhotos(100)).toBe(15);
  });
  it('returns 10 for 10–19 photos', () => {
    expect(scorePhotos(10)).toBe(10);
    expect(scorePhotos(19)).toBe(10);
  });
  it('returns 5 for 3–9 photos', () => {
    expect(scorePhotos(3)).toBe(5);
    expect(scorePhotos(9)).toBe(5);
  });
  it('returns 0 for < 3 photos', () => {
    expect(scorePhotos(2)).toBe(0);
    expect(scorePhotos(0)).toBe(0);
  });
  it('returns 0 for null', () => {
    expect(scorePhotos(null)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// totalRevenueLeak (reportRenderer.js)
// ---------------------------------------------------------------------------

describe('totalRevenueLeak', () => {
  it('sums low and high from all gaps', () => {
    const gaps = [
      { revenue_impact: { low: 100, high: 200 } },
      { revenue_impact: { low: 50,  high: 150 } },
    ];
    expect(totalRevenueLeak(gaps)).toEqual({ low: 150, high: 350 });
  });
  it('handles missing revenue_impact gracefully', () => {
    const gaps = [{ label: 'test' }];
    expect(totalRevenueLeak(gaps)).toEqual({ low: 0, high: 0 });
  });
  it('handles empty gap list', () => {
    expect(totalRevenueLeak([])).toEqual({ low: 0, high: 0 });
  });
});

// ---------------------------------------------------------------------------
// scoreProjection (reportRenderer.js) — via test export
// ---------------------------------------------------------------------------

describe('scoreProjectionForTest', () => {
  function baseAudit(overrides = {}) {
    return {
      score: 40,
      gaps: [
        { id: 'few_reviews' },
        { id: 'no_hours' },
        { id: 'no_website' },
      ],
      fields: {
        rating: 4.5,
        review_count: 5,
        photo_count: 0,
        has_hours: false,
        has_website: false,
        has_phone: false,
        has_description: false,
        primary_category_set: true,
        is_open: true,
      },
      ...overrides,
    };
  }

  it('projected score exceeds current score when gaps exist', () => {
    const { projectedScore, delta } = scoreProjectionForTest(baseAudit());
    expect(projectedScore).toBeGreaterThan(40);
    expect(delta).toBeGreaterThan(0);
  });

  it('resolves few_reviews gap by setting review_count to threshold', () => {
    const audit = baseAudit({ gaps: [{ id: 'few_reviews' }] });
    const { projectedScore } = scoreProjectionForTest(audit, 1);
    // Fields: rating=4.5(15) + reviews=50(15) + photos=0(0) + hours=false(0)
    //         + website=false(0) + phone=false(0) + desc=false(0) + category=true(10) + open=true(5) = 45
    expect(projectedScore).toBe(45);
  });

  it('caps projected score at 100', () => {
    const highScoreAudit = {
      score: 95,
      gaps: [{ id: 'few_reviews' }],
      fields: {
        rating: 4.5,
        review_count: 5,
        photo_count: 25,
        has_hours: true,
        has_website: true,
        has_phone: true,
        has_description: true,
        primary_category_set: true,
        is_open: true,
      },
    };
    const { projectedScore } = scoreProjectionForTest(highScoreAudit, 3);
    expect(projectedScore).toBeLessThanOrEqual(100);
  });

  it('returns delta=0 when there are no gaps', () => {
    const noGapAudit = { score: 85, gaps: [], fields: {} };
    const { delta } = scoreProjectionForTest(noGapAudit);
    expect(delta).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildMatrix / identifyKeyGaps (competitors.js) — via test exports
// ---------------------------------------------------------------------------

describe('buildMatrix', () => {
  const subject = {
    fields: { rating: 4.2, review_count: 30, photo_count: 10, has_website: true, has_hours: true },
  };
  const competitors = [
    { fields: { rating: 4.5, review_count: 80, photo_count: 5, has_website: true, has_hours: true } },
    { fields: { rating: 4.0, review_count: 20, photo_count: 15, has_website: false, has_hours: true } },
  ];

  it('ranks subject behind leader on reviews', () => {
    const matrix = buildMatrix(subject, competitors);
    expect(matrix.review_count.subject_rank).toBeGreaterThan(1);
    expect(matrix.review_count.subject).toBe(30);
  });

  it('ranks subject #1 on rating when rating is highest', () => {
    const subjectTop = { fields: { ...subject.fields, rating: 4.9 } };
    const matrix = buildMatrix(subjectTop, competitors);
    expect(matrix.rating.subject_rank).toBe(1);
  });

  it('includes all metrics', () => {
    const matrix = buildMatrix(subject, competitors);
    expect(Object.keys(matrix)).toEqual(
      expect.arrayContaining(['rating', 'review_count', 'photo_count', 'has_website', 'has_hours'])
    );
  });
});

describe('identifyKeyGaps', () => {
  it('flags review gap when competitors have more reviews', () => {
    const subject = { fields: { rating: 4.0, review_count: 10, photo_count: 5 } };
    const competitors = [
      { fields: { rating: 4.0, review_count: 100, photo_count: 5 } },
    ];
    const matrix = buildMatrix(subject, competitors);
    const gaps = identifyKeyGaps(subject, competitors, matrix);
    expect(gaps.some(g => g.includes('reviews'))).toBe(true);
  });

  it('flags rating gap when competitor rating is higher', () => {
    const subject = { fields: { rating: 3.8, review_count: 50, photo_count: 20 } };
    const competitors = [
      { fields: { rating: 4.7, review_count: 50, photo_count: 20 } },
    ];
    const matrix = buildMatrix(subject, competitors);
    const gaps = identifyKeyGaps(subject, competitors, matrix);
    expect(gaps.some(g => g.includes('rating') || g.includes('Rating'))).toBe(true);
  });

  it('returns empty array when subject leads on all metrics', () => {
    const subject = { fields: { rating: 4.9, review_count: 200, photo_count: 50 } };
    const competitors = [
      { fields: { rating: 4.0, review_count: 10, photo_count: 5 } },
    ];
    const matrix = buildMatrix(subject, competitors);
    const gaps = identifyKeyGaps(subject, competitors, matrix);
    expect(gaps).toHaveLength(0);
  });
});
