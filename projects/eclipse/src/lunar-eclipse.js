// Lunar-eclipse detection. Mirror of the solar case, but now Earth casts the
// shadow: at full moon the Moon can pass through Earth's umbra/penumbra. The
// shadow axis is the ray from Earth pointing away from the Sun; "greatest
// eclipse" is the instant the Moon's centre is closest to that axis — exactly
// NASA's definition, so the timings are comparable.
//
// Pure numerics, dt=0.005 like the solar scan (the Moon needs the small step).

import {
  makeSystem, cloneSystem, integrate, integrateTo, bodyPos, indexOf,
} from './integrator.js';
import { GM, BODY_NAMES, AU_KM } from './constants.js';
import { INITIAL_STATE } from './initial-state.js';
import { J2000_JD } from './time.js';
import { R_SUN, R_MOON, R_EARTH, serializeState } from './eclipse.js';

const PHYSICS_DT = 0.005;
// Earth's shadow is enlarged ~2% by the atmosphere (the classic Chauvenet /
// Danjon correction NASA applies). Only shifts type boundaries, not timing.
const SHADOW_ENLARGE = 1.02;

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
function norm(a) { return Math.hypot(a[0], a[1], a[2]); }

/**
 * Earth-shadow geometry at the current Sun/Earth/Moon positions (AU).
 * @returns {{gamma, axialDist, rUmbra, rPenumbra}}
 *   gamma      Moon-centre distance from the shadow axis
 *   axialDist  Earth->Moon distance along the axis (>0 => full-moon side)
 *   rUmbra     umbral-shadow radius at the Moon's distance (enlarged)
 *   rPenumbra  penumbral-shadow radius at the Moon's distance (enlarged)
 */
export function earthShadowGeometry(sun, earth, moon) {
  const anti = sub(earth, sun); // Earth relative to Sun == anti-solar direction
  const Dse = norm(anti);
  const dhat = [anti[0] / Dse, anti[1] / Dse, anti[2] / Dse];
  const em = sub(moon, earth);
  const axialDist = dot(em, dhat);
  const foot = [
    earth[0] + axialDist * dhat[0],
    earth[1] + axialDist * dhat[1],
    earth[2] + axialDist * dhat[2],
  ];
  const gamma = norm(sub(moon, foot));
  // Converging umbra, diverging penumbra at distance axialDist behind Earth.
  const rUmbra = (R_EARTH - axialDist * (R_SUN - R_EARTH) / Dse) * SHADOW_ENLARGE;
  const rPenumbra = (R_EARTH + axialDist * (R_SUN + R_EARTH) / Dse) * SHADOW_ENLARGE;
  return { gamma, axialDist, rUmbra, rPenumbra };
}

/** Classify a lunar eclipse at greatest eclipse, or null if the Moon misses. */
export function classifyLunar(g) {
  if (g.axialDist <= 0) return null;
  if (g.gamma + R_MOON <= g.rUmbra) return 'total';       // Moon fully in umbra
  if (g.gamma - R_MOON < g.rUmbra) return 'partial';      // umbra clips the Moon
  if (g.gamma - R_MOON < g.rPenumbra) return 'penumbral'; // only penumbra
  return null;
}

function sem(system) {
  return {
    sun: bodyPos(system, indexOf(system, 'sun')),
    earth: bodyPos(system, indexOf(system, 'earth')),
    moon: bodyPos(system, indexOf(system, 'moon')),
  };
}

function gammaOf(system) {
  const { sun, earth, moon } = sem(system);
  const g = earthShadowGeometry(sun, earth, moon);
  return g.axialDist > 0 ? g.gamma : Infinity; // new moons never register
}

/**
 * Scan for lunar eclipses (total/partial/penumbral) between two JDs.
 * @returns {Array<{jd:number, type:string, gammaEarthRadii:number}>}
 */
export function scanLunarEclipses(startJd, endJd, opts = {}) {
  const sample = opts.sampleDays ?? 0.05;
  const steps = Math.max(1, Math.round(sample / PHYSICS_DT));
  const system = makeSystem(BODY_NAMES, INITIAL_STATE, GM);
  integrateTo(system, startJd - J2000_JD, PHYSICS_DT);

  const results = [];
  let jd = startJd;
  let gPrev = Infinity, jdPrev = jd;
  let snapPrev = cloneSystem(system);
  let g = gammaOf(system);

  while (jd < endJd) {
    const snapCur = cloneSystem(system);
    integrate(system, sample / steps, steps);
    const jdNext = jd + sample;
    const gNext = gammaOf(system);

    if (g < gPrev && g <= gNext && g < 0.02) {
      const refined = refineMinimum(snapPrev, jdPrev, jdNext);
      if (refined && refined.type) {
        results.push({
          jd: refined.jd,
          type: refined.type,
          gammaEarthRadii: refined.gamma / R_EARTH,
          state: serializeState(refined.system),
        });
      }
    }
    gPrev = g; g = gNext; jdPrev = jd; snapPrev = snapCur; jd = jdNext;
  }
  return results;
}

function gammaFrom(base, baseJd, targetJd) {
  const s = cloneSystem(base);
  integrateTo(s, targetJd - baseJd, PHYSICS_DT);
  return gammaOf(s);
}

function refineMinimum(base, lo, hi) {
  const baseJd = lo;
  const gr = (Math.sqrt(5) - 1) / 2;
  let a = lo, b = hi;
  let c = b - gr * (b - a);
  let d = a + gr * (b - a);
  let fc = gammaFrom(base, baseJd, c);
  let fd = gammaFrom(base, baseJd, d);
  while (b - a > 1e-3) {
    if (fc < fd) { b = d; d = c; fd = fc; c = b - gr * (b - a); fc = gammaFrom(base, baseJd, c); }
    else { a = c; c = d; fc = fd; d = a + gr * (b - a); fd = gammaFrom(base, baseJd, d); }
  }
  const jd = (a + b) / 2;
  const s = cloneSystem(base);
  integrateTo(s, jd - baseJd, PHYSICS_DT);
  const { sun, earth, moon } = sem(s);
  const geom = earthShadowGeometry(sun, earth, moon);
  return { jd, gamma: geom.gamma, type: classifyLunar(geom), system: s };
}
