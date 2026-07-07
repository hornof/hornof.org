// Geography of a solar eclipse: where on Earth the shadow axis lands, and
// whether the eclipse is total, annular, or hybrid along its central track.
//
// The positions are all derived; only Earth's orientation borrows a standard
// convention (mean obliquity + GMST). Two honest approximations, both small
// against our tolerances: we use geocentric latitude (~0.19 deg from geographic)
// and treat the dynamical clock as UT1 (ignoring dT ~= 69 s, ~0.29 deg of
// longitude — smaller than the timing-driven longitude error anyway).

import { R_SUN, R_MOON, R_EARTH } from './eclipse.js';
import { J2000_JD } from './time.js';

const DEG = 180 / Math.PI;
const OBLIQUITY = 23.43929 / DEG; // mean obliquity of the ecliptic at J2000 (rad)

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm(a) { return Math.hypot(a[0], a[1], a[2]); }

/** Rotate an ecliptic-frame vector into the equatorial frame (about +X by eps). */
function eclToEqu([x, y, z]) {
  const c = Math.cos(OBLIQUITY), s = Math.sin(OBLIQUITY);
  return [x, y * c - z * s, y * s + z * c];
}

/** Greenwich Mean Sidereal Time in degrees [0,360) for a Julian date. */
export function gmstDeg(jd) {
  const d = jd - J2000_JD;
  return ((280.46061837 + 360.98564736629 * d) % 360 + 360) % 360;
}

function wrap180(deg) {
  let x = ((deg % 360) + 360) % 360;
  return x > 180 ? x - 360 : x;
}

/**
 * Sub-shadow geographic point: where the Moon's shadow axis pierces Earth's
 * near surface at time `jd`. Returns {lat, lon} in signed degrees, or null if
 * the axis misses Earth (a partial eclipse at that instant).
 */
export function subShadowPoint(sun, earth, moon, jd) {
  const d = sub(moon, sun);
  const Dsm = norm(d);
  const dhat = [d[0] / Dsm, d[1] / Dsm, d[2] / Dsm];
  const w = sub(earth, moon);
  const tca = dot(w, dhat);
  const perp2 = dot(w, w) - tca * tca;
  if (perp2 > R_EARTH * R_EARTH) return null; // axis misses Earth's disc
  const th = Math.sqrt(R_EARTH * R_EARTH - perp2);
  const t = tca - th; // near-side intersection distance from Moon
  const P = [moon[0] + t * dhat[0], moon[1] + t * dhat[1], moon[2] + t * dhat[2]];
  const r = sub(P, earth); // Earth-centre -> surface point, ecliptic frame
  const [xe, ye, ze] = eclToEqu(r);
  const R = Math.hypot(xe, ye, ze);
  const lat = Math.asin(ze / R) * DEG;
  const ra = Math.atan2(ye, xe) * DEG;
  const lon = wrap180(ra - gmstDeg(jd));
  return { lat, lon };
}

/**
 * Central-eclipse character at one instant on the axis: 'total' if the umbral
 * cone tip reaches the surface, 'annular' if it falls short, or null if the
 * axis misses Earth.
 */
export function centralCharacterAt(sun, earth, moon) {
  const d = sub(moon, sun);
  const Dsm = norm(d);
  const dhat = [d[0] / Dsm, d[1] / Dsm, d[2] / Dsm];
  const w = sub(earth, moon);
  const tca = dot(w, dhat);
  const perp2 = dot(w, w) - tca * tca;
  if (perp2 > R_EARTH * R_EARTH) return null;
  const th = Math.sqrt(R_EARTH * R_EARTH - perp2);
  const surfaceDist = tca - th;             // Moon -> surface along axis
  const umbraLen = (R_MOON * Dsm) / (R_SUN - R_MOON); // Moon -> umbral cone tip
  return umbraLen >= surfaceDist ? 'total' : 'annular';
}
