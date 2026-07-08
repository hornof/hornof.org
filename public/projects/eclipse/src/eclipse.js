// Solar-eclipse detection from the integrated Sun-Earth-Moon geometry.
//
// A central (total/annular/hybrid) solar eclipse happens when the Moon's shadow
// axis — the line through the Moon in the Sun->Moon direction — passes within
// one Earth radius of Earth's centre. We scan that miss distance (gamma) over
// time, find its local minima, refine each to the minute, and keep the ones
// below R_earth. "Greatest eclipse" in the catalog is defined the same way (the
// instant the axis is closest to Earth's centre), so the times are comparable.
//
// Pure numerics: takes a fresh J2000 system and the integrator; no rendering.

import {
  makeSystem, cloneSystem, integrate, integrateTo, bodyPos, indexOf,
} from './integrator.js';
import { GM, BODY_NAMES, AU_KM } from './constants.js';
import { INITIAL_STATE } from './initial-state.js';
import { J2000_JD } from './time.js';
import { subShadowPoint, centralCharacterAt } from './geo.js';

// Body radii in AU.
export const R_SUN = 696000 / AU_KM;
export const R_MOON = 1737.4 / AU_KM;
export const R_EARTH = 6378.137 / AU_KM;

// Eclipse detection is a one-time computation, so it uses a finer step than
// the real-time orrery. The Moon orbits fast enough that dt=0.05 leaves a
// ~dt^2 secular timing bias (up to ~12 h by 2030); dt=0.005 pulls it under
// ~20 minutes, far inside the +/-6 h tolerance, and the whole decade still
// scans in a couple of seconds.
const PHYSICS_DT = 0.005;

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm(a) { return Math.hypot(a[0], a[1], a[2]); }

/**
 * Shadow-axis geometry for the current Sun/Earth/Moon positions (AU).
 * @returns {{gamma:number, axialDist:number, sunMoon:number, umbraLen:number}}
 *   gamma     perpendicular miss distance of the axis from Earth's centre
 *   axialDist distance from Moon to the axis foot near Earth (>0 => new-moon side)
 *   umbraLen  length of the Moon's umbral cone from the Moon
 */
export function shadowGeometry(sun, earth, moon) {
  const d = sub(moon, sun);
  const Dsm = norm(d);
  const dhat = [d[0] / Dsm, d[1] / Dsm, d[2] / Dsm];
  const em = sub(earth, moon);
  const axialDist = dot(em, dhat); // along-axis distance Moon -> foot
  const foot = [
    moon[0] + axialDist * dhat[0],
    moon[1] + axialDist * dhat[1],
    moon[2] + axialDist * dhat[2],
  ];
  const gamma = norm(sub(earth, foot));
  const umbraLen = (R_MOON * Dsm) / (R_SUN - R_MOON);
  return { gamma, axialDist, sunMoon: Dsm, umbraLen };
}

/** Classify a central eclipse at greatest eclipse from its geometry. */
function classify(geom) {
  // Distance from Moon to the near-side surface point the axis pierces.
  const surfDist = geom.axialDist - Math.sqrt(Math.max(0, R_EARTH * R_EARTH - geom.gamma * geom.gamma));
  // If the umbral cone tip reaches (or passes) the surface -> totality; the
  // antumbra (cone tip in front of the surface) -> annular. A track that
  // straddles the tip within an Earth radius is hybrid.
  const slack = geom.umbraLen - surfDist;
  const scale = R_EARTH;
  if (Math.abs(slack) < 0.35 * scale) return 'hybrid';
  return slack >= 0 ? 'total' : 'annular';
}

// Positions of Sun/Earth/Moon from a system.
function sem(system) {
  return {
    sun: bodyPos(system, indexOf(system, 'sun')),
    earth: bodyPos(system, indexOf(system, 'earth')),
    moon: bodyPos(system, indexOf(system, 'moon')),
  };
}

function gammaOf(system) {
  const { sun, earth, moon } = sem(system);
  const g = shadowGeometry(sun, earth, moon);
  // Only count new-moon side (Moon between Sun and Earth); otherwise +inf so
  // full moons never register as solar eclipses.
  return g.axialDist > 0 ? g.gamma : Infinity;
}

/**
 * Scan for central solar eclipses between two JDs.
 * @param {number} startJd
 * @param {number} endJd
 * @param {object} [opts] { sampleDays=0.05 }
 * @returns {Array<{jd:number, type:string, gammaEarthRadii:number}>}
 */
export function scanSolarEclipses(startJd, endJd, opts = {}) {
  const sample = opts.sampleDays ?? 0.05;
  const steps = Math.max(1, Math.round(sample / PHYSICS_DT));
  const system = makeSystem(BODY_NAMES, INITIAL_STATE, GM);
  integrateTo(system, startJd - J2000_JD, PHYSICS_DT);

  const results = [];
  let jd = startJd;
  let gPrev = Infinity, jdPrev = jd;
  let snapPrev = cloneSystem(system); // state at jdPrev, for local refinement
  let g = gammaOf(system);

  while (jd < endJd) {
    const snapCur = cloneSystem(system); // state at jd
    integrate(system, sample / steps, steps);
    const jdNext = jd + sample;
    const gNext = gammaOf(system);

    // local minimum bracketed at `jd`, and below the coarse gate
    if (g < gPrev && g <= gNext && g < 0.02) {
      const refined = refineMinimum(snapPrev, jdPrev, jdNext);
      if (refined && refined.gamma < R_EARTH) {
        // F8: classify total/annular/hybrid from the whole central track, and
        // find the geographic sub-point of greatest eclipse.
        const track = classifyTrack(refined.system, refined.jd);
        results.push({
          jd: refined.jd,
          type: track.type,
          location: track.location, // {lat, lon} or null
          gammaEarthRadii: refined.gamma / R_EARTH,
          // Fine-step Sun-Earth-Moon-and-planets state at greatest eclipse, so
          // the view can snap here exactly instead of re-integrating coarsely.
          state: serializeState(refined.system),
        });
      }
    }
    gPrev = g; g = gNext; jdPrev = jd; snapPrev = snapCur; jd = jdNext;
  }
  return results;
}

// Evaluate gamma at absolute JD by cloning a nearby base state and integrating
// the short remaining distance to it. Base must be at or before `targetJd`.
function gammaFrom(base, baseJd, targetJd) {
  const s = cloneSystem(base);
  integrateTo(s, targetJd - baseJd, PHYSICS_DT);
  return { g: gammaOf(s), system: s };
}

// Golden-section refine of gamma(jd) on [lo, hi], integrating short hops from a
// local base snapshot (state at `lo` or earlier).
function refineMinimum(base, lo, hi) {
  const baseJd = lo;
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = lo, b = hi;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  let fc = gammaFrom(base, baseJd, c).g;
  let fd = gammaFrom(base, baseJd, d).g;
  while (b - a > 1e-3) { // ~1.5 min tolerance
    if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = gammaFrom(base, baseJd, c).g; }
    else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = gammaFrom(base, baseJd, d).g; }
  }
  const jd = (a + b) / 2;
  const { system } = gammaFrom(base, baseJd, jd);
  const { sun, earth, moon } = sem(system);
  const geom = shadowGeometry(sun, earth, moon);
  if (geom.axialDist <= 0) return null;
  return { jd, gamma: geom.gamma, type: classify(geom), system };
}

/** Plain-array snapshot of a system's positions/velocities (worker-serialisable). */
export function serializeState(system) {
  return { pos: Array.from(system.pos), vel: Array.from(system.vel) };
}

/**
 * The next central solar eclipse at or after `fromJd`, computed on demand so
 * the "next eclipse" card resolves at ANY date (the pre-scanned list only spans
 * 2020-2030). The longest observed gap between central solar eclipses is ~680
 * days (e.g. 1999->2001, 2017->2019); a 900-day horizon clears that with margin
 * (asserted by test/next-eclipse-invariants). Returns a scan entry or null.
 */
export function nextCentralSolarEclipse(fromJd, horizonDays = 900) {
  const found = scanSolarEclipses(fromJd, fromJd + horizonDays);
  return found.find((e) => e.jd >= fromJd - 0.02) || null;
}

/**
 * Classify a central solar eclipse over its whole track and locate greatest
 * eclipse. Samples the umbral cone tip vs the surface along the central line
 * (from the fine greatest-eclipse state); if it is total on part of the track
 * and annular on another, the eclipse is hybrid.
 * @returns {{type:string, location:{lat,lon}|null}}
 */
export function classifyTrack(system, jd) {
  const chars = new Set();
  const HALF_STEPS = 13; // ~+/-0.12 day each side, covering the central track
  for (const dir of [-1, 1]) {
    const s = cloneSystem(system);
    for (let k = 0; k < HALF_STEPS; k++) {
      const { sun, earth, moon } = sem(s);
      const c = centralCharacterAt(sun, earth, moon);
      if (c) chars.add(c);
      integrate(s, dir * PHYSICS_DT, 2); // 0.01-day sample
    }
  }
  let type;
  if (chars.has('total') && chars.has('annular')) type = 'hybrid';
  else if (chars.has('total')) type = 'total';
  else if (chars.has('annular')) type = 'annular';
  else type = 'annular'; // no central sample landed (degenerate); safest label
  const { sun, earth, moon } = sem(system);
  return { type, location: subShadowPoint(sun, earth, moon, jd) };
}
