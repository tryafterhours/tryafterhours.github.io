// AfterHours story v3: the evening scene (three.js). Small, soft and warm:
// a backdrop for two people, never the headline. Reads window.AH.st.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const AH = window.AH, st = AH.st;
const host = document.getElementById('scene'), cv = document.getElementById('gl');
const mobile = innerWidth < 760;
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: devicePixelRatio < 1.5, alpha: true, powerPreference: 'high-performance' });
let dpr = Math.min(devicePixelRatio, mobile ? 1.5 : 1.75); const dprMax = dpr, dprMin = Math.min(1, dpr); renderer.setPixelRatio(dpr);
renderer.setClearColor(0x000000, 0);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.7;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const clamp = (t) => Math.min(1, Math.max(0, t)), lerp = (a, b, t) => a + (b - a) * t;

/* light: soft and warm; photographed skies only for gentle reflections */
const hemi = new THREE.HemisphereLight(0xffe4c4, 0x6b4e3e, 1.2); scene.add(hemi);
const sunL = new THREE.DirectionalLight(0xffc489, 2.2); sunL.castShadow = true;
sunL.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
Object.assign(sunL.shadow.camera, { left: -120, right: 120, top: 120, bottom: -40, near: 10, far: 700 }); sunL.shadow.bias = -0.0004;
sunL.position.set(-260, 120, -200); scene.add(sunL, sunL.target);
scene.fog = new THREE.Fog(0xf2c191, 120, 560);
const pmrem = new THREE.PMREMGenerator(renderer);
const env = {};
const afterPaint = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 2500 }) : setTimeout(f, 1200));
afterPaint(() => new RGBELoader().load('assets/the_sky_is_on_fire.hdr', (t) => { t.mapping = THREE.EquirectangularReflectionMapping; env.day = pmrem.fromEquirectangular(t).texture; scene.environment = env.day; t.dispose(); }));
afterPaint(() => setTimeout(() => new RGBELoader().load('assets/satara_night_no_lamps.hdr', (t) => { t.mapping = THREE.EquirectangularReflectionMapping; env.night = pmrem.fromEquirectangular(t).texture; t.dispose(); }), 1500));

/* facades: soft, warm curtain walls (backdrop, not real-estate glamour) */
function facade({ cols = 8, rows = 15, glass = ['#6d6670', '#746c74', '#675f69'], mull = '#b9aea4', spandrel = '#a2968d', punched = false } = {}) {
  const W = 512, H = Math.round(512 * rows / cols * 0.9), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const cw = W / cols, rh = H / rows; x.fillStyle = punched ? '#cbbfae' : mull; x.fillRect(0, 0, W, H);
  for (let j = 0; j < rows; j++) { x.fillStyle = spandrel; x.fillRect(0, j * rh + rh * 0.78, W, rh * 0.22);
    for (let i = 0; i < cols; i++) { const px = i * cw + (punched ? cw * 0.18 : cw * 0.04), py = j * rh + (punched ? rh * 0.14 : rh * 0.04), pw = cw * (punched ? 0.64 : 0.92), ph = rh * (punched ? 0.56 : 0.72);
      const g = x.createLinearGradient(px, py, px + pw, py + ph); g.addColorStop(0, glass[Math.floor(rnd() * glass.length)]); g.addColorStop(1, '#4a3f48'); x.fillStyle = g; x.fillRect(px, py, pw, ph); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function nightTex(cols, rows, d = 0.32) {
  const c = document.createElement('canvas'); c.width = 256; c.height = Math.round(256 * rows / cols * 0.9); const x = c.getContext('2d'); x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height);
  const cw = c.width / cols, rh = c.height / rows;
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (rnd() < d) { x.fillStyle = rnd() < 0.7 ? '#ffcf86' : '#fff1d8'; x.globalAlpha = 0.55 + rnd() * 0.45; x.fillRect(i * cw + cw * 0.08, j * rh + rh * 0.08, cw * 0.84, rh * 0.66); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const M = {
  concrete: new THREE.MeshStandardMaterial({ color: 0xd8ccbb, roughness: 0.85 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: 0xa99a88, roughness: 0.9 }),
  ground: new THREE.MeshStandardMaterial({ color: 0xcdb698, roughness: 1 }),
  trunk: new THREE.MeshStandardMaterial({ color: 0x5b4636, roughness: 1 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x6d6a68, roughness: 0.5, metalness: 0.6 }),
  tyre: new THREE.MeshStandardMaterial({ color: 0x151313, roughness: 0.8 }),
  paint: new THREE.MeshBasicMaterial({ color: 0xeadfc8 }),
};
const glassFront = new THREE.MeshPhysicalMaterial({ map: facade({ cols: 8, rows: 15 }), roughness: 0.75, metalness: 0.3, clearcoat: 0.3, clearcoatRoughness: 0.3 });
const glassSide = new THREE.MeshPhysicalMaterial({ map: facade({ cols: 5, rows: 15 }), roughness: 0.8, metalness: 0.25 });

/* ground + road (real asphalt) */
const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), M.ground); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const TL = new THREE.TextureLoader();
const asp = ['Diffuse', 'nor_gl', 'Rough'].map((k) => { const t = TL.load('assets/asphalt_' + k + '.jpg'); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(400, 2); return t; }); asp[0].colorSpace = THREE.SRGBColorSpace;
const road = new THREE.Mesh(new THREE.PlaneGeometry(4000, 16), new THREE.MeshStandardMaterial({ map: asp[0], normalMap: asp[1], roughnessMap: asp[2], color: 0x8a8480 }));
road.rotation.x = -Math.PI / 2; road.position.set(0, 0.02, 52); road.receiveShadow = true; scene.add(road);
const foot = new THREE.Mesh(new THREE.BoxGeometry(4000, 0.4, 4), M.concrete); foot.position.set(0, 0.2, 42); foot.receiveShadow = true; scene.add(foot);
const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(4, 0.3), M.paint, 300);
for (let i = 0; i < 300; i++) dash.setMatrixAt(i, new THREE.Matrix4().makeRotationX(-Math.PI / 2).setPosition(-1500 + i * 10, 0.04, 52)); scene.add(dash);

/* the tower (the stage for two people) */
const tower = new THREE.Group(); scene.add(tower);
const TW = 26, TD = 18, FL = 15, FH = 3.7, TH = FL * FH, COLS = 8, SCOLS = 5;
const pod = new THREE.Mesh(new THREE.BoxGeometry(44, 7, 30), M.concrete); pod.position.y = 3.5; pod.castShadow = pod.receiveShadow = true; tower.add(pod);
const body = new THREE.Mesh(new THREE.BoxGeometry(TW, TH, TD), [glassSide, glassSide, M.concrete, M.concrete, glassFront, glassFront]); body.position.y = 7 + TH / 2; body.castShadow = true; tower.add(body);
for (let f = 0; f <= FL; f++) { const sl = new THREE.Mesh(new THREE.BoxGeometry(TW + 0.8, 0.55, TD + 0.8), M.concrete); sl.position.y = 7 + f * FH; sl.castShadow = true; tower.add(sl); }
for (let c = 0; c <= COLS; c++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(0.35, TH, 1.1), M.concrete); fin.position.set(-TW / 2 + c * (TW / COLS), 7 + TH / 2, TD / 2 + 0.4); fin.castShadow = true; tower.add(fin); }
for (let c = 0; c <= SCOLS; c++) { const fin = new THREE.Mesh(new THREE.BoxGeometry(1.1, TH, 0.35), M.concrete); fin.position.set(TW / 2 + 0.4, 7 + TH / 2, -TD / 2 + c * (TD / SCOLS)); fin.castShadow = true; tower.add(fin); }
const crown = new THREE.Mesh(new THREE.BoxGeometry(TW + 1.6, 2.2, TD + 1.6), M.concrete); crown.position.y = 7 + TH + 1.1; tower.add(crown);
[[-6, 3.5, 8, 6], [6, 2.5, 5, 5]].forEach(([x, h, w, d]) => { const r = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M.concreteDark); r.position.set(x, 7 + TH + 2.2 + h / 2, -2); tower.add(r); });
const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 0.5, 0.3), toneMapped: false })); beacon.position.set(-6, 7 + TH + 9, -2); tower.add(beacon);
const lobby = new THREE.Mesh(new THREE.PlaneGeometry(16, 5), new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.68, 0.36), toneMapped: false })); lobby.position.set(0, 3, 15.05); tower.add(lobby);

// windows: each one individually lit; additive so daylight shows the glass
const winMat = new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const cw = TW / COLS, cs = TD / SCOLS, WH = FH - 1.15, all = [];
for (let f = 0; f < FL; f++) for (let c = 0; c < COLS; c++) all.push({ f, c, face: 'front' });
for (let f = 0; f < FL; f++) for (let c = 0; c < SCOLS; c++) all.push({ f, c, face: 'side' });
const wins = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), winMat, all.length);
const qSide = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
all.forEach((w, i) => {
  w.i = i; w.tone = rnd() < 0.7 ? new THREE.Color(1, 0.7, 0.36) : new THREE.Color(0.95, 0.9, 0.8); w.k = 0.75 + rnd() * 0.5; w.leave = rnd();
  const y = 7 + w.f * FH + 0.55 + WH / 2;
  const m = w.face === 'front'
    ? new THREE.Matrix4().compose(new THREE.Vector3(-TW / 2 + cw * (w.c + 0.5), y, TD / 2 + 0.03), new THREE.Quaternion(), new THREE.Vector3(cw - 0.75, WH, 1))
    : new THREE.Matrix4().compose(new THREE.Vector3(TW / 2 + 0.03, y, TD / 2 - cs * (w.c + 0.5)), qSide, new THREE.Vector3(cs - 0.75, WH, 1));
  wins.setMatrixAt(i, m); w.pos = new THREE.Vector3().setFromMatrixPosition(m);
});
tower.add(wins);
const A = all.find((w) => w.face === 'front' && w.f === 3 && w.c === 2), B = all.find((w) => w.face === 'front' && w.f === 10 && w.c === 6), YOU = all.find((w) => w.face === 'front' && w.f === 6 && w.c === 4);
tower.rotation.y = -0.42;

// the two people
function person(pose) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = 'rgba(40,24,22,.92)';
  if (pose === 'desk') { x.beginPath(); x.arc(46, 52, 13, 0, 7); x.fill(); x.beginPath(); x.moveTo(24, 128); x.quadraticCurveTo(26, 74, 46, 70); x.quadraticCurveTo(68, 74, 70, 128); x.fill(); x.fillRect(74, 74, 40, 28); x.fillRect(90, 102, 8, 10); x.fillRect(60, 112, 68, 5); }
  else { x.beginPath(); x.arc(70, 40, 12, 0, 7); x.fill(); x.beginPath(); x.moveTo(50, 128); x.quadraticCurveTo(50, 60, 70, 56); x.quadraticCurveTo(90, 60, 92, 128); x.fill(); x.fillRect(84, 74, 8, 22); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cw - 0.9, WH - 0.1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
  mesh.renderOrder = 3; return mesh;
}
const people = [[A, 'desk'], [B, 'window']].map(([w, pose]) => { const p = person(pose); p.position.copy(w.pos).add(new THREE.Vector3(0, 0, 0.06)); tower.add(p); return p; });

/* low, soft neighbours + a hazy distant skyline (backdrop only) */
const cityMats = [];
for (let v = 0; v < 4; v++) { const cols = 6 + v, rows = 8 + v * 2, punched = v % 2 === 1;
  cityMats.push(new THREE.MeshStandardMaterial({ map: facade({ cols, rows, punched, glass: ['#7a7077', '#6f666d', '#776e75'], mull: '#b3a79c' }), roughness: 0.9, emissive: 0xffffff, emissiveMap: nightTex(cols, rows), emissiveIntensity: 0 })); }
const plain = new THREE.MeshStandardMaterial({ color: 0xb7a998, roughness: 0.95 });
[[-62, 26, -18], [-96, 34, -30], [64, 30, -16], [100, 22, -34], [-140, 28, -50], [140, 32, -52]].forEach(([x, h, z], i) => {
  const m = cityMats[i % 4]; const b = new THREE.Mesh(new THREE.BoxGeometry(30, h, 22), [m, m, plain, plain, m, m]); b.position.set(x, h / 2, z); b.castShadow = b.receiveShadow = true; scene.add(b); });
for (let i = 0; i < 60; i++) { const w = 16 + rnd() * 26, h = 18 + rnd() * 46, x = -520 + rnd() * 1040, z = -170 - rnd() * 260; const m = cityMats[i % 4];
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 18), [m, m, plain, plain, m, m]); b.position.set(x, h / 2, z); scene.add(b); }

/* Namma Metro: elevated viaduct on round piers + purple train */
const VY = 11, VZ = 34;
const deck = new THREE.Mesh(new THREE.BoxGeometry(4000, 1.6, 8), M.concrete); deck.position.set(0, VY, VZ); deck.castShadow = deck.receiveShadow = true; scene.add(deck);
const par = new THREE.Mesh(new THREE.BoxGeometry(4000, 1, 0.4), M.concreteDark); par.position.set(0, VY + 1.2, VZ + 3.8); scene.add(par);
for (let x = -640; x <= 640; x += 32) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.3, VY - 1, 20), M.concrete); p.position.set(x, (VY - 1) / 2, VZ); p.castShadow = true; scene.add(p);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.2, 7), M.concrete); cap.position.set(x, VY - 1.3, VZ); scene.add(cap); }
const train = new THREE.Group(); scene.add(train);
const purple = new THREE.MeshPhysicalMaterial({ color: 0x6a2c8c, roughness: 0.35, metalness: 0.3, clearcoat: 0.8 });
const silver = new THREE.MeshStandardMaterial({ color: 0xd7d5da, roughness: 0.35, metalness: 0.6 });
const tWinMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.12, 0.11, 0.14), toneMapped: false });
for (let k = 0; k < 3; k++) { const car = new THREE.Group();
  const shell = new THREE.Mesh(new RoundedBoxGeometry(21, 3.6, 3.2, 4, 0.7), silver); shell.castShadow = true; car.add(shell);
  const skirt = new THREE.Mesh(new RoundedBoxGeometry(21.05, 1.3, 3.25, 3, 0.4), purple); skirt.position.y = -1.1; car.add(skirt);
  const band = new THREE.Mesh(new THREE.BoxGeometry(21.1, 0.25, 3.3), new THREE.MeshStandardMaterial({ color: 0x2f9e57 })); band.position.y = -0.35; car.add(band);
  const wl = new THREE.Mesh(new THREE.BoxGeometry(18, 1.1, 3.28), tWinMat); wl.position.y = 0.55; car.add(wl);
  car.position.set(k * 21.6, VY + 2.6, VZ); train.add(car); }

/* Namma Metro station (light touch): the train glides through it */
{
  const SX = 40, SL = 46;
  const blue = new THREE.MeshStandardMaterial({ color: 0x2f6fb5, roughness: 0.5 });
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x5f7fae, roughness: 0.45, metalness: 0.45, side: THREE.DoubleSide });
  const plat = new THREE.Mesh(new THREE.BoxGeometry(SL, 1.2, 15), M.concrete); plat.position.set(SX, VY + 0.2, VZ); plat.castShadow = plat.receiveShadow = true; scene.add(plat);
  const concourse = new THREE.Mesh(new THREE.BoxGeometry(SL * 0.8, 4.2, 13), M.concrete); concourse.position.set(SX, VY - 3.6, VZ); concourse.castShadow = true; scene.add(concourse);
  const band = new THREE.Mesh(new THREE.BoxGeometry(SL * 0.8 + 0.2, 1.1, 13.2), blue); band.position.set(SX, VY - 2.2, VZ); scene.add(band);
  for (const z of [-7.2, 7.2]) { const rail = new THREE.Mesh(new THREE.BoxGeometry(SL, 0.9, 0.15), blue); rail.position.set(SX, VY + 1.3, VZ + z); scene.add(rail); }
  for (let x = -SL / 2 + 4; x <= SL / 2 - 4; x += 10) for (const z of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 7.2, 10), M.metal); c.position.set(SX + x, VY + 4.4, VZ + z * 8.9 * Math.cos(Math.PI * 0.11)); scene.add(c); }
  // arched roof shed (solid, only above the platform), like Namma Metro elevated stations
  const R0 = 9, R1 = 9.35, a0 = Math.PI * 0.11, a1 = Math.PI * 0.89, sh = new THREE.Shape();
  sh.absarc(0, 0, R1, a0, a1, false); sh.absarc(0, 0, R0, a1, a0, true);
  const roofGeo = new THREE.ExtrudeGeometry(sh, { depth: SL + 4, bevelEnabled: false, curveSegments: 28 });
  roofGeo.translate(0, 0, -(SL + 4) / 2);
  const roof = new THREE.Mesh(roofGeo, roofMat); roof.rotation.y = Math.PI / 2;
  roof.position.set(SX, VY + 8 - R0 * Math.sin(a0), VZ); roof.castShadow = true; scene.add(roof);
  for (const z of [-1, 1]) { const beam = new THREE.Mesh(new THREE.BoxGeometry(SL + 4, 0.5, 0.5), M.metal); beam.position.set(SX, VY + 8, VZ + z * R0 * Math.cos(a0)); scene.add(beam); }
}

/* Bengaluru autos */
function auto() { const g = new THREE.Group();
  const green = new THREE.MeshPhysicalMaterial({ color: 0x2e7d3e, roughness: 0.4, clearcoat: 0.7 }), yellow = new THREE.MeshPhysicalMaterial({ color: 0xf2c12e, roughness: 0.45, clearcoat: 0.5 });
  const add = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  add(new RoundedBoxGeometry(2.8, 1.1, 1.5, 3, 0.35), green, 0, 0.95, 0); add(new RoundedBoxGeometry(0.9, 1.5, 1.1, 3, 0.35), green, 1.45, 1.05, 0);
  add(new RoundedBoxGeometry(2.7, 0.35, 1.6, 3, 0.15), yellow, -0.1, 2.75, 0); add(new RoundedBoxGeometry(1.2, 1.4, 1.55, 3, 0.3), yellow, -0.85, 2.0, 0);
  [[1.45, 0.38, 0], [-0.9, 0.38, 0.68], [-0.9, 0.38, -0.68]].forEach(([x, y, z]) => { const w = add(new THREE.CylinderGeometry(0.38, 0.38, 0.24, 16), M.tyre, x, y, z); w.rotation.x = Math.PI / 2; });
  g.userData.head = add(new THREE.SphereGeometry(0.16, 10, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 1.4, 0.9), toneMapped: false }), 1.92, 1.35, 0);
  g.scale.setScalar(1.6); return g; }
const autos = [auto(), auto()]; autos[0].position.set(-60, 0, 49); autos[1].position.set(80, 0, 55); autos[1].rotation.y = Math.PI; autos.forEach((a) => scene.add(a));

/* trees (leaf cards) + street lamps */
function leafAtlas() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  for (let i = 0; i < 70; i++) { x.save(); x.translate(20 + rnd() * 216, 20 + rnd() * 216); x.rotate(rnd() * Math.PI); const l = 10 + rnd() * 12;
    x.fillStyle = ['#3e5a2c', '#4d6b34', '#35502a', '#5a7a3c', '#2f4624'][Math.floor(rnd() * 5)]; x.beginPath(); x.ellipse(0, 0, l, l * 0.42, 0, 0, 7); x.fill(); x.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const leafMat = new THREE.MeshStandardMaterial({ map: leafAtlas(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.95 });
const spots = []; for (let i = 0; i < 34; i++) { const x = -300 + i * 18 + rnd() * 6; if (Math.abs(x) < 16) continue; spots.push([x, 40 + rnd() * 1.2, 0.9 + rnd() * 0.35]); }
const CARDS = 170, leaves = new THREE.InstancedMesh(new THREE.PlaneGeometry(2.6, 2.6), leafMat, spots.length * CARDS); leaves.castShadow = true;
const tmp = new THREE.Object3D(); let li = 0;
spots.forEach(([x, z, s]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.35 * s, 0.6 * s, 6.5 * s, 8), M.trunk); t.position.set(x, 3.2 * s, z); t.castShadow = true; scene.add(t);
  for (let k = 0; k < CARDS; k++) { const u = rnd() * 6.283, v = Math.acos(2 * rnd() - 1), r = Math.cbrt(rnd());
    tmp.position.set(x + Math.sin(v) * Math.cos(u) * 5.2 * s * r, (7.8 + Math.cos(v) * 2.6 * r) * s, z + Math.sin(v) * Math.sin(u) * 4.2 * s * r);
    tmp.rotation.set(rnd() * 6, rnd() * 6, rnd() * 6); tmp.scale.setScalar(0.8 + rnd() * 0.6); tmp.updateMatrix(); leaves.setMatrixAt(li++, tmp.matrix); } });
scene.add(leaves);
const bulbMat = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
for (let x = -300; x <= 300; x += 36) { const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 9), M.metal); pole.position.set(x, 4.5, 44.5); scene.add(pole);
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 10), bulbMat); b.position.set(x, 8.8, 46.5); scene.add(b); }

/* sparks: a warm ember with a fading trail */
function glowTex() { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,248,225,1)'); g.addColorStop(0.25, 'rgba(255,205,120,.9)'); g.addColorStop(1, 'rgba(233,169,59,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const gt = glowTex();
function sparkTex() { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const halo = x.createRadialGradient(128, 128, 0, 128, 128, 128); halo.addColorStop(0, 'rgba(255,214,140,.55)'); halo.addColorStop(.35, 'rgba(255,190,100,.18)'); halo.addColorStop(1, 'rgba(255,170,80,0)');
  x.fillStyle = halo; x.fillRect(0, 0, 256, 256);
  x.save(); x.translate(128, 128); x.scale(3.6, 3.6); x.translate(-12, -12);
  const p = new Path2D('M12 1.5c.6 4.6 2.5 7.4 10.5 10.5-8 3.1-9.9 5.9-10.5 10.5-.6-4.6-2.5-7.4-10.5-10.5 8-3.1 9.9-5.9 10.5-10.5z');
  const g = x.createRadialGradient(9, 8, 0, 12, 12, 13); g.addColorStop(0, '#ffffff'); g.addColorStop(.3, '#ffe2a0'); g.addColorStop(.75, '#f0ae45'); g.addColorStop(1, '#b8691d');
  x.fillStyle = g; x.fill(p); x.restore();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; }
const sparkT = sparkTex();
const sprite = (size, c = 1.4) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: gt, color: new THREE.Color(c, c * 0.78, c * 0.45), blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true })); s.scale.setScalar(size); s.visible = false; scene.add(s); return s; };
const starSprite = (size) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: sparkT, depthWrite: false, depthTest: false, toneMapped: false, transparent: true })); s.scale.setScalar(size); s.visible = false; s.renderOrder = 10; scene.add(s); return s; };
const s1 = starSprite(4.2), s2 = starSprite(4.2), big = starSprite(9);
let line = null, glowLine = null, segs = 80, radial = 8;
const coreMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.35, 1.05, 0.66), toneMapped: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const haloMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.55, 0.25), toneMapped: false, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false });
const world = (w) => tower.localToWorld(w.pos.clone().add(new THREE.Vector3(0, 0, 1)));
const bez = (a, c, b, t) => a.clone().multiplyScalar((1 - t) ** 2).add(c.clone().multiplyScalar(2 * (1 - t) * t)).add(b.clone().multiplyScalar(t * t));

/* camera: frame like the 2D story (small tower, lots of evening sky) */
const camBase = new THREE.Vector3(), lookBase = new THREE.Vector3();
function frame() {
  const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = camera.aspect < 1 ? 40 : 28;
  const ph = window.AH.phone && window.AH.phone();
  camBase.set(camera.aspect < 1 ? 20 : 26, 3.2, camera.aspect < 1 ? (ph ? 150 : 178) : 215); lookBase.set(0, camera.aspect < 1 ? (ph ? 41 : 44) : 40, 0);
  if (ph) camera.fov = 41;
  camera.updateProjectionMatrix();
}
new ResizeObserver(() => { const ae = document.activeElement; if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return; frame(); }).observe(host); frame();

/* state → scene, every frame */
const dark = new THREE.Color(0, 0, 0), blindC = new THREE.Color(0.32, 0.22, 0.13);
const order = all.filter((w) => w !== A && w !== B).sort((p, q) => (q.f - p.f) + (rnd() - 0.5) * 3);
const tmpC = new THREE.Color(); let youLit = 0, lastSig = '', lastShadowT = -1;
const rank = new Map(order.map((w, i) => [w, i]));
AH.onJoin = () => { const t0 = performance.now(); (function up() { youLit = clamp((performance.now() - t0) / 1400); if (youLit < 1) requestAnimationFrame(up); })(); };
function update(now) {
  const t = AH.t ?? 0, n = st.dark;
  const pal = AH.palette(t);
  scene.fog.color.set(pal.low);
  hemi.intensity = lerp(1.2, 0.35, n); hemi.color.set(pal.mid).lerp(new THREE.Color(1, 1, 1), 0.25); hemi.groundColor.set(pal.top).multiplyScalar(0.55);
  sunL.intensity = lerp(2.2, 0, clamp(t * 1.6)); sunL.color.set(pal.top).lerp(new THREE.Color(1, 0.8, 0.55), 0.5);
  renderer.toneMappingExposure = lerp(0.72, 0.6, n);
  if (env.night && env.day) scene.environment = n > 0.6 ? env.night : env.day;
  scene.environmentIntensity = lerp(0.6, 0.3, n);
  // windows
  const offN = Math.round(st.off * order.length);
  const sig = [offN, (t * 200) | 0, (st.blinds * 100) | 0, (st.fuse * 50) | 0, (st.sky * 100) | 0, st.you > 0.5 ? ((now / 60) | 0) : 0, AH.joined ? (youLit * 50) | 0 : 0].join();
  if (sig !== lastSig) { lastSig = sig;
  all.forEach((w) => {
    let on = w === A || w === B ? 1 : rank.get(w) < offN ? 0 : 1;
    let lit = on * lerp(0.05, 1.0, clamp((t - 0.05) / 0.5)) * w.k;
    tmpC.copy(on ? w.tone : dark).multiplyScalar(lit);
    // blinds roll down floor by floor (privacy scene): warm light through fabric
    const d = (w.c / COLS) * 0.25 + (w.f / FL) * 0.3, bl = clamp((st.blinds - d) / 0.4);
    if (bl > 0) tmpC.lerp(blindC, bl);
    if (w === YOU && st.you > 0.5) { const pulse = AH.joined ? youLit * 1.3 : 0.18 + 0.22 * Math.abs(Math.sin(now / 650)); tmpC.copy(w.tone).multiplyScalar(pulse); }
    if (w === A || w === B) { const hero = 1 - clamp(st.sky * 2.5); tmpC.copy(w.tone).multiplyScalar(Math.max(lit, 0.75 * hero + lit) * (1 + st.fuse * 0.6)); }
    wins.setColorAt(w.i, tmpC);
  });
  wins.instanceColor.needsUpdate = true; }
  if (Math.abs(t - lastShadowT) > 0.01) { lastShadowT = t; renderer.shadowMap.needsUpdate = true; }
  people.forEach((p) => (p.material.opacity = Math.max(1 - clamp(st.sky * 2.5), clamp((n - 0.35) / 0.25)) * (1 - clamp(st.blinds * 2))));
  cityMats.forEach((m) => (m.emissiveIntensity = lerp(0, 0.9, clamp((n - 0.25) / 0.5))));
  bulbMat.color.setRGB(lerp(0, 1.5, n), lerp(0, 1.1, n), lerp(0, 0.6, n));
  tWinMat.color.setRGB(lerp(0.12, 1.8, n), lerp(0.11, 1.5, n), lerp(0.14, 1, n));
  autos.forEach((a) => (a.userData.head.visible = n > 0.4));
  // sparks
  const a = world(A), b = world(B), m = a.clone().lerp(b, 0.5).add(new THREE.Vector3(10, 2, 6));
  const ctrlAB = a.clone().lerp(b, 0.5).add(new THREE.Vector3(16, 3, 8));
  const t1 = clamp(st.s1), tf = 1 - clamp(st.trail);
  if (st.s2 <= 0) { s1.visible = st.s1 > 0 && st.s1 < 1; s1.position.copy(bez(a, ctrlAB, b, t1)); s2.visible = false; }
  else { s1.visible = s2.visible = st.fuse < 1; s1.position.copy(bez(a, a.clone().lerp(m, 0.5).add(new THREE.Vector3(0, 3, 0)), m, st.s2)); s2.position.copy(bez(b, b.clone().lerp(m, 0.5).add(new THREE.Vector3(0, -3, 0)), m, st.s2)); }
  if (!line) { const curve = new THREE.QuadraticBezierCurve3(a, ctrlAB, b);
    line = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.22, radial, false), coreMat); glowLine = new THREE.Mesh(new THREE.TubeGeometry(curve, segs, 0.42, radial, false), haloMat);
    line.renderOrder = glowLine.renderOrder = 9; scene.add(line, glowLine); }
  // hero: a soft, breathing thread already connects the two of them; story: drawn by the spark
  const hero = 1 - clamp(st.sky * 3), pulse = 0.55 + 0.45 * Math.sin(now / 700);
  const drawn = st.s1 > 0 ? t1 : hero > 0 ? 1 : 0;
  const n2 = Math.floor(drawn * segs) * radial * 6; line.geometry.setDrawRange(0, n2); glowLine.geometry.setDrawRange(0, n2);
  const lo = st.s1 > 0 ? tf * (1 - st.fuse * 0.6) : hero * 0.55 * pulse;
  coreMat.opacity = lo * 0.9; haloMat.opacity = lo * 0.18; line.visible = glowLine.visible = lo > 0.01 && st.blinds < 0.3;
  big.visible = st.fuse > 0 && st.blinds < 0.5 && st.you < 0.5; big.position.copy(m); big.scale.setScalar(4 + 6 * st.fuse); big.material.rotation = st.fuse * 0.5; big.material.opacity = st.fuse;
  // camera: drift toward the two people during the spark and chat moments
  const focus = a.clone().lerp(b, 0.5);
  const ph = AH.phone && AH.phone();
  const lean = ph ? 0.72 * clamp(st.s1 * 2.5) * (1 - clamp((st.zoom - 0.45) * 4)) * (1 - clamp(st.blinds * 3)) * (1 - st.you) : 0;
  const z = Math.max(st.zoom, lean), u = st.you;
  const sk = ph ? 1.45 : 1; s1.scale.setScalar(4.2 * sk); s2.scale.setScalar(4.2 * sk);
  camera.position.copy(camBase).lerp(focus.clone().add(new THREE.Vector3(12, -1, 62)), z * 0.9);
  camera.position.y += u * 6; camera.position.z += u * 30;
  const look = lookBase.clone().lerp(focus, z);
  camera.lookAt(look);
  // life
  train.position.x = ((now * 0.012) % 900) - 450;
  autos[0].position.x = ((now * 0.006) % 500) - 250; autos[1].position.x = 250 - ((now * 0.0045) % 500);
  beacon.visible = now % 1800 < 900;
}
const toScreen = (v) => { const p = v.clone().project(camera); const r = host.getBoundingClientRect(); return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height }; };
let visible = true, slow = 0, fast = 0, prev = 0;
new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(host);
function loop(now) {
  const dt = now - (prev || now); prev = now;
  if (!visible || document.hidden || AH.paused) { requestAnimationFrame(loop); return; }
  if (dt > 26) { slow++; fast = 0; } else if (dt < 18) { fast++; slow = 0; }
  if (slow > 30 && dpr > dprMin) { dpr = Math.max(dprMin, dpr - 0.25); renderer.setPixelRatio(dpr); frame(); slow = 0; }
  if (fast > 240 && dpr < dprMax) { dpr = Math.min(dprMax, dpr + 0.25); renderer.setPixelRatio(dpr); frame(); fast = 0; }
  update(now); renderer.render(scene, camera);
  AH.scr = { a: toScreen(world(A)), b: toScreen(world(B)), crown: toScreen(tower.localToWorld(new THREE.Vector3(TW / 2, 7 + TH + 2, TD / 2))) };
  requestAnimationFrame(loop); }
requestAnimationFrame(loop);
