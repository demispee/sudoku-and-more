// The realistic Mastermind board in 3D (.openspec/specs/007-mastermind, Requirement 5;
// ADR-0009). It only draws the state it is given and reports clicks; the rules are in
// Rust. Every shape and texture is made here in code, so no files are loaded.
// jsdom has no WebGL, so this file is checked by hand in the browser, not in Vitest.
import {
  CanvasTexture, Color, CylinderGeometry, ExtrudeGeometry, Fog, Group, HemisphereLight,
  LatheGeometry, Mesh, MeshBasicMaterial, MeshPhysicalMaterial, MeshStandardMaterial,
  NeutralToneMapping, Object3D, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry,
  PMREMGenerator, Raycaster, MirroredRepeatWrapping, Scene, Shape, SpotLight, SRGBColorSpace,
  Texture, Vector2, WebGLRenderer, type Material,
} from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface BoardState {
  rows: { pegs: (number | null)[]; answer: [number, number] | null }[];
  /** The open row */
  current: number;
  /** The colour chosen in the tray */
  selected: number;
  /** The secret code, once the game is over */
  code: number[] | null;
}

export interface BoardEvents {
  hole(hole: number): void;
  colour(colour: number): void;
}

export interface Board {
  update(state: BoardState): void;
  dispose(): void;
}

/** Red, orange, yellow, green, blue, purple */
export const PEG_COLOURS = ["#c8102e", "#f0661a", "#f4c20d", "#1d9a3d", "#1652c4", "#6a2ca0"];

// Sizes in cm. The board lies along x: row 1 on the left, the shield on the right.
const W = 29;
const D = 10.4;
const TOP = 1.2; // height of the board's top
const HOLE_Z = [-3.6, -2.0, -0.4, 1.2];
const rowX = (r: number) => -12.8 + r * 2.3;
const CODE_X = 11.8;
const ANSWER = [[-0.4, 2.8], [0.4, 2.8], [-0.4, 3.6], [0.4, 3.6]] as const; // dx, z
const dishX = (c: number) => -12.5 + c * 5;
const DISH_Z = 9.2;

// ---------- Noise and wood, drawn in code ----------

function noise2(seed: number) {
  const perm = new Uint8Array(512);
  let s = seed;
  for (let i = 0; i < 256; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    perm[i] = perm[i + 256] = s >>> 24;
  }
  const at = (x: number, y: number) => perm[(perm[x & 255]! + (y & 255)) & 511]! / 255;
  return (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const u = fx * fx * (3 - 2 * fx);
    const v = fy * fy * (3 - 2 * fy);
    const a = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * u;
    const b = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * u;
    return a + (b - a) * v;
  };
}

function fbm(n: (x: number, y: number) => number, x: number, y: number) {
  let sum = 0;
  for (let o = 0, amp = 0.5, f = 1; o < 4; o++, amp *= 0.5, f *= 2) sum += amp * n(x * f, y * f);
  return sum;
}

type Rgb = [number, number, number];

/**
 * Wood with its grain along x, `cmW` × `cmH` cm on a canvas of `pw` × `ph` pixels.
 * Returns the colour canvas and a height canvas for the bump map.
 */
function wood(pw: number, ph: number, cmW: number, cmH: number, dark: Rgb, light: Rgb, seed: number) {
  const n = noise2(seed);
  const colour = document.createElement("canvas");
  const height = document.createElement("canvas");
  colour.width = height.width = pw;
  colour.height = height.height = ph;
  const ci = colour.getContext("2d")!.createImageData(pw, ph);
  const hi = height.getContext("2d")!.createImageData(pw, ph);
  for (let py = 0; py < ph; py++) {
    const z = (py / ph) * cmH;
    for (let px = 0; px < pw; px++) {
      const x = (px / pw) * cmW;
      const warp = fbm(n, x * 0.06, z * 0.35) * 7;
      const ring = 0.5 + 0.5 * Math.sin((z * 1.7 + warp) * 2.4);
      const fibre = n(x * 0.7, z * 16);
      const t = Math.pow(ring, 3) * 0.65 + fibre * 0.25 + fbm(n, x * 0.3, z * 3) * 0.2;
      const k = (py * pw + px) * 4;
      for (let c = 0; c < 3; c++) ci.data[k + c] = dark[c]! + (light[c]! - dark[c]!) * Math.min(1, t);
      ci.data[k + 3] = 255;
      const h = 200 + fibre * 55 - ring * 20;
      hi.data[k] = hi.data[k + 1] = hi.data[k + 2] = h;
      hi.data[k + 3] = 255;
    }
  }
  colour.getContext("2d")!.putImageData(ci, 0, 0);
  height.getContext("2d")!.putImageData(hi, 0, 0);
  return { colour, height };
}

// ---------- Shapes ----------

function roundedRect(w: number, d: number, r: number) {
  const s = new Shape();
  const [x, y] = [-w / 2, -d / 2];
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

/** A peg: a shaft that goes into the hole, a collar, and a round head */
function pegGeometry(scale: number) {
  const p = [new Vector2(0, -0.8), new Vector2(0.22, -0.8), new Vector2(0.22, -0.02),
    new Vector2(0.24, 0), new Vector2(0.4, 0), new Vector2(0.42, 0.03), new Vector2(0.42, 0.1)];
  for (let i = 1; i <= 10; i++) {
    const a = (i / 10) * (Math.PI / 2);
    p.push(new Vector2(0.42 * Math.cos(a), 0.1 + 0.46 * Math.sin(a)));
  }
  return new LatheGeometry(p.map(v => v.multiplyScalar(scale)), 40);
}

/** A shallow ceramic dish for the pegs of one colour */
function dishGeometry() {
  const p = [new Vector2(0, 0), new Vector2(1.5, 0), new Vector2(1.75, 0.08), new Vector2(2.05, 0.5),
    new Vector2(2.1, 0.62), new Vector2(2.02, 0.66), new Vector2(1.9, 0.56), new Vector2(1.55, 0.24),
    new Vector2(1.2, 0.17), new Vector2(0, 0.16)];
  return new LatheGeometry(p, 64);
}

// ---------- The board ----------

export function createBoard(container: HTMLElement, events: BoardEvents): Board {
  if (!document.createElement("canvas").getContext("webgl2")) throw new Error("no WebGL");

  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.toneMapping = NeutralToneMapping;
  renderer.domElement.style.touchAction = "none";
  container.appendChild(renderer.domElement);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new Scene();
  scene.background = new Color("#07090c");
  scene.fog = new Fog("#07090c", 55, 110);
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.22;
  room.dispose();

  const textures: Texture[] = [];
  const texture = (canvas: HTMLCanvasElement, srgb: boolean) => {
    const t = new CanvasTexture(canvas);
    if (srgb) t.colorSpace = SRGBColorSpace;
    t.anisotropy = maxAniso;
    textures.push(t);
    return t;
  };

  // The lamp above the table, and a little light from the room
  const lamp = new SpotLight("#fff1dc", 4.2, 0, 0.5, 0.9, 0);
  lamp.position.set(-7, 34, 15);
  lamp.target.position.set(0, 0, 2);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(2048, 2048);
  lamp.shadow.camera.near = 15;
  lamp.shadow.camera.far = 60;
  lamp.shadow.bias = -0.0002;
  lamp.shadow.normalBias = 0.02;
  lamp.shadow.radius = 4;
  scene.add(lamp, lamp.target, new HemisphereLight("#d8e2ff", "#2a1a10", 0.12));

  // The table: smoked oak planks
  const oak = wood(1024, 1024, 40, 40, [58, 44, 34], [104, 82, 62], 7);
  const plank = oak.colour.getContext("2d")!;
  plank.fillStyle = "rgba(40, 24, 12, 0.55)";
  for (let k = 0; k < 4; k++) plank.fillRect(0, k * 256, 1024, 3);
  const oakMap = texture(oak.colour, true);
  oakMap.wrapS = oakMap.wrapT = MirroredRepeatWrapping; // no seams between the tiles
  oakMap.repeat.set(4, 4);
  const table = new Mesh(new PlaneGeometry(160, 160),
    new MeshStandardMaterial({ map: oakMap, roughness: 0.72 }));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  // The board: dark lacquered walnut with real holes
  const walnut = wood(2048, 734, W, D, [34, 17, 9], [92, 52, 27], 3);
  const paint = walnut.colour.getContext("2d")!;
  const bump = walnut.height.getContext("2d")!;
  const px = (x: number) => ((x + W / 2) / W) * 2048;
  const py = (z: number) => ((z + D / 2) / D) * 734;
  paint.font = bump.font = "600 34px Georgia, serif";
  paint.textAlign = bump.textAlign = "center";
  paint.fillStyle = "#b8955a";
  bump.fillStyle = "#555";
  for (let r = 0; r < 10; r++) {
    paint.fillText(String(r + 1), px(rowX(r)), py(4.75));
    bump.fillText(String(r + 1), px(rowX(r)), py(4.75));
  }
  for (const ctx of [paint, bump]) ctx.fillRect(px(9.85) - 2, py(-4.5), 4, py(4.5) - py(-4.5)); // an inlay
  const walnutMap = texture(walnut.colour, true);
  const walnutBump = texture(walnut.height, false);
  for (const t of [walnutMap, walnutBump]) {
    t.repeat.set(1 / W, 1 / D);
    t.offset.set(0.5, 0.5);
  }
  const lacquer = new MeshPhysicalMaterial({
    map: walnutMap, bumpMap: walnutBump, bumpScale: 0.4, roughness: 0.42, clearcoat: 1, clearcoatRoughness: 0.06,
  });

  const outline = roundedRect(W, D, 0.9);
  const hole = (x: number, z: number, r: number) => {
    const s = new Shape();
    s.absarc(x, -z, r, 0, Math.PI * 2, false);
    outline.holes.push(s);
  };
  for (let r = 0; r < 10; r++) {
    for (const z of HOLE_Z) hole(rowX(r), z, 0.3);
    for (const [dx, z] of ANSWER) hole(rowX(r) + dx, z, 0.18);
  }
  for (const z of HOLE_Z) hole(CODE_X, z, 0.3);
  const boardGeometry = new ExtrudeGeometry(outline, {
    depth: 0.9, bevelEnabled: true, bevelThickness: 0.15, bevelSize: 0.15, bevelSegments: 4, curveSegments: 20,
  });
  boardGeometry.rotateX(-Math.PI / 2);
  boardGeometry.translate(0, 0.15, 0);
  const board = new Mesh(boardGeometry, lacquer);
  board.castShadow = board.receiveShadow = true;
  // The bottom of the holes
  const floor = new Mesh(new PlaneGeometry(W, D), new MeshStandardMaterial({ color: "#0d0704", roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.01;
  scene.add(board, floor);

  // The shield over the code, on a brass hinge at its right edge
  const brass = new MeshPhysicalMaterial({ color: "#c9a25a", metalness: 1, roughness: 0.32 });
  const lidGeometry = new ExtrudeGeometry(roundedRect(3.2, 6.8, 0.4), {
    depth: 0.8, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 3,
  });
  lidGeometry.rotateX(-Math.PI / 2);
  const hinge = new Group();
  hinge.position.set(13.5, TOP + 1.0, -1.2);
  const lid = new Mesh(lidGeometry, lacquer);
  lid.position.set(-1.7, -0.9, 0);
  lid.castShadow = lid.receiveShadow = true;
  const pin = new Mesh(new CylinderGeometry(0.14, 0.14, 6.4, 24), brass);
  pin.rotation.x = Math.PI / 2;
  pin.castShadow = true;
  hinge.add(lid, pin);
  scene.add(hinge);

  // The marker that shows the open row
  const marker = new Mesh(new CylinderGeometry(0, 0.32, 0.12, 3), brass);
  marker.rotation.y = Math.PI / 6;
  marker.position.set(rowX(0), TOP + 0.06, -4.65);
  marker.castShadow = true;
  scene.add(marker);

  // Pegs
  const pegShape = pegGeometry(1.15);
  const answerShape = pegGeometry(0.62);
  const plastic = (color: string) => new MeshPhysicalMaterial({ color, roughness: 0.26, clearcoat: 1, clearcoatRoughness: 0.08 });
  const pegMaterials = PEG_COLOURS.map(plastic);
  const answerMaterials = [plastic("#141414"), plastic("#f1efe9")];
  const peg = (material: Material, small = false) => {
    const m = new Mesh(small ? answerShape : pegShape, material);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  // The tray: a dish per colour, with pegs lying in it
  const ceramic = new MeshPhysicalMaterial({ color: "#ece6dc", roughness: 0.3, clearcoat: 0.6 });
  const dishShape = dishGeometry();
  const targets: Object3D[] = [];
  const hidden = new MeshBasicMaterial({ visible: false });
  const lying = [[-0.75, -0.35, 0.5], [0.7, -0.45, 2.3], [0, 0.75, 1.4]]; // x, z, turn
  for (let c = 0; c < 6; c++) {
    const dish = new Mesh(dishShape, ceramic);
    dish.position.set(dishX(c), 0, DISH_Z);
    dish.castShadow = dish.receiveShadow = true;
    scene.add(dish);
    for (const [x, z, turn] of lying) {
      const p = peg(pegMaterials[c]!);
      p.rotation.set(0, turn! + c, Math.PI / 2);
      p.position.set(dishX(c) + x!, 0.6, DISH_Z + z!);
      scene.add(p);
    }
    const target = new Mesh(new CylinderGeometry(2.2, 2.2, 2, 16), hidden);
    target.position.set(dishX(c), 0.8, DISH_Z);
    target.userData = { colour: c };
    targets.push(target);
  }
  const held = peg(pegMaterials[0]!);
  scene.add(held);

  // Click targets for the holes: flat discs, so a hole in front doesn't catch a click
  // meant for the one behind it
  const disc = new CylinderGeometry(0.8, 0.8, 0.05, 16);
  for (let r = 0; r < 10; r++) {
    HOLE_Z.forEach((z, h) => {
      const target = new Mesh(disc, hidden);
      target.position.set(rowX(r), TOP + 0.3, z);
      target.userData = { row: r, hole: h };
      targets.push(target);
    });
  }
  scene.add(...targets);

  // ---------- Camera: drag to turn and tilt, within limits ----------

  const camera = new PerspectiveCamera(32, 1, 1, 300);
  const view = { turn: 0, tilt: 0.78, goalTurn: 0, goalTilt: 0.78, distance: 60 };
  const TURN = 0.45;
  const TILT: [number, number] = [0.3, 1.1];

  function resize() {
    const w = container.clientWidth;
    const h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const tanV = Math.tan((camera.fov * Math.PI) / 360);
    view.distance = Math.max(16 / (tanV * camera.aspect), 10 / tanV);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  // ---------- State ----------

  let state: BoardState | null = null;
  const placed = new Map<string, Mesh>();
  const drops = new Map<Mesh, number>(); // peg → time its drop started
  let clock = 0;
  let shield = 0;

  function show(key: string, material: Material, x: number, z: number, small = false, drop = true) {
    const old = placed.get(key);
    if (old?.material === material) return;
    if (old) scene.remove(old);
    const p = peg(material, small);
    p.position.set(x, TOP, z);
    p.userData.drop = drop;
    if (drop) drops.set(p, clock);
    placed.set(key, p);
    scene.add(p);
  }

  function hide(key: string) {
    const old = placed.get(key);
    if (old) {
      scene.remove(old);
      drops.delete(old);
      placed.delete(key);
    }
  }

  function update(next: BoardState) {
    state = next;
    next.rows.forEach((row, r) => {
      row.pegs.forEach((colour, h) => {
        if (colour === null) hide(`${r}:${h}`);
        else show(`${r}:${h}`, pegMaterials[colour]!, rowX(r), HOLE_Z[h]!);
      });
      const [black, white] = row.answer ?? [0, 0];
      ANSWER.forEach(([dx, z], k) => {
        if (k < black + white) show(`a${r}:${k}`, answerMaterials[k < black ? 0 : 1]!, rowX(r) + dx, z, true);
        else hide(`a${r}:${k}`);
      });
    });
    HOLE_Z.forEach((z, h) => {
      const colour = next.code?.[h];
      if (colour === undefined) hide(`c${h}`);
      else show(`c${h}`, pegMaterials[colour]!, CODE_X, z, false, false);
    });
    held.material = pegMaterials[next.selected]!;
  }

  // ---------- Pointer ----------

  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let drag: { x: number; y: number; moved: boolean } | null = null;

  function hit(event: PointerEvent) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
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
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 5) return;
    drag.moved = true;
    renderer.domElement.style.cursor = "grabbing";
    view.goalTurn = Math.max(-TURN, Math.min(TURN, view.goalTurn - dx * 0.005));
    view.goalTilt = Math.max(TILT[0], Math.min(TILT[1], view.goalTilt - dy * 0.005));
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
  }

  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);

  // ---------- Every frame ----------

  let frameId = 0;
  let last = performance.now();
  function frame(now: number) {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    clock += dt;

    view.turn += (view.goalTurn - view.turn) * Math.min(1, dt * 10);
    view.tilt += (view.goalTilt - view.tilt) * Math.min(1, dt * 10);
    const target = { x: 0, y: 0.5, z: 2.6 };
    camera.position.set(
      target.x + view.distance * Math.sin(view.tilt) * Math.sin(view.turn),
      target.y + view.distance * Math.cos(view.tilt),
      target.z + view.distance * Math.sin(view.tilt) * Math.cos(view.turn),
    );
    camera.lookAt(target.x, target.y, target.z);

    // A placed peg falls into its hole and bounces once
    for (const [p, start] of drops) {
      const t = (clock - start) / 0.26;
      if (t >= 1.6) {
        p.position.y = TOP;
        drops.delete(p);
      } else if (t < 1) {
        p.position.y = TOP + 2.5 * (1 - t * t);
      } else {
        p.position.y = TOP + 0.12 * Math.sin(((t - 1) / 0.6) * Math.PI);
      }
    }

    // The shield opens when the code is shown
    const open = state?.code ? 1 : 0;
    shield += (open - shield) * Math.min(1, dt * 4);
    hinge.rotation.z = -shield * 1.75;

    // The marker slides to the open row; the chosen colour floats above its dish
    const row = state?.current ?? 0;
    marker.position.x += (rowX(row) - marker.position.x) * Math.min(1, dt * 8);
    marker.visible = !state?.code;
    const c = state?.selected ?? 0;
    held.position.set(dishX(c), 3.2 + 0.18 * Math.sin(clock * 2.2), DISH_Z);
    held.rotation.y = clock * 0.8;

    renderer.render(scene, camera);
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
    const geometries = new Set<{ dispose(): void }>();
    const materials = new Set<Material>();
    scene.traverse(o => {
      if (o instanceof Mesh) {
        geometries.add(o.geometry);
        materials.add(o.material as Material);
      }
    });
    for (const p of placed.values()) materials.add(p.material as Material);
    [pegShape, answerShape, ...geometries].forEach(g => g.dispose());
    [...pegMaterials, ...answerMaterials, ...materials].forEach(m => m.dispose());
    textures.forEach(t => t.dispose());
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    canvas.remove();
  }

  return { update, dispose };
}
