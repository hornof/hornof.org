// Pure Sun-Earth-Moon phase/alignment state for the inset. Separated from the
// canvas drawing in syzygy-inset.js so the classification logic (phase names,
// solar-vs-lunar side, whether it's a central alignment) can be unit-tested.

import { shadowGeometry, R_EARTH } from './eclipse.js';
import { earthShadowGeometry } from './lunar-eclipse.js';

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => Math.hypot(a[0], a[1], a[2]);

/** Moon phase name from its elongation from the Sun (0 = new, 180 = full). */
export function phaseName(elongationDeg) {
  return elongationDeg < 12 ? 'New'
    : elongationDeg > 168 ? 'Full'
      : elongationDeg < 88 ? 'Crescent'
        : elongationDeg > 92 ? 'Gibbous'
          : 'Quarter';
}

/**
 * @returns {{elongationDeg, phase, kind:'solar'|'lunar', gammaEarthRadii, central}}
 *   elongationDeg  Sun-Earth-Moon angle (0 new .. 180 full)
 *   kind           which shadow matters: near new moon -> solar, near full -> lunar
 *   gammaEarthRadii shadow-axis miss distance in Earth radii
 *   central        true when the alignment is close enough to be an eclipse
 */
export function syzygyState(sun, earth, moon) {
  const es = sub(sun, earth);
  const em = sub(moon, earth);
  const cosEl = Math.max(-1, Math.min(1, dot(es, em) / (norm(es) * norm(em))));
  const elongationDeg = (Math.acos(cosEl) * 180) / Math.PI;
  const isNewSide = elongationDeg < 90;
  const geom = isNewSide ? shadowGeometry(sun, earth, moon) : earthShadowGeometry(sun, earth, moon);
  const gammaEarthRadii = geom.gamma / R_EARTH;
  const central = isNewSide ? gammaEarthRadii < 1 : geom.gamma < geom.rUmbra;
  return {
    elongationDeg,
    phase: phaseName(elongationDeg),
    kind: isNewSide ? 'solar' : 'lunar',
    gammaEarthRadii,
    central,
  };
}
