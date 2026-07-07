// Module Web Worker: runs the solar and lunar eclipse scans off the main thread
// so the orrery keeps animating while the (~2-3 s) decade scans compute.
import { scanSolarEclipses, nextCentralSolarEclipse } from './eclipse.js';
import { scanLunarEclipses } from './lunar-eclipse.js';

self.onmessage = (e) => {
  // On-demand "next solar eclipse after fromJd" for the verify card (any date).
  if (e.data.kind === 'next') {
    const eclipse = nextCentralSolarEclipse(e.data.fromJd);
    self.postMessage({ kind: 'next', reqId: e.data.reqId, eclipse });
    return;
  }
  // Full decade scan for the panel lists.
  const { startJd, endJd, lunarStartJd, lunarEndJd } = e.data;
  const t0 = performance.now();
  const eclipses = scanSolarEclipses(startJd, endJd);
  const lunar = scanLunarEclipses(lunarStartJd ?? startJd, lunarEndJd ?? endJd);
  self.postMessage({ eclipses, lunar, ms: performance.now() - t0 });
};
