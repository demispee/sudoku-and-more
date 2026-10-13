// The Mastermind board in 3D (.openspec/specs/007-mastermind, Requirements 5 and 7;
// ADR-0009). It only draws the state it is given and reports clicks; the rules are in
// Rust. Every shape and texture is made here in code, so no files are loaded.
// jsdom has no WebGL, so this file is checked by hand in the browser, not in Vitest.
import {
  BufferAttribute, CanvasTexture, Color, CylinderGeometry, ExtrudeGeometry, Group, Mesh,
  MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial, NeutralToneMapping,
  Object3D, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, PMREMGenerator, Raycaster,
  RingGeometry, Scene, Shape, SphereGeometry, SpotLight, SRGBColorSpace,
  Texture, Vector2, WebGLRenderer, type Material,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import type { Studio } from "./palettes";

export interface BoardState {
  rows: { pegs: (number | null)[]; answer: [number, number] | null }[];
  /** The open row */
  current: number;
  /** The secret code, once the game is over */
  code: number[] | null;
  /** The colour of every peg colour, from the palette */
  colours: string[];
  /** The palette's studio */
  studio: Studio;
  /** The last colour placed, counted, so the tray ball can hop at every click */
  hop: { colour: number; count: number } | null;
}

export interface Level {
  holes: number;
  colours: number;
}

export interface BoardEvents {
  hole(hole: number): void;
  colour(colour: number): void;
}

export interface Board {
  update(state: BoardState): void;
  dispose(): void;
}

// Sizes in cm. The player looks from the bottom edge: row 1 is nearest (large z), the
// code is at the far end, and the holes of a row run along x. The width follows the level.
const D = 27;
const MID_Z = -0.5; // the board's centre
const TOP = 1.3; // the board's top, above the bottom of the board
const rowZ = (r: number) => 7.6 - r * 1.9;
const CODE_Z = -12.4;
const WELL_Z = 11.2;
const FLOAT = 2.4; // how high the board hangs above the floor
const PEG_R = 0.62;
const PEG_Y = TOP + Math.sqrt(PEG_R ** 2 - 0.42 ** 2); // a ball resting in a hole
const SMALL_R = 0.24;
const SMALL_Y = TOP + Math.sqrt(SMALL_R ** 2 - 0.17 ** 2);
const WELL_Y = TOP + Math.sqrt(PEG_R ** 2 - 0.55 ** 2);

function roundedRect(cx: number, cy: number, w: number, d: number, r: number) {
  const s = new Shape();
  const [x, y] = [cx - w / 2, cy - d / 2];
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * A studio backdrop: a floor that curves up into a wall. Returns the shape and, per vertex,
 * where it is in the colour gradient from floor (0) to wall (1).
 */
function backdrop() {
  const profile: [number, number][] = []; // z, y
  for (let z = 70; z > -25; z -= 5) profile.push([z, 0]);
  for (let a = 0; a <= 16; a++) {
    const t = (a / 16) * (Math.PI / 2);
    profile.push([-25 - 22 * Math.sin(t), 22 - 22 * Math.cos(t)]);
  }
  for (let y = 30; y <= 110; y += 10) profile.push([-47, y]);
  const geometry = new PlaneGeometry(200, 1, 1, profile.length - 1);
  const position = geometry.attributes.position!;
  const gradient = new Float32Array(position.count);
  for (let i = 0; i < position.count; i++) {
    const [z, y] = profile[Math.floor(i / 2)]!;
    position.setXYZ(i, -position.getX(i), y, z); // mirrored, so the surface faces up
    gradient[i] = Math.min(1, Math.max(0, (y + 4 - Math.max(0, z) * 0.1) / 50));
  }
  geometry.setAttribute("color", new BufferAttribute(new Float32Array(position.count * 3), 3));
  geometry.computeVertexNormals();
  return { geometry, gradient };
}

/** A soft-touch graphite surface with the row numbers printed on it */
function graphite(W: number, numberX: number) {
  const pw = 1024;
  const ph = Math.round((pw * D) / W);
  const colour = document.createElement("canvas");
  const height = document.createElement("canvas");
  colour.width = height.width = pw;
  colour.height = height.height = ph;
  const ctx = colour.getContext("2d")!;
  ctx.fillStyle = "#22242a";
  ctx.fillRect(0, 0, pw, ph);
  const px = (x: number) => ((x + W / 2) / W) * pw;
  const py = (z: number) => ((z - MID_Z) / D + 0.5) * ph;
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#6f7686";
  for (let r = 0; r < 10; r++) ctx.fillText(String(r + 1), px(numberX), py(rowZ(r)));
  ctx.fillStyle = "#8a92a6";
  ctx.fillRect(px(-W / 2 + 1), py(-10.9) - 1.5, px(W / 2 - 1) - px(-W / 2 + 1), 3); // a line before the code
  // A fine grain for the bump map, so the surface catches the light like soft plastic
  const h = height.getContext("2d")!;
  const grain = h.createImageData(pw, ph);
  for (let i = 0; i < grain.data.length; i += 4) {
    const v = 120 + Math.random() * 30;
    grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = v;
    grain.data[i + 3] = 255;
  }
  h.putImageData(grain, 0, 0);
  return { colour, height };
}

/** A value that springs towards a goal; with little damping it overshoots */
interface Spring {
  x: number;
  v: number;
}

function spring(s: Spring, goal: number, dt: number, stiffness: number, damping: number) {
  s.v += (-(s.x - goal) * stiffness - s.v * damping) * dt;
  s.x += s.v * dt;
}

/** Where everything goes for a level: the holes, the answer pegs and the tray */
function layout({ holes, colours }: Level) {
  const holeX = Array.from({ length: holes }, (_, i) => i * 1.8);
  const cols = Math.ceil(holes / 2);
  const last = holeX[holes - 1]!;
  const answer = Array.from({ length: holes }, (_, k) => {
    const back = k < cols;
    return [last + 1.95 + (back ? k : k - cols) * 0.78, back ? -0.4 : 0.4] as const; // x, dz
  });
  const right = answer[cols - 1]![0] + 1.6;
  const left = holeX[0]! - 2.0;
  const W = right - left;
  const shift = -(left + right) / 2; // centre the board on x = 0
  const spacing = Math.min(2, (W - 2.6) / (colours - 1));
  return {
    W,
    holeX: holeX.map(x => x + shift),
    answer: answer.map(([x, dz]) => [x + shift, dz] as const),
    wellX: (c: number) => (c - (colours - 1) / 2) * spacing,
    numberX: left + shift + 0.75,
    codeX: (holeX[0]! + last) / 2 + shift,
    lidW: last - holeX[0]! + 2.2,
  };
}

export function createBoard(container: HTMLElement, events: BoardEvents, level: Level): Board {
  if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no WebGL");
  const { W, holeX: HOLE_X, answer: ANSWER, wellX, numberX, codeX, lidW } = layout(level);
  const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = NeutralToneMapping;
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new Scene();
  // The studio's colours now, and the palette's colours they fade to
  const look = { low: new Color(), high: new Color(), left: new Color(), right: new Color() };
  const studioGoal = { low: new Color(), high: new Color(), left: new Color(), right: new Color() };
  let fading = 0; // seconds of fading left
  const background = new Color();
  scene.background = background;
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.35;
  room.dispose();

  const textures: Texture[] = [];
  const texture = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new CanvasTexture(canvas);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = maxAniso;
    textures.push(t);
    return t;
  };

  // ---------- The studio ----------

  const { geometry: studioShape, gradient } = backdrop();
  const studio = new Mesh(studioShape, new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }));
  const paintColour = new Color();
  /** Colours the backdrop, the background and the side lights with the studio's colours now */
  function paint() {
    const colours = studioShape.attributes.color!;
    for (let i = 0; i < gradient.length; i++) {
      paintColour.copy(look.low).lerp(look.high, gradient[i]!);
      colours.setXYZ(i, paintColour.r, paintColour.g, paintColour.b);
    }
    colours.needsUpdate = true;
    background.copy(look.high);
    magenta.color.copy(look.left);
    cyan.color.copy(look.right);
  }
  studio.receiveShadow = true;
  scene.add(studio);

  const key = new SpotLight("#ffffff", 5, 0, 0.42, 0.85, 0);
  const keyHome = { x: -4, y: 40, z: 16 };
  key.position.set(keyHome.x, keyHome.y, keyHome.z);
  key.target.position.set(0, 0, -1);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 20;
  key.shadow.camera.far = 70;
  key.shadow.bias = -0.0002;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 6;
  // Coloured lights from both sides, which also show up in the glossy pegs
  const magenta = new SpotLight("#ff3dbb", 9, 0, 0.55, 1, 0);
  magenta.position.set(-34, 14, 0);
  magenta.target.position.set(-16, 0, -2);
  const cyan = new SpotLight("#19e3f0", 8, 0, 0.55, 1, 0);
  cyan.position.set(34, 14, -4);
  cyan.target.position.set(16, 0, -2);
  scene.add(key, key.target, magenta, magenta.target, cyan, cyan.target);

  // ---------- The board, in a rig that floats and springs ----------

  const rig = new Group();
  rig.position.set(0, FLOAT, 0);
  scene.add(rig);

  const surface = graphite(W, numberX);
  const map = texture(surface.colour, true);
  const bumpMap = texture(surface.height, false);
  for (const t of [map, bumpMap]) {
    t.repeat.set(1 / W, 1 / D);
    t.offset.set(0.5, 0.5 + MID_Z / D);
  }
  const soft = new MeshPhysicalMaterial({
    map, bumpMap, bumpScale: 0.25, roughness: 0.6, metalness: 0.05, clearcoat: 0.35, clearcoatRoughness: 0.45,
  });
  const metal = new MeshPhysicalMaterial({ color: "#a9b0bc", metalness: 1, roughness: 0.4 });

  // The shape on the board's plane: x, and y = -z
  const outline = roundedRect(0, -MID_Z, W, D, 1.4);
  const hole = (x: number, z: number, r: number) => {
    const s = new Shape();
    s.absarc(x, -z, r, 0, Math.PI * 2, false);
    outline.holes.push(s);
  };
  for (let r = 0; r < 10; r++) {
    for (const x of HOLE_X) hole(x, rowZ(r), 0.42);
    for (const [x, dz] of ANSWER) hole(x, rowZ(r) + dz, 0.17);
  }
  for (const x of HOLE_X) hole(x, CODE_Z, 0.42);
  for (let c = 0; c < level.colours; c++) hole(wellX(c), WELL_Z, 0.55);
  const bodyGeometry = new ExtrudeGeometry(outline, {
    depth: 0.8, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 4, curveSegments: 24,
  });
  bodyGeometry.rotateX(-Math.PI / 2);
  bodyGeometry.translate(0, 0.4, 0);
  const body = new Mesh(bodyGeometry, soft);
  // A thin polished metal plate under it: the rim
  const plateGeometry = new ExtrudeGeometry(roundedRect(0, -MID_Z, W + 0.1, D + 0.1, 1.45), {
    depth: 0.18, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 12,
  });
  plateGeometry.rotateX(-Math.PI / 2);
  plateGeometry.translate(0, 0.08, 0);
  const plate = new Mesh(plateGeometry, metal);
  // The bottom of the holes
  const floor = new Mesh(new PlaneGeometry(W - 1, D - 1), new MeshBasicMaterial({ color: "#050507" }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0.33, MID_Z);
  for (const m of [body, plate]) m.castShadow = m.receiveShadow = true;
  rig.add(body, plate, floor);

  // The shield over the code, on a hinge at the far edge
  const lidGeometry = new ExtrudeGeometry(roundedRect(0, 0, lidW, 2.9, 0.6), {
    depth: 1.1, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 4,
  });
  lidGeometry.rotateX(-Math.PI / 2);
  const hinge = new Group();
  hinge.position.set(codeX, TOP + 1.3, CODE_Z - 1.55);
  const lid = new Mesh(lidGeometry, soft);
  lid.position.set(0, -1.2, 1.55);
  lid.castShadow = lid.receiveShadow = true;
  const pin = new Mesh(new CylinderGeometry(0.16, 0.16, lidW - 0.4, 24), metal);
  pin.rotation.z = Math.PI / 2;
  hinge.add(lid, pin);
  rig.add(hinge);

  // A thin light around the holes of the open row
  const glow = new MeshBasicMaterial({ color: "#3ef2ff", transparent: true, toneMapped: false });
  const ringShape = new RingGeometry(0.47, 0.55, 48);
  ringShape.rotateX(-Math.PI / 2);
  const rings = HOLE_X.map(x => {
    const ring = new Mesh(ringShape, glow);
    ring.position.set(x, TOP + 0.01, rowZ(0));
    rig.add(ring);
    return ring;
  });

  // Pegs: glossy balls with a slight pearly shine
  const ball = new SphereGeometry(PEG_R, 48, 32);
  const small = new SphereGeometry(SMALL_R, 32, 20);
  const candy = (color: string) => new MeshPhysicalMaterial({
    color, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, iridescence: 0.4, iridescenceIOR: 1.3,
  });
  const pegMaterials = Array.from({ length: level.colours }, () => candy("#ffffff"));
  const answerMaterials = [
    new MeshPhysicalMaterial({ color: "#0a0a0f", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.04 }),
    new MeshPhysicalMaterial({ color: "#e4dff0", roughness: 0.22, clearcoat: 1, iridescence: 0.7, iridescenceIOR: 1.4 }),
  ];
  const peg = (material: Material, size = ball) => {
    const m = new Mesh(size, material);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  // The tray: a ball in each well
  const targets: Object3D[] = [];
  const hidden = new MeshBasicMaterial({ visible: false });
  const wellBalls = pegMaterials.map((material, c) => {
    const b = peg(material);
    b.position.set(wellX(c), WELL_Y, WELL_Z);
    const target = new Mesh(new CylinderGeometry(0.95, 0.95, 2.4, 16), hidden);
    target.position.set(wellX(c), TOP + 0.8, WELL_Z);
    target.userData = { colour: c };
    targets.push(target);
    rig.add(b);
    return b;
  });

  // Click targets for the holes: flat discs, so a hole in front doesn't catch a click
  // meant for the one behind it
  const disc = new CylinderGeometry(0.85, 0.85, 0.05, 16);
  for (let r = 0; r < 10; r++) {
    HOLE_X.forEach((x, h) => {
      const target = new Mesh(disc, hidden);
      target.position.set(x, TOP + 0.3, rowZ(r));
      target.userData = { row: r, hole: h };
      targets.push(target);
    });
  }
  rig.add(...targets);

  // ---------- Camera and glow ----------

  const camera = new PerspectiveCamera(30, 1, 1, 400);
  const LOOK = { x: 0, y: FLOAT, z: -0.5 };
  const TILT = 0.68; // from straight above
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new Vector2(1, 1), 0.3, 0.4, 0.97);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    // On a narrow (phone) screen the board may come closer to the edges
    const narrow = camera.aspect < 1;
    const distance = Math.max((W / 2 + (narrow ? 0.9 : 2.4)) / (tanV * camera.aspect), (narrow ? 13.4 : 15.5) / tanV);
    camera.position.set(LOOK.x, LOOK.y + distance * Math.cos(TILT), LOOK.z + distance * Math.sin(TILT));
    camera.lookAt(LOOK.x, LOOK.y, LOOK.z);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  // ---------- State ----------

  interface Fall {
    y: number;
    v: number;
    landed: boolean;
  }
  let state: BoardState | null = null;
  const placed = new Map<string, Mesh>();
  const falls = new Map<Mesh, Fall>();
  const pops = new Map<Mesh, number>(); // answer peg → when it pops up
  const jumps = new Map<Mesh, number>(); // peg → when its jumps start
  let clock = 0;
  let hopCount = 0;
  const hops = new Map<Mesh, number>(); // tray ball → when its hop started
  let won = false;
  const shield: Spring = { x: 0, v: 0 };
  // The board's springs: turn and tilt from dragging; dip and lean from a landing peg
  const turn: Spring = { x: 0, v: 0 };
  const tilt: Spring = { x: 0, v: 0 };
  const dip: Spring = { x: 0, v: 0 };
  const leanX: Spring = { x: 0, v: 0 };
  const leanZ: Spring = { x: 0, v: 0 };
  const goal = { turn: 0, tilt: 0 };

  function remove(key: string) {
    const old = placed.get(key);
    if (!old) return;
    rig.remove(old);
    falls.delete(old);
    pops.delete(old);
    jumps.delete(old);
    placed.delete(key);
  }

  /** Puts a ball in a hole: it falls in, pops up after `delay` seconds, or is just there */
  function show(key: string, material: Material, x: number, y: number, z: number,
    how: "fall" | "pop" | "place", delay = 0, size = ball) {
    if (placed.get(key)?.material === material) return;
    remove(key);
    const p = peg(material, size);
    p.position.set(x, y, z);
    if (how === "fall") {
      falls.set(p, { y: y + 3.2, v: 0, landed: false });
      p.position.y = y + 3.2;
    }
    if (how === "pop") {
      pops.set(p, clock + delay);
      p.scale.setScalar(0.001);
    }
    placed.set(key, p);
    rig.add(p);
  }

  function update(next: BoardState) {
    const ended = !!next.code && !state?.code;
    const keys = ["low", "high", "left", "right"] as const;
    if (keys.some(k => studioGoal[k].getHexString() !== new Color(next.studio[k]).getHexString())) {
      keys.forEach(k => studioGoal[k].set(next.studio[k]));
      if (state) fading = 0.8; // a new palette fades in
      else {
        keys.forEach(k => look[k].copy(studioGoal[k]));
        paint();
      }
    }
    state = next;
    next.rows.forEach((row, r) => {
      row.pegs.forEach((colour, h) => {
        if (colour === null) remove(`${r}:${h}`);
        else show(`${r}:${h}`, pegMaterials[colour]!, HOLE_X[h]!, PEG_Y, rowZ(r), "fall");
      });
      const [black, white] = row.answer ?? [0, 0];
      ANSWER.forEach(([x, dz], k) => {
        if (k < black + white) {
          show(`a${r}:${k}`, answerMaterials[k < black ? 0 : 1]!, x, SMALL_Y, rowZ(r) + dz, "pop", 0.12 + k * 0.14, small);
        } else remove(`a${r}:${k}`);
      });
    });
    HOLE_X.forEach((x, h) => {
      const colour = next.code?.[h];
      if (colour === undefined) remove(`c${h}`);
      else show(`c${h}`, pegMaterials[colour]!, x, PEG_Y, CODE_Z, "place");
    });
    if (!next.code) won = false;
    if (ended) {
      const r = next.rows.filter(row => row.answer).length - 1; // the last checked row
      won = next.rows[r]?.answer?.[0] === 4;
      if (won) {
        HOLE_X.forEach((_, h) => {
          for (const key of [`${r}:${h}`, `c${h}`]) jumps.set(placed.get(key)!, clock + 0.7 + h * 0.09);
        });
      }
    }
    next.colours.forEach((colour, c) => pegMaterials[c]?.color.set(colour));
    if (next.hop && next.hop.count !== hopCount) {
      hopCount = next.hop.count;
      const b = wellBalls[next.hop.colour];
      if (b) hops.set(b, clock);
    }
  }

  // ---------- Pointer ----------

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let drag: { x: number; y: number; moved: boolean } | null = null;

  function aim(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  }

  function hit(event: PointerEvent) {
    aim(event);
    raycaster.setFromCamera(pointer, camera);
    for (const { object } of raycaster.intersectObjects(targets, false)) {
      const data = object.userData as { row?: number; hole?: number; colour?: number };
      if (data.colour !== undefined) return data;
      if (state && !state.code && data.row === state.current) return data;
    }
    return null;
  }

  function down(event: PointerEvent) {
    drag = { x: event.clientX, y: event.clientY, moved: false };
    renderer.domElement.setPointerCapture(event.pointerId);
  }

  function move(event: PointerEvent) {
    if (!drag) {
      renderer.domElement.style.cursor = hit(event) ? "pointer" : "grab";
      return;
    }
    aim(event);
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    renderer.domElement.style.cursor = "grabbing";
    goal.turn = Math.max(-0.6, Math.min(0.6, goal.turn + dx * 0.006));
    goal.tilt = Math.max(-0.35, Math.min(0.35, goal.tilt + dy * 0.004));
    drag.x = event.clientX;
    drag.y = event.clientY;
  }

  function up(event: PointerEvent) {
    if (drag && !drag.moved) {
      const data = hit(event);
      if (data?.colour !== undefined) events.colour(data.colour);
      else if (data?.hole !== undefined) events.hole(data.hole);
    }
    drag = null;
    goal.turn = goal.tilt = 0; // let go: the board springs back
  }

  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  // ---------- Every frame ----------

  /** A peg landed at (x, z): the board dips and leans a little towards it */
  function knock(x: number, z: number) {
    if (still) return;
    dip.v -= 0.9;
    leanX.v += ((z - MID_Z) / D) * 0.25;
    leanZ.v -= (x / W) * 0.25;
  }

  let frameId = 0;
  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 1 / 30);
    last = now;
    clock += dt;

    // The board: floating, swaying, springing back after a drag, dipping under a peg
    const damping = still ? 13 : 5.5;
    spring(turn, goal.turn, dt, 40, damping);
    spring(tilt, goal.tilt, dt, 40, damping);
    for (const s of [dip, leanX, leanZ]) spring(s, 0, dt, 140, 9);
    const sway = still ? 0 : 1;
    rig.position.y = FLOAT + sway * 0.22 * Math.sin(clock * 0.9) + dip.x;
    rig.rotation.set(
      tilt.x + leanX.x + sway * 0.018 * Math.sin(clock * 0.7),
      turn.x + sway * 0.03 * Math.sin(clock * 0.45),
      leanZ.x + sway * 0.014 * Math.sin(clock * 0.55 + 1),
    );

    // A new palette's studio fades in
    if (fading > 0) {
      fading -= dt;
      const t = fading > 0 ? Math.min(1, dt * 7) : 1;
      for (const k of ["low", "high", "left", "right"] as const) look[k].lerp(studioGoal[k], t);
      paint();
    }

    // The key light follows the pointer a little
    key.position.x += (keyHome.x + pointer.x * 10 - key.position.x) * Math.min(1, dt * 3);
    key.position.z += (keyHome.z - pointer.y * 8 - key.position.z) * Math.min(1, dt * 3);

    // Falling pegs bounce in their hole
    for (const [p, f] of falls) {
      f.v -= 70 * dt;
      f.y += f.v * dt;
      if (f.y <= PEG_Y) {
        f.y = PEG_Y;
        if (!f.landed) knock(p.position.x, p.position.z);
        f.landed = true;
        f.v = -f.v * 0.38;
        if (f.v < 1.2) falls.delete(p);
      }
      p.position.y = f.y;
    }

    // Answer pegs pop up one by one, a little too big at first
    for (const [p, start] of pops) {
      const t = (clock - start) / 0.32;
      if (t < 0) continue;
      p.scale.setScalar(t >= 1 ? 1 : t < 0.7 ? Math.max(0.001, (t / 0.7) * 1.25) : 1.25 - ((t - 0.7) / 0.3) * 0.25);
      if (t >= 1) pops.delete(p);
    }

    // The winning row jumps three times
    for (const [p, start] of jumps) {
      const t = clock - start;
      if (t < 0) continue;
      const done = t > 1.35;
      p.position.y = done ? PEG_Y : PEG_Y + Math.abs(Math.sin((t / 0.45) * Math.PI)) * 0.9 * (1 - t / 1.6);
      if (done) jumps.delete(p);
    }

    // The shield: falls open with a bounce after a win, opens slowly after a loss
    const open = state?.code ? 1 : 0;
    if (won) spring(shield, open, dt, 60, still ? 16 : 6);
    else spring(shield, open, dt, 9, 6);
    hinge.rotation.x = -shield.x * 1.95;

    // The open row is lit; a tray ball hops when its colour is placed
    rings.forEach(ring => {
      ring.visible = !!state && !state.code;
      ring.position.z += (rowZ(state?.current ?? 0) - ring.position.z) * Math.min(1, dt * 10);
    });
    glow.opacity = 0.65 + 0.35 * Math.sin(clock * 3);
    for (const [b, start] of hops) {
      const t = (clock - start) / 0.42;
      b.position.y = WELL_Y + (t < 1 ? Math.sin(t * Math.PI) * 1.1 : 0);
      if (t >= 1) hops.delete(b);
    }

    composer.render();
    frameId = requestAnimationFrame(frame);
  }
  frameId = requestAnimationFrame(frame);

  function dispose() {
    cancelAnimationFrame(frameId);
    observer.disconnect();
    canvas.removeEventListener("pointerdown", down);
    canvas.removeEventListener("pointermove", move);
    canvas.removeEventListener("pointerup", up);
    canvas.removeEventListener("pointercancel", up);
    const geometries = new Set<{ dispose(): void }>([ball, small, ringShape, disc]);
    const materials = new Set<Material>([...pegMaterials, ...answerMaterials, glow, hidden]);
    scene.traverse(o => {
      if (o instanceof Mesh) {
        geometries.add(o.geometry);
        materials.add(o.material as Material);
      }
    });
    geometries.forEach(g => g.dispose());
    materials.forEach(m => m.dispose());
    textures.forEach(t => t.dispose());
    scene.environment?.dispose();
    pmrem.dispose();
    bloom.dispose();
    composer.dispose();
    renderer.dispose();
    canvas.remove();
  }

  return { update, dispose };
}
