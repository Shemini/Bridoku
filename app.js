// ============================================================================
//  MURDOKU · interfaz y flujo de juego
// ============================================================================
import { CONTENT } from './content.js';
import { DIFFICULTIES } from './engine.js';
import { clueTokens, clueRefs, roomText, itemText, openingText } from './texts.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin espacio */ } },
  del(k) { try { localStorage.removeItem(k); } catch (e) { /* nada */ } },
};
const SAVE_V = 3;

// ------------------------------------------------------------------ Estado
const DEFAULTS = { rowcol: true, conflicts: true, vibrate: true, timer: true, autofs: true, seenHowto: false };
const settings = Object.assign({}, DEFAULTS, LS.get('mdk.settings', {}));
let stats = LS.get('mdk.stats', { solved: {}, daily: {} });
let G = null;                         // partida en curso
// sel: personaje seleccionado · tool: 'sol' (colocar) | 'pen' (lápiz) | 'erase' (borrar) | 'empty' (marcar vacía)
const U = { sel: -1, tool: 'sol', pen: false, hl: null, hlTimer: 0, acc: -1, tick: 0, activeClue: -1 };

// ----------------------------------------------------------------- Sprites
const SP = new Set();
const spKey = (kind, id) => kind + '/' + id;
const has = (kind, id) => SP.has(spKey(kind, id));
const spUrl = (kind, id) => `sprites/${kind}/${id}.png`;
// [Tema pixel] icono de interfaz (sprites/ui/icon_<nombre>.png)
const uiImg = (n) => `<img class="ui sp" src="${spUrl('ui', 'icon_' + n)}" alt="" draggable="false">`;
// [Tema pixel] color de letra legible (blanco o ciruela) sobre el color de un personaje
function textOn(hex) {
  const h = hex.replace('#', '');
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(parseInt(h.slice(0, 2), 16)) + 0.7152 * lin(parseInt(h.slice(2, 4), 16)) + 0.0722 * lin(parseInt(h.slice(4, 6), 16));
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.0728) ? '#fffdf6' : '#2d2540';
}

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
  CONTENT.ROOM_TYPES.forEach((r) => add('floors', r.id));
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 2500))]);
}

// ------------------------------------------------------ Piezas de interfaz
function avatar(cid, opts = {}) {
  const c = CONTENT.charMap[cid];
  const dead = opts.dead && has('characters', cid + '_dead');
  const id = dead ? cid + '_dead' : cid;
  if (has('characters', id)) return `<img class="av sp" src="${spUrl('characters', id)}" alt="${esc(c.name)}" draggable="false">`;
  return `<span class="badge" style="--c:${c.color};--fg:${textOn(c.color)}">${esc(c.mark)}</span>`;
}
function itemIcon(id) {
  const it = CONTENT.itemMap[id];
  if (has('items', id)) return `<img class="sp" src="${spUrl('items', id)}" alt="">`;
  if (it && it.emoji) return `<span class="em">${it.emoji}</span>`;
  if (id === 'alfombra') return '<span class="em sw carpet-sw"></span>';
  if (id === 'mesa' || id === 'mesa_larga') return '<span class="em sw table-sw"></span>';
  return `<span class="em sw ${id}-sw"></span>`;
}
function pchip(i) {
  const c = CONTENT.charMap[G.puz.persons[i]];
  const v = i === G.puz.victim;
  return `<b class="pc${v ? ' v' : ''}" data-act="pick" data-p="${i}" style="--c:${c.color};--fg:${textOn(c.color)}">${esc(c.name)}${v ? ' †' : ''}</b>`;
}
function tokensHTML(tokens) {
  const puz = G.puz;
  return tokens.map((t) => {
    switch (t.k) {
      case 'p': return pchip(t.i);
      case 'room': return `<span class="rc" style="--c:${CONTENT.roomTypeMap[puz.roomTypes[t.r]].color}">${esc(roomText(t.r, puz, CONTENT, t))}</span>`;
      case 'item': return `<span class="ic${CONTENT.itemMap[t.id].walk ? ' walk' : ''}">${itemIcon(t.id)}${esc(itemText(t.id, CONTENT, t))}</span>`;
      case 'win': return `<span class="ic op win"><span class="em sw win-sw"></span>${esc(openingText(t))}</span>`;
      case 'door': return `<span class="ic op door"><span class="em sw door-sw"></span>${esc(openingText(t))}</span>`;
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
// Casos diarios: uno por dificultad y día. Se generan a partir de la fecha (semilla
// "D" + fecha), así que son iguales en todos los móviles y no hace falta guardarlos.
const DIFF_KEYS = Object.keys(DIFFICULTIES);
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const WDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const cap1 = (t) => t[0].toUpperCase() + t.slice(1);
function fmtDay(k) { const d = parseKey(k); return `${WDAYS[d.getDay()]} ${d.getDate()} de ${MONTHS[d.getMonth()]}`; }
function fmtDayShort(k) { const d = parseKey(k); return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`; }
const dailyId = (key, diff) => diff + ':D' + key;
const archiveStart = () => CONTENT.GAME.epoch;             // primer día del archivo
const isPlayableDay = (k) => k >= archiveStart() && k <= todayKey();
function dayStatus(key, diff) {
  const id = dailyId(key, diff);
  const s = stats.solved[id];
  if (s) return { state: 'solved', time: s.time, hints: s.hints };
  const g = loadGame(id);
  if (g && g.status === 'playing' && (placedCount(g) > 0 || g.time > 5)) return { state: 'playing', time: g.time };
  return { state: 'new' };
}
function daySolvedCount(key) { return DIFF_KEYS.filter((d) => stats.solved[dailyId(key, d)]).length; }
// racha: días seguidos (hasta hoy o ayer) con al menos un caso resuelto
function streak() {
  let k = todayKey();
  if (!daySolvedCount(k)) k = addDays(k, -1);
  let n = 0;
  while (k >= archiveStart() && daySolvedCount(k)) { n++; k = addDays(k, -1); }
  return n;
}
function statusText(st) {
  if (st.state === 'solved') return `✓ ${fmtTime(st.time)}`;
  if (st.state === 'playing') return `En curso · ${fmtTime(st.time)}`;
  return 'Sin empezar';
}
function dayButtons(key) {
  return `<div class="diffgrid">${DIFF_KEYS.map((d) => {
    const D = DIFFICULTIES[d], st = dayStatus(key, d);
    return `<button class="diff ${st.state}" data-act="daily" data-key="${key}" data-diff="${d}">
      <b>${D.label}</b><span>Plano ${D.N}×${D.N} · ${D.N - 1} sospechosos</span><i>${statusText(st)}</i></button>`;
  }).join('')}</div>`;
}
const dLabel = (d) => DIFFICULTIES[d].label + ' · ' + DIFFICULTIES[d].N + '×' + DIFFICULTIES[d].N;
const pname = (p) => CONTENT.charMap[G.puz.persons[p]].name;

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

const LOAD_MSGS = ['Investigando el caso…', 'Interrogando a los invitados…', 'Repasando el seating plan…', 'Comprobando coartadas…', 'Revisando las fotos del photocall…', 'Cerrando las puertas de la finca…'];
async function withLoading(fn) {
  const el = $('#loading'), tx = $('#loading-text');
  let i = 0;
  const show = setTimeout(() => { el.classList.add('on'); tx.textContent = LOAD_MSGS[0]; }, 250);
  const cyc = setInterval(() => { i = (i + 1) % LOAD_MSGS.length; tx.textContent = LOAD_MSGS[i]; }, 1800);
  try { return await fn(); } finally { clearTimeout(show); clearInterval(cyc); el.classList.remove('on'); }
}

// --------------------------------------------------------- Guardar / cargar
function newGameFrom(puz, kind, dailyKey) {
  const NN = puz.N * puz.N;
  return {
    v: SAVE_V, id: puz.id, kind, dailyKey: dailyKey || '', puz,
    sol: new Array(NN).fill(-1),     // solución colocada en cada casilla (índice de persona)
    pen: new Array(NN).fill(0),      // marcas a lápiz (bits por persona) · se conservan bajo la solución
    emp: new Array(NN).fill(0),      // casillas marcadas como "aquí no hay nadie"
    lock: new Array(NN).fill(0),     // reveladas por una pista: no se pueden borrar
    done: new Array(puz.clues.length).fill(0),
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
  while (idx.length > 40) LS.del('mdk.save.' + idx.pop());
  LS.set('mdk.saves', idx);
}
function loadGame(id) {
  const s = LS.get('mdk.save.' + id, null);
  if (!s || !s.puz || s.v !== SAVE_V) return null;
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
const placedCount = (g) => g.sol.filter((p) => p >= 0).length;

function renderHome() {
  const today = todayKey();
  const st = streak();
  const curId = LS.get('mdk.current', '');
  const cur = curId ? loadGame(curId) : null;
  const resumeG = cur && cur.status === 'playing' && cur.dailyKey && cur.dailyKey !== today && isPlayableDay(cur.dailyKey) ? cur : null;

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
        <span class="tag brass">Casos de hoy</span>
        <span class="tag">#${caseNumber(today)}</span>
        ${st > 0 ? `<span class="tag ok">🔥 Racha ${st}</span>` : ''}
      </div>
      <h3>${esc(cap1(fmtDay(today)))}</h3>
      <div class="meta">Un caso por dificultad. Son los mismos para todo el mundo y cambian cada día.</div>
      ${dayButtons(today)}
    </div>

    ${resumeG ? `<div class="card"><div class="tagrow"><span class="tag">En curso</span><span class="tag">${esc(fmtDayShort(resumeG.dailyKey))}</span><span class="tag">${esc(dLabel(resumeG.puz.diff))}</span></div>
      <div class="meta">Tienes un caso del archivo a medias · ${fmtTime(resumeG.time)}</div>
      <button class="btn ghost" data-act="daily" data-key="${resumeG.dailyKey}" data-diff="${resumeG.puz.diff}">Continuar</button></div>` : ''}

    <button class="btn ghost" data-act="archive">📅 Archivo de casos anteriores</button>

    ${needsFsHint()}
    <div class="linkrow">
      <button class="link" data-act="howto">Cómo se juega</button>
      <button class="link" data-act="settings">Ajustes</button>
    </div>
    <div class="fine">Los casos se generan en tu dispositivo · funciona sin conexión</div>
  </div>`;
}

// ------------------------------------------------------------- Archivo
function openArchive(ym) {
  const today = todayKey(), start = archiveStart();
  ym = ym || U.archYM || today.slice(0, 7);
  if (ym < start.slice(0, 7)) ym = start.slice(0, 7);
  if (ym > today.slice(0, 7)) ym = today.slice(0, 7);
  U.archYM = ym;
  const [y, m] = ym.split('-').map(Number);
  const days = new Date(y, m, 0).getDate();
  const offset = (new Date(y, m - 1, 1).getDay() + 6) % 7;     // la semana empieza en lunes
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
  let cells = '';
  for (let i = 0; i < offset; i++) cells += '<span class="cal-gap"></span>';
  for (let d = 1; d <= days; d++) {
    const key = `${ym}-${String(d).padStart(2, '0')}`;
    const ok = isPlayableDay(key);
    let pips = '';
    if (ok) pips = DIFF_KEYS.map((df) => `<i class="${dayStatus(key, df).state}"></i>`).join('');
    cells += `<button class="cal-day${key === today ? ' today' : ''}${ok && daySolvedCount(key) === DIFF_KEYS.length ? ' full' : ''}" ${ok ? `data-act="arch-day" data-key="${key}"` : 'disabled'}>
      <b>${d}</b><span class="pips">${pips}</span></button>`;
  }
  openSheet('Archivo de casos', `
    <div class="cal-nav">
      <button class="icon-btn" data-act="archive" data-ym="${prev}" ${prev < start.slice(0, 7) ? 'disabled' : ''} aria-label="Mes anterior">‹</button>
      <b>${cap1(MONTHS[m - 1])} ${y}</b>
      <button class="icon-btn" data-act="archive" data-ym="${next}" ${next > today.slice(0, 7) ? 'disabled' : ''} aria-label="Mes siguiente">›</button>
    </div>
    <div class="cal-head">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((w) => `<span>${w}</span>`).join('')}</div>
    <div class="cal">${cells}</div>
    <p class="hint">Cada cuadradito es una dificultad (Fácil, Normal, Difícil, Experto): relleno si está resuelto, a medias si está en curso.</p>`);
}
function openArchiveDay(key) {
  if (!isPlayableDay(key)) return;
  openSheet(`Caso #${caseNumber(key)}`, `
    <p><b>${esc(cap1(fmtDay(key)))}</b></p>
    ${dayButtons(key)}
    <div class="stack" style="margin-top:14px"><button class="btn ghost" data-act="archive" data-ym="${key.slice(0, 7)}">‹ Volver al calendario</button></div>`);
}

function isStandalone() {
  return matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}
function canFullscreen() { const el = document.documentElement; return !!(el.requestFullscreen || el.webkitRequestFullscreen); }
// iPhone: Safari no deja que una web se ponga a pantalla completa (solo los vídeos).
// La única forma es instalarla en la pantalla de inicio: se abre como app, sin barras.
function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function needsFsHint() {
  if (isStandalone()) return '';
  if (isIOS() && !canFullscreen()) return `<button class="btn ghost small" style="align-self:center" data-act="ios-install">📲 Jugar a pantalla completa</button>`;
  if (canFullscreen()) return `<button class="btn ghost small" style="align-self:center" data-act="fullscreen">⛶ Pantalla completa</button>`;
  return '';
}
function openIosInstall() {
  const chrome = /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
  openSheet('Pantalla completa en iPhone', `
    <p>En iPhone, Safari no permite que una web ocupe toda la pantalla. La solución es <b>añadir Bridoku a la pantalla de inicio</b>: desde su icono se abre como una app, sin barras del navegador y también sin conexión.</p>
    <ol class="steps">
      ${chrome
        ? '<li>Toca el botón <b>Compartir</b> <span class="ios-share" aria-hidden="true"></span> junto a la barra de direcciones.</li>'
        : '<li>Toca el botón <b>Compartir</b> <span class="ios-share" aria-hidden="true"></span> de Safari. En iOS 26, si no lo ves, toca primero <b>···</b> abajo a la derecha.</li>'}
      <li>Elige <b>Añadir a pantalla de inicio</b> (si no aparece, desliza la lista o toca <b>Ver más</b>).</li>
      <li>Deja activado <b>Abrir como app web</b> y toca <b>Añadir</b>.</li>
      <li>Abre <b>Bridoku</b> desde el nuevo icono.</li>
    </ol>
    <p class="hint">Ojo: el iPhone guarda por separado el progreso de la app y el de Safari, así que los casos empezados aquí no aparecerán en la app.</p>
    <button class="btn" data-act="close-sheet">Entendido</button>`);
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
    if (!makeFn) return;
    const puz = await withLoading(makeFn);
    g = newGameFrom(puz, kind, dailyKey);
    // caso ya resuelto cuya partida se borró: se muestra resuelto
    const rec = stats.solved[id];
    if (rec) {
      g.status = 'solved'; g.time = rec.time || 0; g.hints = rec.hints || 0; g.checks = rec.checks || 0; g.wrong = rec.wrong || 0;
      puz.solution.forEach((x, p) => { g.sol[x] = p; });
    }
  }
  G = g; U.sel = -1; U.tool = 'sol'; U.pen = false; U.hl = null; G.labels = null;
  renderPlayShell();
  show('play');
  if (!H.stack.includes('play')) hPush('play');
  saveGame();
  if (G.status === 'solved') openVictory(true);
  else if (!settings.seenHowto) { settings.seenHowto = true; saveSettings(); setTimeout(openHowto, 350); }
}
function openDaily(key, diff) {
  if (!isPlayableDay(key) || !DIFFICULTIES[diff]) return toast('Ese caso aún no está disponible');
  // si venimos de una hoja (archivo, resultado…), se cierra sin tocar el historial:
  // su entrada pasa a ser la de la partida
  if (sheetOpen()) {
    $('#sheet-bg').classList.remove('on'); $('#sheet').classList.remove('on');
    if (H.stack[H.stack.length - 1] === 'sheet') {
      H.stack.pop();
      if (!H.stack.includes('play')) H.stack.push('play');
      else { H.ignore++; try { history.back(); } catch (e) { H.ignore--; } }
    }
  }
  autoFullscreen();
  return openGame(dailyId(key, diff), () => generate(diff, 'D' + key), 'daily', key);
}

function goHome(fromPop) {
  saveGame();
  $('#sheet-bg').classList.remove('on'); $('#sheet').classList.remove('on');
  if (!fromPop) {
    const n = H.stack.length;
    if (n) { H.stack = []; H.ignore++; try { history.go(-n); } catch (e) { H.ignore--; } }
  }
  renderHome();
  show('home');
}

// --------------------------------------------------------- Partida: pintado
function renderPlayShell() {
  const puz = G.puz, v = puz.victim;
  const vc = CONTENT.charMap[puz.persons[v]];
  const num = G.dailyKey ? `Caso #${caseNumber(G.dailyKey)}` : 'Caso libre';
  const sub = G.dailyKey ? `${dLabel(puz.diff)} · ${fmtDayShort(G.dailyKey)}` : dLabel(puz.diff);
  $('#screen-play').innerHTML = `
  <div class="play">
    <div class="topbar">
      <button class="icon-btn" data-act="home" aria-label="Menú">‹</button>
      <div class="ttl">${num}<small>${esc(sub)}</small></div>
      <div class="timer" id="timer"></div>
      <button class="icon-btn" data-act="hint" aria-label="Pista">${uiImg('pista')}</button>
      <button class="icon-btn" data-act="check" aria-label="Revisar">${uiImg('comprobar')}</button>
      <button class="icon-btn" data-act="howto" aria-label="Ayuda">?</button>
    </div>
    <div class="casestrip">
      <div class="vic">${avatar(puz.persons[v], { dead: true })}<span>Finca ${esc(puz.venue)}: <b>${esc(vc.name)}</b>, ${esc(vc.role.toLowerCase())}, ha aparecido sin vida. ¿Quién estuvo a solas con ${vc.g === 'f' ? 'ella' : 'él'}?</span></div>
    </div>
    <div class="boardwrap"><div class="board" id="board"></div></div>
    <div class="modebar" id="modebar"></div>
    <div class="tray" id="tray"></div>
    <div class="cluehead"><b>Pistas</b><span id="clue-count"></span></div>
    <ul class="clues" id="clues"></ul>
    <div class="bottombar" id="tools"></div>
  </div>`;
  drawAll();
  updateTimer();
}
function drawAll() { drawBoard(); drawTray(); drawTools(); drawClues(); }

function labelCells() {
  if (G.labels) return G.labels;
  const puz = G.puz, N = puz.N, out = new Array(puz.K).fill(-1);
  // primera casilla (de arriba a la izquierda) sin mueble de cada habitación
  for (let i = 0; i < N * N; i++) {
    const r = puz.roomOf[i];
    if (out[r] === -1 && puz.cellObj[i] < 0) out[r] = i;
  }
  for (let i = 0; i < N * N; i++) if (out[puz.roomOf[i]] === -1) out[puz.roomOf[i]] = i;
  return (G.labels = out);
}

// Conflictos: dos soluciones en la misma fila/columna, o el mismo personaje dos veces.
function conflictSet() {
  const N = G.puz.N, NN = N * N, bad = new Set();
  const cells = [];
  for (let x = 0; x < NN; x++) if (G.sol[x] >= 0) cells.push(x);
  for (let i = 0; i < cells.length; i++) {
    for (let j = i + 1; j < cells.length; j++) {
      const a = cells[i], b = cells[j];
      if (((a / N) | 0) === ((b / N) | 0) || a % N === b % N || G.sol[a] === G.sol[b]) { bad.add(a); bad.add(b); }
    }
  }
  return bad;
}
function occupiedLines() {
  const N = G.puz.N, rows = new Set(), cols = new Set();
  for (let x = 0; x < N * N; x++) if (G.sol[x] >= 0) { rows.add((x / N) | 0); cols.add(x % N); }
  return { rows, cols };
}

const pct = (v, N) => (v / N * 100).toFixed(4) + '%';
const CARPETS = [['#8e2f36', '#d6a54a'], ['#2f4d7a', '#d8c08a'], ['#3e6b45', '#e0c27a'], ['#6b3f7a', '#e2c690'], ['#9a5a2a', '#f0d9a0']];

function objectsHTML() {
  const puz = G.puz, N = puz.N;
  let html = '';
  puz.objs.forEach((o, idx) => {
    const it = CONTENT.itemMap[o.t];
    const rs = o.cells.map((x) => (x / N) | 0), cs = o.cells.map((x) => x % N);
    const r0 = Math.min(...rs), r1 = Math.max(...rs), c0 = Math.min(...cs), c1 = Math.max(...cs);
    const h = r1 - r0 + 1, w = c1 - c0 + 1;
    const box = `left:${pct(c0, N)};top:${pct(r0, N)};width:${pct(w, N)};height:${pct(h, N)};`;
    const sprite = has('items', o.t);
    const hl = U.hl && U.hl.items.includes(o.t) ? ' hl' : '';
    if (it.shape === 'area') {
      const kind = it.walk ? 'carpet' : 'table';
      let style = box + `--w:${w};--h:${h};`;
      if (sprite) style += `background-image:url(${spUrl('items', o.t)});`;
      else if (kind === 'carpet') { const [a, b] = CARPETS[idx % CARPETS.length]; style += `--ca:${a};--cb:${b};`; }
      html += `<div class="obj ${kind}${sprite ? ' sprite' : ''}${hl}" style="${style}">${!sprite && it.emoji ? `<span class="em">${it.emoji}</span>` : ''}</div>`;
      return;
    }
    const vert = h > w;
    let inner;
    if (sprite) {
      inner = vert
        ? `<img class="sp rot" src="${spUrl('items', o.t)}" alt="" style="width:${(h / w) * 100}%;height:${(w / h) * 100}%">`
        : `<img class="sp" src="${spUrl('items', o.t)}" alt="">`;
    } else {
      inner = it.emoji ? `<span class="em">${it.emoji}</span>` : `<span class="em sw ${o.t}-sw"></span>`;
    }
    const shape = it.shape === 'pair' ? ' pair' + (vert ? ' vert' : '') : ' one';
    html += `<div class="obj${shape}${it.walk ? ' walk' : ' block'}${sprite ? ' sprite' : ''}${hl} t-${o.t}" style="${box}">${inner}</div>`;
  });
  return html;
}

function openingsHTML() {
  const puz = G.puz, N = puz.N, NN = N * N;
  const hlW = U.hl && U.hl.win, hlD = U.hl && U.hl.door;
  let html = '';
  const seen = new Set();
  const seg = (x, bit, cls) => {
    const r = (x / N) | 0, c = x % N;
    let key, style;
    const T = 10; // grosor en px
    if (bit === 1 || bit === 4) {
      const yy = bit === 1 ? r : r + 1;
      key = 'h' + yy + ',' + c;
      style = `left:calc(${pct(c + 0.2, N)});width:${pct(0.6, N)};top:calc(${pct(yy, N)} - ${yy === 0 ? 0 : yy === N ? T : T / 2}px);height:${T}px;`;
    } else {
      const xx = bit === 8 ? c : c + 1;
      key = 'v' + r + ',' + xx;
      style = `top:calc(${pct(r + 0.2, N)});height:${pct(0.6, N)};left:calc(${pct(xx, N)} - ${xx === 0 ? 0 : xx === N ? T : T / 2}px);width:${T}px;`;
    }
    if (seen.has(cls + key)) return;
    seen.add(cls + key);
    const hl = (cls === 'win' && hlW) || (cls === 'door' && hlD) ? ' hl' : '';
    html += `<div class="opening ${cls}${bit === 1 || bit === 4 ? ' h' : ' v'}${hl}" style="${style}"></div>`;
  };
  for (let x = 0; x < NN; x++) {
    for (const bit of [1, 2, 4, 8]) {
      if (puz.winAt[x] & bit) seg(x, bit, 'win');
      if (puz.doorAt[x] & bit) seg(x, bit, 'door');
    }
  }
  return html;
}

function pencilHTML(mask) {
  if (!mask) return '';
  let s = '';
  G.puz.persons.forEach((cid, p) => {
    if (!(mask & (1 << p))) return;
    const c = CONTENT.charMap[cid];
    s += `<i style="--c:${c.color};--fg:${textOn(c.color)};grid-row:${((p / 3) | 0) + 1};grid-column:${(p % 3) + 1}">${esc(c.mark)}</i>`;
  });
  return `<div class="pm">${s}</div>`;
}

function drawBoard() {
  const puz = G.puz, N = puz.N, NN = N * N;
  const board = $('#board');
  board.style.setProperty('--n', N);
  board.dataset.tool = U.tool === 'sol' && U.pen ? 'pen' : U.tool;
  const labels = labelCells();
  const bad = settings.conflicts ? conflictSet() : new Set();
  const lines = settings.rowcol ? occupiedLines() : { rows: new Set(), cols: new Set() };
  const hl = U.hl;
  const flash = G.flash;

  let html = '';
  for (let i = 0; i < NN; i++) {
    const r = (i / N) | 0, c = i % N, room = puz.roomOf[i];
    const type = CONTENT.roomTypeMap[puz.roomTypes[room]];
    const cls = ['cell'];
    if (r === 0 || puz.roomOf[i - N] !== room) cls.push('bt');
    if (r === N - 1 || puz.roomOf[i + N] !== room) cls.push('bb');
    if (c === 0 || puz.roomOf[i - 1] !== room) cls.push('bl');
    if (c === N - 1 || puz.roomOf[i + 1] !== room) cls.push('br');
    const p = G.sol[i];
    if (bad.has(i)) cls.push('conflict');
    if (flash && flash.cells.includes(i)) cls.push('badcell');
    if (hl && hl.rooms.includes(room)) cls.push('hl');
    if (hl && hl.cells && hl.cells.includes(i)) cls.push('hl');
    if (U.sel >= 0 && p === U.sel) cls.push('sel');
    let inner = '';
    if (!puz.walk[i]) inner += '<div class="blk"></div>';
    else if (G.emp[i] && p < 0) inner += '<div class="emp"></div>';
    else if (p < 0 && (lines.rows.has(r) || lines.cols.has(c))) inner += '<div class="dim"></div>';
    if (p >= 0) {
      const isV = p === puz.victim;
      inner += `<div class="tok${isV ? ' vic' : ''}">${avatar(puz.persons[p], { dead: isV })}${G.lock[i] ? `<span class="pin">${uiImg('pista')}</span>` : ''}</div>`;
    } else if (G.pen[i]) {
      inner += pencilHTML(G.pen[i]);
    }
    inner += '<div class="ring"></div>';
    const fl = has('floors', type.id) ? `background-image:url(${spUrl('floors', type.id)});` : '';
    html += `<div class="${cls.join(' ')}" data-act="cell" data-i="${i}" style="--fl:${type.color};${fl}">${inner}</div>`;
  }
  let lab = '';
  labels.forEach((cellIdx, room) => {
    const t = CONTENT.roomTypeMap[puz.roomTypes[room]];
    const lc = cellIdx % N, lr = (cellIdx / N) | 0;
    const hpos = lc >= N - 1 ? `right:calc(${pct(N - 1 - lc, N)} + 4px)` : `left:calc(${pct(lc, N)} + 4px)`;
    lab += `<span class="rl" style="${hpos};top:calc(${pct(lr, N)} + 4px)">${esc(t.label)}</span>`;
  });
  board.innerHTML = html + `<div class="layer">${objectsHTML()}</div><div class="layer top">${openingsHTML()}${lab}</div>`;
}

function personCount(p) { return G.sol.filter((q) => q === p).length; }

function drawTray() {
  const puz = G.puz;
  const hlP = U.hl ? U.hl.persons : [];
  const active = U.tool === 'sol';
  $('#tray').innerHTML = puz.persons.map((cid, p) => {
    const c = CONTENT.charMap[cid];
    const cls = ['chip'];
    if (U.sel === p && active) cls.push('sel');
    const n = personCount(p);
    if (n === 1) cls.push('placed');
    if (n > 1) cls.push('dup');
    if (p === puz.victim) cls.push('vic');
    if (hlP.includes(p)) cls.push('pulse');
    return `<button class="${cls.join(' ')}" data-act="pick" data-p="${p}">${avatar(cid)}<span>${esc(c.name)}</span></button>`;
  }).join('');
  drawModebar();
}

function drawModebar() {
  const mb = $('#modebar');
  if (!mb) return;
  let txt;
  if (U.tool === 'erase') txt = '<b class="m-erase">Borrar</b> toca casillas para vaciarlas por completo';
  else if (U.tool === 'empty') txt = '<b class="m-empty">Vacía</b> toca casillas donde no puede haber nadie';
  else if (U.sel < 0) txt = 'Elige un personaje y toca una casilla';
  else if (U.pen) txt = `<b class="m-pen">Lápiz</b> posibles casillas de <b>${esc(pname(U.sel))}</b>`;
  else txt = `<b class="m-sol">Colocar</b> <b>${esc(pname(U.sel))}</b> · toca su casilla`;
  mb.innerHTML = txt;
}

function drawTools() {
  const full = G.sol.filter((p) => p >= 0).length === G.puz.N && new Set(G.sol.filter((p) => p >= 0)).size === G.puz.N;
  $('#tools').innerHTML = `
    <button class="tbtn${U.tool === 'sol' && U.pen ? ' on' : ''}" data-act="tool" data-t="pen"><i>${uiImg('lapiz')}</i>Lápiz</button>
    <button class="tbtn${U.tool === 'empty' ? ' on' : ''}" data-act="tool" data-t="empty"><i>${uiImg('vacio')}</i>Vacía</button>
    <button class="tbtn${U.tool === 'erase' ? ' on' : ''}" data-act="tool" data-t="erase"><i>${uiImg('goma')}</i>Borrar</button>
    <button class="tbtn" data-act="undo" ${G.undo.length ? '' : 'disabled'}><i>${uiImg('deshacer')}</i>Deshacer</button>
    <button class="tbtn primary${full && G.status === 'playing' ? ' glow' : ''}" data-act="accuse"><i>${uiImg('lupa')}</i>Acusar</button>`;
}

function drawClues() {
  const ul = $('#clues');
  const top = ul.scrollTop;
  const puz = G.puz;
  const vic = CONTENT.charMap[puz.persons[puz.victim]];
  const rule = `<li class="clue rule"><div class="ctext">${pchip(puz.victim)} estaba a solas con su asesino: en su habitación solo había otra persona.</div><span class="chk rule-ico">${uiImg('calavera')}</span></li>`;
  ul.innerHTML = rule + puz.clues.map((c, i) => {
    const toks = clueTokens(c, puz, CONTENT);
    return `<li class="clue${G.done[i] ? ' done' : ''}${U.activeClue === i ? ' active' : ''}" data-act="clue" data-i="${i}">
      <div class="ctext">${tokensHTML(toks)}</div>
      <button class="chk" data-act="chk" data-i="${i}" aria-label="Marcar como usada">✓</button></li>`;
  }).join('');
  ul.scrollTop = top;
  const n = G.done.filter(Boolean).length;
  $('#clue-count').textContent = `${n}/${puz.clues.length} usadas`;
}
function updateTimer() {
  const t = $('#timer');
  if (t) t.textContent = settings.timer ? fmtTime(G.time) : '';
}

// --------------------------------------------------------------- Acciones
function snapshot() { return JSON.stringify({ sol: G.sol, pen: G.pen, emp: G.emp, lock: G.lock }); }
function pushUndo() {
  G.undo.push(snapshot());
  if (G.undo.length > 150) G.undo.shift();
}
function undo() {
  const s = G.undo.pop();
  if (!s) return;
  Object.assign(G, JSON.parse(s));
  G.flash = null;
  drawAll(); saveGame();
}
function pick(p) {
  if (U.tool === 'erase' || U.tool === 'empty') U.tool = 'sol';
  else if (U.sel === p) { U.sel = -1; drawTray(); drawBoard(); return; }
  U.sel = p;
  buzz(6);
  drawBoard(); drawTray(); drawTools();
}
function setTool(t) {
  if (t === 'pen') {
    if (U.tool !== 'sol') { U.tool = 'sol'; U.pen = true; } else U.pen = !U.pen;
  } else {
    U.tool = U.tool === t ? 'sol' : t;
  }
  buzz(6);
  drawBoard(); drawTray(); drawTools();
}

function tapCell(i) {
  if (G.status !== 'playing') return;
  const puz = G.puz;
  const cur = G.sol[i];
  const changed = () => { G.flash = null; drawBoard(); drawTray(); drawTools(); saveGame(); };

  if (U.tool === 'erase') {
    if (G.lock[i]) return toast('Esta casilla la reveló una pista');
    if (cur < 0 && !G.pen[i] && !G.emp[i]) return;
    pushUndo();
    G.sol[i] = -1; G.pen[i] = 0; G.emp[i] = 0;
    buzz(10);
    return changed();
  }
  if (!puz.walk[i]) return toast('Ahí hay un mueble: nadie puede ocupar esa casilla');
  if (U.tool === 'empty') {
    if (cur >= 0) return toast('Primero quita al personaje de esa casilla');
    pushUndo();
    G.emp[i] = G.emp[i] ? 0 : 1;
    buzz(8);
    return changed();
  }
  // modos con personaje: colocar o lápiz
  if (U.sel < 0) {
    if (cur >= 0) { U.sel = cur; drawBoard(); drawTray(); return; }
    return toast('Elige primero un personaje de la lista');
  }
  const p = U.sel;
  if (U.pen) {
    if (cur >= 0) return toast('Esa casilla ya tiene una solución');
    pushUndo();
    G.pen[i] ^= (1 << p);
    buzz(6);
    return changed();
  }
  if (G.lock[i]) return toast('Esta casilla la reveló una pista');
  pushUndo();
  if (cur === p) {
    G.sol[i] = -1;                       // quitar: reaparecen las marcas a lápiz
  } else {
    G.sol[i] = p;                        // colocar (el lápiz se conserva debajo)
    G.emp[i] = 0;
  }
  buzz(14);
  changed();
}

function toggleClueDone(i) { G.done[i] = G.done[i] ? 0 : 1; drawClues(); saveGame(); }
function flashClue(i) {
  const puz = G.puz, N = puz.N, NN = N * N;
  const c = puz.clues[i];
  const refs = clueRefs(c);
  U.activeClue = i;
  const cells = [];
  if (refs.win || refs.door) for (let x = 0; x < NN; x++) if ((refs.win && puz.winAt[x]) || (refs.door && puz.doorAt[x])) cells.push(x);
  if (c.t === 'LINE') for (let k = 0; k < N; k++) cells.push(c.side === 'N' ? k : c.side === 'S' ? (N - 1) * N + k : c.side === 'W' ? k * N : k * N + N - 1);
  U.hl = { rooms: refs.rooms, items: refs.items, persons: refs.victim ? refs.persons.concat([puz.victim]) : refs.persons, win: refs.win, door: refs.door, cells };
  drawBoard(); drawTray(); drawClues();
  clearTimeout(U.hlTimer);
  U.hlTimer = setTimeout(() => { U.hl = null; U.activeClue = -1; if (G) { drawBoard(); drawTray(); drawClues(); } }, 2400);
}

function doHint() {
  if (G.status !== 'playing') return;
  const puz = G.puz, N = puz.N, sol = puz.solution;
  const wrongP = [], freeP = [];
  for (let p = 0; p < N; p++) {
    if (G.lock[sol[p]]) continue;
    const right = G.sol[sol[p]] === p;
    const elsewhere = G.sol.some((q, x) => q === p && x !== sol[p]);
    if (elsewhere) wrongP.push(p);
    else if (!right) freeP.push(p);
  }
  const pool = wrongP.length ? wrongP : freeP;
  if (!pool.length) return toast('Ya está todo bien colocado. ¡Acusa al culpable!');
  const p = pool[Math.floor(Math.random() * pool.length)];
  pushUndo();
  for (let x = 0; x < G.sol.length; x++) if (G.sol[x] === p && !G.lock[x]) G.sol[x] = -1;
  G.sol[sol[p]] = p; G.emp[sol[p]] = 0; G.lock[sol[p]] = 1;
  G.hints++;
  U.sel = p; U.tool = 'sol'; U.pen = false;
  drawAll(); saveGame();
  toast(`${pname(p)} estaba aquí (pista revelada)`);
}
function doCheck() {
  if (G.status !== 'playing') return;
  const puz = G.puz, sol = puz.solution, NN = puz.N * puz.N;
  G.checks++;
  const bad = [];
  let wrongSol = 0, wrongEmp = 0, missingPen = 0;
  const trueAt = new Array(NN).fill(-1);
  sol.forEach((x, p) => { trueAt[x] = p; });
  for (let x = 0; x < NN; x++) {
    if (G.sol[x] >= 0 && trueAt[x] !== G.sol[x]) { bad.push(x); wrongSol++; }
    if (G.emp[x] && trueAt[x] >= 0) { bad.push(x); wrongEmp++; }
  }
  // lápiz: si un personaje tiene marcas pero ninguna en su casilla real
  for (let p = 0; p < puz.N; p++) {
    let any = false;
    for (let x = 0; x < NN; x++) if (G.pen[x] & (1 << p)) { any = true; break; }
    if (any && !(G.pen[sol[p]] & (1 << p)) && G.sol[sol[p]] !== p) missingPen++;
  }
  if (!bad.length && !missingPen) {
    toast(placedCount(G) || G.emp.some(Boolean) ? 'Todo lo que has marcado es correcto ✔︎' : 'Aún no hay nada que revisar');
  } else {
    G.flash = { cells: bad };
    buzz(30);
    const parts = [];
    if (wrongSol) parts.push(`${wrongSol} personaje${wrongSol > 1 ? 's' : ''} mal colocado${wrongSol > 1 ? 's' : ''}`);
    if (wrongEmp) parts.push(`${wrongEmp} casilla${wrongEmp > 1 ? 's' : ''} marcada${wrongEmp > 1 ? 's' : ''} como vacía sin estarlo`);
    if (missingPen) parts.push(`al lápiz de ${missingPen} personaje${missingPen > 1 ? 's' : ''} le falta su casilla real`);
    toast('⚠ ' + parts.join(' · '), 3200);
    setTimeout(() => { if (G) { G.flash = null; drawBoard(); } }, 3200);
  }
  drawBoard(); saveGame();
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
function sheetOpen() { return $('#sheet').classList.contains('on'); }
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

function accuseHTML() {
  const puz = G.puz;
  const vc = CONTENT.charMap[puz.persons[puz.victim]];
  const suspects = puz.persons.map((cid, p) => ({ cid, p })).filter((o) => o.p !== puz.victim);
  return `
    <p>El asesino es la única persona que estuvo a solas con <b>${esc(vc.name)}</b> en su habitación. ¿Quién fue?</p>
    <div class="picker">${suspects.map((o) => `<button class="pick${U.acc === o.p ? ' sel' : ''}" data-act="pick-suspect" data-p="${o.p}">${avatar(o.cid)}<span>${esc(CONTENT.charMap[o.cid].name)}</span></button>`).join('')}</div>
    <button class="btn danger" data-act="do-accuse" ${U.acc < 0 ? 'style="opacity:.5"' : ''}>Acusar</button>`;
}
function openAccuse() {
  if (G.status !== 'playing') return openVictory(true);
  U.acc = -1;
  openSheet('¿Quién fue?', accuseHTML());
}
function doAccuse() {
  if (U.acc < 0) return toast('Elige a un sospechoso');
  const puz = G.puz;
  if (U.acc === puz.murderer) {
    G.status = 'solved';
    G.sol = new Array(puz.N * puz.N).fill(-1);
    puz.solution.forEach((x, p) => { G.sol[x] = p; });
    G.emp = G.emp.map((e, x) => (G.sol[x] >= 0 ? 0 : e));
    stats.solved[G.id] = { diff: puz.diff, time: G.time, hints: G.hints, checks: G.checks, wrong: G.wrong, at: Date.now(), kind: G.kind };
    saveStats(); saveGame();
    U.sel = -1;
    drawAll();
    buzz([30, 60, 30]);
    openVictory(false);
  } else {
    G.wrong++;
    saveGame();
    buzz(60);
    toast(`❌ ${pname(U.acc)} no estuvo a solas con la víctima`, 2600);
    $('#sheet').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 260 });
  }
}
function storyText() {
  const puz = G.puz;
  return `${pname(puz.murderer)} estuvo a solas con ${pname(puz.victim)} en ${roomText(puz.crimeRoom, puz, CONTENT)}.`;
}
function openVictory(again) {
  const puz = G.puz;
  const key = G.dailyKey;
  const num = key ? `Caso #${caseNumber(key)} · ${fmtDayShort(key)}` : 'Caso libre';
  const nextDiff = key ? DIFF_KEYS.find((d) => d !== puz.diff && !stats.solved[dailyId(key, d)]) : null;
  openSheet(again ? 'Caso cerrado' : '¡Caso resuelto!', `
  <div class="reveal">
    <div class="cast">${avatar(puz.persons[puz.murderer])}</div>
    <div class="big">${esc(pname(puz.murderer))} es ${CONTENT.charMap[puz.persons[puz.murderer]].g === 'f' ? 'la asesina' : 'el asesino'}</div>
    <p>${esc(storyText())}</p>
    <div class="stats"><span class="tag brass">⏱ ${fmtTime(G.time)}</span><span class="tag">💡 ${G.hints} pista${G.hints === 1 ? '' : 's'}</span><span class="tag">✔︎ ${G.checks} revisión${G.checks === 1 ? '' : 'es'}</span>${G.wrong ? `<span class="tag">❌ ${G.wrong} fallo${G.wrong === 1 ? '' : 's'}</span>` : ''}</div>
    <div class="stack">
      <button class="btn" data-act="share">Compartir resultado</button>
      ${nextDiff ? `<button class="btn ghost" data-act="daily" data-key="${key}" data-diff="${nextDiff}">Siguiente: ${esc(DIFFICULTIES[nextDiff].label)} del ${esc(fmtDayShort(key))}</button>` : ''}
      <button class="btn ghost" data-act="archive" data-ym="${(key || todayKey()).slice(0, 7)}">📅 Archivo de casos</button>
      <button class="btn ghost" data-act="home">Volver al inicio</button>
    </div>
    <p class="hint" style="margin-top:12px">${esc(num)} · ${esc(dLabel(puz.diff))}${streak() ? ` · 🔥 racha de ${streak()}` : ''}</p>
  </div>`);
}
async function shareResult() {
  const puz = G.puz;
  const num = G.dailyKey ? `Caso #${caseNumber(G.dailyKey)} (${fmtDayShort(G.dailyKey)})` : 'Caso libre';
  const text = `${CONTENT.GAME.title} · ${num} · ${dLabel(puz.diff)}\n✅ Resuelto en ${fmtTime(G.time)} · 💡 ${G.hints} · ✔︎ ${G.checks}`;
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast('Resultado copiado'); }
  } catch (e) { /* cancelado */ }
}

function openHowto() {
  openSheet('Cómo se juega', `
    <p>En plena boda, <b>${esc(CONTENT.charMap[CONTENT.GAME.victim] ? CONTENT.charMap[CONTENT.GAME.victim].name : 'el novio')}</b> ha aparecido sin vida en algún rincón de la finca. Todos los personajes, <b>incluida la víctima</b>, están en el plano. Colócalos a todos y descubre quién estuvo a solas con él.</p>
    <h4>Las reglas</h4>
    <ul>
      <li>Hay exactamente <b>una persona por fila y una por columna</b>.</li>
      <li>Nadie puede estar en una casilla con un <b>obstáculo</b> (mesas, plantas, pianos, armarios…): aparecen oscurecidas. Sí se puede estar <b>sobre</b> sillas, sillones, sofás, camas, bancos o alfombras.</li>
      <li>Las pistas son siempre <b>verdaderas</b>.</li>
      <li>La víctima estaba <b>a solas con el asesino</b>: en su habitación solo había otra persona.</li>
    </ul>
    <h4>Cómo se marca</h4>
    <ul>
      <li><b>Colocar:</b> toca un personaje y luego su casilla. Tocar otra vez la misma casilla lo quita.</li>
      <li><b>${uiImg('lapiz')} Lápiz:</b> con un personaje elegido, anota dónde <i>podría</i> estar. Tocar de nuevo borra la marca. Las marcas se conservan debajo de una solución y reaparecen si la quitas.</li>
      <li><b>${uiImg('vacio')} Vacía:</b> oscurece casillas donde estás seguro de que no hay nadie.</li>
      <li><b>${uiImg('goma')} Borrar:</b> vacía por completo cada casilla que toques.</li>
      <li>Las filas y columnas de cada solución se oscurecen solas; si dos soluciones chocan o repites personaje, se marcan en <b style="color:#ff8b7d">rojo</b>.</li>
      <li>Toca una pista para ver en el plano a qué se refiere; con ✓ la tachas.</li>
    </ul>
    <h4>Para leer las pistas</h4>
    <ul>
      <li><b>Al lado de</b>: casilla contigua (arriba, abajo, izquierda o derecha) <u>dentro de la misma habitación</u>. Una pared de por medio no cuenta, y las diagonales tampoco.</li>
      <li>Las <b>puertas y ventanas</b> están en los muros: «junto a una ventana» es estar en una casilla que toca ese muro.</li>
      <li><b>Arriba, abajo, izquierda y derecha</b> se refieren al plano tal como lo ves.</li>
      <li>«Junto a la planta» habla de la única planta del plano. Si hay varias, la pista dice «junto a <b>una de las</b> plantas»: vale cualquiera de ellas (al tocar la pista se iluminan todas).</li>
      <li>«En la misma fila que el piano»: en esa fila está el piano, en cualquier habitación.</li>
    </ul>
    <button class="btn" data-act="close-sheet">¡A investigar!</button>`);
}

function openSettings() {
  const row = (k, t, sub) => `<div class="row"><div>${t}<small>${sub}</small></div><button class="switch${settings[k] ? ' on' : ''}" data-act="toggle" data-k="${k}" aria-label="${t}"></button></div>`;
  openSheet('Ajustes', `
    ${row('rowcol', 'Oscurecer filas y columnas ocupadas', 'Al colocar a alguien, su fila y columna se oscurecen.')}
    ${row('conflicts', 'Marcar conflictos', 'Borde rojo si dos soluciones comparten fila o columna, o si repites personaje.')}
    ${row('timer', 'Mostrar el cronómetro', 'El tiempo se sigue contando aunque lo ocultes.')}
    ${row('vibrate', 'Vibración', 'Respuesta háptica al tocar (si tu móvil lo permite).')}
    ${isIOS() && !canFullscreen() ? '' : row('autofs', 'Pantalla completa automática', 'En móviles, al empezar un caso.')}
    <div class="stack" style="margin-top:16px">
      <button class="btn ghost" data-act="sprites">Galería de sprites</button>
      <button class="btn ghost" data-act="howto">Cómo se juega</button>
      <button class="btn ghost" data-act="reset" style="color:#ff9c8f">Borrar todo el progreso</button>
    </div>`);
}

function openSprites() {
  const tile = (kind, id, fallback, label, note) => `<div class="gal ${has(kind, id) ? 'ok' : 'miss'}"><div class="box">${has(kind, id) ? `<img class="sp" src="${spUrl(kind, id)}" alt="">` : fallback}</div>${esc(label)}${note ? `<small>${esc(note)}</small>` : ''}</div>`;
  const sec = (title, list) => {
    const have = list.filter((x) => has(x.kind, x.id)).length;
    return `<h4>${title} <small style="color:var(--muted);font-weight:400">${have}/${list.length}</small></h4><div class="gallery">${list.map((x) => tile(x.kind, x.id, x.fb, x.label, x.note)).join('')}</div>`;
  };
  const shapeNote = (it) => (it.shape === 'pair' ? '2×1' : it.shape === 'area' ? 'baldosa' : '') + (it.walk ? ' · se pisa' : '');
  openSheet('Galería de sprites', `
    <p class="hint">Los que aparecen en gris aún usan un dibujo provisional. Deja el PNG con ese nombre en su carpeta y se usará solo.</p>
    ${sec('Personajes · sprites/characters/', CONTENT.CHARACTERS.map((c) => ({ kind: 'characters', id: c.id, fb: `<span class="badge" style="--c:${c.color};width:40px;height:40px;font-size:18px">${c.mark}</span>`, label: c.id + '.png' })))}
    ${sec('Muebles · sprites/items/', CONTENT.ITEMS.map((it) => ({ kind: 'items', id: it.id, fb: itemIcon(it.id), label: it.id + '.png', note: shapeNote(it) })))}
    ${sec('Suelos · sprites/floors/', CONTENT.ROOM_TYPES.map((r) => ({ kind: 'floors', id: r.id, fb: `<span class="em sw" style="background:${r.color}"></span>`, label: r.id + '.png' })))}`);
}

// ------------------------------------------------------------ Eventos
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-act]');
  if (!el) return;
  const act = el.dataset.act;
  switch (act) {
    case 'daily': return openDaily(el.dataset.key || todayKey(), el.dataset.diff || 'normal');
    case 'archive': return openArchive(el.dataset.ym);
    case 'arch-day': return openArchiveDay(el.dataset.key);
    case 'home': return goHome(false);
    case 'howto': return openHowto();
    case 'settings': return openSettings();
    case 'sprites': return openSprites();
    case 'fullscreen': return toggleFullscreen(false);
    case 'ios-install': return openIosInstall();
    case 'close-sheet': return closeSheet();
    case 'toggle': {
      const k = el.dataset.k; settings[k] = !settings[k]; saveSettings();
      el.classList.toggle('on', settings[k]);
      if (G && $('#board')) { drawBoard(); updateTimer(); }
      return;
    }
    case 'reset':
      if (confirm('¿Borrar todos los casos y estadísticas de este dispositivo?')) {
        Object.keys(localStorage).filter((k) => k.startsWith('mdk.save.') || k === 'mdk.stats' || k === 'mdk.saves' || k === 'mdk.current').forEach((k) => localStorage.removeItem(k));
        stats = { solved: {}, daily: {} }; G = null; closeSheet(); renderHome(); show('home');
      }
      return;
    case 'pick': e.stopPropagation(); return G && pick(+el.dataset.p);
    case 'tool': return G && setTool(el.dataset.t);
    case 'cell': return G && tapCell(+el.dataset.i);
    case 'clue': return G && flashClue(+el.dataset.i);
    case 'chk': e.stopPropagation(); return G && toggleClueDone(+el.dataset.i);
    case 'undo': return G && undo();
    case 'hint': return G && doHint();
    case 'check': return G && doCheck();
    case 'accuse': return G && openAccuse();
    case 'pick-suspect': U.acc = +el.dataset.p; $('#sheet-body').innerHTML = accuseHTML(); return;
    case 'do-accuse': return doAccuse();
    case 'share': return shareResult();
    default: return undefined;
  }
});
$('#sheet-bg').addEventListener('click', () => closeSheet());

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
  // en iPhone (Safari), explicar una vez cómo jugar a pantalla completa
  if (isIOS() && !isStandalone() && !canFullscreen() && !settings.seenIosTip) {
    settings.seenIosTip = true; saveSettings();
    setTimeout(openIosInstall, 700);
  }
  // para pruebas y depuración
  window.__mdk = { get G() { return G; }, U, H, settings, openDaily, openArchive, tapCell, pick, setTool, stats: () => stats };
})();
