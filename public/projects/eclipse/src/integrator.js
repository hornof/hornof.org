// Symplectic N-body integrator core. Pure numerics — no rendering, no DOM,
// no network. Everything works in AU / day with GM in AU^3/day^2.
//
// State is a plain object of flat Float64Arrays so it is cheap to copy and
// trivially serialisable for tests:
//   { n, names, gm:[n], pos:[3n], vel:[3n] }
// Positions/velocities are laid out x0,y0,z0, x1,y1,z1, ...

/**
 * Build a System from named bodies and their GM values.
 * @param {string[]} names            body order
 * @param {Record<string,{x,y,z,vx,vy,vz}>} state  per-body state vectors
 * @param {Record<string,number>} gm   per-body GM in AU^3/day^2
 */
export function makeSystem(names, state, gm) {
  const n = names.length;
  const pos = new Float64Array(3 * n);
  const vel = new Float64Array(3 * n);
  const gmArr = new Float64Array(n);
  names.forEach((name, i) => {
    const b = state[name];
    if (!b) throw new Error(`missing state for body "${name}"`);
    pos[3 * i] = b.x; pos[3 * i + 1] = b.y; pos[3 * i + 2] = b.z;
    vel[3 * i] = b.vx; vel[3 * i + 1] = b.vy; vel[3 * i + 2] = b.vz;
    if (gm[name] == null) throw new Error(`missing GM for body "${name}"`);
    gmArr[i] = gm[name];
  });
  return { n, names: [...names], gm: gmArr, pos, vel };
}

/** Deep copy of a System (independent typed arrays). */
export function cloneSystem(s) {
  return {
    n: s.n, names: [...s.names], gm: Float64Array.from(s.gm),
    pos: Float64Array.from(s.pos), vel: Float64Array.from(s.vel),
  };
}

/**
 * Gravitational acceleration on every body from every other body.
 * a_i = sum_{j!=i} GM_j (r_j - r_i) / |r_j - r_i|^3
 * @returns {Float64Array} length 3n
 */
export function accelerations(pos, gm, n, out) {
  const a = out || new Float64Array(3 * n);
  a.fill(0);
  for (let i = 0; i < n; i++) {
    const ix = 3 * i, iy = ix + 1, iz = ix + 2;
    for (let j = i + 1; j < n; j++) {
      const jx = 3 * j, jy = jx + 1, jz = jx + 2;
      const dx = pos[jx] - pos[ix];
      const dy = pos[jy] - pos[iy];
      const dz = pos[jz] - pos[iz];
      const r2 = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(r2);
      const inv3 = 1 / (r2 * r);
      // pair contribution shared by Newton's third law
      const sGmJ = gm[j] * inv3;
      const sGmI = gm[i] * inv3;
      a[ix] += sGmJ * dx; a[iy] += sGmJ * dy; a[iz] += sGmJ * dz;
      a[jx] -= sGmI * dx; a[jy] -= sGmI * dy; a[jz] -= sGmI * dz;
    }
  }
  return a;
}

/**
 * One velocity-Verlet (kick-drift-kick leapfrog) step, IN PLACE.
 * Symplectic and time-reversible, so energy error stays bounded.
 * `scratch` (two Float64Array(3n)) may be passed to avoid allocation.
 */
export function leapfrogStep(s, dt, scratch) {
  const { pos, vel, gm, n } = s;
  const a1 = scratch?.a1 || new Float64Array(3 * n);
  const a2 = scratch?.a2 || new Float64Array(3 * n);
  accelerations(pos, gm, n, a1);
  const half = 0.5 * dt;
  for (let k = 0; k < 3 * n; k++) {
    vel[k] += half * a1[k];
    pos[k] += dt * vel[k];
  }
  accelerations(pos, gm, n, a2);
  for (let k = 0; k < 3 * n; k++) {
    vel[k] += half * a2[k];
  }
  return s;
}

/**
 * Integrate `steps` leapfrog steps of size `dt` days. Mutates and returns `s`.
 */
export function integrate(s, dt, steps) {
  const scratch = { a1: new Float64Array(3 * s.n), a2: new Float64Array(3 * s.n) };
  for (let i = 0; i < steps; i++) leapfrogStep(s, dt, scratch);
  return s;
}

/**
 * Integrate to a target time by choosing a step count that lands exactly on it.
 * @param {object} s     system (mutated)
 * @param {number} days  signed elapsed days from current epoch (may be negative)
 * @param {number} maxDt preferred step magnitude in days
 */
export function integrateTo(s, days, maxDt = 0.05) {
  const steps = Math.max(1, Math.ceil(Math.abs(days) / maxDt));
  const dt = days / steps;
  return integrate(s, dt, steps);
}

/** Position vector of body `i` as [x,y,z]. */
export function bodyPos(s, i) {
  return [s.pos[3 * i], s.pos[3 * i + 1], s.pos[3 * i + 2]];
}

/** Index of a body by name. */
export function indexOf(s, name) {
  const i = s.names.indexOf(name);
  if (i < 0) throw new Error(`no such body "${name}"`);
  return i;
}

/**
 * Total energy of the system treating GM_i as mass_i with G = 1. This is the
 * exact conserved Hamiltonian of the integrated equations, so its relative
 * drift is a faithful measure of the integrator's quality.
 */
export function totalEnergy(s) {
  const { pos, vel, gm, n } = s;
  let ke = 0;
  for (let i = 0; i < n; i++) {
    const vx = vel[3 * i], vy = vel[3 * i + 1], vz = vel[3 * i + 2];
    ke += 0.5 * gm[i] * (vx * vx + vy * vy + vz * vz);
  }
  let pe = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const dx = pos[3 * j] - pos[3 * i];
      const dy = pos[3 * j + 1] - pos[3 * i + 1];
      const dz = pos[3 * j + 2] - pos[3 * i + 2];
      pe -= (gm[i] * gm[j]) / Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  }
  return ke + pe;
}

/** Heliocentric ecliptic longitude (deg) of body `i`, measured from the Sun. */
export function heliocentricLongitude(s, i, sunIndex = 0) {
  const sx = s.pos[3 * sunIndex], sy = s.pos[3 * sunIndex + 1];
  const x = s.pos[3 * i] - sx;
  const y = s.pos[3 * i + 1] - sy;
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
