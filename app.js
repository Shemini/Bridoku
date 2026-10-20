// ============================================================================
//  MURDOKU · interfaz y flujo de juego
// ============================================================================
import { CONTENT } from './content.js';
import { DIFFICULTIES } from './engine.js';
import { clueTokens, clueRefs, roomText, itemText, openingText, roomLabel } from './texts.js';
import { tr, getLang, setLang, nextLang, LANGS } from './i18n.js';

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
  return `<span class="badge" style="--c:${c.color};--fg:${textOn(c.color)}">${esc(c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '')[0].toUpperCase())}</span>`;
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
const cap1 = (t) => t[0].toUpperCase() + t.slice(1);
function fmtDay(k) { const d = parseKey(k); return tr('dayLong', { wd: tr('wdays')[d.getDay()], d: d.getDate(), m: tr('months')[d.getMonth()] }); }
function fmtDayShort(k) { const d = parseKey(k); return tr('dayShort', { d: d.getDate(), m: tr('months')[d.getMonth()] }); }
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
  if (st.state === 'solved') return tr('stSolved', { t: fmtTime(st.time) });
  if (st.state === 'playing') return tr('stPlaying', { t: fmtTime(st.time) });
  return tr('stNew');
}
function dayButtons(key) {
  return `<div class="diffgrid">${DIFF_KEYS.map((d) => {
    const D = DIFFICULTIES[d], st = dayStatus(key, d);
    return `<button class="diff ${st.state}" data-act="daily" data-key="${key}" data-diff="${d}">
      <b>${dName(d)}</b><span>${tr('plan', { n: D.N, s: D.N - 1 })}</span><i>${statusText(st)}</i></button>`;
  }).join('')}</div>`;
}
const dName = (d) => tr('diff.' + d);
const dLabel = (d) => dName(d) + ' · ' + DIFFICULTIES[d].N + '×' + DIFFICULTIES[d].N;
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

async function withLoading(fn) {
  const el = $('#loading'), tx = $('#loading-text');
  const msgs = tr('loading');
  let i = 0;
  const show = setTimeout(() => { el.classList.add('on'); tx.textContent = msgs[0]; }, 250);
  const cyc = setInterval(() => { i = (i + 1) % msgs.length; tx.textContent = msgs[i]; }, 1800);
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
  if (!s.puz.persons.every((id) => CONTENT.charMap[id])) return null;   // personajes que ya no existen
  s.undo = []; s.flash = null;
  return s;
}
function saveStats() { LS.set('mdk.stats', stats); }
function saveSettings() { LS.set('mdk.settings', settings); }

// ------------------------------------------------------------- Pantallas
function show(name) {
  $('#screen-home').classList.toggle('on', name === 'home');
  $('#screen-play').classList.toggle('on', name === 'play');
  if (name === 'home') startWalker(); else stopWalker();
}
const placedCount = (g) => g.sol.filter((p) => p >= 0).length;

function renderHome() {
  const today = todayKey();
  const st = streak();
  const curId = LS.get('mdk.current', '');
  const curG = curId ? loadGame(curId) : null;
  const resumeG = curG && curG.status === 'playing' && curG.dailyKey && curG.dailyKey !== today && isPlayableDay(curG.dailyKey) ? curG : null;

  const cur = LANGS.find((l) => l.id === getLang());
  $('#screen-home').innerHTML = `
  <button class="lang-btn" data-act="lang" aria-label="${tr('language')}: ${cur.name}">🌐 ${cur.label}</button>
  <div class="home">
    <div class="hero">
      <div class="eyebrow">${tr('eyebrow')}</div>
      <h1>${esc(CONTENT.GAME.title)}</h1>
      <div class="rule"></div>
      <p>${esc(tr('subtitle'))}</p>
    </div>

    <div class="walker-stage" aria-hidden="true"><div id="walker-lane" class="walker-lane"></div></div>

    <div class="card daily">
      ${st > 0 ? `<div class="tagrow"><span class="tag ok">${tr('streak', { n: st })}</span></div>` : ''}
      <h3>${esc(cap1(fmtDay(today)))}</h3>
      ${dayButtons(today)}
    </div>

    ${resumeG ? `<div class="card"><div class="tagrow"><span class="tag">${tr('inProgress')}</span><span class="tag">${esc(fmtDayShort(resumeG.dailyKey))}</span><span class="tag">${esc(dLabel(resumeG.puz.diff))}</span></div>
      <div class="meta">${tr('resumeInfo', { t: fmtTime(resumeG.time) })}</div>
      <button class="btn ghost" data-act="daily" data-key="${resumeG.dailyKey}" data-diff="${resumeG.puz.diff}">${tr('continue')}</button></div>` : ''}

    <button class="btn ghost" data-act="archive">${tr('archiveBtn')}</button>

    <div class="linkrow">
      <button class="link" data-act="howto">${tr('howto')}</button>
      <button class="link" data-act="settings">${tr('settings')}</button>
      ${needsFsHint()}
    </div>
    <div class="fine">${tr('fine')}</div>
  </div>`;
  startWalker();
}
// Novia caminante de la portada: se crea tras cada render y se detiene al salir de la portada.
let walker = null;
function stopWalker() { if (walker) { walker.stop(); walker = null; } }
function startWalker() {
  stopWalker();
  const lane = $('#walker-lane');
  if (!lane || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  import('./novia-walker.js').then((m) => {
    if (!lane.isConnected || !$('#screen-home').classList.contains('on')) return;
    stopWalker(); walker = m.noviaWalker(lane, { scale: 1 });
  }).catch(() => {});
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
  openSheet(tr('archiveTitle'), `
    <div class="cal-nav">
      <button class="icon-btn" data-act="archive" data-ym="${prev}" ${prev < start.slice(0, 7) ? 'disabled' : ''} aria-label="${tr('prevMonth')}">‹</button>
      <b>${cap1(tr('months')[m - 1])} ${y}</b>
      <button class="icon-btn" data-act="archive" data-ym="${next}" ${next > today.slice(0, 7) ? 'disabled' : ''} aria-label="${tr('nextMonth')}">›</button>
    </div>
    <div class="cal-head">${tr('weekHead').map((w) => `<span>${w}</span>`).join('')}</div>
    <div class="cal">${cells}</div>
    <p class="hint">${tr('archiveHint')}</p>`);
}
function openArchiveDay(key) {
  if (!isPlayableDay(key)) return;
  openSheet(tr('caseN', { n: caseNumber(key) }), `
    <p><b>${esc(cap1(fmtDay(key)))}</b></p>
    ${dayButtons(key)}
    <div class="stack" style="margin-top:14px"><button class="btn ghost" data-act="archive" data-ym="${key.slice(0, 7)}">${tr('backCalendar')}</button></div>`);
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
  // Mismo enlace corto en todos los móviles; en iPhone abre las instrucciones para instalarla.
  if (canFullscreen()) return `<button class="link" data-act="fullscreen">${tr('fsBtn')}</button>`;
  if (isIOS() && !isStandalone()) return `<button class="link" data-act="ios-install">${tr('fsBtn')}</button>`;
  return '';
}
function openIosInstall() {
  const chrome = /CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
  openSheet(tr('iosTitle'), tr('iosBody', { chrome }) + `
    <button class="btn" data-act="close-sheet">${tr('gotIt')}</button>`);
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
  } catch (e) { if (silent !== true) toast(tr('fsFail')); }
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
  if (!isPlayableDay(key) || !DIFFICULTIES[diff]) return toast(tr('notAvailable'));
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
  const num = G.dailyKey ? tr('caseN', { n: caseNumber(G.dailyKey) }) : tr('freeCase');
  const sub = G.dailyKey ? `${dLabel(puz.diff)} · ${fmtDayShort(G.dailyKey)}` : dLabel(puz.diff);
  $('#screen-play').innerHTML = `
  <div class="play">
    <div class="topbar">
      <button class="icon-btn" data-act="home" aria-label="${tr('menu')}">‹</button>
      <div class="ttl">${num}<small>${esc(sub)}</small></div>
      <div class="timer" id="timer"></div>
      <button class="icon-btn" data-act="hint" aria-label="${tr('hint')}">${uiImg('pista')}</button>
      <button class="icon-btn" data-act="check" aria-label="${tr('check')}">${uiImg('comprobar')}</button>
      <button class="icon-btn" data-act="howto" aria-label="${tr('help')}">?</button>
    </div>
    <div class="casestrip">
      <div class="vic">${avatar(puz.persons[v], { dead: true })}<span>${tr('intro', { venue: esc(puz.venue), name: esc(vc.name), role: esc(getLang() === 'en' && vc.role_en ? vc.role_en : (vc.role || '').toLowerCase()), him: tr(vc.g === 'f' ? 'her' : 'him') })}</span></div>
    </div>
    <div class="boardwrap"><div class="board" id="board"></div></div>
    <div class="modebar" id="modebar"></div>
    <div class="tray" id="tray"></div>
    <div class="cluehead"><b>${tr('clues')}</b><span id="clue-count"></span></div>
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
      html += `<div class="obj ${kind} t-${o.t}${sprite ? ' sprite' : ''}${hl}" style="${style}">${!sprite && it.emoji ? `<span class="em">${it.emoji}</span>` : ''}</div>`;
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
    lab += `<span class="rl" style="${hpos};top:calc(${pct(lr, N)} + 4px)">${esc(roomLabel(t))}</span>`;
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
  if (U.tool === 'erase') txt = tr('modeErase');
  else if (U.tool === 'empty') txt = tr('modeEmpty');
  else if (U.sel < 0) txt = tr('modeNone');
  else if (U.pen) txt = tr('modePen', { n: esc(pname(U.sel)) });
  else txt = tr('modeSol', { n: esc(pname(U.sel)) });
  mb.innerHTML = txt;
}

function drawTools() {
  const full = G.sol.filter((p) => p >= 0).length === G.puz.N && new Set(G.sol.filter((p) => p >= 0)).size === G.puz.N;
  $('#tools').innerHTML = `
    <button class="tbtn${U.tool === 'sol' && U.pen ? ' on' : ''}" data-act="tool" data-t="pen"><i>${uiImg('lapiz')}</i>${tr('tPen')}</button>
    <button class="tbtn${U.tool === 'empty' ? ' on' : ''}" data-act="tool" data-t="empty"><i>${uiImg('vacio')}</i>${tr('tEmpty')}</button>
    <button class="tbtn${U.tool === 'erase' ? ' on' : ''}" data-act="tool" data-t="erase"><i>${uiImg('goma')}</i>${tr('tErase')}</button>
    <button class="tbtn" data-act="undo" ${G.undo.length ? '' : 'disabled'}><i>${uiImg('deshacer')}</i>${tr('tUndo')}</button>
    <button class="tbtn primary${full && G.status === 'playing' ? ' glow' : ''}" data-act="accuse"><i>${uiImg('lupa')}</i>${tr('tAccuse')}</button>`;
}

function drawClues() {
  const ul = $('#clues');
  const top = ul.scrollTop;
  const puz = G.puz;
  const vic = CONTENT.charMap[puz.persons[puz.victim]];
  const rule = `<li class="clue rule"><div class="ctext">${tr('victimRule', { v: pchip(puz.victim) })}</div><span class="chk rule-ico">${uiImg('calavera')}</span></li>`;
  ul.innerHTML = rule + puz.clues.map((c, i) => {
    const toks = clueTokens(c, puz, CONTENT);
    return `<li class="clue${G.done[i] ? ' done' : ''}${U.activeClue === i ? ' active' : ''}" data-act="clue" data-i="${i}">
      <div class="ctext">${tokensHTML(toks)}</div>
      <button class="chk" data-act="chk" data-i="${i}" aria-label="${tr('markUsed')}">✓</button></li>`;
  }).join('');
  ul.scrollTop = top;
  const n = G.done.filter(Boolean).length;
  $('#clue-count').textContent = tr('used', { n, m: puz.clues.length });
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
    if (G.lock[i]) return toast(tr('lockedCell'));
    if (cur < 0 && !G.pen[i] && !G.emp[i]) return;
    pushUndo();
    G.sol[i] = -1; G.pen[i] = 0; G.emp[i] = 0;
    buzz(10);
    return changed();
  }
  if (!puz.walk[i]) return toast(tr('blockedCell'));
  if (U.tool === 'empty') {
    if (cur >= 0) return toast(tr('removeFirst'));
    pushUndo();
    G.emp[i] = G.emp[i] ? 0 : 1;
    buzz(8);
    return changed();
  }
  // modos con personaje: colocar o lápiz
  if (U.sel < 0) {
    if (cur >= 0) { U.sel = cur; drawBoard(); drawTray(); return; }
    return toast(tr('pickFirst'));
  }
  const p = U.sel;
  if (U.pen) {
    if (cur >= 0) return toast(tr('hasSolution'));
    pushUndo();
    G.pen[i] ^= (1 << p);
    buzz(6);
    return changed();
  }
  if (G.lock[i]) return toast(tr('lockedCell'));
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
  if (!pool.length) return toast(tr('allGood'));
  const p = pool[Math.floor(Math.random() * pool.length)];
  pushUndo();
  for (let x = 0; x < G.sol.length; x++) if (G.sol[x] === p && !G.lock[x]) G.sol[x] = -1;
  G.sol[sol[p]] = p; G.emp[sol[p]] = 0; G.lock[sol[p]] = 1;
  G.hints++;
  U.sel = p; U.tool = 'sol'; U.pen = false;
  drawAll(); saveGame();
  toast(tr('hintShown', { n: pname(p) }));
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
    toast(placedCount(G) || G.emp.some(Boolean) ? tr('checkOk') : tr('checkNothing'));
  } else {
    G.flash = { cells: bad };
    buzz(30);
    const parts = [];
    if (wrongSol) parts.push(tr('badSol', { n: wrongSol }));
    if (wrongEmp) parts.push(tr('badEmp', { n: wrongEmp }));
    if (missingPen) parts.push(tr('badPen', { n: missingPen }));
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
    <p>${tr('accuseText', { v: esc(vc.name) })}</p>
    <div class="picker">${suspects.map((o) => `<button class="pick${U.acc === o.p ? ' sel' : ''}" data-act="pick-suspect" data-p="${o.p}">${avatar(o.cid)}<span>${esc(CONTENT.charMap[o.cid].name)}</span></button>`).join('')}</div>
    <button class="btn danger" data-act="do-accuse" ${U.acc < 0 ? 'style="opacity:.5"' : ''}>${tr('tAccuse')}</button>`;
}
function openAccuse() {
  if (G.status !== 'playing') return openVictory(true);
  U.acc = -1;
  openSheet(tr('accuseTitle'), accuseHTML());
}
function doAccuse() {
  if (U.acc < 0) return toast(tr('pickSuspect'));
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
    toast(tr('wrongAccuse', { n: pname(U.acc) }), 2600);
    $('#sheet').animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 260 });
  }
}
function storyText() {
  const puz = G.puz;
  return tr('story', { m: pname(puz.murderer), v: pname(puz.victim), room: roomText(puz.crimeRoom, puz, CONTENT) });
}
function openVictory(again) {
  const puz = G.puz;
  const key = G.dailyKey;
  const num = key ? `${tr('caseN', { n: caseNumber(key) })} · ${fmtDayShort(key)}` : tr('freeCase');
  const nextDiff = key ? DIFF_KEYS.find((d) => d !== puz.diff && !stats.solved[dailyId(key, d)]) : null;
  openSheet(again ? tr('closedTitle') : tr('solvedTitle'), `
  <div class="reveal">
    <div class="cast">${avatar(puz.persons[puz.murderer])}</div>
    <div class="big">${esc(tr('isMurderer', { n: pname(puz.murderer), f: CONTENT.charMap[puz.persons[puz.murderer]].g === 'f' }))}</div>
    <p>${esc(storyText())}</p>
    <div class="stats"><span class="tag brass">⏱ ${fmtTime(G.time)}</span><span class="tag">${tr('statHints', { n: G.hints })}</span><span class="tag">${tr('statChecks', { n: G.checks })}</span>${G.wrong ? `<span class="tag">${tr('statWrong', { n: G.wrong })}</span>` : ''}</div>
    <div class="stack">
      <button class="btn" data-act="share">${tr('share')}</button>
      ${nextDiff ? `<button class="btn ghost" data-act="daily" data-key="${key}" data-diff="${nextDiff}">${esc(tr('nextCase', { d: dName(nextDiff), day: fmtDayShort(key) }))}</button>` : ''}
      <button class="btn ghost" data-act="archive" data-ym="${(key || todayKey()).slice(0, 7)}">${tr('archiveShort')}</button>
      <button class="btn ghost" data-act="home">${tr('backHome')}</button>
    </div>
    <p class="hint" style="margin-top:12px">${esc(num)} · ${esc(dLabel(puz.diff))}${streak() ? ` · ${tr('streakOf', { n: streak() })}` : ''}</p>
  </div>`);
}
async function shareResult() {
  const puz = G.puz;
  const num = G.dailyKey ? `${tr('caseN', { n: caseNumber(G.dailyKey) })} (${fmtDayShort(G.dailyKey)})` : tr('freeCase');
  const text = tr('shareText', { title: CONTENT.GAME.title, num, diff: dLabel(puz.diff), t: fmtTime(G.time), h: G.hints, c: G.checks });
  try {
    if (navigator.share) await navigator.share({ text });
    else { await navigator.clipboard.writeText(text); toast(tr('copied')); }
  } catch (e) { /* cancelado */ }
}

function openHowto() {
  const v = CONTENT.charMap[CONTENT.GAME.victim] ? CONTENT.charMap[CONTENT.GAME.victim].name : '';
  openSheet(tr('howto'), tr('howtoBody', { v: esc(v), ic: { lapiz: uiImg('lapiz'), vacio: uiImg('vacio'), goma: uiImg('goma') } }) + `
    <button class="btn" data-act="close-sheet">${tr('letsGo')}</button>`);
}

function openSettings() {
  const row = (k, t, sub) => `<div class="row"><div>${t}<small>${sub}</small></div><button class="switch${settings[k] ? ' on' : ''}" data-act="toggle" data-k="${k}" aria-label="${t}"></button></div>`;
  openSheet(tr('settings'), `
    ${row('rowcol', tr('sRowcol'), tr('sRowcolSub'))}
    ${row('conflicts', tr('sConf'), tr('sConfSub'))}
    ${row('timer', tr('sTimer'), tr('sTimerSub'))}
    ${row('vibrate', tr('sVib'), tr('sVibSub'))}
    ${isIOS() && !canFullscreen() ? '' : row('autofs', tr('sFs'), tr('sFsSub'))}
    <div class="stack" style="margin-top:16px">
      <button class="btn ghost" data-act="lang">🌐 ${tr('language')}: ${LANGS.find((l) => l.id === getLang()).name}</button>
      <button class="btn ghost" data-act="howto">${tr('howto')}</button>
      <button class="btn ghost" data-act="reset" style="color:#ff9c8f">${tr('reset')}</button>
    </div>`);
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
    case 'fullscreen': return toggleFullscreen(false);
    case 'ios-install': return openIosInstall();
    case 'close-sheet': return closeSheet();
    case 'lang': {
      setLang(nextLang());
      const inSettings = sheetOpen();
      renderHome();
      if (G && $('#screen-play').classList.contains('on')) renderPlayShell();
      if (inSettings) openSettings();
      return;
    }
    case 'toggle': {
      const k = el.dataset.k; settings[k] = !settings[k]; saveSettings();
      el.classList.toggle('on', settings[k]);
      if (G && $('#board')) { drawBoard(); updateTimer(); }
      return;
    }
    case 'reset':
      if (confirm(tr('resetConfirm'))) {
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
  document.documentElement.lang = getLang();
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
