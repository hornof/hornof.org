// F4: verify-yourself surfaces.
//  1. A live "next solar eclipse" card that updates with the simulation clock
//     and links out to NASA so a visitor can check the claim.
//  2. A Methods note stating plainly what is derived, what is fixture, and the
//     known error sources (the point-mass / two-body simplifications).

import { formatJdDate, formatJdDateTime, jdToDate } from './time.js';
import { NextEclipseCache } from './next-eclipse-cache.js';

const NASA_SOLAR = 'https://eclipse.gsfc.nasa.gov/solar.html';

/** First detected eclipse at or after `jd`, or null if none ahead. */
export function nextEclipseAfter(jd, eclipses) {
  let best = null;
  for (const e of eclipses) {
    if (e.jd >= jd - 0.02 && (!best || e.jd < best.jd)) best = e;
  }
  return best;
}

export class VerifyPanel {
  constructor(sim) {
    this.sim = sim;
    this.eclipses = [];
    this._cache = new NextEclipseCache(); // pure cache-validity logic (tested)
    this._buildCard();
    this._buildMethods();

    window.addEventListener('eclipses-ready', (e) => {
      this.eclipses = e.detail;
      this.updateCard(this.sim.jd);
    });
    // main.js funnels every clock change through this hook.
    const prev = window.__eclipseOnDate;
    window.__eclipseOnDate = (jd) => { prev?.(jd); this.updateCard(jd); };
    // Populate immediately (its own light search), not only after the big scan.
    this.updateCard(this.sim.jd);
  }

  _buildCard() {
    const card = document.createElement('div');
    card.id = 'nextEclipse';
    card.className = 'next-card';
    card.innerHTML = `
      <div class="nc-label">Next solar eclipse</div>
      <div class="nc-date" id="ncDate">computing…</div>
      <div class="nc-meta" id="ncMeta"></div>
      <a id="ncLink" class="nc-link" href="${NASA_SOLAR}" target="_blank" rel="noopener">
        Check against NASA’s catalog ↗</a>`;
    document.body.append(card);
    this.card = card;
    this.dateEl = card.querySelector('#ncDate');
    this.metaEl = card.querySelector('#ncMeta');
    this.linkEl = card.querySelector('#ncLink');
  }

  updateCard(jd) {
    // Always find the TRUE next central eclipse by search. The pre-scanned list
    // only spans 2020-2030, so trusting it skips events for any other date
    // (e.g. at 2000 the real next is 2001-06-21, not the list's first 2020 entry).
    // Serve from cache only when the pure cache logic says it still answers this
    // date (jd inside [searchedFrom, result] — see next-eclipse-cache.js). Outside
    // it (notably after scrubbing BACK past an earlier eclipse) we search again.
    const cached = this._cache.get(jd);
    if (cached) {
      this._renderNext(cached, jd);
      return;
    }
    // Cache miss. If the clock has run PAST the last eclipse we found and the
    // next one isn't ready yet (playback outrunning the ~1 s search), render the
    // last result live rather than freezing on a stale earlier render — the
    // countdown then honestly reads "happening now" as it's crossed. (For a
    // backward scrub, jd is behind the last result, so we leave the display and
    // just re-search.)
    const last = this._cache.peek();
    if (this.sim.playing && last && jd > last.jd) {
      // Only while PLAYING can the clock outrun the ~1 s search — keep the most
      // recent result live (as "happening now" / "fast-forwarding") instead of
      // freezing. On a paused jump/scrub, show we're recomputing rather than a
      // stale/"fast-forwarding" value that makes no sense for a static view.
      this._renderNext(last, jd);
    } else {
      this.dateEl.textContent = 'computing…';
      this.metaEl.textContent = 'searching the integrated orbit';
    }
    this._requestNext(jd);
  }

  _renderNext(next, jd) {
    this._everRendered = true;
    const days = next.jd - jd;
    const rd = Math.round(days);
    const dateStr = formatJdDate(next.jd);
    // days < -45: the clock has run well past this one and the next isn't ready —
    // only reachable when playback outruns the ~1 s search. Say so honestly
    // instead of "happening now" for a long-past eclipse.
    const when = days < -45 ? 'passed · fast-forwarding faster than it computes'
      : days < 0.5 ? 'happening now'
        : `in ${rd} day${rd === 1 ? '' : 's'}`;
    const where = next.location
      ? ` · near ${Math.abs(Math.round(next.location.lat))}°${next.location.lat >= 0 ? 'N' : 'S'} ` +
        `${Math.abs(Math.round(next.location.lon))}°${next.location.lon >= 0 ? 'E' : 'W'}`
      : '';
    const metaStr = `${next.type} · ${when}${where} · ${formatJdDateTime(next.jd)}`;
    // updateCard() runs every animation frame during play; only WRITE the DOM
    // when the text actually changes, or the per-frame reflow of this fixed card
    // tanks the frame rate.
    if (dateStr === this._lastDateStr && metaStr === this._lastMetaStr) return;
    this._lastDateStr = dateStr;
    this._lastMetaStr = metaStr;
    this.dateEl.textContent = dateStr;
    this.metaEl.textContent = metaStr;
    const yr = jdToDate(next.jd).getUTCFullYear();
    this.linkEl.title = `Cross-check the ${dateStr} eclipse (${yr}) on NASA's site`;
  }

  // Ask for the next central eclipse after `fromJd`. Each search takes ~1-2 s,
  // so a scrubber DRAG (many input events) must not queue one per event — that
  // backs up the worker and the card looks hung. We debounce (fire only after
  // the date settles) and allow just one search in flight; the latest wanted
  // date is re-checked when it returns.
  _requestNext(fromJd) {
    this._wantFrom = fromJd;
    // THROTTLE, not debounce: schedule at most one pending search. A true
    // debounce (reset the timer on every call) STARVES during continuous
    // playback — updateCard() runs every animation frame, resetting the 150 ms
    // timer before it can fire, so the search never runs until the clock stops
    // (that's why the card only corrected on pause). Scheduling once fixes play
    // while still collapsing a scrubber drag's burst into a single search.
    if (this._inflight || this._debounce) return;
    this._debounce = setTimeout(() => { this._debounce = null; this._fireNext(); }, 150);
  }

  _fireNext() {
    if (this._inflight) return;
    const fromJd = this._wantFrom;
    this._firedFrom = fromJd; // remember what this search is "next after"
    this._inflight = true;
    const reqId = (this._reqId = (this._reqId || 0) + 1);
    const worker = this._ensureWorker();
    if (worker) {
      worker.postMessage({ kind: 'next', fromJd, reqId });
    } else {
      // No worker: compute inline (rare; blocks briefly).
      import('./eclipse.js').then(({ nextCentralSolarEclipse }) => {
        this._onNext(nextCentralSolarEclipse(fromJd), reqId);
      });
    }
  }

  _ensureWorker() {
    if (this._worker !== undefined) return this._worker;
    try {
      this._worker = new Worker(new URL('./eclipse-worker.js', import.meta.url), { type: 'module' });
      this._worker.onmessage = (e) => {
        if (e.data?.kind === 'next') this._onNext(e.data.eclipse, e.data.reqId);
      };
      this._worker.onerror = () => { this._worker = null; };
    } catch { this._worker = null; }
    return this._worker;
  }

  _onNext(eclipse, reqId) {
    this._inflight = false;
    if (reqId !== this._reqId) return; // superseded
    if (!eclipse) { this.dateEl.textContent = 'none found ahead'; this.metaEl.textContent = ''; return; }
    this._cache.set(this._firedFrom, eclipse); // record: search from _firedFrom -> eclipse
    // Re-render for the current date; if it scrubbed past this result while we
    // computed, updateCard() will kick off exactly one more search.
    this.updateCard(this.sim.jd);
  }

  _buildMethods() {
    const btn = document.createElement('button');
    btn.id = 'methodsBtn';
    btn.className = 'btn';
    btn.textContent = 'Methods';
    btn.title = 'How this is computed, and its error sources';
    // slot it into the control bar
    document.getElementById('controls')?.append(btn);

    const overlay = document.createElement('div');
    overlay.id = 'methods';
    overlay.className = 'overlay hidden';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-label', 'Methods and error sources');
    overlay.innerHTML = `
      <div class="help-card">
        <h2>Methods &amp; honest error sources</h2>
        <p id="methodsBody">
          <strong>Derived here:</strong> every body’s position comes from a symplectic
          (leapfrog) N-body integration of Newtonian gravity — the Sun, eight planets,
          and the Moon as point masses — started from J2000 state vectors and stepped
          forward or back in time. Eclipses are found purely from that geometry: a
          central solar eclipse is flagged when the Moon’s shadow axis passes within one
          Earth radius of Earth’s centre, and “greatest eclipse” is the instant of
          closest approach. The geographic point under that shadow is found by
          intersecting the axis with Earth’s surface and rotating into longitude via
          sidereal time (GMST).
        </p>
        <p>
          <strong>Fixture, not derived:</strong> the J2000 initial state vectors and the
          GM values come from JPL (DE441). Published planet longitudes and the NASA/GSFC
          eclipse catalog are used <em>only</em> to score accuracy — never to place a body
          or find an eclipse.
        </p>
        <p>
          <strong>Known error sources:</strong> the model is point-mass Newtonian only —
          no general relativity, no Earth oblateness (J2), no tides or solar radiation.
          The Moon is the hardest case; its fast orbit needs a small step, so detection
          integrates at 0.005 day (timing error under ~20 min) while the live view runs
          at 0.05 day, where the Moon’s residual phase error is invisible. Times treat the
          dynamical clock as UTC, ignoring ΔT (~70 s); with the ~0.3 h timing error this
          caps eclipse longitude to ~6° (latitude stays within ~1°). Type comes from the
          umbral cone along the whole track, correct on 15 of 16 — the lone miss is a
          knife-edge hybrid below a point model’s resolution. Orbit rings are a two-body
          (Sun + planet) integration; distances toggle true/log; body sizes never to scale.
        </p>
        <button class="btn" id="methodsClose">Close</button>
      </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) this.showMethods(false); });
    document.body.append(overlay);
    this.methodsOverlay = overlay;
    btn.onclick = () => this.showMethods(true);
    overlay.querySelector('#methodsClose').onclick = () => this.showMethods(false);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') this.showMethods(false); });
  }

  showMethods(show) {
    this.methodsOverlay.classList.toggle('hidden', !show);
  }
}
