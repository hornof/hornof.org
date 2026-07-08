// Entry point: wire the simulation, renderer, and UI into one animation loop.
import { Simulation } from './simulation.js';
import { Orrery } from './render.js';
import { UI } from './ui.js';
import { EclipsePanel } from './eclipse-panel.js';
import { VerifyPanel } from './verify-panel.js';
import { SyzygyInset } from './syzygy-inset.js';

const container = document.getElementById('view');
const sim = new Simulation();
const orrery = new Orrery(container);

const ui = new UI(sim, orrery, {
  onDate: (jd) => window.__eclipseOnDate?.(jd),
});

// F3: eclipse list. Clicking an event flies the orrery there. F7: when the row
// carries a captured fine-step state, snap to it exactly (no coarse re-integration).
const eclipsePanel = new EclipsePanel({
  onPick: (ecl) => {
    if (ecl && ecl.state) ui.jumpToState(ecl.jd, ecl.state);
    else ui.jumpTo(typeof ecl === 'number' ? ecl : ecl.jd);
  },
});
document.getElementById('eclipseToggle')?.addEventListener('click', () => eclipsePanel.toggle());

// F4: live "next eclipse" card + methods note.
const verifyPanel = new VerifyPanel(sim);

// F7: Sun-Earth-Moon inset so the alignment is actually visible.
const syzygy = new SyzygyInset();
syzygy.update(sim, true);

// Expose for tests / other panels.
window.__sim = sim;
window.__orrery = orrery;
window.__ui = ui;
window.__eclipsePanel = eclipsePanel;
window.__verifyPanel = verifyPanel;
window.__syzygy = syzygy;

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 0.1); // clamp long stalls
  last = now;
  if (sim.playing) {
    sim.advance(dt);
    ui.syncReadout();
    window.__eclipseOnDate?.(sim.jd);
  }
  orrery.update(sim.positions());
  orrery.render();
  syzygy.update(sim);
  requestAnimationFrame(frame);
}
orrery.update(sim.positions());
requestAnimationFrame(frame);
