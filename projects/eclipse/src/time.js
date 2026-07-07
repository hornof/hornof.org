// Julian Date <-> calendar helpers. We treat the integration time base and
// UTC as interchangeable here (they differ by ~70 s of TT-UTC over this span,
// far below the display resolution and the eclipse tolerance).

export const J2000_JD = 2451545.0;
const UNIX_EPOCH_JD = 2440587.5;

/** JS Date -> Julian Date. */
export function dateToJd(date) {
  return date.getTime() / 86400000 + UNIX_EPOCH_JD;
}

/** Julian Date -> JS Date. */
export function jdToDate(jd) {
  return new Date((jd - UNIX_EPOCH_JD) * 86400000);
}

/** Elapsed days from J2000 for a JD. */
export function daysFromJ2000(jd) {
  return jd - J2000_JD;
}

/** Format a JD as an ISO-ish UTC date string (YYYY-MM-DD). */
export function formatJdDate(jd) {
  return jdToDate(jd).toISOString().slice(0, 10);
}

/** Format a JD as UTC date + time (YYYY-MM-DD HH:MM UTC). */
export function formatJdDateTime(jd) {
  return jdToDate(jd).toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
}
