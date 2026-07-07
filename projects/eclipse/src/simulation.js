// Stateful clock + integrator wrapper that the view drives. Physics always
// advances in fixed dt substeps so results are independent of frame rate; the
// only thing playback speed changes is how many simulated days pass per second.

import {
  makeSystem, cloneSystem, integrate, integrateTo, bodyPos, indexOf,
} from './integrator.js';
import { GM, BODY_NAMES } from './constants.js';
import { INITIAL_STATE, EPOCH_JD_TDB } from './initial-state.js';
import { daysFromJ2000 } from './time.js';

export const PHYSICS_DT = 0.05; // days per integrator substep

export class Simulation {
  constructor() {
    this.system = makeSystem(BODY_NAMES, INITIAL_STATE, GM);
    this.jd = EPOCH_JD_TDB;
    this.playing = false;
    this.daysPerSecond = 30; // playback speed
  }

  /** Rebuild from J2000 and integrate straight to a target JD (used for jumps). */
  setJd(targetJd) {
    this.system = makeSystem(BODY_NAMES, INITIAL_STATE, GM);
    integrateTo(this.system, daysFromJ2000(targetJd), PHYSICS_DT);
    this.jd = targetJd;
  }

  /**
   * Install a pre-computed fine-step state (from the eclipse scan) directly,
   * instead of re-integrating coarsely. `state` is {pos:[3n], vel:[3n]} in
   * BODY_NAMES order — the same order the scan used.
   */
  setState(targetJd, state) {
    this.system.pos.set(state.pos);
    this.system.vel.set(state.vel);
    this.jd = targetJd;
  }

  /** Advance continuously by realSeconds of wall time at the current speed. */
  advance(realSeconds) {
    if (!this.playing) return;
    const days = this.daysPerSecond * realSeconds;
    this.step(days);
  }

  /**
   * Integrate INCREMENTALLY to a target JD from the current state. Cheap for
   * small deltas, so the scrubber stays smooth even out at 2100 (setJd re-runs
   * the whole J2000->target integration on every drag event, which stutters).
   * The position is within one PHYSICS_DT of exact; jd is pinned to the target.
   */
  advanceTo(targetJd) {
    this.step(targetJd - this.jd);
    this.jd = targetJd;
  }

  /** Integrate forward/back by `days`, snapping to whole PHYSICS_DT substeps. */
  step(days) {
    if (days === 0) return;
    const nSteps = Math.max(1, Math.round(Math.abs(days) / PHYSICS_DT));
    const dt = Math.sign(days) * PHYSICS_DT;
    integrate(this.system, dt, nSteps);
    this.jd += dt * nSteps;
  }

  /** Position [x,y,z] (AU) of a named body. */
  position(name) {
    return bodyPos(this.system, indexOf(this.system, name));
  }

  /** All body positions as {name: [x,y,z]}. */
  positions() {
    const out = {};
    for (const name of this.system.names) out[name] = this.position(name);
    return out;
  }

  snapshot() {
    return { jd: this.jd, system: cloneSystem(this.system) };
  }
}
