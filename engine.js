// ============================================================================
//  MOTOR DEL MURDOKU
//  - Genera una mansión (habitaciones, muebles, puertas y ventanas) y una solución.
//  - Genera pistas verdaderas y elige un conjunto que da UNA ÚNICA solución.
//  - Todo es determinista a partir de una semilla (el "caso del día" es igual
//    en todos los dispositivos).
//  No depende del navegador: se usa igual en un Worker o en Node (tests).
//
//  Reglas del puzzle (como en los libros de Murdoku):
//   1. Cuadrícula N×N con N personas (la víctima incluida): una por fila y una por columna.
//   2. Nadie puede estar en una casilla con un obstáculo (mesa, planta, piano...).
//      Sí se puede estar sobre sillas, sofás, camas, alfombras, bancos...
//   3. Las pistas son siempre verdaderas.
//   4. La víctima estaba a solas con el asesino: en su habitación solo había otra persona.
//  "Al lado de" = casilla contigua (arriba, abajo, izquierda o derecha) de la misma habitación.
//  Puertas y ventanas están en los muros: se está "junto a una ventana" si la casilla toca ese muro.
// ============================================================================

// ---------------------------------------------------------------- Aleatorio
export function hashStr(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function makeRng(seed) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (n) => Math.floor(next() * n),
    range: (lo, hi) => lo + Math.floor(next() * (hi - lo + 1)),
    chance: (p) => next() < p,
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    shuffle: (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const t = a2[i]; a2[i] = a2[j]; a2[j] = t;
      }
      return a2;
    },
  };
}

function weightedPick(rng, items, wf) {
  let total = 0;
  const ws = items.map((it) => { const w = wf(it); total += w; return w; });
  if (total <= 0) return null;
  let r = rng.next() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Direcciones de los muros de una casilla (bits): norte, este, sur, oeste.
export const DIRS = [
  { bit: 1, dr: -1, dc: 0, name: 'N' },
  { bit: 2, dr: 0, dc: 1, name: 'E' },
  { bit: 4, dr: 1, dc: 0, name: 'S' },
  { bit: 8, dr: 0, dc: -1, name: 'W' },
];
const OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };

// ------------------------------------------------------------- Dificultades
// Pesos base de cada tipo de pista (1 = normal). Cada dificultad los ajusta.
const BASE_W = {
  IN_ROOM: 1.8, NOT_IN_ROOM: 1.1, ON: 2.8, NOT_ON: 0.9, FLOOR: 0.7, NOT_FLOOR: 0.6,
  BESIDE: 2.8, NOT_BESIDE: 1, BESIDE_WIN: 2, NOT_BESIDE_WIN: 0.8, BESIDE_DOOR: 1.7, NOT_BESIDE_DOOR: 0.7,
  ROW_HAS: 1.1, COL_HAS: 1.1, NOT_ROW_HAS: 0.5, NOT_COL_HAS: 0.5, LINE: 1.2, ON_EDGE: 0.6, NOT_EDGE: 0.6,
  ALONE: 1.2, NOT_ALONE: 0.9,
  // pistas que relacionan a dos sospechosos: pocas (ver REL)
  SAME_ROOM: 0.5, DIFF_ROOM: 0.35, ALONE_WITH: 0.6, DIAG: 0.25, NOT_DIAG: 0.1,
  NORTH: 0.25, WEST: 0.25, ROW_OFF: 0.2, COL_OFF: 0.2,
  ROOM_COUNT: 1.4, ROOM_GT: 0.9, ROOM_EQ: 0.6, EMPTY_ROOMS: 0.9,
  NOBODY_ON: 1.1, ONLY_ON: 1.8, CRIME_HAS: 1.3, CRIME_NOT_HAS: 0.8, CRIME_WIN: 0.8, CRIME_NOWIN: 0.8,
};
// Familias: se penaliza repetir mucho la misma familia en un caso. Todas las pistas
// entre dos personas comparten familia ("rel"), así que cada una que sale hace menos
// probable la siguiente.
const REL = ['SAME_ROOM', 'DIFF_ROOM', 'ALONE_WITH', 'DIAG', 'NOT_DIAG', 'NORTH', 'WEST', 'ROW_OFF', 'COL_OFF'];
const FAMILY = { ROW_HAS: 'line', COL_HAS: 'line', NOT_ROW_HAS: 'line', NOT_COL_HAS: 'line', LINE: 'line' };
for (const t of REL) FAMILY[t] = 'rel';
const famOf = (t) => FAMILY[t] || t;
const NEG = new Set(['NOT_IN_ROOM', 'NOT_ON', 'NOT_FLOOR', 'NOT_BESIDE', 'NOT_BESIDE_WIN', 'NOT_BESIDE_DOOR', 'NOT_ROW_HAS',
  'NOT_COL_HAS', 'NOT_EDGE', 'NOT_ALONE', 'DIFF_ROOM', 'NOT_DIAG', 'ROOM_GT', 'ROOM_EQ', 'CRIME_NOT_HAS', 'NOBODY_ON']);
const DIRECT = new Set(['IN_ROOM', 'ON', 'LINE', 'ROW_OFF', 'COL_OFF', 'ONLY_ON']);
function weights(direct, neg) {
  const w = {};
  for (const k in BASE_W) w[k] = BASE_W[k] * (NEG.has(k) ? neg : 1) * (DIRECT.has(k) ? direct : 1);
  return w;
}

export const DIFFICULTIES = {
  facil:   { key: 'facil',   label: 'Fácil',   N: 5, K: 4, obst: 0.30, maxGuesses: 0,   minSupport: 2, attempts: 16, weights: weights(1.6, 0.5) },
  normal:  { key: 'normal',  label: 'Normal',  N: 6, K: 5, obst: 0.30, maxGuesses: 3,   minSupport: 3, attempts: 16, weights: weights(1.1, 0.9) },
  dificil: { key: 'dificil', label: 'Difícil', N: 7, K: 6, obst: 0.32, maxGuesses: 1e9, minGuesses: 1, minSupport: 4, attempts: 14, weights: weights(0.8, 1.3) },
  experto: { key: 'experto', label: 'Experto', N: 8, K: 7, obst: 0.32, maxGuesses: 1e9, minGuesses: 2, minSupport: 5, attempts: 12, weights: weights(0.6, 1.6) },
};

// ------------------------------------------------------------------ Plano
function genLayout(rng, N, K) {
  const NN = N * N;
  for (let attempt = 0; attempt < 300; attempt++) {
    const roomOf = new Array(NN).fill(-1);
    const cells = [];
    for (let i = 0; i < NN; i++) cells.push(i);
    const seeds = [rng.pick(cells)];
    while (seeds.length < K) {
      let best = -1, bd = -1;
      for (let t = 0; t < 14; t++) {
        const c = rng.pick(cells);
        if (seeds.includes(c)) continue;
        let d = 1e9;
        for (const s of seeds) d = Math.min(d, Math.abs(((c / N) | 0) - ((s / N) | 0)) + Math.abs((c % N) - (s % N)));
        if (d > bd) { bd = d; best = c; }
      }
      if (best >= 0) seeds.push(best);
    }
    seeds.forEach((c, i) => { roomOf[c] = i; });
    const size = new Array(K).fill(1);
    let remaining = NN - K;
    while (remaining > 0) {
      const cand = [];
      for (let x = 0; x < NN; x++) {
        if (roomOf[x] !== -1) continue;
        const r = (x / N) | 0, c = x % N;
        const seen = [];
        const nb = [];
        if (r > 0) nb.push(x - N);
        if (r < N - 1) nb.push(x + N);
        if (c > 0) nb.push(x - 1);
        if (c < N - 1) nb.push(x + 1);
        for (const n of nb) {
          const rm = roomOf[n];
          if (rm >= 0 && !seen.includes(rm)) { seen.push(rm); cand.push({ x, room: rm }); }
        }
      }
      const pick = weightedPick(rng, cand, (o) => 1 / (size[o.room] * size[o.room]));
      roomOf[pick.x] = pick.room;
      size[pick.room]++;
      remaining--;
    }
    const minSize = Math.min(...size);
    const maxSize = Math.max(...size);
    if (minSize >= 3 && maxSize <= Math.ceil(NN / K) * 2) return roomOf;
  }
  return null;
}

function neighbor(N, x, d) {
  const r = ((x / N) | 0) + d.dr, c = (x % N) + d.dc;
  if (r < 0 || r >= N || c < 0 || c >= N) return -1;
  return r * N + c;
}
// ¿hay muro en ese lado? (borde exterior o cambio de habitación)
function isWall(N, roomOf, x, d) {
  const y = neighbor(N, x, d);
  return y < 0 || roomOf[y] !== roomOf[x];
}

// --------------------------------------------------------------- Amueblar
function furnish(rng, content, D, N, roomOf, typeIds, K) {
  const NN = N * N;
  const cellObj = new Array(NN).fill(-1);
  const objs = [];
  const walk = new Array(NN).fill(1);
  const rowWalk = new Array(N).fill(N), colWalk = new Array(N).fill(N);
  const roomCells = Array.from({ length: K }, () => []);
  roomOf.forEach((r, x) => roomCells[r].push(x));
  const free = (x, r) => x >= 0 && roomOf[x] === r && cellObj[x] === -1;
  const wallCell = (x) => DIRS.some((d) => isWall(N, roomOf, x, d));

  for (let r = 0; r < K; r++) {
    const type = content.roomTypeMap[typeIds[r]];
    const cells = roomCells[r];
    const maxObst = Math.max(1, Math.floor(cells.length * D.obst + rng.next() * 0.8));
    let obstUsed = 0;
    let walkLeft = cells.length;

    const canPlace = (item, xs) => {
      if (item.walk) return true;
      if (obstUsed + xs.length > maxObst) return false;
      if (walkLeft - xs.length < 2) return false;
      const dr = {}, dc = {};
      for (const x of xs) { dr[(x / N) | 0] = (dr[(x / N) | 0] || 0) + 1; dc[x % N] = (dc[x % N] || 0) + 1; }
      for (const k in dr) if (rowWalk[k] - dr[k] < 2) return false;
      for (const k in dc) if (colWalk[k] - dc[k] < 2) return false;
      return true;
    };
    const commit = (item, xs) => {
      const id = objs.length;
      objs.push({ t: item.id, cells: xs.slice().sort((a, b) => a - b) });
      for (const x of xs) {
        cellObj[x] = id;
        if (!item.walk) { walk[x] = 0; rowWalk[(x / N) | 0]--; colWalk[x % N]--; }
      }
      if (!item.walk) { obstUsed += xs.length; walkLeft -= xs.length; }
    };
    const nextToTypes = (x, types) => DIRS.some((d) => {
      const y = neighbor(N, x, d);
      return y >= 0 && roomOf[y] === r && cellObj[y] >= 0 && types.includes(objs[cellObj[y]].t);
    });

    const placeOne = (item) => {
      const fr = cells.filter((x) => free(x, r));
      if (item.shape === 'one') {
        let cand = fr;
        if (item.around) cand = cand.filter((x) => nextToTypes(x, item.around));
        if (item.around && !cand.length) return false;
        if (item.wall) { const w = cand.filter(wallCell); if (w.length) cand = w; }
        cand = rng.shuffle(cand);
        for (const x of cand) if (canPlace(item, [x])) { commit(item, [x]); return true; }
        return false;
      }
      if (item.shape === 'pair') {
        let pairs = [];
        for (const x of fr) {
          for (const d of [DIRS[1], DIRS[2]]) {
            const y = neighbor(N, x, d);
            if (free(y, r)) pairs.push([x, y]);
          }
        }
        if (item.wall) {
          // las dos casillas pegadas al mismo muro (p. ej. una cama con el cabecero en la pared)
          const w = pairs.filter(([x, y]) => DIRS.some((d) => isWall(N, roomOf, x, d) && isWall(N, roomOf, y, d)));
          if (w.length) pairs = w;
        }
        pairs = rng.shuffle(pairs);
        for (const pr of pairs) if (canPlace(item, pr)) { commit(item, pr); return true; }
        return false;
      }
      // área rectangular
      const [s0, s1] = item.size;
      const rects = [];
      for (const x of fr) {
        const r0 = (x / N) | 0, c0 = x % N;
        for (let h = 1; h <= 3; h++) {
          for (let w = 1; w <= 3; w++) {
            const n = h * w;
            if (n < s0 || n > s1) continue;
            if (r0 + h > N || c0 + w > N) continue;
            const xs = [];
            let ok = true;
            for (let i = 0; i < h && ok; i++) for (let j = 0; j < w; j++) {
              const y = (r0 + i) * N + c0 + j;
              if (!free(y, r)) { ok = false; break; }
              xs.push(y);
            }
            if (ok) rects.push(xs);
          }
        }
      }
      if (!rects.length) return false;
      // mesas: deja sitio alrededor para las sillas · alfombras: preferir grandes
      const score = (xs) => {
        let ring = 0;
        const set = new Set(xs);
        for (const x of xs) for (const d of DIRS) { const y = neighbor(N, x, d); if (free(y, r) && !set.has(y)) ring++; }
        return item.walk ? xs.length * 2 + rng.next() * 3 : Math.min(ring, 6) + rng.next() * 3;
      };
      const sorted = rects.map((xs) => ({ xs, s: score(xs) })).sort((a, b) => b.s - a.s);
      for (const o of sorted.slice(0, 6)) if (canPlace(item, o.xs)) { commit(item, o.xs); return true; }
      return false;
    };

    for (const f of type.furnish) {
      if (f.p !== undefined && !rng.chance(f.p)) continue;
      const item = content.itemMap[f.t];
      const n = rng.range(f.n[0], f.n[1]);
      for (let i = 0; i < n; i++) if (!placeOne(item)) break;
    }
  }
  return { cellObj, objs, walk };
}

// --------------------------------------------------------- Puertas y ventanas
function placeOpenings(rng, N, roomOf, typeIds, K, cellObj, objs, content) {
  const NN = N * N;
  const winAt = new Array(NN).fill(0), doorAt = new Array(NN).fill(0);
  // puertas entre habitaciones vecinas
  const shared = {};
  for (let x = 0; x < NN; x++) {
    for (const d of [DIRS[1], DIRS[2]]) {
      const y = neighbor(N, x, d);
      if (y < 0 || roomOf[y] === roomOf[x]) continue;
      const a = Math.min(roomOf[x], roomOf[y]), b = Math.max(roomOf[x], roomOf[y]);
      (shared[a + ',' + b] = shared[a + ',' + b] || []).push([x, d, y]);
    }
  }
  const keys = rng.shuffle(Object.keys(shared));
  // árbol de conexión (todas las habitaciones accesibles) + alguna puerta extra
  const parent = [...Array(K).keys()];
  const find = (i) => (parent[i] === i ? i : (parent[i] = find(parent[i])));
  for (const k of keys) {
    const [a, b] = k.split(',').map(Number);
    const join = find(a) !== find(b);
    if (!join && !rng.chance(0.2)) continue;
    parent[find(a)] = find(b);
    const [x, d, y] = rng.pick(shared[k]);
    doorAt[x] |= d.bit;
    doorAt[y] |= OPP[d.bit];
  }
  // ventanas en los muros exteriores
  for (let r = 0; r < K; r++) {
    if (content.roomTypeMap[typeIds[r]].outdoor) continue;
    const outer = [];
    for (let x = 0; x < NN; x++) {
      if (roomOf[x] !== r) continue;
      for (const d of DIRS) if (neighbor(N, x, d) < 0) outer.push([x, d]);
    }
    if (!outer.length) continue;
    const n = rng.range(0, 2);
    for (const [x, d] of rng.shuffle(outer).slice(0, n)) winAt[x] |= d.bit;
  }
  // puerta principal en el exterior (en el vestíbulo si lo hay)
  let main = typeIds.indexOf('recepcion');
  if (main < 0) main = rng.int(K);
  const outerMain = [];
  for (let x = 0; x < NN; x++) {
    if (roomOf[x] !== main) continue;
    for (const d of DIRS) if (neighbor(N, x, d) < 0 && !(winAt[x] & d.bit)) outerMain.push([x, d]);
  }
  if (outerMain.length) { const [x, d] = rng.pick(outerMain); doorAt[x] |= d.bit; }
  return { winAt, doorAt };
}

// ------------------------------------------------------------------ Escena
// Permutación aleatoria fila→columna que solo usa casillas transitables.
function randomPlacement(rng, N, walk) {
  const cols = new Array(N).fill(-1), used = new Array(N).fill(false);
  const rows = rng.shuffle([...Array(N).keys()]);
  let steps = 0;
  const rec = (i) => {
    if (i === N) return true;
    if (++steps > 4000) return false;
    const r = rows[i];
    for (const c of rng.shuffle([...Array(N).keys()])) {
      if (used[c] || !walk[r * N + c]) continue;
      used[c] = true; cols[r] = c;
      if (rec(i + 1)) return true;
      used[c] = false;
    }
    return false;
  };
  return rec(0) ? cols : null;
}

function buildScene(rng, content, D) {
  const N = D.N, K = D.K, NN = N * N;
  const roomOf = genLayout(rng, N, K);
  if (!roomOf) return null;
  const typeIds = rng.shuffle(content.ROOM_TYPES.map((t) => t.id)).slice(0, K);
  const { cellObj, objs, walk } = furnish(rng, content, D, N, roomOf, typeIds, K);
  const { winAt, doorAt } = placeOpenings(rng, N, roomOf, typeIds, K, cellObj, objs, content);
  // personajes: la víctima fija (GAME.victim) y N-1 sospechosos con letras distintas
  const victimId = content.GAME.victim && content.charMap[content.GAME.victim] ? content.GAME.victim : null;
  const persons = [];
  const seenMark = new Set();
  if (victimId) { persons.push(victimId); seenMark.add(content.charMap[victimId].mark); }
  for (const c of rng.shuffle(content.CHARACTERS)) {
    if (persons.length >= N) break;
    if (c.id === victimId || seenMark.has(c.mark)) continue;
    seenMark.add(c.mark); persons.push(c.id);
  }
  if (persons.length < N) for (const c of content.CHARACTERS) if (persons.length < N && !persons.includes(c.id)) persons.push(c.id);
  // la víctima primero y los sospechosos en orden alfabético (así salen en la interfaz).
  // Comparación propia, sin localeCompare, para que el orden sea idéntico en todos los navegadores.
  const sortKey = (id) => content.charMap[id].name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rest = persons.slice(victimId ? 1 : 0).sort((x, y) => (sortKey(x) < sortKey(y) ? -1 : sortKey(x) > sortKey(y) ? 1 : 0));
  persons.splice(victimId ? 1 : 0, rest.length, ...rest);
  const victim = 0;

  for (let attempt = 0; attempt < 400; attempt++) {
    const cols = randomPlacement(rng, N, walk);
    if (!cols) return null;
    const cellsSol = [];
    for (let r = 0; r < N; r++) cellsSol.push(r * N + cols[r]);
    const counts = new Array(K).fill(0);
    for (const x of cellsSol) counts[roomOf[x]]++;
    const rooms2 = [];
    for (let r = 0; r < K; r++) if (counts[r] === 2) rooms2.push(r);
    if (!rooms2.length) continue;
    const crimeRoom = rng.pick(rooms2);
    const pair = rng.shuffle(cellsSol.filter((x) => roomOf[x] === crimeRoom));
    const rest = rng.shuffle(cellsSol.filter((x) => roomOf[x] !== crimeRoom));
    const murderer = 1 + rng.int(N - 1);
    const solution = new Array(N);
    solution[victim] = pair[0];
    solution[murderer] = pair[1];
    for (let p = 1; p < N; p++) if (p !== murderer) solution[p] = rest.pop();
    return { N, K, roomOf, typeIds, cellObj, objs, walk, winAt, doorAt, persons, solution, victim, murderer, crimeRoom };
  }
  return null;
}

// ------------------------------------------------------------------ Contexto
function makeCtx(scene, content) {
  const { N, K, roomOf, cellObj, objs, walk, winAt, doorAt, victim } = scene;
  const NN = N * N;
  const roomCells = Array.from({ length: K }, () => []);
  roomOf.forEach((r, x) => roomCells[r].push(x));
  const cellType = cellObj.map((o) => (o >= 0 ? objs[o].t : ''));
  const roomTypes = Array.from({ length: K }, () => new Set());
  for (let x = 0; x < NN; x++) if (cellType[x]) roomTypes[roomOf[x]].add(cellType[x]);
  const roomWin = new Array(K).fill(false);
  for (let x = 0; x < NN; x++) if (winAt[x]) roomWin[roomOf[x]] = true;
  // tipos de mueble "al lado" de cada casilla (misma habitación, otro objeto)
  const beside = Array.from({ length: NN }, () => new Set());
  for (let x = 0; x < NN; x++) {
    for (const d of DIRS) {
      const y = neighbor(N, x, d);
      if (y < 0 || roomOf[y] !== roomOf[x] || cellObj[y] < 0) continue;
      if (cellObj[y] === cellObj[x]) continue;
      beside[x].add(cellType[y]);
    }
  }
  const rowTypes = Array.from({ length: N }, () => new Set()), colTypes = Array.from({ length: N }, () => new Set());
  for (let x = 0; x < NN; x++) if (cellType[x]) { rowTypes[(x / N) | 0].add(cellType[x]); colTypes[x % N].add(cellType[x]); }
  const typesPresent = [...new Set(cellType.filter(Boolean))];
  return {
    N, NN, K, roomOf, walk, cellObj, cellType, objs, winAt, doorAt, victim, roomCells, roomTypes, roomWin,
    beside, rowTypes, colTypes, typesPresent,
    walkTypes: typesPresent.filter((t) => content.itemMap[t].walk),
    hasWin: winAt.some(Boolean), hasDoor: doorAt.some(Boolean),
  };
}

const row = (N, x) => (x / N) | 0;
const col = (N, x) => x % N;
const isEdge = (N, x) => row(N, x) === 0 || row(N, x) === N - 1 || col(N, x) === 0 || col(N, x) === N - 1;
function lineOf(N, x, side) {
  if (side === 'N') return row(N, x) === 0;
  if (side === 'S') return row(N, x) === N - 1;
  if (side === 'W') return col(N, x) === 0;
  return col(N, x) === N - 1;
}

// ------------------------------------------------------------ Pistas posibles
function trueClues(scene, ctx, rng) {
  const { N, K, roomOf, cellType, beside, winAt, doorAt, rowTypes, colTypes, typesPresent, walkTypes } = ctx;
  const pos = scene.solution;
  const out = [];
  const add = (d) => { d.v = rng.int(3); out.push(d); };
  const roomCount = new Array(K).fill(0);
  for (let p = 0; p < N; p++) roomCount[roomOf[pos[p]]]++;
  const obstTypes = typesPresent.filter((t) => !walkTypes.includes(t));

  for (let p = 0; p < N; p++) {
    const x = pos[p], r = roomOf[x];
    add({ t: 'IN_ROOM', a: p, r });
    for (let r2 = 0; r2 < K; r2++) if (r2 !== r) add({ t: 'NOT_IN_ROOM', a: p, r: r2 });
    for (const t of walkTypes) add(cellType[x] === t ? { t: 'ON', a: p, k: t } : { t: 'NOT_ON', a: p, k: t });
    add({ t: cellType[x] ? 'NOT_FLOOR' : 'FLOOR', a: p });
    for (const t of typesPresent) add(beside[x].has(t) ? { t: 'BESIDE', a: p, k: t } : { t: 'NOT_BESIDE', a: p, k: t });
    if (ctx.hasWin) add({ t: winAt[x] ? 'BESIDE_WIN' : 'NOT_BESIDE_WIN', a: p });
    if (ctx.hasDoor) add({ t: doorAt[x] ? 'BESIDE_DOOR' : 'NOT_BESIDE_DOOR', a: p });
    for (const t of obstTypes) {
      add({ t: rowTypes[row(N, x)].has(t) ? 'ROW_HAS' : 'NOT_ROW_HAS', a: p, k: t });
      add({ t: colTypes[col(N, x)].has(t) ? 'COL_HAS' : 'NOT_COL_HAS', a: p, k: t });
    }
    for (const side of ['N', 'S', 'W', 'E']) if (lineOf(N, x, side)) add({ t: 'LINE', a: p, side });
    add({ t: isEdge(N, x) ? 'ON_EDGE' : 'NOT_EDGE', a: p });
    add({ t: roomCount[r] === 1 ? 'ALONE' : 'NOT_ALONE', a: p });
  }
  for (let p = 0; p < N; p++) {
    for (let q = p + 1; q < N; q++) {
      const x = pos[p], y = pos[q];
      const same = roomOf[x] === roomOf[y];
      // "la víctima estaba en la misma habitación que X" delataría al asesino: no se usa
      if (!(same && (p === scene.victim || q === scene.victim))) add({ t: same ? 'SAME_ROOM' : 'DIFF_ROOM', a: p, b: q });
      if (same && roomCount[roomOf[x]] === 2 && p !== scene.victim && q !== scene.victim) add({ t: 'ALONE_WITH', a: p, b: q });
      const dr = Math.abs(row(N, x) - row(N, y)), dc = Math.abs(col(N, x) - col(N, y));
      add({ t: dr === 1 && dc === 1 ? 'DIAG' : 'NOT_DIAG', a: p, b: q });
      const [nn, ss] = row(N, x) < row(N, y) ? [p, q] : [q, p];
      add({ t: 'NORTH', a: nn, b: ss });
      if (dr <= 2) add({ t: 'ROW_OFF', a: nn, b: ss, k: dr });
      const [ww, ee] = col(N, x) < col(N, y) ? [p, q] : [q, p];
      add({ t: 'WEST', a: ww, b: ee });
      if (dc <= 2) add({ t: 'COL_OFF', a: ww, b: ee, k: dc });
    }
  }
  for (let r = 0; r < K; r++) {
    add({ t: 'ROOM_COUNT', r, n: roomCount[r] });
    for (let r2 = r + 1; r2 < K; r2++) {
      if (roomCount[r] > roomCount[r2]) add({ t: 'ROOM_GT', r, r2 });
      else if (roomCount[r2] > roomCount[r]) add({ t: 'ROOM_GT', r: r2, r2: r });
      else if (roomCount[r] > 0) add({ t: 'ROOM_EQ', r, r2 });
    }
  }
  add({ t: 'EMPTY_ROOMS', n: roomCount.filter((c) => c === 0).length });
  for (const t of walkTypes) {
    const on = [];
    for (let p = 0; p < N; p++) if (cellType[pos[p]] === t) on.push(p);
    if (on.length === 0) add({ t: 'NOBODY_ON', k: t });
    else if (on.length === 1) add({ t: 'ONLY_ON', a: on[0], k: t });
  }
  const cr = roomOf[pos[scene.victim]];
  for (const t of typesPresent) add({ t: ctx.roomTypes[cr].has(t) ? 'CRIME_HAS' : 'CRIME_NOT_HAS', k: t });
  if (ctx.hasWin) add({ t: ctx.roomWin[cr] ? 'CRIME_WIN' : 'CRIME_NOWIN' });
  return out;
}

// ------------------------------------------------------------- Compilación
// Cada pista se traduce en una o varias restricciones:
//   un : sobre la casilla de una persona   · bin : entre dos personas
//   cnt: recuentos por habitación (se comprueban con el resumen de dominios)
function compileClue(c, ctx) {
  const { N, roomOf, cellType, beside, winAt, doorAt, rowTypes, colTypes, K, roomTypes, roomWin, victim } = ctx;
  const R = (x) => roomOf[x];
  const parts = [];
  const un = (a, f) => parts.push({ kind: 'un', a, f, full: (pos) => f(pos[a]) });
  const bin = (a, b, f) => parts.push({ kind: 'bin', a, b, f, full: (pos) => f(pos[a], pos[b]) });
  const counts = (pos) => { const k = new Array(K).fill(0); for (const x of pos) k[roomOf[x]]++; return k; };
  const cnt = (full, check, extra = {}) => parts.push(Object.assign({ kind: 'cnt', full, check }, extra));

  switch (c.t) {
    case 'IN_ROOM': un(c.a, (x) => R(x) === c.r); break;
    case 'NOT_IN_ROOM': un(c.a, (x) => R(x) !== c.r); break;
    case 'ON': un(c.a, (x) => cellType[x] === c.k); break;
    case 'NOT_ON': un(c.a, (x) => cellType[x] !== c.k); break;
    case 'FLOOR': un(c.a, (x) => !cellType[x]); break;
    case 'NOT_FLOOR': un(c.a, (x) => !!cellType[x]); break;
    case 'BESIDE': un(c.a, (x) => beside[x].has(c.k)); break;
    case 'NOT_BESIDE': un(c.a, (x) => !beside[x].has(c.k)); break;
    case 'BESIDE_WIN': un(c.a, (x) => winAt[x] !== 0); break;
    case 'NOT_BESIDE_WIN': un(c.a, (x) => winAt[x] === 0); break;
    case 'BESIDE_DOOR': un(c.a, (x) => doorAt[x] !== 0); break;
    case 'NOT_BESIDE_DOOR': un(c.a, (x) => doorAt[x] === 0); break;
    case 'ROW_HAS': un(c.a, (x) => rowTypes[row(N, x)].has(c.k)); break;
    case 'NOT_ROW_HAS': un(c.a, (x) => !rowTypes[row(N, x)].has(c.k)); break;
    case 'COL_HAS': un(c.a, (x) => colTypes[col(N, x)].has(c.k)); break;
    case 'NOT_COL_HAS': un(c.a, (x) => !colTypes[col(N, x)].has(c.k)); break;
    case 'LINE': un(c.a, (x) => lineOf(N, x, c.side)); break;
    case 'ON_EDGE': un(c.a, (x) => isEdge(N, x)); break;
    case 'NOT_EDGE': un(c.a, (x) => !isEdge(N, x)); break;
    case 'SAME_ROOM': bin(c.a, c.b, (x, y) => R(x) === R(y)); break;
    case 'DIFF_ROOM': bin(c.a, c.b, (x, y) => R(x) !== R(y)); break;
    case 'DIAG': bin(c.a, c.b, (x, y) => Math.abs(row(N, x) - row(N, y)) === 1 && Math.abs(col(N, x) - col(N, y)) === 1); break;
    case 'NOT_DIAG': bin(c.a, c.b, (x, y) => !(Math.abs(row(N, x) - row(N, y)) === 1 && Math.abs(col(N, x) - col(N, y)) === 1)); break;
    case 'NORTH': bin(c.a, c.b, (x, y) => row(N, x) < row(N, y)); break;
    case 'WEST': bin(c.a, c.b, (x, y) => col(N, x) < col(N, y)); break;
    case 'ROW_OFF': bin(c.a, c.b, (x, y) => row(N, y) - row(N, x) === c.k); break;
    case 'COL_OFF': bin(c.a, c.b, (x, y) => col(N, y) - col(N, x) === c.k); break;
    case 'ALONE_WITH':
      bin(c.a, c.b, (x, y) => R(x) === R(y));
      cnt((pos) => counts(pos)[R(pos[c.a])] === 2, (m) => {
        const mk = m.mask[c.a];
        if (mk && (mk & (mk - 1)) === 0) { const r = 31 - Math.clz32(mk); return m.def[r] <= 2 && m.poss[r] >= 2; }
        return true;
      });
      break;
    case 'ALONE':
      cnt((pos) => counts(pos)[R(pos[c.a])] === 1, (m) => {
        const mk = m.mask[c.a];
        if (mk && (mk & (mk - 1)) === 0) return m.def[31 - Math.clz32(mk)] <= 1;
        return true;
      });
      break;
    case 'NOT_ALONE':
      cnt((pos) => counts(pos)[R(pos[c.a])] > 1, (m) => {
        const mk = m.mask[c.a];
        if (mk && (mk & (mk - 1)) === 0) return m.poss[31 - Math.clz32(mk)] >= 2;
        return true;
      });
      break;
    case 'ROOM_COUNT':
      cnt((pos) => counts(pos)[c.r] === c.n, (m) => !(m.def[c.r] > c.n || m.poss[c.r] < c.n), { isCount: true, r: c.r, n: c.n });
      break;
    case 'ROOM_GT':
      cnt((pos) => { const k = counts(pos); return k[c.r] > k[c.r2]; }, (m) => !(m.poss[c.r] <= m.def[c.r2]));
      break;
    case 'ROOM_EQ':
      cnt((pos) => { const k = counts(pos); return k[c.r] === k[c.r2]; }, (m) => !(m.poss[c.r] < m.def[c.r2] || m.poss[c.r2] < m.def[c.r]));
      break;
    case 'EMPTY_ROOMS':
      cnt((pos) => counts(pos).filter((v) => v === 0).length === c.n, (m) => {
        let lb = 0, ub = 0;
        for (let r = 0; r < K; r++) { if (m.poss[r] === 0) lb++; if (m.def[r] === 0) ub++; }
        return lb <= c.n && c.n <= ub;
      });
      break;
    case 'NOBODY_ON':
      for (let p = 0; p < N; p++) un(p, (x) => cellType[x] !== c.k);
      break;
    case 'ONLY_ON':
      for (let p = 0; p < N; p++) un(p, p === c.a ? (x) => cellType[x] === c.k : (x) => cellType[x] !== c.k);
      break;
    case 'CRIME_HAS': un(victim, (x) => roomTypes[R(x)].has(c.k)); break;
    case 'CRIME_NOT_HAS': un(victim, (x) => !roomTypes[R(x)].has(c.k)); break;
    case 'CRIME_WIN': un(victim, (x) => roomWin[R(x)]); break;
    case 'CRIME_NOWIN': un(victim, (x) => !roomWin[R(x)]); break;
    default: throw new Error('Tipo de pista desconocido: ' + c.t);
  }
  return { def: c, parts, full: (pos) => parts.every((k) => k.full(pos)) };
}

function consFrom(clues) {
  const cons = { un: [], bin: [], cnt: [], all: [] };
  for (const cl of clues) for (const k of cl.parts) { cons[k.kind].push(k); cons.all.push(k); }
  return cons;
}
function compileAll(defs, ctx) { return consFrom(defs.map((d) => compileClue(d, ctx))); }

// ---------------------------------------------------------------- Solucionador
function initState(ctx, cons) {
  const { N, NN, walk } = ctx;
  const dom = new Uint8Array(N * NN);
  const pos = new Int16Array(N).fill(-1);
  for (let p = 0; p < N; p++) for (let x = 0; x < NN; x++) dom[p * NN + x] = walk[x] ? 1 : 0;
  for (const k of cons.un) {
    const b = k.a * NN;
    for (let x = 0; x < NN; x++) if (dom[b + x] && !k.f(x)) dom[b + x] = 0;
  }
  for (let p = 0; p < N; p++) {
    let any = false;
    for (let x = 0; x < NN; x++) if (dom[p * NN + x]) { any = true; break; }
    if (!any) return null;
  }
  return { dom, pos };
}

function propagate(ctx, cons, S, level) {
  const { N, NN, K, roomOf, roomCells, victim } = ctx;
  const dom = S.dom, pos = S.pos;
  const T = ctx.tmp || (ctx.tmp = {
    cnt: new Int16Array(N), last: new Int16Array(N), rowM: new Int32Array(N), colM: new Int32Array(N),
    mask: new Int32Array(N), def: new Int8Array(K), poss: new Int8Array(K),
  });
  const cnt = T.cnt, last = T.last, rowM = T.rowM, colM = T.colM, mask = T.mask, def = T.def, poss = T.poss;
  const info = { mask, def, poss };
  for (;;) {
    // --- pasada A: resumen de dominios
    def.fill(0); poss.fill(0);
    for (let p = 0; p < N; p++) {
      let c = 0, l = -1, rm = 0, cm = 0, om = 0;
      const b = p * NN;
      for (let r = 0, x = 0; r < N; r++) {
        for (let cc = 0; cc < N; cc++, x++) {
          if (dom[b + x]) { c++; l = x; rm |= 1 << r; cm |= 1 << cc; om |= 1 << roomOf[x]; }
        }
      }
      if (c === 0) return false;
      cnt[p] = c; last[p] = l; rowM[p] = rm; colM[p] = cm; mask[p] = om;
      if ((om & (om - 1)) === 0) def[31 - Math.clz32(om)]++;
      for (let r = 0; r < K; r++) if (om & (1 << r)) poss[r]++;
    }
    // --- 1) personas con una sola casilla: asignar y limpiar fila/columna
    let changed = false;
    for (let p = 0; p < N; p++) {
      if (pos[p] >= 0 || cnt[p] !== 1) continue;
      const x = last[p];
      pos[p] = x;
      const r = (x / N) | 0, cc = x % N;
      for (let q = 0; q < N; q++) {
        if (q === p) continue;
        const bq = q * NN;
        for (let k = 0; k < N; k++) {
          const y1 = r * N + k, y2 = k * N + cc;
          if (dom[bq + y1]) { if (pos[q] === y1) return false; dom[bq + y1] = 0; }
          if (dom[bq + y2]) { if (pos[q] === y2) return false; dom[bq + y2] = 0; }
        }
      }
      changed = true;
    }
    if (changed) continue;
    // --- 2) pistas binarias
    for (const k of cons.bin) {
      const a = k.a, b = k.b, pa = pos[a], pb = pos[b];
      if (pa >= 0 && pb >= 0) { if (!k.f(pa, pb)) return false; continue; }
      if (pa >= 0) {
        const bb = b * NN;
        for (let y = 0; y < NN; y++) if (dom[bb + y] && !k.f(pa, y)) { dom[bb + y] = 0; changed = true; }
      } else if (pb >= 0) {
        const ba = a * NN;
        for (let x = 0; x < NN; x++) if (dom[ba + x] && !k.f(x, pb)) { dom[ba + x] = 0; changed = true; }
      } else if (level >= 2) {
        const ba = a * NN, bb = b * NN;
        for (let x = 0; x < NN; x++) {
          if (!dom[ba + x]) continue;
          const xr = (x / N) | 0, xc = x % N;
          let ok = false;
          for (let y = 0; y < NN; y++) {
            if (!dom[bb + y]) continue;
            if (((y / N) | 0) === xr || (y % N) === xc) continue;
            if (k.f(x, y)) { ok = true; break; }
          }
          if (!ok) { dom[ba + x] = 0; changed = true; }
        }
        for (let y = 0; y < NN; y++) {
          if (!dom[bb + y]) continue;
          const yr = (y / N) | 0, yc = y % N;
          let ok = false;
          for (let x = 0; x < NN; x++) {
            if (!dom[ba + x]) continue;
            if (((x / N) | 0) === yr || (x % N) === yc) continue;
            if (k.f(x, y)) { ok = true; break; }
          }
          if (!ok) { dom[bb + y] = 0; changed = true; }
        }
      }
    }
    if (changed) continue;
    // --- 3) cada fila y cada columna necesita exactamente un personaje
    for (let line = 0; line < 2 * N; line++) {
      const isRow = line < N, idx = isRow ? line : line - N, bt = 1 << idx;
      const M = isRow ? rowM : colM;
      let c = 0, who = -1;
      for (let p = 0; p < N; p++) if (M[p] & bt) { c++; who = p; }
      if (c === 0) return false;
      if (c === 1 && M[who] !== bt) {
        const b = who * NN;
        for (let x = 0; x < NN; x++) {
          if (dom[b + x] && (isRow ? ((x / N) | 0) : x % N) !== idx) dom[b + x] = 0;
        }
        changed = true;
      }
    }
    if (changed) continue;
    // --- 4) recuentos por habitación
    for (const k of cons.cnt) {
      if (!k.check(info)) return false;
      if (k.isCount) {
        const r = k.r, n = k.n, bt = 1 << r;
        if (def[r] === n && poss[r] > n) {
          for (let p = 0; p < N; p++) {
            if ((mask[p] & bt) && mask[p] !== bt) {
              const b = p * NN;
              for (const x of roomCells[r]) dom[b + x] = 0;
              changed = true;
            }
          }
        } else if (poss[r] === n && def[r] < n) {
          for (let p = 0; p < N; p++) {
            if ((mask[p] & bt) && mask[p] !== bt) {
              const b = p * NN;
              for (let x = 0; x < NN; x++) if (dom[b + x] && roomOf[x] !== r) dom[b + x] = 0;
              changed = true;
            }
          }
        }
        if (changed) break;
      }
    }
    if (changed) continue;
    // --- 5) regla del crimen: la habitación de la víctima tiene exactamente 2 personas
    const mv = mask[victim];
    if (mv && (mv & (mv - 1)) === 0) {
      const r = 31 - Math.clz32(mv), bt = 1 << r;
      if (def[r] > 2 || poss[r] < 2) return false;
      if (def[r] === 2 && poss[r] > 2) {
        for (let p = 0; p < N; p++) {
          if ((mask[p] & bt) && mask[p] !== bt) {
            const b = p * NN;
            for (const x of roomCells[r]) dom[b + x] = 0;
            changed = true;
          }
        }
      } else if (poss[r] === 2 && def[r] < 2) {
        for (let p = 0; p < N; p++) {
          if ((mask[p] & bt) && mask[p] !== bt) {
            const b = p * NN;
            for (let x = 0; x < NN; x++) if (dom[b + x] && roomOf[x] !== r) dom[b + x] = 0;
            changed = true;
          }
        }
      }
    }
    if (!changed) return true;
  }
}

function finalCheck(ctx, cons, pos) {
  const { N, K, roomOf, victim, walk } = ctx;
  const p = Array.from(pos);
  const rows = new Set(), cols = new Set();
  for (const x of p) { if (!walk[x]) return false; rows.add((x / N) | 0); cols.add(x % N); }
  if (rows.size !== N || cols.size !== N) return false;
  const counts = new Array(K).fill(0);
  for (const x of p) counts[roomOf[x]]++;
  if (counts[roomOf[p[victim]]] !== 2) return false;
  for (const k of cons.all) if (!k.full(p)) return false;
  return true;
}

// level 1: comprobación hacia delante · level 2: consistencia de arcos (para medir dificultad)
export function solve(ctx, cons, cap, level = 1, collect = false, maxNodes = 400000) {
  const { N, NN } = ctx;
  const res = { count: 0, sols: [], nodes: 0, guesses: 0, aborted: false };
  const root = initState(ctx, cons);
  if (!root) return res;
  function rec(S) {
    if (res.aborted || res.count >= cap) return;
    res.nodes++;
    if (res.nodes > maxNodes) { res.aborted = true; return; }
    if (!propagate(ctx, cons, S, level)) return;
    let best = -1, bc = 1e9;
    for (let p = 0; p < N; p++) {
      if (S.pos[p] >= 0) continue;
      let c = 0;
      const b = p * NN;
      for (let x = 0; x < NN; x++) if (S.dom[b + x]) c++;
      if (c < bc) { bc = c; best = p; }
    }
    if (best < 0) {
      if (finalCheck(ctx, cons, S.pos)) { res.count++; if (collect) res.sols.push(Array.from(S.pos)); }
      return;
    }
    res.guesses++;
    const cells = [];
    const bb = best * NN;
    for (let x = 0; x < NN; x++) if (S.dom[bb + x]) cells.push(x);
    for (const x of cells) {
      if (res.aborted || res.count >= cap) return;
      const child = { dom: S.dom.slice(), pos: S.pos.slice() };
      child.dom.fill(0, bb, bb + NN);
      child.dom[bb + x] = 1;
      rec(child);
    }
  }
  rec(root);
  return res;
}


function sampleWorlds(rng, ctx, want, maxTrials) {
  const { N, K, roomOf, victim, walk } = ctx;
  const idx = [];
  for (let i = 0; i < N; i++) idx.push(i);
  const worlds = [];
  let trials = 0;
  while (worlds.length < want && trials < maxTrials) {
    trials++;
    const cols = rng.shuffle(idx), rows = rng.shuffle(idx);
    const pos = new Array(N);
    let ok = true;
    for (let p = 0; p < N; p++) { pos[p] = rows[p] * N + cols[rows[p]]; if (!walk[pos[p]]) { ok = false; break; } }
    if (!ok) continue;
    const counts = new Array(K).fill(0);
    for (let p = 0; p < N; p++) counts[roomOf[pos[p]]]++;
    if (counts[roomOf[pos[victim]]] === 2) worlds.push(pos);
  }
  return { worlds, rate: Math.max(worlds.length, 1) / Math.max(trials, 1) };
}

// ------------------------------------------------------- Selección de pistas
function pickClues(rng, scene, ctx, D) {
  const pool0 = trueClues(scene, ctx, rng);
  const pool = [], comp = [];
  for (const d of pool0) {
    const k = compileClue(d, ctx);
    if (k.parts.length === 1 && k.parts[0].kind === 'un') {   // descarta pistas que clavan a alguien en 1-2 casillas
      let sup = 0;
      for (let x = 0; x < ctx.NN; x++) if (ctx.walk[x] && k.parts[0].f(x)) sup++;
      if (sup < D.minSupport) continue;
      // y las que no dicen nada (cierto en todas las casillas)
      let all = 0;
      for (let x = 0; x < ctx.NN; x++) if (ctx.walk[x]) all++;
      if (sup === all) continue;
    }
    pool.push(d); comp.push(k);
  }
  const V = ctx.victim;
  const wOf = (d) => {
    const w = D.weights[d.t] === undefined ? 1 : D.weights[d.t];
    if (d.a === V && d.b === undefined) return w * 0.25;           // pista "propia" de la víctima: rara
    if (d.a === V || d.b === V) return w * 0.7;
    return w;
  };
  // cada sospechoso debe aparecer en alguna pista (la víctima no hace falta)
  const mentions = (d) => { const m = []; if (d.a !== undefined) m.push(d.a); if (d.b !== undefined) m.push(d.b); return m; };
  const covered = (idxs) => {
    const seen = new Set();
    for (const j of idxs) for (const p of mentions(pool[j])) seen.add(p);
    for (let p = 0; p < ctx.N; p++) if (p !== V && !seen.has(p)) return false;
    return true;
  };
  const N = ctx.N;
  const usedType = {};
  const chosen = [];
  const used = new Set();
  const take = (j) => { chosen.push(j); used.add(j); const f = famOf(pool[j].t); usedType[f] = (usedType[f] || 0) + 1; if (pool[j].a !== undefined) mentioned.add(pool[j].a); if (pool[j].b !== undefined) mentioned.add(pool[j].b); };
  const rep = (j) => { const f = famOf(pool[j].t); return (usedType[f] || 0) * (f === 'rel' ? 2.5 : 1); };
  const mentioned = new Set();
  const fresh = (j) => { const d = pool[j]; return (d.a !== undefined && !mentioned.has(d.a)) || (d.b !== undefined && !mentioned.has(d.b)) ? 1.6 : 1; };
  const consOf = (idxs) => consFrom(idxs.map((j) => comp[j]));

  // fase 1: pistas "informativas" según una estimación a priori, hasta que las
  // soluciones sean pocas y se puedan enumerar con exactitud.
  const CAP = 600;
  const { worlds, rate } = sampleWorlds(rng, ctx, 1200, 60000);
  let fact = 1;
  for (let i = 2; i <= N; i++) fact *= i;
  let est = fact * fact * rate;
  const pr = comp.map((k) => {
    let c = 0;
    for (let w = 0; w < worlds.length; w++) if (k.full(worlds[w])) c++;
    return Math.max(c, 0.5) / Math.max(worlds.length, 1);
  });
  const pickInformative = () => {
    const cands = [];
    for (let j = 0; j < pool.length; j++) if (!used.has(j)) cands.push(j);
    const j = weightedPick(rng, cands, (jj) => {
      const inf = 0.08 + (1 - pr[jj]);
      return wOf(pool[jj]) * fresh(jj) * inf / (1 + 1.1 * rep(jj));
    });
    if (j === null) return false;
    take(j);
    est *= pr[j];
    return true;
  };
  while (est > CAP * 0.7 && chosen.length < 40) if (!pickInformative()) return null;
  let sols = null;
  for (let guard = 0; guard < 14 && !sols; guard++) {
    const r = solve(ctx, consOf(chosen), CAP + 1, 1, true, 20000);
    if (!r.aborted && r.count <= CAP) sols = r.sols;
    else for (let i = 0; i < 3; i++) if (!pickInformative()) return null;
  }
  if (!sols || !sols.length) return null;

  // fase 2: voraz, favoreciendo pistas que descartan muchas soluciones
  let safety = 60;
  while (sols.length > 1 && safety-- > 0) {
    const cands = [];
    for (let j = 0; j < pool.length; j++) {
      if (used.has(j)) continue;
      let keep = 0;
      for (let s = 0; s < sols.length; s++) if (comp[j].full(sols[s])) keep++;
      if (keep < sols.length) cands.push({ j, frac: (sols.length - keep) / sols.length });
    }
    if (!cands.length) return null;
    const c = weightedPick(rng, cands, (o) => wOf(pool[o.j]) * fresh(o.j) * (0.06 + o.frac) / (1 + 1.1 * rep(o.j)));
    take(c.j);
    sols = sols.filter((s) => comp[c.j].full(s));
  }
  if (sols.length !== 1) return null;

  // completar: una pista para cada sospechoso que aún no aparezca
  for (let p = 0; p < N; p++) {
    if (p === V || mentioned.has(p)) continue;
    const cands = [];
    for (let j = 0; j < pool.length; j++) if (!used.has(j) && mentions(pool[j]).includes(p)) cands.push(j);
    const j = weightedPick(rng, cands, (jj) => wOf(pool[jj]) * (1 - pr[jj] + 0.1) / (1 + 1.1 * rep(jj)));
    if (j === null) return null;
    take(j);
  }

  // fase 3: dejar solo las pistas imprescindibles
  const acceptable = (idxs) => {
    if (!covered(idxs)) return false;
    const cons = consOf(idxs);
    const u = solve(ctx, cons, 2, 1, false, 12000);
    if (u.aborted || u.count !== 1) return false;
    if (D.maxGuesses < 1e8) {
      const g = solve(ctx, cons, 2, 2, false, 5000);
      if (g.aborted || g.guesses > D.maxGuesses) return false;
    }
    return true;
  };
  if (D.maxGuesses < 1e8 && !acceptable(chosen)) {
    let extra = 40;
    while (extra-- > 0 && !acceptable(chosen)) {
      const cands = [];
      for (let j = 0; j < pool.length; j++) if (!used.has(j)) cands.push(j);
      const j = weightedPick(rng, cands, (jj) => wOf(pool[jj]) / (1 + 1.1 * rep(jj)));
      if (j === null) break;
      take(j);
    }
    if (!acceptable(chosen)) return null;
  }
  let current = chosen.slice();
  for (const j of rng.shuffle(chosen.slice())) {
    const without = current.filter((x) => x !== j);
    if (without.length < 2) continue;
    if (acceptable(without)) current = without;
  }
  return { defs: current.map((j) => pool[j]) };
}

// ------------------------------------------------------------ Puzzle completo
export function generatePuzzle(content, diffKey, seedStr, opts = {}) {
  const D = DIFFICULTIES[diffKey];
  const rng = makeRng(hashStr(seedStr + '|' + diffKey + '|v2'));
  let best = null;
  const t0 = Date.now();
  for (let attempt = 0; attempt < D.attempts; attempt++) {
    const scene = buildScene(rng, content, D);
    if (!scene) continue;
    const ctx = makeCtx(scene, content);
    const picked = pickClues(rng, scene, ctx, D);
    if (!picked) continue;
    const cons = compileAll(picked.defs, ctx);
    const rate = solve(ctx, cons, 2, 2, false, 300);
    const rating = { guesses: rate.aborted ? 999 : rate.guesses, nodes: rate.nodes, clues: picked.defs.length };
    const puzzle = assemble(scene, picked.defs, rating, content, diffKey, seedStr, rng);
    const ok = (D.minGuesses === undefined || rating.guesses >= D.minGuesses);
    if (!best || (ok && !best.ok)) best = { puzzle, ok };
    if (ok) break;
    if (opts.onProgress) opts.onProgress(attempt + 1, D.attempts);
  }
  if (!best) throw new Error('No se pudo generar el puzzle (' + diffKey + ', ' + seedStr + ')');
  best.puzzle.rating.ms = Date.now() - t0;
  return best.puzzle;
}

function clueSortKey(c, victim) {
  const ps = [];
  if (c.a !== undefined && c.a !== victim) ps.push(c.a);
  if (c.b !== undefined && c.b !== victim) ps.push(c.b);
  return ps.length ? Math.min(...ps) : 99;
}

function assemble(scene, defs, rating, content, diffKey, seedStr, rng) {
  const clues = defs.slice().sort((x, y) => clueSortKey(x, scene.victim) - clueSortKey(y, scene.victim));
  return {
    v: 2, id: diffKey + ':' + seedStr, diff: diffKey, seed: seedStr,
    N: scene.N, K: scene.K, venue: rng.pick(content.GAME.venues),
    roomOf: scene.roomOf, roomTypes: scene.typeIds,
    objs: scene.objs, cellObj: scene.cellObj, walk: scene.walk, winAt: scene.winAt, doorAt: scene.doorAt,
    persons: scene.persons, victim: scene.victim, murderer: scene.murderer, crimeRoom: scene.crimeRoom,
    solution: scene.solution, clues, rating,
  };
}

// Reconstruye lo necesario para validar un puzzle ya generado (tests).
export function sceneOf(puz) {
  return {
    N: puz.N, K: puz.K, roomOf: puz.roomOf, cellObj: puz.cellObj, objs: puz.objs, walk: puz.walk,
    winAt: puz.winAt, doorAt: puz.doorAt, victim: puz.victim,
  };
}
export function verifyPuzzle(content, puz, cap = 2) {
  const ctx = makeCtx(sceneOf(puz), content);
  const cons = compileAll(puz.clues, ctx);
  const r = solve(ctx, cons, cap, 1, true, 2e6);
  return { count: r.count, sols: r.sols, aborted: r.aborted, ctx, cons };
}

export { makeCtx, compileAll, compileClue, finalCheck };
