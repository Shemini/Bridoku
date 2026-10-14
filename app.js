// ============================================================================
//  MURDOKU · interfaz y flujo de juego
// ============================================================================
import { CONTENT } from './content.js';
import { DIFFICULTIES } from './engine.js';
import { clueTokens, clueRefs, roomText, itemText, weaponText } from './texts.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin espacio */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } },
};

// ------------------------------------------------------------------ Estado
const DEFAULTS = { rowcol: true, conflicts: true, vibrate: true, timer: true, autofs: true, seenHowto: false };
const settings = Object.assign({}, DEFAULTS, LS.get('mdk.settings', {}));
let stats = LS.get('mdk.stats', { solved: {}, daily: {} });
let G = null;                         // partida en curso
const U = { sel: -1, hl: null, hlTimer: 0, acc: { m: -1, w: '' }, tick: 0 }; // interfaz

// ----------------------------------------------------------------- Sprites
const SP = new Set();
const spKey = (kind, id) => kind + '/' + id;
const has = (kind, id) => SP.has(spKey(kind, id));
const spUrl = (kind, id) => `sprites/${kind}/${id}.png`;

async function probeSprites() {
  const jobs = [];
  const add = (kind, id) => jobs.push(new Promise((res) => {
    const im = new Image();
    im.onload = () => { SP.add(spKey(kind, id)); res(); };
    im.onerror = () => res();
    im.src = spUrl(kind, id);
  }));
  CONTENT.CHARACTERS.forEach((c) => { add('characters', c.id); add('characters', c.id + '_dead'); });
  CONTENT.ITEMS.forEach((i) => add('items', i.id));
  CONTENT.WEAPONS.forEach((w) => add('weapons', w.id));
  CONTENT.DECOR.forEach((d) => add('decor', d.id));
  CONTENT.ROOM_TYPES.forEach((r) => add('floors', r.id));
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 2500))]);
}

// ------------------------------------------------------ Piezas de interfaz
function avatar(cid, opts = {}) {
  const c = CONTENT.charMap[cid];
  const dead = opts.dead && has('characters', cid + '_dead');
  const id = dead ? cid + '_dead' : cid;
  if (has('characters', id)) return `<img class="av sp" src="${spUrl('characters', id)}" alt="${esc(c.name)}" draggable="false">`;
  return `<span class="badge" style="--c:${c.color}">${esc(c.name[0])}</span>`;
}
function thingVis(id, cls = '') {
  const w = CONTENT.weaponMap[id];
  const kind = w ? 'weapons' : 'items';
  const def = w || CONTENT.itemMap[id];
  if (has(kind, id)) return `<img class="sp ${cls}" src="${spUrl(kind, id)}" alt="" draggable="false">`;
  return `<span class="em ${cls}">${def ? def.emoji : '?'}</span>`;
}
function pchip(i) {
  const cid = G.puz.persons[i], c = CONTENT.charMap[cid];
  return `<b class="pc${i === G.puz.victim ? ' v' : ''}" data-act="pick" data-p="${i}" style="--c:${c.color}">${esc(c.name)}${i === G.puz.victim ? ' †' : ''}</b>`;
}
function tokensHTML(tokens) {
  const puz = G.puz;
  return tokens.map((t) => {
    switch (t.k) {
      case 'p': return pchip(t.i);
      case 'room': return `<span class="rc" style="--c:${CONTENT.roomTypeMap[puz.roomTypes[t.r]].color}">${esc(roomText(t.r, puz, CONTENT, t))}</span>`;
      case 'item': return `<span class="ic">${thingVis(t.id, 'em')}${esc(itemText(t.id, CONTENT))}</span>`;
      case 'w': return `<span class="ic w">${thingVis(t.id, 'em')}${esc(weaponText(t.id, CONTENT, t))}</span>`;
      default: return esc(t.s);
    }
  }).join('');
}

// -------------------------------------------------------------- Utilidades
function toast(msg, ms = 1900) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), ms);
}
function buzz(ms) { if (settings.vibrate && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { /* ignorar */ } }
function fmtTime(s) { const m = Math.floor(s / 60), r = s % 60; return String(m).padStart(2, '0') + ':' + String(r).padStart(2, '0'); }
function todayKey(d = new Date()) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function parseKey(k) { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); }
function addDays(k, n) { const d = parseKey(k); d.setDate(d.getDate() + n); return todayKey(d); }
function caseNumber(k) { return Math.round((parseKey(k) - parseKey(CONTENT.GAME.epoch)) / 86400000) + 1; }
const DAILY_BY_DOW = { 0: 'experto', 1: 'facil', 2: 'facil', 3: 'normal', 4: 'normal', 5: 'dificil', 6: 'dificil' };
function dailyInfo() {
  const key = todayKey();
  const diff = DAILY_BY_DOW[parseKey(key).getDay()];
  return { key, num: caseNumber(key), diff, seed: 'D' + key, id: diff + ':D' + key };
}
function streak() {
  let k = todayKey();
  if (!stats.daily[k]) k = addDays(k, -1);
  let n = 0;
  while (stats.daily[k]) { n++; k = addDays(k, -1); }
  return n;
}
const dLabel = (d) => DIFFICULTIES[d].label + ' · ' + DIFFICULTIES[d].N + '×' + DIFFICULTIES[d].N;

// ------------------------------------------------------------ Generación
let worker = null, reqId = 0;
const pending = new Map();
function getWorker() {
  if (worker !== null) return worker;
  try {
    worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const p = pending.get(e.data.id);
      if (!p) return;
      pending.delete(e.data.id);
      e.data.error ? p.rej(new Error(e.data.error)) : p.res(e.data.puzzle);
    };
    worker.onerror = () => { worker = false; for (const [, p] of pending) p.rej(new Error('worker')); pending.clear(); };
  } catch (e) { worker = false; }
  return worker;
}
async function generate(diff, seed) {
  const w = getWorker();
  if (w) {
    try {
      return await new Promise((res, rej) => { const id = ++reqId; pending.set(id, { res, rej }); w.postMessage({ id, diff, seed }); });
    } catch (e) { /* cae al modo sin worker */ }
  }
  const { generatePuzzle } = await import('./engine.js');
  await new Promise((r) => setTimeout(r, 40));
  return generatePuzzle(CONTENT, diff, seed);
}

const LOAD_MSGS = ['Investigando el caso…', 'Interrogando a los sospechosos…', 'Rastreando huellas…', 'Comprobando coartadas…', 'Cerrando las puertas de la mansión…'];
async function withLoading(fn) {
  const el = $('#loading'), tx = $('#loading-text');
  let i = 0;
  const show = setTimeout(() => { el.classList.add('on'); tx.textContent = LOAD_MSGS[0]; }, 250);
  const cyc = setInterval(() => { i = (i + 1) % LOAD_MSGS.length; tx.textContent = LOAD_MSGS[i]; }, 1800);
  try { return await fn(); } finally { clearTimeout(show); clearInterval(cyc); el.classList.remove('on'); }
}

// --------------------------------------------------------- Guardar / cargar
function newGameFrom(puz, kind, dailyKey) {
  const N = puz.N;
  return {
    v: 1, id: puz.id, kind, dailyKey: dailyKey || '', puz,
    placed: new Array(N).fill(-1),
    notes: Array.from({ length: N }, () => new Array(N * N).fill(0)),
    done: new Array(puz.clues.length).fill(0), hinted: [],
    time: 0, hints: 0, checks: 0, wrong: 0, status: 'playing', undo: [], flash: null,
  };
}
function saveGame() {
  if (!G) return;
  const { undo, flash, ...rest } = G;
  LS.set('mdk.save.' + G.id, rest);
  LS.set('mdk.current', G.id);
  const idx = LS.get('mdk.saves', []).filter((x) => x !== G.id);
  idx.unshift(G.id);
  while (idx.length > 14) { const old = idx.pop(); if (!(stats.daily && Object.values(stats.daily).includes(old))) LS.del('mdk.save.' + old); }
  LS.set('mdk.saves', idx);
}
function loadGame(id) {
  const s = LS.get('mdk.save.' + id, null);
  if (!s || !s.puz || s.v !== 1) return null;
  s.undo = []; s.flash = null;
  return s;
}
function saveStats() { LS.set('mdk.stats', stats); }
function saveSettings() { LS.set('mdk.settings', settings); }

// ------------------------------------------------------------- Pantallas
function show(name) {
  $('#screen-home').classList.toggle('on', name === 'home');
  $('#screen-play').classList.toggle('on', name === 'play');
}

function renderHome() {
  const d = dailyInfo();
  const ds = loadGame(d.id);
  const solved = !!stats.daily[d.key];
  const started = ds && ds.status === 'playing' && (ds.placed.some((x) => x >= 0) || ds.time > 5);
  const st = streak();
  const curId = LS.get('mdk.current', '');
  const cur = curId && curId !== d.id ? loadGame(curId) : null;
  const resume = cur && cur.status === 'playing' ? cur : null;
  const sol = solved && ds ? ds : null;

  let dailyBtn = `<button class="btn" data-act="daily">${started ? 'Continuar caso' : 'Investigar'}</button>`;
  if (solved) dailyBtn = `<button class="btn ghost" data-act="daily">Ver resultado</button>`;
  const fsHint = needsFsHint();

  $('#screen-home').innerHTML = `
  <div class="home">
    <div class="hero">
      <div class="eyebrow">Rompecabezas de lógica</div>
      <h1>${esc(CONTENT.GAME.title)}</h1>
      <div class="rule"></div>
      <p>${esc(CONTENT.GAME.subtitle)}</p>
    </div>

    <div class="card daily">
      <div class="tagrow">
        <span class="tag brass">Caso del día</span>
        <span class="tag">#${d.num}</span>
        <span class="tag">${esc(dLabel(d.diff))}</span>
        ${st > 0 ? `<span class="tag ok">🔥 Racha ${st}</span>` : ''}
      </div>
      <h3>${solved ? 'Caso resuelto' : 'Un caso nuevo cada día'}</h3>
      <div class="meta">${solved && sol ? `Lo resolviste en ${fmtTime(sol.time)}${sol.hints ? ` · ${sol.hints} pista${sol.hints > 1 ? 's' : ''}` : ''}. Vuelve mañana.` : started ? `En curso · ${fmtTime(ds.time)}` : 'Todos reciben el mismo caso. La dificultad sube a lo largo de la semana.'}</div>
      ${dailyBtn}
    </div>

    ${resume ? `<div class="card"><div class="tagrow"><span class="tag">En curso</span><span class="tag">${esc(dLabel(resume.puz.diff))}</span></div>
      <div class="meta">Tienes un caso a medias · ${fmtTime(resume.time)}</div>
      <button class="btn ghost" data-act="resume" data-id="${esc(resume.id)}">Continuar</button></div>` : ''}

    <div class="sectiontitle">Caso libre</div>
    <div class="diffgrid">
      ${Object.values(DIFFICULTIES).map((D) => `<button class="diff" data-act="new" data-diff="${D.key}">
        <b>${D.label}</b><span>Cuadrícula ${D.N}×${D.N} · ${D.N} sospechosos</span><i>${solvedCount(D.key)} resueltos</i></button>`).join('')}
    </div>

    ${fsHint}
    <div class="linkrow">
      <button class="link" data-act="howto">Cómo se juega</button>
      <button class="link" data-act="settings">Ajustes</button>
    </div>
    <div class="fine">Los casos se generan en tu dispositivo · funciona sin conexión</div>
  </div>`;
}
function solvedCount(diff) { return Object.values(stats.solved).filter((s) => s.diff === diff).length; }

function isStandalone() {
  return matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}
function canFullscreen() { const el = document.documentElement; return !!(el.requestFullscreen || el.webkitRequestFullscreen); }
function needsFsHint() {
  if (isStandalone()) return '';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return `<div class="card"><div class="meta" style="margin:0">📲 Para jugar a pantalla completa en iPhone: pulsa <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>.</div></div>`;
  if (canFullscreen()) return `<button class="btn ghost small" style="align-self:center" data-act="fullscreen">⛶ Pantalla completa</button>`;
  return '';
}
async function toggleFullscreen(silent) {
  const el = document.documentElement;
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    } else {
      await (el.requestFullscreen || el.webkitRequestFullscreen).call(el, { navigationUI: 'hide' });
      try { await screen.orientation.lock('portrait'); } catch (e) { /* no permitido */ }
    }
  } catch (e) { if (silent !== true) toast('Tu navegador no permite pantalla completa aquí'); }
}
function autoFullscreen() {
  if (!settings.autofs || isStandalone() || !canFullscreen() || document.fullscreenElement) return;
  if (!matchMedia('(pointer: coarse)').matches) return;
  toggleFullscreen(true);
}

// ---------------------------------------------------------- Partida: inicio
async function openGame(id, makeFn, kind, dailyKey) {
  let g = loadGame(id);
  if (!g) {
    const puz = await withLoading(makeFn);
    g = newGameFrom(puz, kind, dailyKey);
  }
  G = g; U.sel = -1; U.hl = null;
  renderPlayShell();
  show('play');
  if (!H.stack.includes('play')) hPush('play');
  saveGame();
  if (G.status === 'solved') openVictory(true);
  else if (!settings.seenHowto) { settings.seenHowto = true; saveSettings(); setTimeout(openHowto, 350); }
}
function startDaily() {
  const d = dailyInfo();
  autoFullscreen();
  return openGame(d.id, () => generate(d.diff, d.seed), 'daily', d.key);
}
function startFree(diff) {
  const seed = 'F' + Date.now().toString(36) + Math.floor(Math.random() * 1296).toString(36);
  autoFullscreen();
  return openGame(diff + ':' + seed, () => generate(diff, seed), 'free', '');
}
function resume(id) { autoFullscreen(); return openGame(id, null, 'free', ''); }

function goHome(fromPop) {
  saveGame();
  if (fromPop) {
    $('#sheet-bg').classList.remove('on'); $('#sheet').classList.remove('on');
  } else {
    const n = H.stack.length;
    $('#sheet-bg').classList.remove('on'); $('#sheet').classList.remove('on');
    if (n) { H.stack = []; H.ignore++; try { history.go(-n); } catch (e) { H.ignore--; } }
  }
  renderHome();
  show('home');
}

// --------------------------------------------------------- Partida: pintado
function renderPlayShell() {
  const puz = G.puz, v = puz.victim;
  const num = G.kind === 'daily' ? `Caso #${caseNumber(G.dailyKey)}` : 'Caso libre';
  $('#screen-play').innerHTML = `
  <div class="play">
    <div class="topbar">
      <button class="icon-btn" data-act="home" aria-label="Menú">‹</button>
      <div class="ttl">${num}<small>${esc(dLabel(puz.diff))} · Mansión ${esc(puz.mansion)}</small></div>
      <div class="timer" id="timer"></div>
      <button class="icon-btn" data-act="howto" aria-label="Ayuda">?</button>
    </div>
    <div class="casestrip">
      <div class="vic">${avatar(puz.persons[v], { dead: true })}<span><b>${esc(CONTENT.charMap[puz.persons[v]].name)}</b> ha aparecido sin vida. ¿Quién estuvo a solas con la víctima?</span></div>
      <div class="compass" title="Norte arriba"><div><b>N</b>↑</div></div>
    </div>
    <div class="boardwrap"><div class="board" id="board"></div></div>
    <div class="tray" id="tray"></div>
    <div class="cluehead"><b>Pistas</b><span id="clue-count"></span></div>
    <ul class="clues" id="clues"></ul>
    <div class="bottombar">
      <button class="tbtn" data-act="undo" id="b-undo"><i>↶</i>Deshacer</button>
      <button class="tbtn" data-act="hint"><i>💡</i>Pista</button>
      <button class="tbtn" data-act="check"><i>✔︎</i>Revisar</button>
      <button class="tbtn primary" data-act="accuse" id="b-acc"><i>🔎</i>Acusar</button>
    </div>
  </div>`;
  drawAll();
  updateTimer();
}
function drawAll() { drawBoard(); drawTray(); drawClues(); updateBottom(); }

function labelCells() {
  if (G.labels) return G.labels;
  const puz = G.puz, N = puz.N, out = new Array(puz.K).fill(-1);
  for (let i = 0; i < N * N; i++) {
    const r = puz.roomOf[i];
    if (out[r] === -1 && !puz.itemAt[i]) out[r] = i;
  }
  for (let i = 0; i < N * N; i++) if (out[puz.roomOf[i]] === -1) out[puz.roomOf[i]] = i;
  return (G.labels = out);
}

function conflictSet() {
  const N = G.puz.N, bad = new Set();
  for (let p = 0; p < N; p++) {
    if (G.placed[p] < 0) continue;
    for (let q = p + 1; q < N; q++) {
      if (G.placed[q] < 0) continue;
      const a = G.placed[p], b = G.placed[q];
      if (((a / N) | 0) === ((b / N) | 0) || a % N === b % N) { bad.add(a); bad.add(b); }
    }
  }
  return bad;
}

function drawBoard() {
  const puz = G.puz, N = puz.N, NN = N * N;
  const board = $('#board');
  board.style.setProperty('--n', N);
  const labels = labelCells();
  const sel = U.sel;
  const bad = settings.conflicts ? conflictSet() : new Set();
  const hl = U.hl;
  const flash = G.flash;
  // filas/columnas ocupadas por otros personajes
  const occ = [];
  for (let p = 0; p < N; p++) if (G.placed[p] >= 0 && p !== sel) occ.push(G.placed[p]);
  const personAt = {};
  G.placed.forEach((c, p) => { if (c >= 0) personAt[c] = p; });

  let html = '';
  for (let i = 0; i < NN; i++) {
    const r = (i / N) | 0, c = i % N, room = puz.roomOf[i];
    const type = CONTENT.roomTypeMap[puz.roomTypes[room]];
    const cls = ['cell'];
    if (r === 0 || puz.roomOf[i - N] !== room) cls.push('bt');
    if (r === N - 1 || puz.roomOf[i + N] !== room) cls.push('bb');
    if (c === 0 || puz.roomOf[i - 1] !== room) cls.push('bl');
    if (c === N - 1 || puz.roomOf[i + 1] !== room) cls.push('br');
    const p = personAt[i];
    if (sel >= 0 && G.placed[sel] === i) cls.push('sel');
    if (bad.has(i)) cls.push('conflict');
    if (flash && flash.cells.includes(i)) cls.push('badcell');
    if (hl) {
      const itemHit = puz.itemAt[i] && hl.items.includes(puz.itemAt[i]) && !hl.rooms.length;
      if (hl.rooms.includes(room) || itemHit) cls.push('hl');
    }
    let inner = '';
    if (puz.decorAt[i]) {
      const d = puz.decorAt[i];
      inner += has('decor', d) ? `<img class="decor sp" src="${spUrl('decor', d)}" alt="">` : `<span class="decor">${CONTENT.decorMap[d].emoji}</span>`;
    }
    const it = puz.itemAt[i];
    if (it) inner += `<span class="it${CONTENT.weaponMap[it] ? ' weapon' : ''}" style="display:grid;place-items:center">${thingVis(it, has(CONTENT.weaponMap[it] ? 'weapons' : 'items', it) ? 'itimg' : '')}</span>`;
    if (p !== undefined) {
      const isV = p === puz.victim;
      inner += `<div class="tok${isV ? ' vic' : ''}">${avatar(puz.persons[p], { dead: isV })}${isV ? '<span class="skull">💀</span>' : ''}${G.hinted.includes(p) ? '<span class="pin">💡</span>' : ''}</div>`;
    }
    if (sel >= 0 && G.notes[sel][i] && p === undefined) {
      const fx = flash && flash.notes.some(([pp, ii]) => pp === sel && ii === i);
      inner += `<div class="x">✕</div>`;
      if (fx) cls.push('flashx');
    }
    if (settings.rowcol && p === undefined && occ.some((o) => ((o / N) | 0) === r || o % N === c)) inner += '<div class="dim"></div>';
    inner += '<div class="ring"></div>';
    const fl = has('floors', type.id) ? `background-image:url(${spUrl('floors', type.id)});` : '';
    html += `<div class="${cls.join(' ')}" data-act="cell" data-i="${i}" style="--fl:${type.color};${fl}">${inner}</div>`;
  }
  let lab = '';
  labels.forEach((cellIdx, room) => {
    const t = CONTENT.roomTypeMap[puz.roomTypes[room]];
    lab += `<span class="rl" style="left:calc(var(--cell) * ${cellIdx % N} + 4px);top:calc(var(--cell) * ${(cellIdx / N) | 0} + 4px)">${esc(t.label)}</span>`;
  });
  board.innerHTML = html + lab;
  // el "it" usa estilos de .it en CSS; asegurar clase correcta en emoji/imagen
  board.querySelectorAll('.it > .em').forEach((e) => { e.style.fontSize = 'calc(var(--cell) * .46)'; });
  board.querySelectorAll('.it > img').forEach((e) => { e.style.width = '100%'; e.style.height = '100%'; e.style.objectFit = 'contain'; });
}

function drawTray() {
  const puz = G.puz;
  const hlP = U.hl ? U.hl.persons : [];
  $('#tray').innerHTML = puz.persons.map((cid, p) => {
    const c = CONTENT.charMap[cid];
    const cls = ['chip'];
    if (U.sel === p) cls.push('sel');
    if (G.placed[p] >= 0) cls.push('placed');
    if (p === puz.victim) cls.push('vic');
    if (hlP.includes(p)) cls.push('pulse');
    return `<button class="${cls.join(' ')}" data-act="pick" data-p="${p}">${avatar(cid)}<span>${esc(c.name)}</span></button>`;
  }).join('');
}

function drawClues() {
  const ul = $('#clues');
  const top = ul.scrollTop;
  const puz = G.puz;
  ul.innerHTML = puz.clues.map((c, i) => {
    const toks = clueTokens(c, puz, CONTENT);
    return `<li class="clue${G.done[i] ? ' done' : ''}${U.activeClue === i ? ' active' : ''}" data-act="clue" data-i="${i}">
      <div class="ctext">${tokensHTML(toks)}</div>
      <button class="chk" data-act="chk" data-i="${i}" aria-label="Marcar como usada">✓</button></li>`;
  }).join('');
  ul.scrollTop = top;
  const n = G.done.filter(Boolean).length;
  $('#clue-count').textContent = `${n}/${puz.clues.length} usadas`;
}

function updateBottom() {
  const full = G.placed.every((x) => x >= 0);
  const acc = $('#b-acc');
  if (acc) acc.classList.toggle('glow', full && G.status === 'playing');
  const un = $('#b-undo');
  if (un) un.disabled = !G.undo.length;
}
function updateTimer() {
  const t = $('#timer');
  if (t) t.textContent = settings.timer ? fmtTime(G.time) : '';
}

// --------------------------------------------------------------- Acciones
function pushUndo() {
  G.undo.push(JSON.stringify({ placed: G.placed, notes: G.notes }));
  if (G.undo.length > 120) G.undo.shift();
}
function undo() {
  const s = G.undo.pop();
  if (!s) return;
  const o = JSON.parse(s);
  G.placed = o.placed; G.notes = o.notes;
  drawAll(); saveGame();
}
function pick(p) {
  U.sel = U.sel === p ? -1 : p;
  buzz(6);
  drawBoard(); drawTray();
}
function tapCell(i) {
  if (G.status !== 'playing') return;
  const N = G.puz.N;
  const sel = U.sel;
  if (sel < 0) {
    const q = G.placed.indexOf(i);
    if (q >= 0) { U.sel = q; drawBoard(); drawTray(); } else toast('Elige un personaje de la bandeja y toca una casilla');
    return;
  }
  const locked = (q) => G.hinted.includes(q);
  if (G.placed[sel] === i) {
    if (locked(sel)) return toast('Esta casilla la reveló una pista');
    pushUndo(); G.placed[sel] = -1;
  } else if (G.notes[sel][i]) {
    const q = G.placed.indexOf(i);
    if (q >= 0 && q !== sel && locked(q)) return toast('Esa casilla la reveló una pista');
    if (locked(sel)) return toast('Este personaje ya está fijado por una pista');
    pushUndo();
    G.notes[sel][i] = 0;
    if (q >= 0 && q !== sel) G.placed[q] = -1;
    G.placed[sel] = i;
    buzz(14);
  } else {
    pushUndo();
    G.notes[sel][i] = 1;
    buzz(6);
  }
  G.flash = null;
  drawAll(); saveGame();
}
function toggleClueDone(i) { G.done[i] = G.done[i] ? 0 : 1; drawClues(); saveGame(); }
function flashClue(i) {
  const c = G.puz.clues[i];
  const refs = clueRefs(c, G.puz, CONTENT);
  U.activeClue = i;
  U.hl = { rooms: refs.rooms, items: refs.items, persons: refs.persons };
  if (refs.victim) U.hl.persons = U.hl.persons.concat([G.puz.victim]);
  drawBoard(); drawTray(); drawClues();
  clearTimeout(U.hlTimer);
  U.hlTimer = setTimeout(() => { U.hl = null; U.activeClue = -1; if (G) { drawBoard(); drawTray(); drawClues(); } }, 2400);
}

function doHint() {
  if (G.status !== 'playing') return;
  const N = G.puz.N, sol = G.puz.solution;
  const cand = [];
  for (let p = 0; p < N; p++) if (!G.hinted.includes(p)) cand.push(p);
  if (!cand.length) return toast('Ya no quedan pistas por revelar');
  const wrong = cand.filter((p) => G.placed[p] >= 0 && G.placed[p] !== sol[p]);
  const free = cand.filter((p) => G.placed[p] < 0);
  const pool = wrong.length ? wrong : (free.length ? free : cand);
  const p = pool[Math.floor(Math.random() * pool.length)];
  pushUndo();
  const q = G.placed.indexOf(sol[p]);
  if (q >= 0 && q !== p) G.placed[q] = -1;
  G.placed[p] = sol[p];
  G.notes[p][sol[p]] = 0;
  G.hinted.push(p);
  G.hints++;
  U.sel = p;
  drawAll(); saveGame();
  toast(`${CONTENT.charMap[G.puz.persons[p]].name} estaba aquí (pista revelada)`);
}
function doCheck() {
  if (G.status !== 'playing') return;
  const N = G.puz.N, sol = G.puz.solution;
  G.checks++;
  const wrongP = [];
  for (let p = 0; p < N; p++) if (G.placed[p] >= 0 && G.placed[p] !== sol[p]) wrongP.push(p);
  const badNotes = [];
  for (let p = 0; p < N; p++) if (G.notes[p][sol[p]]) badNotes.push([p, sol[p]]);
  const placedN = G.placed.filter((x) => x >= 0).length;
  if (!wrongP.length && !badNotes.length) {
    toast(placedN ? 'Todo lo que has marcado es correcto ✔︎' : 'Aún no hay nada que revisar');
  } else {
    G.flash = { cells: wrongP.map((p) => G.placed[p]), notes: badNotes };
    if (!wrongP.length && badNotes.length) U.sel = badNotes[0][0];
    buzz(30);
    const parts = [];
    if (wrongP.length) parts.push(`${wrongP.length} personaje${wrongP.length > 1 ? 's' : ''} mal colocado${wrongP.length > 1 ? 's' : ''}`);
    if (badNotes.length) parts.push(`${badNotes.length} descarte${badNotes.length > 1 ? 's' : ''} erróneo${badNotes.length > 1 ? 's' : ''}`);
    toast('⚠ ' + parts.join(' y '), 2600);
    setTimeout(() => { if (G) { G.flash = null; drawBoard(); } }, 3200);
  }
  drawAll(); saveGame();
}

// ------------------------------------------------- Historial (botón Atrás del móvil)
const H = { stack: [], ignore: 0 };
function hPush(kind) { H.stack.push(kind); try { history.pushState({ mdk: kind }, ''); } catch (e) { /* nada */ } }
function hPop() {
  if (!H.stack.length) return;
  H.stack.pop(); H.ignore++;
  try { history.back(); } catch (e) { H.ignore--; }
}
window.addEventListener('popstate', () => {
  if (H.ignore > 0) { H.ignore--; return; }
  const top = H.stack.pop();
  if (top === 'sheet') closeSheet(true);
  else if (top === 'play') goHome(true);
});

// -------------------------------------------------------------- Hojas
function openSheet(title, html) {
  if (!sheetOpen()) hPush('sheet');
  $('#sheet-title').textContent = title;
  $('#sheet-body').innerHTML = html;
  $('#sheet-bg').classList.add('on');
  $('#sheet').classList.add('on');
  $('#sheet-body').scrollTop = 0;
}
function closeSheet(fromPop) {
  const was = sheetOpen();
  $('#sheet-bg').classList.remove('on');
  $('#sheet').classList.remove('on');
  if (was && fromPop !== true && H.stack[H.stack.length - 1] === 'sheet') hPop();
}
function sheetOpen() { return $('#sheet').classList.contains('on'); }

function accuseHTML() {
  const puz = G.puz;
  const suspects = puz.persons.map((cid, p) => ({ cid, p })).filter((o) => o.p !== puz.victim);
  const weapons = puz.weaponOfRoom.filter(Boolean);
  return `
    <p>¿Quién estuvo a solas con <b>${esc(CONTENT.charMap[puz.persons[puz.victim]].name)}</b> y con qué arma?</p>
    <h4>El asesino</h4>
    <div class="picker">${suspects.map((o) => `<button class="pick${U.acc.m === o.p ? ' sel' : ''}" data-act="pick-suspect" data-p="${o.p}">${avatar(o.cid)}<span>${esc(CONTENT.charMap[o.cid].name)}</span></button>`).join('')}</div>
    <h4>El arma</h4>
    <div class="picker">${weapons.map((w) => `<button class="pick${U.acc.w === w ? ' sel' : ''}" data-act="pick-weapon" data-w="${w}">${thingVis(w, 'wp')}<span>${esc(CONTENT.weaponMap[w].name)}</span></button>`).join('')}</div>
    <button class="btn danger" data-act="do-accuse" ${U.acc.m < 0 || !U.acc.w ? 'style="opacity:.5"' : ''}>Acusar</button>`;
}
function openAccuse() {
  if (G.status !== 'playing') return openVictory(true);
  U.acc = { m: -1, w: '' };
  openSheet('Hacer una acusación', accuseHTML());
}
function doAccuse() {
  if (U.acc.m < 0 || !U.acc.w) return toast('Elige un sospechoso y un arma');
  const puz = G.puz;
  if (U.acc.m === puz.murderer && U.acc.w === puz.weapon) {
    G.status = 'solved';
    G.placed = puz.solution.slice();
    const rec = { diff: puz.diff, time: G.time, hints: G.hints, checks: G.checks, wrong: G.wrong, at: Date.now(), kind: G.kind };
    stats.solved[G.id] = rec;
    if (G.kind === 'daily') stats.daily[G.dailyKey] = G.id;
    saveStats(); saveGame();
    U.sel = -1;
    drawAll();
    buzz([30, 60, 30]);
    openVictory(false);
  } else {
    G.wrong++;
    saveGame();
    buzz(60);
    const hintTxt = U.acc.m !== puz.murderer && U.acc.w !== puz.weapon ? 'Ni el sospechoso ni el arma son correctos.' : (U.acc.m !== puz.murderer ? 'El arma es correcta, pero ese no es el asesino.' : 'El asesino es correcto, pero el arma no.');
    toast('❌ ' + hintTxt, 2800);
    const sh = $('#sheet'); sh.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 260 });
  }
}
function storyText() {
  const puz = G.puz;
  const n = (p) => CONTENT.charMap[puz.persons[p]].name;
  return `${n(puz.murderer)} estuvo a solas con ${n(puz.victim)} en ${roomText(puz.crimeRoom, puz, CONTENT)} y mató con ${weaponText(puz.weapon, CONTENT)}.`;
}
function openVictory(again) {
  const puz = G.puz;
  const num = G.kind === 'daily' ? `Caso #${caseNumber(G.dailyKey)}` : 'Caso libre';
  openSheet(again ? 'Caso cerrado' : '¡Caso resuelto!', `
  <div class="reveal">
    <div class="cast">${avatar(puz.persons[puz.murderer])}<span class="em" style="font-size:44px">${has('weapons', puz.weapon) ? thingVis(puz.weapon, 'wp') : CONTENT.weaponMap[puz.weapon].emoji}</span></div>
    <div class="big">${esc(CONTENT.charMap[puz.persons[puz.murderer]].name)} era el asesino</div>
    <p>${esc(storyText())}</p>
    <div class="stats"><span class="tag brass">⏱ ${fmtTime(G.time)}</span><span class="tag">💡 ${G.hints} pista${G.hints === 1 ? '' : 's'}</span><span class="tag">✔︎ ${G.checks} revisión${G.checks === 1 ? '' : 'es'}</span>${G.wrong ? `<span class="tag">❌ ${G.wrong} fallo${G.wrong === 1 ? '' : 's'}</span>` : ''}</div>
    <div class="stack">
      <button class="btn" data-act="share">Compartir resultado</button>
      <button class="btn ghost" data-act="again" data-diff="${puz.diff}">Otro caso ${esc(DIFFICULTIES[puz.diff].label)}</button>
      <button class="btn ghost" data-act="home">Volver al inicio</button>
    </div>
    <p class="hint" style="margin-top:12px">${num} · ${esc(dLabel(puz.diff))}${G.kind === 'daily' && streak() ? ` · 🔥 racha de ${streak()}` : ''}</p>
  </div>`);
}
async function shareResult() {
  const puz = G.puz;
  const num = G.kind === 'daily' ? `Caso #${caseNumber(G.dailyKey)}` : 'Caso libre';
  const text = `${CONTENT.GAME.title} · ${num} · ${dLabel(puz.diff)}\n✅ Resuelto en ${fmtTime(G.time)} · 💡 ${G.hints} · ✔︎ ${G.checks}`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast('Resultado copiado'); }
  } catch (e) { /* cancelado */ }
}

function openHowto() {
  openSheet('Cómo se juega', `
    <p>Han asesinado a alguien en la mansión. Todos los personajes, <b>incluida la víctima</b>, están en el plano. Tu trabajo: colocarlos a todos y descubrir quién fue el asesino y con qué arma.</p>
    <h4>Las reglas</h4>
    <ul>
      <li>Cada personaje ocupa <b>una casilla</b>. Hay exactamente <b>uno por cada fila y uno por cada columna</b>.</li>
      <li>Las pistas son siempre <b>verdaderas</b>.</li>
      <li>La víctima estaba en una habitación con un <b>arma</b>, y solo había <b>otra persona</b> con ella: <b>el asesino</b>. Esa es el arma del crimen.</li>
    </ul>
    <h4>Cómo se marca</h4>
    <ul>
      <li>Toca un personaje de la bandeja y luego una casilla: <b>1 toque</b> = ✕ descartar · <b>2 toques</b> = colocar · <b>3</b> = quitar.</li>
      <li>El <b>rayado</b> marca filas y columnas que ya tienen dueño.</li>
      <li>Toca una pista para ver a qué se refiere en el plano; con el círculo ✓ la tachas.</li>
      <li>Cuando tengas a todos, pulsa <b>Acusar</b> y elige asesino y arma.</li>
    </ul>
    <h4>Para leer las pistas</h4>
    <ul>
      <li><b>Al lado / pegados</b>: casillas contiguas <u>de la misma habitación</u>. Una pared de por medio no cuenta.</li>
      <li><b>Norte</b> es arriba y <b>oeste</b> es la izquierda del plano.</li>
      <li><b>Ante</b> un mueble = en su misma casilla.</li>
      <li>El borde del plano son los <b>muros exteriores</b> de la mansión.</li>
    </ul>
    <button class="btn" data-act="close-sheet">¡A investigar!</button>`);
}

function openSettings() {
  const row = (k, t, sub) => `<div class="row"><div>${t}<small>${sub}</small></div><button class="switch${settings[k] ? ' on' : ''}" data-act="toggle" data-k="${k}" aria-label="${t}"></button></div>`;
  openSheet('Ajustes', `
    ${row('rowcol', 'Rayar filas y columnas ocupadas', 'Te recuerda dónde ya no puede ir nadie más.')}
    ${row('conflicts', 'Marcar conflictos', 'Resalta en rojo dos personajes en la misma fila o columna.')}
    ${row('timer', 'Mostrar el cronómetro', 'El tiempo se sigue contando aunque lo ocultes.')}
    ${row('vibrate', 'Vibración', 'Respuesta háptica al tocar (si tu móvil lo permite).')}
    ${row('autofs', 'Pantalla completa automática', 'En móviles, al empezar un caso (no funciona en iPhone).')}
    <div class="stack" style="margin-top:16px">
      <button class="btn ghost" data-act="sprites">Galería de sprites</button>
      <button class="btn ghost" data-act="howto">Cómo se juega</button>
      <button class="btn ghost" data-act="reset" style="color:#ff9c8f">Borrar todo el progreso</button>
    </div>
    <p class="hint" style="margin-top:14px;text-align:center">${esc(CONTENT.GAME.title)} · motor de puzles propio</p>`);
}

function openSprites() {
  const tile = (kind, id, emoji, label) => `<div class="gal ${has(kind, id) ? 'ok' : 'miss'}"><div class="box">${has(kind, id) ? `<img class="sp" src="${spUrl(kind, id)}" alt="">` : emoji}</div>${esc(label)}</div>`;
  const sec = (title, list) => {
    const have = list.filter((x) => has(x.kind, x.id)).length;
    return `<h4>${title} <small style="color:var(--muted);font-weight:400">${have}/${list.length}</small></h4><div class="gallery">${list.map((x) => tile(x.kind, x.id, x.emoji, x.label)).join('')}</div>`;
  };
  openSheet('Galería de sprites', `
    <p class="hint">Los que aparecen en gris todavía usan un dibujo provisional. Deja el PNG con el nombre indicado en su carpeta y se usará solo.</p>
    ${sec('Personajes · sprites/characters/', CONTENT.CHARACTERS.map((c) => ({ kind: 'characters', id: c.id, emoji: c.emoji, label: c.id + '.png' })))}
    ${sec('Muebles · sprites/items/', CONTENT.ITEMS.map((c) => ({ kind: 'items', id: c.id, emoji: c.emoji, label: c.id + '.png' })))}
    ${sec('Armas · sprites/weapons/', CONTENT.WEAPONS.map((c) => ({ kind: 'weapons', id: c.id, emoji: c.emoji, label: c.id + '.png' })))}
    ${sec('Suelos · sprites/floors/', CONTENT.ROOM_TYPES.map((c) => ({ kind: 'floors', id: c.id, emoji: '▦', label: c.id + '.png' })))}
    ${sec('Decorado · sprites/decor/', CONTENT.DECOR.map((c) => ({ kind: 'decor', id: c.id, emoji: c.emoji, label: c.id + '.png' })))}`);
}

// ------------------------------------------------------------ Eventos
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  switch (act) {
    case 'daily': return startDaily();
    case 'new': return startFree(el.dataset.diff);
    case 'again': closeSheet(); return startFree(el.dataset.diff);
    case 'resume': return resume(el.dataset.id);
    case 'home': return goHome(false);
    case 'howto': return openHowto();
    case 'settings': return openSettings();
    case 'sprites': return openSprites();
    case 'fullscreen': return toggleFullscreen(false);
    case 'close-sheet': return closeSheet();
    case 'toggle': {
      const k = el.dataset.k; settings[k] = !settings[k]; saveSettings();
      el.classList.toggle('on', settings[k]);
      if (G) { drawBoard(); updateTimer(); }
      return;
    }
    case 'reset':
      if (confirm('¿Borrar todos los casos y estadísticas de este dispositivo?')) {
        Object.keys(localStorage).filter((k) => k.startsWith('mdk.save.') || k === 'mdk.stats' || k === 'mdk.saves' || k === 'mdk.current').forEach((k) => localStorage.removeItem(k));
        stats = { solved: {}, daily: {} }; G = null; closeSheet(); renderHome(); show('home');
      }
      return;
    case 'pick': e.stopPropagation(); return G && pick(+el.dataset.p);
    case 'cell': return G && tapCell(+el.dataset.i);
    case 'clue': return G && flashClue(+el.dataset.i);
    case 'chk': e.stopPropagation(); return G && toggleClueDone(+el.dataset.i);
    case 'undo': return G && undo();
    case 'hint': return G && doHint();
    case 'check': return G && doCheck();
    case 'accuse': return G && openAccuse();
    case 'pick-suspect': U.acc.m = +el.dataset.p; $('#sheet-body').innerHTML = accuseHTML(); return;
    case 'pick-weapon': U.acc.w = el.dataset.w; $('#sheet-body').innerHTML = accuseHTML(); return;
    case 'do-accuse': return doAccuse();
    case 'share': return shareResult();
    default: return undefined;
  }
});
$('#sheet-bg').addEventListener('click', closeSheet);

// cronómetro
setInterval(() => {
  if (!G || G.status !== 'playing' || !$('#screen-play').classList.contains('on') || document.visibilityState !== 'visible') return;
  G.time++;
  updateTimer();
  if (++U.tick % 5 === 0) saveGame();
}, 1000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(); });
window.addEventListener('pagehide', saveGame);

// altura real del visor (móviles con barras dinámicas)
function setAH() { document.documentElement.style.setProperty('--ah', window.innerHeight + 'px'); }
window.addEventListener('resize', setAH);
window.addEventListener('orientationchange', setAH);
setAH();

// service worker (modo sin conexión)
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// ----------------------------------------------------------------- Inicio
(async function init() {
  await probeSprites();
  renderHome();
  show('home');
  // para pruebas y depuración
  window.__mdk = { get G() { return G; }, U, H, settings, startFree, startDaily, tapCell, pick, openAccuse, doAccuse, stats: () => stats };
})();
