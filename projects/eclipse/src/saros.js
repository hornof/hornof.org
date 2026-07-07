// Saros tagging. The saros is the ~6585.32-day period after which Sun, Moon,
// and node return to nearly the same geometry, so an eclipse recurs. The period
// is physical; the *numbering* of series is a published convention, so a number
// can only be propagated from a seed eclipse whose number is known. Given one
// seeded member, every other member of that series is an integer number of
// saros periods away — which the integrator can confirm independently.

export const SAROS_DAYS = 6585.3211; // mean synodic saros period

/**
 * Assign a saros series number to an eclipse at Julian date `jd`, given seed
 * eclipses {jd, number}. Returns the seed's number when `jd` sits an integer
 * number of saros periods from a seed (within `tolDays`), else null.
 */
export function assignSaros(jd, seeds, tolDays = 2) {
  let best = null, bestResidual = Infinity;
  for (const s of seeds) {
    const k = Math.round((jd - s.jd) / SAROS_DAYS);
    const predicted = s.jd + k * SAROS_DAYS;
    const residual = Math.abs(jd - predicted);
    if (residual < bestResidual) { bestResidual = residual; best = s.number; }
  }
  return bestResidual <= tolDays ? best : null;
}

/**
 * Predicted Julian date of the member of a series `k` saros periods from a seed.
 * Used to check the periodicity against independently detected eclipses.
 */
export function sarosMemberJd(seedJd, k) {
  return seedJd + k * SAROS_DAYS;
}
