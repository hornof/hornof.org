// Three.js orrery renderer. Draws the Sun at the origin with the planets and
// Moon at their integrated heliocentric positions. Distances use a toggle
// between TRUE scale (linear AU) and LOG scale (compressed so the inner planets
// stay visible next to Neptune). Body *sizes* are never to scale — they are
// fixed visual radii, labelled as such on the page.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { makeSystem, integrate, bodyPos } from './integrator.js';
import { GM, PERIOD_DAYS } from './constants.js';
import { INITIAL_STATE } from './initial-state.js';
import { scalePosition } from './scale.js';

// Orbit-ring colour, pinned to a light slate that reads clearly on the always-
// black sky (the old 0x33405e was too dark, and worse under macOS light mode).
export const ORBIT_RING_COLOR = 0x7c90ba;

// Fixed visual radii (scene units) and colours. Not to scale.
const BODY_STYLE = {
  sun: { r: 3.0, color: 0xffcc33, emissive: 0xffaa00 },
  mercury: { r: 0.5, color: 0x9a8f88 },
  venus: { r: 0.7, color: 0xd9b38c },
  earth: { r: 0.75, color: 0x3b7fd4 },
  moon: { r: 0.28, color: 0xbbbbbb },
  mars: { r: 0.6, color: 0xc1440e },
  jupiter: { r: 1.5, color: 0xd8b088 },
  saturn: { r: 1.3, color: 0xe0c286 },
  uranus: { r: 1.0, color: 0x9fe0e0 },
  neptune: { r: 1.0, color: 0x3f66d0 },
};

/** Map a heliocentric position (AU) to a scene position for the given mode. */
export class Orrery {
  constructor(container) {
    this.container = container;
    this.mode = 'log';
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05070f);

    const w = container.clientWidth || 800;
    const h = container.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 5000);
    this.camera.position.set(0, 90, 130);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    this.renderer.setSize(w, h);
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Solar system orrery view');

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const sunLight = new THREE.PointLight(0xffffff, 2.5, 0, 0.4);
    this.scene.add(sunLight);

    this._addStarfield();
    this.meshes = {};
    this.orbits = {};
    this._buildBodies();
    this._buildOrbits();

    window.addEventListener('resize', () => this.onResize());
  }

  _addStarfield() {
    const geo = new THREE.BufferGeometry();
    const N = 1500;
    const pos = new Float32Array(N * 3);
    // Deterministic pseudo-random starfield (no Math.random dependence).
    let seed = 987654321;
    const rand = () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
    for (let i = 0; i < N; i++) {
      const r = 1500 + rand() * 1500;
      const th = rand() * Math.PI * 2;
      const ph = Math.acos(2 * rand() - 1);
      pos[3 * i] = r * Math.sin(ph) * Math.cos(th);
      pos[3 * i + 1] = r * Math.sin(ph) * Math.sin(th);
      pos[3 * i + 2] = r * Math.cos(ph);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x888899, size: 1.2 })));
  }

  _buildBodies() {
    for (const [name, style] of Object.entries(BODY_STYLE)) {
      const color = style.color;
      const geo = new THREE.SphereGeometry(style.r, 24, 16);
      const mat = name === 'sun'
        ? new THREE.MeshBasicMaterial({ color })
        : new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name;
      this.scene.add(mesh);
      this.meshes[name] = mesh;
    }
  }

  // Precompute each planet's orbit as a two-body (Sun+planet) integration over
  // one period, so the ring reflects the actual dynamics, not a drawn ellipse.
  _buildOrbits() {
    const planets = Object.keys(PERIOD_DAYS);
    for (const name of planets) {
      const sub = makeSystem(['sun', name], INITIAL_STATE, GM);
      const period = PERIOD_DAYS[name];
      const samples = 240;
      const dtDays = period / samples;
      const nSub = Math.max(1, Math.round(dtDays / 0.2));
      const pts = [];
      for (let i = 0; i <= samples; i++) {
        const sun = bodyPos(sub, 0);
        const pl = bodyPos(sub, 1);
        pts.push([pl[0] - sun[0], pl[1] - sun[1], pl[2] - sun[2]]);
        integrate(sub, dtDays / nSub, nSub);
      }
      const geo = new THREE.BufferGeometry();
      const mat = new THREE.LineBasicMaterial({ color: ORBIT_RING_COLOR, transparent: true, opacity: 0.8 });
      const line = new THREE.Line(geo, mat);
      this.scene.add(line);
      this.orbits[name] = { line, pts };
    }
    this._applyOrbitScale();
  }

  _applyOrbitScale() {
    for (const { line, pts } of Object.values(this.orbits)) {
      const arr = new Float32Array(pts.length * 3);
      pts.forEach((p, i) => {
        const s = scalePosition(p, this.mode);
        arr[3 * i] = s[0]; arr[3 * i + 1] = s[1]; arr[3 * i + 2] = s[2];
      });
      line.geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      line.geometry.computeBoundingSphere();
    }
  }

  setScaleMode(mode) {
    this.mode = mode === 'true' ? 'true' : 'log';
    this._applyOrbitScale();
  }

  /** positions: {name:[x,y,z] AU heliocentric}. Sun stays at origin. */
  update(positions) {
    const sun = positions.sun || [0, 0, 0];
    for (const [name, mesh] of Object.entries(this.meshes)) {
      const p = positions[name] || [0, 0, 0];
      const rel = [p[0] - sun[0], p[1] - sun[1], p[2] - sun[2]];
      const s = scalePosition(rel, this.mode);
      mesh.position.set(s[0], s[1], s[2]);
    }
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }
}
