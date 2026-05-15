import { describe, it, expect } from 'vitest';
import { buildPageNumbers } from './useTicketsPage';

describe('buildPageNumbers', () => {
  describe('total <= 7 (no ellipsis path)', () => {
    it('returns [1] for total = 1', () => {
      expect(buildPageNumbers(1, 1)).toEqual([1]);
    });

    it('returns [1, 2, 3] for total = 3', () => {
      expect(buildPageNumbers(2, 3)).toEqual([1, 2, 3]);
    });

    it('returns full range for total = 7', () => {
      expect(buildPageNumbers(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });

    it('returns full range regardless of current page when total <= 7', () => {
      expect(buildPageNumbers(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      expect(buildPageNumbers(1, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    });
  });

  describe('total > 7 — current near start (no leading ellipsis)', () => {
    it('current = 1: no leading ellipsis, trailing ellipsis present', () => {
      // current (1) is NOT > 3, so no leading ellipsis
      // current (1) < total - 2 (8), so trailing ellipsis present
      expect(buildPageNumbers(1, 10)).toEqual([1, 2, 'ellipsis', 10]);
    });

    it('current = 2: no leading ellipsis, trailing ellipsis present', () => {
      // current (2) is NOT > 3
      // start = max(2, 1) = 2, end = min(9, 3) = 3
      expect(buildPageNumbers(2, 10)).toEqual([1, 2, 3, 'ellipsis', 10]);
    });

    it('current = 3: no leading ellipsis, trailing ellipsis present', () => {
      // current (3) is NOT > 3
      // start = max(2, 2) = 2, end = min(9, 4) = 4
      expect(buildPageNumbers(3, 10)).toEqual([1, 2, 3, 4, 'ellipsis', 10]);
    });
  });

  describe('total > 7 — current in the middle (both ellipses)', () => {
    it('current = 5, total = 10: both ellipses present', () => {
      // current (5) > 3 → leading ellipsis
      // current (5) < total - 2 (8) → trailing ellipsis
      // start = max(2, 4) = 4, end = min(9, 6) = 6
      expect(buildPageNumbers(5, 10)).toEqual([1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]);
    });

    it('current = 4, total = 10: leading ellipsis, trailing ellipsis', () => {
      // current (4) > 3 → leading ellipsis
      // current (4) < total - 2 (8) → trailing ellipsis
      // start = max(2, 3) = 3, end = min(9, 5) = 5
      expect(buildPageNumbers(4, 10)).toEqual([1, 'ellipsis', 3, 4, 5, 'ellipsis', 10]);
    });

    it('current = 7, total = 12: both ellipses present', () => {
      // current (7) > 3 → leading ellipsis
      // current (7) < total - 2 (10) → trailing ellipsis
      // start = max(2, 6) = 6, end = min(11, 8) = 8
      expect(buildPageNumbers(7, 12)).toEqual([1, 'ellipsis', 6, 7, 8, 'ellipsis', 12]);
    });
  });

  describe('total > 7 — current near end (no trailing ellipsis)', () => {
    it('current = total (10): no trailing ellipsis, leading ellipsis present', () => {
      // current (10) > 3 → leading ellipsis
      // current (10) is NOT < total - 2 (8) → no trailing ellipsis
      // start = max(2, 9) = 9, end = min(9, 11) = 9
      expect(buildPageNumbers(10, 10)).toEqual([1, 'ellipsis', 9, 10]);
    });

    it('current = total - 1 (9), total = 10: no trailing ellipsis', () => {
      // current (9) > 3 → leading ellipsis
      // current (9) is NOT < total - 2 (8) → no trailing ellipsis
      // start = max(2, 8) = 8, end = min(9, 10) = 9
      expect(buildPageNumbers(9, 10)).toEqual([1, 'ellipsis', 8, 9, 10]);
    });

    it('current = total - 2 (8), total = 10: no trailing ellipsis', () => {
      // current (8) > 3 → leading ellipsis
      // current (8) is NOT < total - 2 (8) → no trailing ellipsis
      // start = max(2, 7) = 7, end = min(9, 9) = 9
      expect(buildPageNumbers(8, 10)).toEqual([1, 'ellipsis', 7, 8, 9, 10]);
    });
  });

  describe('edge cases', () => {
    it('total = 8, current = 1: no leading ellipsis', () => {
      // Exactly over the boundary of 7
      expect(buildPageNumbers(1, 8)).toEqual([1, 2, 'ellipsis', 8]);
    });

    it('total = 8, current = 8: no trailing ellipsis', () => {
      expect(buildPageNumbers(8, 8)).toEqual([1, 'ellipsis', 7, 8]);
    });

    it('total = 8, current = 4: both ellipses', () => {
      // current (4) > 3 → leading ellipsis
      // current (4) < total - 2 (6) → trailing ellipsis
      // start = max(2, 3) = 3, end = min(7, 5) = 5
      expect(buildPageNumbers(4, 8)).toEqual([1, 'ellipsis', 3, 4, 5, 'ellipsis', 8]);
    });
  });
});
