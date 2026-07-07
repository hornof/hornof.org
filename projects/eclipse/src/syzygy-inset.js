// A small top-down "Sun–Earth–Moon" inset. The main orrery draws the Moon
// essentially inside the Earth sphere, so you cannot see an eclipse line up
// there. This inset fixes that: Earth at the centre, the direction to the Sun,
// and the Moon on its monthly path around Earth (distance exaggerated so it is
// visible), plus the shadow-axis miss distance gamma in Earth radii — the same
// quantity the detector thresholds on. When gamma is small and the Moon is new,
// you are watching a solar eclipse; small and full, a lunar one.

import { syzygyState } from './syzygy.js';

const W = 210, H = 150;

function sub(a, b) { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
function norm2(a) { return Math.hypot(a[0], a[1]); }

export class SyzygyInset {
  constructor() {
    const box = document.createElement('div');
    box.id = 'syzygy';
    box.className = 'syzygy';
    box.innerHTML = `<div class="sz-title">Sun · Earth · Moon</div>`;
    this.canvas = document.createElement('canvas');
    this.canvas.width = W; this.canvas.height = H;
    this.canvas.setAttribute('aria-label', 'Sun Earth Moon alignment inset');
    box.append(this.canvas);
    this.readout = document.createElement('div');
    this.readout.className = 'sz-readout';
    this.readout.id = 'szReadout';
    box.append(this.readout);
    document.body.append(box);
    this.ctx = this.canvas.getContext('2d');
    this._frame = 0;
  }

  /** sim: Simulation. Throttled; call every frame. */
  update(sim, force = false) {
    if (!force && (this._frame++ % 4 !== 0)) return;
    const S = sim.position('sun'), E = sim.position('earth'), M = sim.position('moon');
    this._draw(S, E, M);
  }

  _draw(S, E, M) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    const cx = W * 0.6, cy = H * 0.5; // Earth position (offset right, Sun to left)

    // Ecliptic-plane (XY) unit directions from Earth.
    const es = sub(S, E), em = sub(M, E);
    const esn = norm2(es) || 1;
    const sdir = [es[0] / esn, es[1] / esn];
    const emn = norm2(em) || 1;
    const mdir = [em[0] / emn, em[1] / emn];

    // Shadow axis (Sun through Earth) dashed across the frame.
    ctx.strokeStyle = '#4a5f8f'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - sdir[0] * 200, cy - sdir[1] * 200);
    ctx.lineTo(cx + sdir[0] * 200, cy + sdir[1] * 200);
    ctx.stroke(); ctx.setLineDash([]);

    // Sun direction arrow + glyph.
    const sunX = cx + sdir[0] * 78, sunY = cy + sdir[1] * 78;
    ctx.strokeStyle = '#ffcc33'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(sunX, sunY); ctx.stroke();
    ctx.fillStyle = '#ffcc33'; ctx.beginPath(); ctx.arc(sunX, sunY, 8, 0, 7); ctx.fill();

    // Moon on its exaggerated orbit (fixed display radius in its true direction).
    const R = 46;
    const mx = cx + mdir[0] * R, my = cy + mdir[1] * R;
    ctx.strokeStyle = '#7c90ba'; ctx.lineWidth = 1; // orbit ring — matches the main view
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.stroke(); // orbit guide
    ctx.strokeStyle = '#8ea0c4'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();

    // Earth.
    ctx.fillStyle = '#3b7fd4'; ctx.beginPath(); ctx.arc(cx, cy, 7, 0, 7); ctx.fill();
    // Moon.
    ctx.fillStyle = '#cccccc'; ctx.beginPath(); ctx.arc(mx, my, 4, 0, 7); ctx.fill();

    // Phase / alignment classification (pure, unit-tested in test/syzygy.test.js).
    const { phase, kind, gammaEarthRadii: gammaR, central } = syzygyState(S, E, M);
    const isNewSide = kind === 'solar';
    if (central) {
      ctx.fillStyle = isNewSide ? '#ffd479' : '#ff9a9a';
      ctx.font = 'bold 11px system-ui'; ctx.fillText('● ALIGNED', 8, 16);
    }
    this.readout.textContent =
      `${phase} · ${kind} axis miss ${gammaR.toFixed(1)} R⊕` +
      (central ? ' — eclipse geometry' : '');
  }
}
