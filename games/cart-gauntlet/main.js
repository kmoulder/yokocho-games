// Cart Gauntlet in the browser: loads the WebAssembly app (pkg/), finds the player's
// ROMs, and runs it with a canvas, Web Audio, and touch / keyboard / gamepad controls.

import init, { Gauntlet } from './pkg/dkc_web.js';

const FPS = 21477272 / (1364 * 262);
const STEP_MS = 1000 / FPS;
/// Time per displayed frame that booting and level starts may use (not while playing).
const BACKGROUND_MS = 9;
const SAMPLE_RATE = 32000;

// SNES buttons (snes::button).
const BTN = {
  B: 0x8000, Y: 0x4000, SELECT: 0x2000, START: 0x1000,
  UP: 0x0800, DOWN: 0x0400, LEFT: 0x0200, RIGHT: 0x0100,
  A: 0x0080, X: 0x0040, L: 0x0020, R: 0x0010,
};
// Gauntlet.tick flags (dkc-web's lib.rs).
const FLAG = { REWIND: 1, FAST: 2, BACK: 4, RESTART: 8, SKIP: 16, PAUSE: 32 };
const HELD_FLAGS = FLAG.REWIND | FLAG.FAST;

const ROMS = [
  { file: 'dkc1_usa_v10.sfc', name: 'Donkey Kong Country (USA, v1.0)' },
  { file: 'dkc2_usa_v10.sfc', name: "Donkey Kong Country 2: Diddy's Kong Quest (USA, v1.0)" },
  { file: 'dkc3_usa.sfc', name: "Donkey Kong Country 3: Dixie Kong's Double Trouble! (USA)" },
];

const $ = (id) => document.getElementById(id);
const canvas = $('screen');
const ctx = canvas.getContext('2d');
const overlay = $('overlay');
const board = $('board');

// ---------------------------------------------------------------- ROM storage

// ROMs are kept in this browser's IndexedDB so they only need picking once.
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('cart-gauntlet', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('roms');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGet(key) {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const req = db.transaction('roms').objectStore('roms').get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

async function dbPut(key, value) {
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction('roms', 'readwrite');
      tx.objectStore('roms').put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Storage unavailable (e.g. private browsing): the ROMs just need picking again.
  }
}

// Small settings (the menu's invincibility switch) in localStorage.
function loadSetting(key) {
  try {
    return localStorage.getItem(`cart-gauntlet-${key}`);
  } catch {
    return null;
  }
}

function saveSetting(key, value) {
  try {
    localStorage.setItem(`cart-gauntlet-${key}`, value);
  } catch {
    // Not stored; it resets next visit.
  }
}

// ---------------------------------------------------------------- start-up

let wasm;
let game;
const have = [false, false, false];

/** Give the app a ROM; returns its game number (1-3) or 0 if unrecognised. */
async function addRom(buffer, save) {
  const n = game.add_rom(new Uint8Array(buffer));
  if (n && !have[n - 1]) {
    have[n - 1] = true;
    if (save) await dbPut(n, buffer);
  }
  return n;
}

function showRomPicker(message) {
  const items = ROMS.map((r, i) => `<li class="${have[i] ? 'ok' : ''}">${r.name}</li>`).join('');
  board.innerHTML = `
    <h1>CART GAUNTLET</h1>
    <p>Choose your three ROM files:</p>
    <ul class="roms">${items}</ul>
    <button class="btn" id="choose">Choose ROM files</button>
    ${message ? `<p id="error">${message}</p>` : ''}
    <p class="note">They stay on this device and only need choosing once.</p>`;
  $('choose').onclick = () => $('files').click();
}

$('files').onchange = async (e) => {
  const unknown = [];
  for (const f of e.target.files) {
    if (!(await addRom(await f.arrayBuffer(), true))) unknown.push(f.name);
  }
  e.target.value = '';
  if (have.every(Boolean)) showStart();
  else showRomPicker(unknown.length ? `Not one of the three: ${unknown.join(', ')}` : '');
};

function showStart() {
  board.innerHTML = `
    <h1>CART GAUNTLET</h1>
    <p>Mine carts, skull carts and rocket barrels from all three games.</p>
    <button class="btn" id="go">TAP TO PLAY</button>
    <p class="note">On iPhone, sound needs the silent switch off. For full screen, use
    Share &rarr; Add to Home Screen.</p>`;
  $('go').onclick = start;
}

async function main() {
  try {
    wasm = await init();
  } catch (e) {
    $('status').textContent = `Could not load the game: ${e}`;
    return;
  }
  game = new Gauntlet();
  game.set_invincible(loadSetting('invincible') === '1');
  // 1. ROMs stored by an earlier visit.
  for (let n = 1; n <= 3; n++) {
    const b = await dbGet(n);
    if (b) await addRom(b, false);
  }
  // 2. ROMs served next to the page (tools/serve.py on the local network).
  for (let n = 1; n <= 3; n++) {
    if (have[n - 1]) continue;
    try {
      const r = await fetch(`roms/${ROMS[n - 1].file}`);
      if (r.ok) await addRom(await r.arrayBuffer(), true);
    } catch {
      // Not served here.
    }
  }
  // 3. Ask for the rest.
  if (have.every(Boolean)) showStart();
  else showRomPicker('');
}

// ---------------------------------------------------------------- sound

let audio;
let audioTime = 0;

function startAudio() {
  if (!audio) {
    try {
      audio = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      return;
    }
  }
  if (audio.state !== 'running') audio.resume().catch(() => {});
}

function queueAudio() {
  if (!audio || audio.state !== 'running') return;
  const len = game.audio_len();
  if (!len) return;
  const samples = new Int16Array(wasm.memory.buffer, game.audio_ptr(), len);
  const frames = len >> 1;
  const now = audio.currentTime;
  // Fell behind: restart with a small cushion. Far ahead (fast forward): drop this.
  if (audioTime < now + 0.02) audioTime = now + 0.06;
  if (audioTime > now + 0.25) return;
  const buf = audio.createBuffer(2, frames, SAMPLE_RATE);
  const left = buf.getChannelData(0);
  const right = buf.getChannelData(1);
  for (let i = 0; i < frames; i++) {
    left[i] = samples[2 * i] / 32768;
    right[i] = samples[2 * i + 1] / 32768;
  }
  const src = audio.createBufferSource();
  src.buffer = buf;
  src.connect(audio.destination);
  src.start(audioTime);
  audioTime += frames / SAMPLE_RATE;
}

document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.suspend().catch(() => {});
  else audio.resume().catch(() => {});
});

// ---------------------------------------------------------------- controls

const touch = { dirs: 0, jump: false, rewind: false };
let pressedFlags = 0; // edge-triggered flags waiting for the next tick
let tap = null;

function useTouch() {
  document.body.classList.add('touch');
}
if (matchMedia('(pointer: coarse)').matches) useTouch();
if (window.parent !== window) document.body.classList.add('embedded');

/** Track the pointers on `el`; `update(pointers)` is called with the active ones. */
function trackPointers(el, update) {
  const pointers = new Map();
  const changed = () => update([...pointers.values()]);
  el.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, e);
    changed();
  });
  el.addEventListener('pointermove', (e) => {
    if (pointers.has(e.pointerId)) {
      pointers.set(e.pointerId, e);
      changed();
    }
  });
  const end = (e) => {
    if (pointers.delete(e.pointerId)) changed();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', end);
}

// D-pad: the direction from the pad's centre, 8 ways, so a thumb can slide around it.
const dpad = $('dpad');
trackPointers(dpad, (pointers) => {
  let dirs = 0;
  const r = dpad.getBoundingClientRect();
  for (const p of pointers) {
    const dx = p.clientX - (r.left + r.width / 2);
    const dy = p.clientY - (r.top + r.height / 2);
    if (Math.hypot(dx, dy) < r.width * 0.1) continue;
    const a = (Math.atan2(dy, dx) * 180) / Math.PI; // 0 = right, 90 = down
    if (a > -67.5 && a < 67.5) dirs |= BTN.RIGHT;
    if (a > 112.5 || a < -112.5) dirs |= BTN.LEFT;
    if (a > 22.5 && a < 157.5) dirs |= BTN.DOWN;
    if (a < -22.5 && a > -157.5) dirs |= BTN.UP;
  }
  touch.dirs = dirs;
  for (const [cls, bit] of [['up', BTN.UP], ['down', BTN.DOWN], ['left', BTN.LEFT], ['right', BTN.RIGHT]]) {
    dpad.querySelector(`.${cls}`).classList.toggle('on', (dirs & bit) !== 0);
  }
});

const jump = $('jump');
trackPointers(jump, (pointers) => {
  const down = pointers.length > 0;
  if (down && !touch.jump && navigator.vibrate) navigator.vibrate(8);
  touch.jump = down;
  jump.classList.toggle('on', down);
});

const rewind = $('rewind');
trackPointers(rewind, (pointers) => {
  touch.rewind = pointers.length > 0;
  rewind.classList.toggle('on', touch.rewind);
});

for (const [id, flag] of [['menu', FLAG.BACK], ['pause', FLAG.PAUSE]]) {
  $(id).addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pressedFlags |= flag;
  });
}

// Taps on the picture (the stage menu).
canvas.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') useTouch();
  const r = canvas.getBoundingClientRect();
  tap = [Math.floor(((e.clientX - r.left) / r.width) * 256), Math.floor(((e.clientY - r.top) / r.height) * 224)];
  startAudio();
});
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'touch') useTouch();
  // iOS may suspend sound after an interruption; any touch can resume it.
  if (audio && audio.state !== 'running') audio.resume().catch(() => {});
});
// Stop the page scrolling, zooming, or showing menus on long presses.
document.addEventListener('touchstart', (e) => {
  if (!e.target.closest('#overlay')) e.preventDefault();
}, { passive: false });
document.addEventListener('contextmenu', (e) => e.preventDefault());

// Keyboard (for playing in a desktop browser).
const KEYS = {
  ArrowUp: BTN.UP, ArrowDown: BTN.DOWN, ArrowLeft: BTN.LEFT, ArrowRight: BTN.RIGHT,
  KeyZ: BTN.B, Space: BTN.B, KeyX: BTN.A, KeyA: BTN.Y, KeyS: BTN.X,
  KeyQ: BTN.L, KeyW: BTN.R, Enter: BTN.START, ShiftRight: BTN.SELECT,
};
const KEY_FLAGS = { Escape: FLAG.BACK, KeyR: FLAG.RESTART, KeyN: FLAG.SKIP, KeyP: FLAG.PAUSE };
let keyPad = 0;
const keyHeld = { rewind: false, fast: false };
addEventListener('keydown', (e) => {
  if (KEYS[e.code] !== undefined) keyPad |= KEYS[e.code];
  else if (KEY_FLAGS[e.code] && !e.repeat) pressedFlags |= KEY_FLAGS[e.code];
  else if (e.code === 'Backspace') keyHeld.rewind = true;
  else if (e.code === 'Tab') keyHeld.fast = true;
  else return;
  e.preventDefault();
});
addEventListener('keyup', (e) => {
  if (KEYS[e.code] !== undefined) keyPad &= ~KEYS[e.code];
  else if (e.code === 'Backspace') keyHeld.rewind = false;
  else if (e.code === 'Tab') keyHeld.fast = false;
});
addEventListener('blur', () => {
  keyPad = 0;
  keyHeld.rewind = keyHeld.fast = false;
});

// Gamepads (standard mapping: Xbox-style layout, the bottom face button jumps).
let padBack = false;
function readGamepads() {
  let pad = 0;
  let flags = 0;
  let back = false;
  for (const gp of navigator.getGamepads ? navigator.getGamepads() : []) {
    if (!gp || gp.mapping !== 'standard') continue;
    const b = (i) => gp.buttons[i] && gp.buttons[i].pressed;
    if (b(0)) pad |= BTN.B;
    if (b(1)) pad |= BTN.A;
    if (b(2)) pad |= BTN.Y;
    if (b(3)) pad |= BTN.X;
    if (b(4)) pad |= BTN.L;
    if (b(5)) pad |= BTN.R;
    if (b(9)) pad |= BTN.START;
    if (b(12) || gp.axes[1] < -0.5) pad |= BTN.UP;
    if (b(13) || gp.axes[1] > 0.5) pad |= BTN.DOWN;
    if (b(14) || gp.axes[0] < -0.5) pad |= BTN.LEFT;
    if (b(15) || gp.axes[0] > 0.5) pad |= BTN.RIGHT;
    if (b(6)) flags |= FLAG.REWIND;
    if (b(7)) flags |= FLAG.FAST;
    back ||= b(8);
  }
  if (back && !padBack) flags |= FLAG.BACK;
  padBack = back;
  return { pad, flags };
}

function readControls() {
  const gp = readGamepads();
  let pad = gp.pad | keyPad | touch.dirs | (touch.jump ? BTN.B : 0);
  let flags = gp.flags | pressedFlags;
  if (touch.rewind || keyHeld.rewind) flags |= FLAG.REWIND;
  if (keyHeld.fast) flags |= FLAG.FAST;
  pressedFlags = 0;
  return { pad, flags };
}

// ---------------------------------------------------------------- main loop

let last = 0;
let behind = 0;
let image;
let savedInvincible = loadSetting('invincible') === '1' ? '1' : '0';

function frame(t) {
  requestAnimationFrame(frame);
  if (!last) last = t;
  behind += t - last;
  last = t;
  // Way behind (the tab was hidden, or the phone is too slow): don't try to catch up.
  if (behind > STEP_MS * 4) behind = STEP_MS;
  let ticks = 0;
  while (behind >= STEP_MS) {
    behind -= STEP_MS;
    ticks++;
  }
  if (!ticks) return;
  for (let i = 0; i < ticks; i++) {
    const c = readControls();
    const flags = i === 0 ? c.flags : c.flags & HELD_FLAGS;
    const [tx, ty] = i === 0 && tap ? tap : [-1, -1];
    tap = null;
    try {
      game.tick(c.pad, flags, tx, ty, game.in_game() ? 0 : BACKGROUND_MS / ticks);
    } catch (e) {
      crashed(e);
      throw e;
    }
    queueAudio();
  }
  const bytes = new Uint8ClampedArray(wasm.memory.buffer, game.rgba_ptr(), game.width() * game.height() * 4);
  if (!image) image = new ImageData(game.width(), game.height());
  image.data.set(bytes);
  ctx.putImageData(image, 0, 0);
  $('paused').style.display = game.in_game() && game.paused() ? 'block' : 'none';
  const invincible = game.invincible() ? '1' : '0';
  if (invincible !== savedInvincible) {
    saveSetting('invincible', invincible);
    savedInvincible = invincible;
  }
}

function crashed(e) {
  overlay.hidden = false;
  board.innerHTML = `<h1>CART GAUNTLET</h1><p id="error">Something went wrong: ${e}</p>
    <button class="btn" onclick="location.reload()">Reload</button>`;
}

function start() {
  startAudio();
  const root = document.documentElement;
  if (root.requestFullscreen) {
    root.requestFullscreen({ navigationUI: 'hide' })
      .then(() => screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape'))
      .catch(() => {});
  }
  overlay.hidden = true;
  requestAnimationFrame(frame);
}

main();
