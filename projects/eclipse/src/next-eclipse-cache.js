// Pure decision logic for the "next eclipse" card's cache. This is deliberately
// separated from the async worker/debounce/DOM plumbing in verify-panel.js so it
// can be exhaustively property- and mutation-tested: it is the exact code that
// decides whether a previously-computed search result still answers the current
// slider date, and it is where two real bugs lived (skipping pre-2020 dates, and
// serving a stale result after scrubbing backward past an earlier eclipse).
//
// The rule, stated precisely:
//   A search launched from `searchedFrom` returns `result` — the FIRST central
//   eclipse at or after `searchedFrom`. That result is therefore the true "next"
//   for ANY slider date jd in the closed interval [searchedFrom, result.jd]:
//   within it the search already proved there is no earlier eclipse. For jd
//   outside that interval (before searchedFrom, e.g. a backward scrub; or after
//   result.jd, e.g. the eclipse has passed) the cached answer may be wrong, so
//   the caller must search again.

export const CACHE_EPS = 0.02; // days of slack for float / greatest-eclipse rounding

export class NextEclipseCache {
  constructor() {
    this._from = null;   // the JD the cached search was launched from
    this._result = null; // the eclipse it returned ({ jd, ... }) or null
  }

  /**
   * The cached result if it is provably the next eclipse for `jd`, else null.
   * @param {number} jd
   * @returns {object|null}
   */
  get(jd) {
    // _from and _result are always set together by set(), so one guard suffices
    // (mutation testing flagged the second clause as redundant / equivalent).
    if (this._result == null) return null;
    if (jd >= this._from - CACHE_EPS && jd <= this._result.jd + CACHE_EPS) return this._result;
    return null;
  }

  /** Record that a search launched from `searchedFrom` returned `result`. */
  set(searchedFrom, result) {
    this._from = searchedFrom;
    this._result = result;
  }

  /** The most recent result regardless of whether it's still valid (may be null). */
  peek() {
    return this._result;
  }
}
