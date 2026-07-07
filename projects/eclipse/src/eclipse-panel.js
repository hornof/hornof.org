// In-page list of detected solar eclipses. Each detection is matched to the
// published catalog and its timing error is shown in a column that never goes
// away — showing the miss margin IS the feature. Clicking a row flies the
// orrery to that eclipse.

import { SOLAR_ECLIPSE_CATALOG, CATALOG_SOURCE } from './eclipse-catalog.js';
import { LUNAR_ECLIPSE_CATALOG, SAROS_SEEDS } from './lunar-catalog.js';
import { assignSaros } from './saros.js';
import { dateToJd, formatJdDateTime, formatJdDate } from './time.js';

const SCAN_START = '2020-01-01T00:00:00Z';
const SCAN_END = '2031-01-01T00:00:00Z';
const LUNAR_START = '2021-01-01T00:00:00Z';
const LUNAR_END = '2031-01-01T00:00:00Z';

function catalogJd(entry) { return dateToJd(new Date(entry.date)); }

const SAROS_SEED_JD = SAROS_SEEDS.map((s) => ({ jd: dateToJd(new Date(s.date)), number: s.saros }));

/** Match a detection to the nearest entry of a catalog within 1 day. */
function nearestIn(list, detJd) {
  let best = null, bd = 1;
  for (const c of list) {
    const dd = Math.abs(detJd - catalogJd(c));
    if (dd < bd) { bd = dd; best = c; }
  }
  return best;
}

/** Match a solar detection to the nearest catalog entry within 1 day. */
export function matchCatalog(detJd) { return nearestIn(SOLAR_ECLIPSE_CATALOG, detJd); }

/** Format a {lat,lon} sub-point as e.g. "25°N 108°W", or "—" if none. */
export function formatLatLon(loc) {
  if (!loc) return '—';
  const la = `${Math.abs(Math.round(loc.lat))}°${loc.lat >= 0 ? 'N' : 'S'}`;
  const lo = `${Math.abs(Math.round(loc.lon))}°${loc.lon >= 0 ? 'E' : 'W'}`;
  return `${la} ${lo}`;
}

export class EclipsePanel {
  constructor({ onPick } = {}) {
    this.onPick = onPick;
    this.eclipses = [];
    this._build();
    this._scan();
  }

  _build() {
    const panel = document.createElement('aside');
    panel.id = 'eclipsePanel';
    panel.className = 'panel hidden';
    panel.setAttribute('aria-label', 'Detected solar eclipses');
    panel.innerHTML = `
      <div class="panel-head">
        <h2>Solar eclipses 2020–2030</h2>
        <button class="btn" id="eclipseClose" aria-label="Close eclipse list">×</button>
      </div>
      <p class="panel-sub" id="eclipseStatus">Computing from the integrated orbit…</p>
      <div class="table-wrap">
        <table id="eclipseTable">
          <thead><tr>
            <th>Detected (UTC)</th><th>Type</th><th>Where (GE)</th><th>Δ</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <h2 class="panel-h2b">Lunar eclipses 2021–2030 · Saros</h2>
      <p class="panel-sub" id="lunarStatus">…</p>
      <div class="table-wrap">
        <table id="lunarTable">
          <thead><tr>
            <th>Detected (UTC)</th><th>Type</th><th>Saros</th><th>Δ</th>
          </tr></thead>
          <tbody></tbody>
        </table>
      </div>
      <p class="panel-foot">Δ = detected greatest-eclipse time minus published time.
        Catalog: NASA/GSFC (Espenak &amp; Meeus). All computed from Newtonian gravity —
        no eclipse data is used to find them, only to score them. Saros numbers are
        derived from the ~6585.3-day periodicity, propagated from one seed eclipse
        per series (dated before 2020), then checked against the catalog.
        “Where (GE)” is the geographic point of greatest eclipse (Earth rotation via
        GMST): latitude lands within ~1° of NASA, longitude within ~6° (Earth turns
        15°/hour, so the ~0.3 h timing error caps it). Type comes from the umbral
        cone along the whole track — total/annular match on 15 of 16; the one miss
        is the 2023 Apr 20 hybrid, whose annular tips are finer than a mean-radius
        point model can resolve.</p>`;
    document.body.append(panel);
    this.panel = panel;
    this.tbody = panel.querySelector('#eclipseTable tbody');
    this.lunarBody = panel.querySelector('#lunarTable tbody');
    this.status = panel.querySelector('#eclipseStatus');
    this.lunarStatus = panel.querySelector('#lunarStatus');
    panel.querySelector('#eclipseClose').onclick = () => this.toggle(false);
  }

  _scan() {
    const startJd = dateToJd(new Date(SCAN_START));
    const endJd = dateToJd(new Date(SCAN_END));
    const lunarStartJd = dateToJd(new Date(LUNAR_START));
    const lunarEndJd = dateToJd(new Date(LUNAR_END));
    let worker;
    try {
      worker = new Worker(new URL('./eclipse-worker.js', import.meta.url), { type: 'module' });
    } catch { worker = null; }

    const handle = (eclipses, lunar, ms) => {
      this.eclipses = eclipses;
      this.lunar = lunar || [];
      window.__eclipses = eclipses;
      window.__lunarEclipses = this.lunar;
      this._render(ms);
      this._renderLunar();
      window.dispatchEvent(new CustomEvent('eclipses-ready', { detail: eclipses }));
    };

    const args = { startJd, endJd, lunarStartJd, lunarEndJd };
    if (worker) {
      worker.onmessage = (e) => { handle(e.data.eclipses, e.data.lunar, e.data.ms); worker.terminate(); };
      worker.onerror = () => { worker.terminate(); this._scanInline(args, handle); };
      worker.postMessage(args);
    } else {
      this._scanInline(args, handle);
    }
  }

  // Fallback if module workers are unavailable (e.g. file://).
  async _scanInline({ startJd, endJd, lunarStartJd, lunarEndJd }, handle) {
    const [{ scanSolarEclipses }, { scanLunarEclipses }] = await Promise.all([
      import('./eclipse.js'), import('./lunar-eclipse.js'),
    ]);
    const t0 = performance.now();
    const eclipses = scanSolarEclipses(startJd, endJd);
    const lunar = scanLunarEclipses(lunarStartJd, lunarEndJd);
    handle(eclipses, lunar, performance.now() - t0);
  }

  _renderLunar() {
    let worst = 0, sarosOk = 0, sarosTotal = 0;
    this.lunarBody.innerHTML = '';
    for (const ecl of this.lunar) {
      const cat = nearestIn(LUNAR_ECLIPSE_CATALOG, ecl.jd);
      const errH = cat ? (ecl.jd - catalogJd(cat)) * 24 : null;
      if (errH != null) worst = Math.max(worst, Math.abs(errH));
      const saros = assignSaros(ecl.jd, SAROS_SEED_JD);
      if (saros != null) { sarosTotal++; if (cat && saros === cat.saros) sarosOk++; }
      const tr = document.createElement('tr');
      tr.className = 'ecl-row';
      const errCell = errH == null ? '—'
        : `<span class="${Math.abs(errH) < 6 ? 'ok' : 'miss'}">${errH >= 0 ? '+' : ''}${errH.toFixed(2)} h</span>`;
      const sarosCell = saros == null ? '—'
        : `<span class="${cat && saros === cat.saros ? 'ok' : 'miss'}">${saros}</span>`;
      tr.innerHTML =
        `<td>${formatJdDateTime(ecl.jd)}</td>` +
        `<td class="type-${ecl.type}">${ecl.type}</td>` +
        `<td>${sarosCell}</td>` +
        `<td>${errCell}</td>`;
      tr.tabIndex = 0;
      const jump = () => this.onPick?.(ecl);
      tr.onclick = jump;
      tr.onkeydown = (e) => { if (e.key === 'Enter') jump(); };
      this.lunarBody.append(tr);
    }
    this.lunarStatus.textContent =
      `${this.lunar.length} lunar eclipses · worst timing ${worst.toFixed(2)} h · ` +
      `Saros derived from periodicity for ${sarosTotal} seeded series, ${sarosOk}/${sarosTotal} match catalog ` +
      `(others shown “—”: no out-of-window seed).`;
  }

  _render(ms) {
    let worst = 0;
    this.tbody.innerHTML = '';
    for (const ecl of this.eclipses) {
      const cat = matchCatalog(ecl.jd);
      const errH = cat ? (ecl.jd - catalogJd(cat)) * 24 : null;
      if (errH != null) worst = Math.max(worst, Math.abs(errH));
      const tr = document.createElement('tr');
      tr.tabIndex = 0;
      tr.className = 'ecl-row';
      const errCell = errH == null ? '—'
        : `<span class="${Math.abs(errH) < 6 ? 'ok' : 'miss'}">${errH >= 0 ? '+' : ''}${errH.toFixed(2)} h</span>`;
      tr.innerHTML =
        `<td>${formatJdDateTime(ecl.jd)}</td>` +
        `<td class="type-${ecl.type}">${ecl.type}</td>` +
        `<td class="geo">${formatLatLon(ecl.location)}</td>` +
        `<td>${errCell}</td>`;
      const jump = () => this.onPick?.(ecl);
      tr.onclick = jump;
      tr.onkeydown = (e) => { if (e.key === 'Enter') jump(); };
      this.tbody.append(tr);
    }
    this.status.textContent =
      `${this.eclipses.length} central eclipses detected in ${(ms / 1000).toFixed(1)} s · ` +
      `worst timing error ${worst.toFixed(2)} h · greatest-eclipse point derived (lat ±1°, lon ±6°).`;
  }

  toggle(show) {
    const willShow = show ?? this.panel.classList.contains('hidden');
    this.panel.classList.toggle('hidden', !willShow);
  }
}
