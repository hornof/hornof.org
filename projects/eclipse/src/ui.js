// Control bar, help overlay, and keyboard handling for the orrery. Every
// control is visible on the page (LAAS lesson: undiscoverable controls are a
// real flaw), and a help overlay listing them all shows on first load and is
// re-openable via the "?" button.

import { formatJdDate, formatJdDateTime, dateToJd, J2000_JD } from './time.js';

// Speed presets in simulated days per real second, spanning the required
// 1 day/s .. 1 year/s range (plus a couple beyond for convenience).
export const SPEEDS = [
  { label: '1 day/s', dps: 1 },
  { label: '1 week/s', dps: 7 },
  { label: '1 month/s', dps: 30 },
  { label: '3 months/s', dps: 91 },
  { label: '1 year/s', dps: 365 },
];

const HELP_ITEMS = [
  ['Space', 'Play / pause the simulation'],
  ['◀ ▶ buttons', 'Play/pause; slower / faster speed'],
  ['← / →', 'Step one day back / forward (while paused)'],
  ['- / +', 'Decrease / increase playback speed'],
  ['Date scrubber', 'Drag to jump to any date 1900–2100'],
  ['Date field', 'Type a date (YYYY-MM-DD) and press Enter'],
  ['Now', 'Jump to today'],
  ['Scale toggle', 'Switch between TRUE-scale and LOG-scale distances'],
  ['Mouse drag / scroll', 'Orbit and zoom the 3D view'],
  ['?', 'Reopen this help overlay'],
];

export class UI {
  /**
   * @param {object} sim   Simulation instance
   * @param {object} orrery Orrery renderer
   * @param {object} opts  { onDate?: (jd)=>void } hooks for other panels
   */
  constructor(sim, orrery, opts = {}) {
    this.sim = sim;
    this.orrery = orrery;
    this.opts = opts;
    this.speedIndex = 2; // 1 month/s default
    this.sim.daysPerSecond = SPEEDS[this.speedIndex].dps;
    this._build();
    this._bindKeys();
    this._maybeShowHelpFirstLoad();
    this.syncReadout();
  }

  _el(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      // Hyphenated keys (aria-*, data-*) are attributes, not DOM properties.
      if (k.includes('-')) el.setAttribute(k, v);
      else el[k] = v;
    }
    for (const c of children) el.append(c);
    return el;
  }

  _build() {
    const bar = document.getElementById('controls');

    this.playBtn = this._el('button', {
      id: 'play', className: 'btn', textContent: '▶ Play',
      title: 'Play/pause (Space)', onclick: () => this.togglePlay(),
    });

    this.slowerBtn = this._el('button', {
      className: 'btn', textContent: '−', title: 'Slower (-)',
      'aria-label': 'Slower', onclick: () => this.changeSpeed(-1),
    });
    this.speedLabel = this._el('span', { id: 'speed', className: 'readout', textContent: '' });
    this.fasterBtn = this._el('button', {
      className: 'btn', textContent: '+', title: 'Faster (+)',
      'aria-label': 'Faster', onclick: () => this.changeSpeed(1),
    });

    this.scrub = this._el('input', {
      id: 'scrubber', type: 'range', title: 'Date scrubber',
      min: String(dateToJd(new Date('1900-01-01'))),
      max: String(dateToJd(new Date('2100-01-01'))),
      step: '1', value: String(this.sim.jd),
    });
    this.scrub.setAttribute('aria-label', 'Date scrubber');
    // Scrub incrementally from the current state so dragging stays smooth even
    // at far dates (a from-J2000 re-integration per event would stutter).
    this.scrub.addEventListener('input', () => this.scrubTo(Number(this.scrub.value)));

    this.dateInput = this._el('input', {
      id: 'dateInput', type: 'date', title: 'Type a date and press Enter',
      value: formatJdDate(this.sim.jd),
    });
    this.dateInput.setAttribute('aria-label', 'Jump to date');
    this.dateInput.addEventListener('change', () => {
      const d = new Date(this.dateInput.value + 'T00:00:00Z');
      if (!isNaN(d)) this.jumpTo(dateToJd(d));
    });

    this.nowBtn = this._el('button', {
      className: 'btn', textContent: 'Now', title: 'Jump to today',
      onclick: () => this.jumpTo(dateToJd(new Date())),
    });

    this.scaleBtn = this._el('button', {
      id: 'scale', className: 'btn', textContent: 'Scale: LOG',
      title: 'Toggle true / log distance scale',
      onclick: () => this.toggleScale(),
    });

    // Wired to the eclipse panel by main.js (id lookup) to keep UI decoupled.
    this.eclipseToggle = this._el('button', {
      id: 'eclipseToggle', className: 'btn', textContent: '☾ Eclipses',
      title: 'Show/hide detected solar eclipses',
    });

    this.helpBtn = this._el('button', {
      id: 'helpBtn', className: 'btn', textContent: '?',
      title: 'Help', 'aria-label': 'Open help',
      onclick: () => this.showHelp(true),
    });

    this.readout = this._el('span', { id: 'dateReadout', className: 'readout' });

    bar.append(
      this.playBtn, this.slowerBtn, this.speedLabel, this.fasterBtn,
      this.scrub, this.dateInput, this.nowBtn, this.scaleBtn,
      this.eclipseToggle, this.readout, this.helpBtn,
    );

    this._buildHelpOverlay();
  }

  _buildHelpOverlay() {
    const overlay = this._el('div', { id: 'help', className: 'overlay hidden' });
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Controls help');
    const card = this._el('div', { className: 'help-card' });
    card.append(this._el('h2', { textContent: 'Controls' }));
    const dl = this._el('dl');
    for (const [key, desc] of HELP_ITEMS) {
      dl.append(this._el('dt', { textContent: key }), this._el('dd', { textContent: desc }));
    }
    card.append(dl);
    const close = this._el('button', {
      className: 'btn', id: 'helpClose', textContent: 'Got it',
      onclick: () => this.showHelp(false),
    });
    card.append(close);
    overlay.append(card);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.showHelp(false); });
    document.body.append(overlay);
    this.helpOverlay = overlay;
  }

  _maybeShowHelpFirstLoad() {
    let seen = false;
    try { seen = localStorage.getItem('eclipse-sim-help-seen') === '1'; } catch { /* private mode */ }
    if (!seen) this.showHelp(true);
  }

  showHelp(show) {
    this.helpOverlay.classList.toggle('hidden', !show);
    if (!show) {
      try { localStorage.setItem('eclipse-sim-help-seen', '1'); } catch { /* ignore */ }
    }
  }

  togglePlay() {
    this.sim.playing = !this.sim.playing;
    this.playBtn.textContent = this.sim.playing ? '❚❚ Pause' : '▶ Play';
    this.playBtn.classList.toggle('active', this.sim.playing);
  }

  changeSpeed(delta) {
    this.speedIndex = Math.max(0, Math.min(SPEEDS.length - 1, this.speedIndex + delta));
    this.sim.daysPerSecond = SPEEDS[this.speedIndex].dps;
    this.syncReadout();
  }

  toggleScale() {
    const next = this.orrery.mode === 'log' ? 'true' : 'log';
    this.orrery.setScaleMode(next);
    this.scaleBtn.textContent = 'Scale: ' + next.toUpperCase();
  }

  jumpTo(jd) {
    this.sim.setJd(jd);
    this.afterJump();
  }

  /** Snap to a pre-computed fine state (e.g. an eclipse) without re-integrating. */
  jumpToState(jd, state) {
    this.sim.setState(jd, state);
    this.afterJump();
  }

  /** Scrubber drag: integrate incrementally from the current state (smooth). */
  scrubTo(jd) {
    this.sim.advanceTo(jd);
    this.afterJump();
  }

  /** Refresh readouts and notify listeners after the clock moved externally. */
  afterJump() {
    this.syncReadout();
    this.opts.onDate?.(this.sim.jd);
  }

  /** Called every frame after physics advances; keeps the readouts in sync. */
  syncReadout() {
    this.speedLabel.textContent = SPEEDS[this.speedIndex].label;
    this.readout.textContent = formatJdDateTime(this.sim.jd);
    // Avoid fighting the user while they drag the scrubber.
    if (document.activeElement !== this.scrub) this.scrub.value = String(this.sim.jd);
    if (document.activeElement !== this.dateInput) this.dateInput.value = formatJdDate(this.sim.jd);
  }

  _bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'date') return;
      switch (e.key) {
        case ' ': e.preventDefault(); this.togglePlay(); break;
        case '+': case '=': this.changeSpeed(1); break;
        case '-': case '_': this.changeSpeed(-1); break;
        case 'ArrowRight': if (!this.sim.playing) { this.sim.step(1); this.syncReadout(); this.opts.onDate?.(this.sim.jd); } break;
        case 'ArrowLeft': if (!this.sim.playing) { this.sim.step(-1); this.syncReadout(); this.opts.onDate?.(this.sim.jd); } break;
        case '?': this.showHelp(true); break;
        case 'Escape': this.showHelp(false); break;
        default: return;
      }
    });
  }
}
