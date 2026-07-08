// Pure distance-scaling math for the orrery view, kept out of render.js so it
// has no three.js import and can be unit-tested in node. Maps a heliocentric
// position (AU) to a scene position, either TRUE scale (linear AU) or LOG scale
// (compressed so inner planets stay visible next to Neptune).

export const SCALE_TRUE = 2.0; // scene units per AU
export const LOG_K = 40.0;     // scene units per decade-ish in log mode

/**
 * @param {[number,number,number]} p  heliocentric position in AU
 * @param {'true'|'log'} mode
 * @returns {[number,number,number]} scene position
 */
export function scalePosition(p, mode) {
  const r = Math.hypot(p[0], p[1], p[2]);
  if (r === 0) return [0, 0, 0];
  const sr = mode === 'log' ? LOG_K * Math.log10(1 + r) : SCALE_TRUE * r;
  const f = sr / r;
  // Three.js is Y-up; our data is the ecliptic X-Y plane with small Z. Map
  // ecliptic (x,y,z) -> scene (x, z, -y) so the ecliptic lies near the ground
  // plane and prograde motion reads counter-clockwise from above.
  return [p[0] * f, p[2] * f, -p[1] * f];
}
