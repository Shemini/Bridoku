// ============================================================================
//  MOTOR DEL MURDOKU
//  - Genera una mansión (habitaciones, muebles, armas) y una solución.
//  - Genera pistas verdaderas y elige un conjunto que da UNA ÚNICA solución.
//  - Todo es determinista a partir de una semilla (el "caso del día" es igual
//    en todos los dispositivos).
//  No depende del navegador: se usa igual en un Worker o en Node (tests).
//
//  Reglas del puzzle:
//   1. Hay N personajes en una cuadrícula N×N: uno por fila y uno por columna.
//   2. Las pistas son siempre verdaderas.
//   3. La víctima estaba en una habitación con un arma (el arma del crimen)
//      y a solas con el asesino (solo había otra persona con ella).
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
  const rng = {
    next,
    int: (n) => Math.floor(next() * n),
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
  return rng;
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

// ------------------------------------------------------------- Dificultades
// weights: cuánto se favorece cada tipo de pista (1 = normal).
export const DIFFICULTIES = {
  facil: {
    key: 'facil', label: 'Fácil', N: 5, K: 4, density: [0.55, 0.75],
    maxGuesses: 0, minSupport: 2, attempts: 14,
    weights: { IN_ROOM: 3, ON_ITEM: 3, NEXT_ITEM: 2, ROOM_COUNT: 2, SAME_ROOM: 1.6, ADJ4: 1.4, CRIME_WEAPON: 1.5, CRIME_ITEM: 1.5, CRIME_CAT: 1.2,
      NOT_IN_ROOM: 1.2, DIFF_ROOM: 0.8, ABOVE: 0.9, LEFT: 0.9, ALONE: 1, NOT_ALONE: 1, ON_EDGE: 0.8, NOT_EDGE: 0.8, DIAG: 1,
      NOT_ON_ITEM: 0.5, NOT_NEXT_ITEM: 0.4, NOT_NEAR: 0.3, ROOM_GT: 0.8, ROOM_EQ: 0.5, CRIME_NOT_WEAPON: 0.6, CRIME_NOT_CAT: 0.5, CRIME_NOT_ITEM: 0.5 },
  },
  normal: {
    key: 'normal', label: 'Normal', N: 6, K: 5, density: [0.45, 0.65],
    maxGuesses: 3, minSupport: 4, attempts: 14,
    weights: { IN_ROOM: 1.6, ON_ITEM: 1.8, NEXT_ITEM: 1.6, ROOM_COUNT: 1.6, SAME_ROOM: 1.4, ADJ4: 1.4, CRIME_WEAPON: 1, CRIME_ITEM: 1.2, CRIME_CAT: 1,
      NOT_IN_ROOM: 1.4, DIFF_ROOM: 1, ABOVE: 1.1, LEFT: 1.1, ALONE: 1.1, NOT_ALONE: 1.1, ON_EDGE: 0.8, NOT_EDGE: 0.8, DIAG: 1.2,
      NOT_ON_ITEM: 0.8, NOT_NEXT_ITEM: 0.7, NOT_NEAR: 0.6, ROOM_GT: 1, ROOM_EQ: 0.8, CRIME_NOT_WEAPON: 0.9, CRIME_NOT_CAT: 0.8, CRIME_NOT_ITEM: 0.8 },
  },
  dificil: {
    key: 'dificil', label: 'Difícil', N: 7, K: 6, density: [0.4, 0.6],
    maxGuesses: 1e9, minGuesses: 1, minSupport: 5, attempts: 12,
    weights: { IN_ROOM: 0.9, ON_ITEM: 1.2, NEXT_ITEM: 1.2, ROOM_COUNT: 1.2, SAME_ROOM: 1.2, ADJ4: 1.3, CRIME_WEAPON: 0.7, CRIME_ITEM: 1, CRIME_CAT: 0.8,
      NOT_IN_ROOM: 1.5, DIFF_ROOM: 1.3, ABOVE: 1.4, LEFT: 1.4, ALONE: 1.2, NOT_ALONE: 1.3, ON_EDGE: 0.8, NOT_EDGE: 0.9, DIAG: 1.3,
      NOT_ON_ITEM: 1.1, NOT_NEXT_ITEM: 1, NOT_NEAR: 1, ROOM_GT: 1.4, ROOM_EQ: 1.1, CRIME_NOT_WEAPON: 1.2, CRIME_NOT_CAT: 1.1, CRIME_NOT_ITEM: 1.1 },
  },
  experto: {
    key: 'experto', label: 'Experto', N: 8, K: 7, density: [0.35, 0.55],
    maxGuesses: 1e9, minGuesses: 2, minSupport: 6, attempts: 10,
    weights: { IN_ROOM: 0.6, ON_ITEM: 0.9, NEXT_ITEM: 1, ROOM_COUNT: 1, SAME_ROOM: 1, ADJ4: 1.2, CRIME_WEAPON: 0.5, CRIME_ITEM: 0.9, CRIME_CAT: 0.7,
      NOT_IN_ROOM: 1.6, DIFF_ROOM: 1.5, ABOVE: 1.6, LEFT: 1.6, ALONE: 1.2, NOT_ALONE: 1.5, ON_EDGE: 0.7, NOT_EDGE: 1, DIAG: 1.3,
      NOT_ON_ITEM: 1.3, NOT_NEXT_ITEM: 1.2, NOT_NEAR: 1.3, ROOM_GT: 1.6, ROOM_EQ: 1.3, CRIME_NOT_WEAPON: 1.4, CRIME_NOT_CAT: 1.3, CRIME_NOT_ITEM: 1.3 },
  },
};

// ------------------------------------------------------------------ Escena
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

function buildScene(rng, content, D) {
  const N = D.N, K = D.K, NN = N * N;
  const roomOf = genLayout(rng, N, K);
  if (!roomOf) return null;
  const typeIds = rng.shuffle(content.ROOM_TYPES.map((t) => t.id)).slice(0, K);
  const roomCells = Array.from({ length: K }, () => []);
  roomOf.forEach((r, x) => roomCells[r].push(x));

  const itemAt = new Array(NN).fill('');
  const decorAt = new Array(NN).fill('');
  for (let r = 0; r < K; r++) {
    const type = content.roomTypeMap[typeIds[r]];
    const cells = rng.shuffle(roomCells[r]);
    const dens = D.density[0] + rng.next() * (D.density[1] - D.density[0]);
    const cnt = Math.max(2, Math.min(cells.length - 1, Math.round(cells.length * dens)));
    const kinds = rng.shuffle(type.items);
    for (let i = 0; i < cnt; i++) itemAt[cells[i]] = kinds[i % kinds.length];
  }

  // armas: una por habitación en W habitaciones
  const W = Math.min(content.WEAPONS.length, K >= 6 ? K - 2 : K - 1);
  const weaponRooms = rng.shuffle([...Array(K).keys()]).slice(0, W);
  const weapons = rng.shuffle(content.WEAPONS.map((w) => w.id)).slice(0, W);
  const weaponOfRoom = new Array(K).fill('');
  weaponRooms.forEach((r, i) => {
    const free = roomCells[r].filter((x) => !itemAt[x]);
    const x = free.length ? rng.pick(free) : rng.pick(roomCells[r]);
    itemAt[x] = weapons[i];
    weaponOfRoom[r] = weapons[i];
  });

  // decorado
  for (let x = 0; x < NN; x++) {
    if (itemAt[x]) continue;
    const type = content.roomTypeMap[typeIds[roomOf[x]]];
    if (type.decor.length && rng.chance(0.2)) decorAt[x] = rng.pick(type.decor);
  }

  const persons = rng.shuffle(content.CHARACTERS.map((c) => c.id)).slice(0, N);

  // solución: permutación + víctima en habitación con arma y exactamente 2 personas
  for (let attempt = 0; attempt < 800; attempt++) {
    const cols = rng.shuffle([...Array(N).keys()]);
    const counts = new Array(K).fill(0);
    for (let r = 0; r < N; r++) counts[roomOf[r * N + cols[r]]]++;
    const rooms2 = [];
    for (let r = 0; r < K; r++) if (counts[r] === 2 && weaponOfRoom[r]) rooms2.push(r);
    if (!rooms2.length) continue;
    const crimeRoom = rng.pick(rooms2);
    const rowsOrder = rng.shuffle([...Array(N).keys()]);
    const solution = new Array(N);
    for (let p = 0; p < N; p++) { const r = rowsOrder[p]; solution[p] = r * N + cols[r]; }
    const inRoom = [];
    for (let p = 0; p < N; p++) if (roomOf[solution[p]] === crimeRoom) inRoom.push(p);
    const victim = rng.pick(inRoom);
    const murderer = inRoom[0] === victim ? inRoom[1] : inRoom[0];
    return { N, K, roomOf, typeIds, itemAt, decorAt, weaponOfRoom, persons, solution, victim, murderer, crimeRoom };
  }
  return null;
}

// ------------------------------------------------------------------ Contexto
function makeCtx(scene, content) {
  const { N, K, roomOf, itemAt, weaponOfRoom, victim } = scene;
  const NN = N * N;
  const roomCells = Array.from({ length: K }, () => []);
  roomOf.forEach((r, x) => roomCells[r].push(x));
  const roomItems = Array.from({ length: K }, () => new Set());
  for (let x = 0; x < NN; x++) {
    const it = itemAt[x];
    if (it && !content.weaponMap[it]) roomItems[roomOf[x]].add(it);
  }
  return {
    N, NN, K, roomOf, itemAt, weaponOfRoom, victim, roomCells, roomItems,
    weaponCat: (w) => (w && content.weaponMap[w] ? content.weaponMap[w].cat : ''),
    isWeapon: (id) => !!content.weaponMap[id],
  };
}

// ------------------------------------------------------------ Pistas posibles
function trueClues(scene, ctx, content, rng) {
  const { N, K, roomOf, itemAt, weaponOfRoom } = ctx;
  const pos = scene.solution;
  const out = [];
  const row = (x) => (x / N) | 0, col = (x) => x % N;
  const add = (d) => { d.v = rng.int(3); out.push(d); };

  const ids = [...new Set(itemAt.filter(Boolean))];
  const kinds = ids.filter((i) => !ctx.isWeapon(i));
  const weaponsPresent = weaponOfRoom.filter(Boolean);
  const catsPresent = [...new Set(weaponsPresent.map((w) => ctx.weaponCat(w)))];

  const nextItem = (x, id) => {
    const r = row(x), c = col(x);
    const nb = [];
    if (r > 0) nb.push(x - N); if (r < N - 1) nb.push(x + N);
    if (c > 0) nb.push(x - 1); if (c < N - 1) nb.push(x + 1);
    return nb.some((n) => roomOf[n] === roomOf[x] && itemAt[n] === id);
  };
  const roomCount = new Array(K).fill(0);
  for (let p = 0; p < N; p++) roomCount[roomOf[pos[p]]]++;

  for (let p = 0; p < N; p++) {
    const x = pos[p], r = roomOf[x];
    add({ t: 'IN_ROOM', a: p, r });
    for (let r2 = 0; r2 < K; r2++) if (r2 !== r) add({ t: 'NOT_IN_ROOM', a: p, r: r2 });
    for (const id of ids) {
      add(itemAt[x] === id ? { t: 'ON_ITEM', a: p, k: id } : { t: 'NOT_ON_ITEM', a: p, k: id });
      add(nextItem(x, id) ? { t: 'NEXT_ITEM', a: p, k: id } : { t: 'NOT_NEXT_ITEM', a: p, k: id });
    }
    const edge = row(x) === 0 || row(x) === N - 1 || col(x) === 0 || col(x) === N - 1;
    add({ t: edge ? 'ON_EDGE' : 'NOT_EDGE', a: p });
    add({ t: roomCount[r] === 1 ? 'ALONE' : 'NOT_ALONE', a: p });
  }
  for (let p = 0; p < N; p++) {
    for (let q = p + 1; q < N; q++) {
      const x = pos[p], y = pos[q];
      const same = roomOf[x] === roomOf[y];
      add({ t: same ? 'SAME_ROOM' : 'DIFF_ROOM', a: p, b: q });
      const dr = Math.abs(row(x) - row(y)), dc = Math.abs(col(x) - col(y));
      if (same && dr + dc === 1) add({ t: 'ADJ4', a: p, b: q });
      else if (same && dr === 1 && dc === 1) add({ t: 'DIAG', a: p, b: q });
      else if (!(same && Math.max(dr, dc) === 1)) add({ t: 'NOT_NEAR', a: p, b: q });
      add(row(x) < row(y) ? { t: 'ABOVE', a: p, b: q } : { t: 'ABOVE', a: q, b: p });
      add(col(x) < col(y) ? { t: 'LEFT', a: p, b: q } : { t: 'LEFT', a: q, b: p });
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
  const vr = roomOf[pos[scene.victim]];
  const vw = weaponOfRoom[vr];
  const vcat = ctx.weaponCat(vw);
  add({ t: 'CRIME_WEAPON', w: vw });
  for (const w of weaponsPresent) if (w !== vw) add({ t: 'CRIME_NOT_WEAPON', w });
  add({ t: 'CRIME_CAT', cat: vcat });
  for (const c of catsPresent) if (c !== vcat) add({ t: 'CRIME_NOT_CAT', cat: c });
  for (const k of kinds) add(ctx.roomItems[vr].has(k) ? { t: 'CRIME_ITEM', k } : { t: 'CRIME_NOT_ITEM', k });
  return out;
}

// ------------------------------------------------------------- Compilación
function compileClue(c, ctx) {
  const { N, roomOf, itemAt, K, weaponOfRoom, roomItems } = ctx;
  const R = (x) => roomOf[x];
  const row = (x) => (x / N) | 0, col = (x) => x % N;
  const un = (a, f) => ({ kind: 'un', def: c, a, f, vars: [a], full: (pos) => f(pos[a]) });
  const bin = (a, b, f) => ({ kind: 'bin', def: c, a, b, f, vars: [a, b], full: (pos) => f(pos[a], pos[b]) });
  const nextItem = (x, id) => {
    const r = row(x), cc = col(x);
    if (r > 0 && roomOf[x - N] === roomOf[x] && itemAt[x - N] === id) return true;
    if (r < N - 1 && roomOf[x + N] === roomOf[x] && itemAt[x + N] === id) return true;
    if (cc > 0 && roomOf[x - 1] === roomOf[x] && itemAt[x - 1] === id) return true;
    if (cc < N - 1 && roomOf[x + 1] === roomOf[x] && itemAt[x + 1] === id) return true;
    return false;
  };
  const edge = (x) => row(x) === 0 || row(x) === N - 1 || col(x) === 0 || col(x) === N - 1;
  const dR = (x, y) => Math.abs(row(x) - row(y)), dC = (x, y) => Math.abs(col(x) - col(y));
  const counts = (pos) => { const k = new Array(K).fill(0); for (const x of pos) k[roomOf[x]]++; return k; };
  const cnt = (full, check) => ({ kind: 'cnt', def: c, vars: null, full, check });
  const bit = (r) => 1 << r;

  switch (c.t) {
    case 'IN_ROOM': return un(c.a, (x) => R(x) === c.r);
    case 'NOT_IN_ROOM': return un(c.a, (x) => R(x) !== c.r);
    case 'ON_ITEM': return un(c.a, (x) => itemAt[x] === c.k);
    case 'NOT_ON_ITEM': return un(c.a, (x) => itemAt[x] !== c.k);
    case 'NEXT_ITEM': return un(c.a, (x) => nextItem(x, c.k));
    case 'NOT_NEXT_ITEM': return un(c.a, (x) => !nextItem(x, c.k));
    case 'ON_EDGE': return un(c.a, (x) => edge(x));
    case 'NOT_EDGE': return un(c.a, (x) => !edge(x));
    case 'SAME_ROOM': return bin(c.a, c.b, (x, y) => R(x) === R(y));
    case 'DIFF_ROOM': return bin(c.a, c.b, (x, y) => R(x) !== R(y));
    case 'ADJ4': return bin(c.a, c.b, (x, y) => R(x) === R(y) && dR(x, y) + dC(x, y) === 1);
    case 'DIAG': return bin(c.a, c.b, (x, y) => R(x) === R(y) && dR(x, y) === 1 && dC(x, y) === 1);
    case 'NOT_NEAR': return bin(c.a, c.b, (x, y) => !(R(x) === R(y) && Math.max(dR(x, y), dC(x, y)) === 1));
    case 'ABOVE': return bin(c.a, c.b, (x, y) => row(x) < row(y));
    case 'LEFT': return bin(c.a, c.b, (x, y) => col(x) < col(y));
    case 'CRIME_WEAPON': return un(ctx.victim, (x) => weaponOfRoom[R(x)] === c.w);
    case 'CRIME_NOT_WEAPON': return un(ctx.victim, (x) => weaponOfRoom[R(x)] !== c.w);
    case 'CRIME_CAT': return un(ctx.victim, (x) => ctx.weaponCat(weaponOfRoom[R(x)]) === c.cat);
    case 'CRIME_NOT_CAT': return un(ctx.victim, (x) => ctx.weaponCat(weaponOfRoom[R(x)]) !== c.cat);
    case 'CRIME_ITEM': return un(ctx.victim, (x) => roomItems[R(x)].has(c.k));
    case 'CRIME_NOT_ITEM': return un(ctx.victim, (x) => !roomItems[R(x)].has(c.k));
    case 'ROOM_COUNT': {
      const o = cnt((pos) => counts(pos)[c.r] === c.n, (m) => !(m.def[c.r] > c.n || m.poss[c.r] < c.n));
      o.r = c.r; o.n = c.n; o.isCount = true; return o;
    }
    case 'ROOM_GT': return cnt((pos) => { const k = counts(pos); return k[c.r] > k[c.r2]; },
      (m) => !(m.poss[c.r] <= m.def[c.r2]));
    case 'ROOM_EQ': return cnt((pos) => { const k = counts(pos); return k[c.r] === k[c.r2]; },
      (m) => !(m.poss[c.r] < m.def[c.r2] || m.poss[c.r2] < m.def[c.r]));
    case 'ALONE': return cnt((pos) => counts(pos)[R(pos[c.a])] === 1, (m) => {
      const mk = m.mask[c.a];
      if (mk && (mk & (mk - 1)) === 0) { const r = 31 - Math.clz32(mk); return !(m.def[r] > 1); }
      return true;
    });
    case 'NOT_ALONE': return cnt((pos) => counts(pos)[R(pos[c.a])] > 1, (m) => {
      const mk = m.mask[c.a];
      if (mk && (mk & (mk - 1)) === 0) { const r = 31 - Math.clz32(mk); return !(m.poss[r] < 2); }
      return true;
    });
    default: throw new Error('Tipo de pista desconocido: ' + c.t);
  }
}

function compileAll(defs, ctx) {
  const cons = { un: [], bin: [], cnt: [], all: [] };
  for (const d of defs) {
    const k = compileClue(d, ctx);
    cons[k.kind].push(k);
    cons.all.push(k);
  }
  return cons;
}

// ---------------------------------------------------------------- Solucionador
function initState(ctx, cons) {
  const { N, NN, roomOf, weaponOfRoom, victim } = ctx;
  const dom = new Uint8Array(N * NN).fill(1);
  const pos = new Int16Array(N).fill(-1);
  for (let x = 0; x < NN; x++) if (!weaponOfRoom[roomOf[x]]) dom[victim * NN + x] = 0;
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
  const { N, K, roomOf, victim } = ctx;
  const p = Array.from(pos);
  const rows = new Set(), cols = new Set();
  for (const x of p) { rows.add((x / N) | 0); cols.add(x % N); }
  if (rows.size !== N || cols.size !== N) return false;
  const counts = new Array(K).fill(0);
  for (const x of p) counts[roomOf[x]]++;
  const vr = roomOf[p[victim]];
  if (counts[vr] !== 2 || !ctx.weaponOfRoom[vr]) return false;
  for (const k of cons.all) if (!k.full(p)) return false;
  return true;
}

// level 1: comprobación hacia delante · level 2: consistencia de arcos (rating)
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
  const { N, K, roomOf, weaponOfRoom, victim } = ctx;
  const idx = [];
  for (let i = 0; i < N; i++) idx.push(i);
  const worlds = [];
  let trials = 0;
  while (worlds.length < want && trials < maxTrials) {
    trials++;
    const cols = rng.shuffle(idx), rows = rng.shuffle(idx);
    const pos = new Array(N);
    for (let p = 0; p < N; p++) pos[p] = rows[p] * N + cols[rows[p]];
    const counts = new Array(K).fill(0);
    for (let p = 0; p < N; p++) counts[roomOf[pos[p]]]++;
    const vr = roomOf[pos[victim]];
    if (counts[vr] === 2 && weaponOfRoom[vr]) worlds.push(pos);
  }
  return { worlds, rate: Math.max(worlds.length, 1) / Math.max(trials, 1) };
}

// ------------------------------------------------------- Selección de pistas
function pickClues(rng, scene, ctx, content, D) {
  const pool0 = trueClues(scene, ctx, content, rng);
  const pool = [], comp = [];
  for (const d of pool0) {
    const k = compileClue(d, ctx);
    if (k.kind === 'un') {           // descarta pistas que clavan a alguien en 1-2 casillas
      let sup = 0;
      for (let x = 0; x < ctx.NN; x++) if (k.f(x)) sup++;
      if (sup < D.minSupport) continue;
    }
    pool.push(d); comp.push(k);
  }
  const wOf = (d) => (D.weights[d.t] === undefined ? 1 : D.weights[d.t]);
  const N = ctx.N;
  const usedType = {};
  const chosen = [];     // índices de pool
  const used = new Set();
  const take = (j) => { chosen.push(j); used.add(j); usedType[pool[j].t] = (usedType[pool[j].t] || 0) + 1; };
  const consOf = (idxs) => compileAllFromComp(idxs.map((j) => comp[j]));

  // fase 1: pistas "informativas" elegidas con una estimación a priori de cuánto recortan,
  // hasta que las soluciones sean pocas y se puedan enumerar con exactitud.
  const CAP = 600;
  const { worlds, rate } = sampleWorlds(rng, ctx, 1200, 40000);
  let fact = 1;
  for (let i = 2; i <= N; i++) fact *= i;
  let est = fact * fact * rate;
  const pr = comp.map((k) => {
    let c = 0;
    for (let w = 0; w < worlds.length; w++) if (k.full(worlds[w])) c++;
    return Math.max(c, 0.5) / worlds.length;
  });
  const pickInformative = () => {
    const cands = [];
    for (let j = 0; j < pool.length; j++) if (!used.has(j)) cands.push(j);
    const j = weightedPick(rng, cands, (jj) => {
      const inf = 0.05 + (1 - pr[jj]);
      return wOf(pool[jj]) * inf * inf / (1 + 0.6 * (usedType[pool[jj].t] || 0));
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
    const c = weightedPick(rng, cands, (o) => wOf(pool[o.j]) * (0.04 + o.frac * o.frac) / (1 + 0.5 * (usedType[pool[o.j].t] || 0)));
    take(c.j);
    sols = sols.filter((s) => comp[c.j].full(s));
  }
  if (sols.length !== 1) return null;

  // fase 3: dejar solo las pistas imprescindibles
  const acceptable = (idxs) => {
    const cons = consOf(idxs);
    const u = solve(ctx, cons, 2, 1, false, 12000);
    if (u.aborted || u.count !== 1) return false;
    if (D.maxGuesses < 1e8) {
      const g = solve(ctx, cons, 2, 2, false, 5000);
      if (g.aborted || g.guesses > D.maxGuesses) return false;
    }
    return true;
  };
  // Para los niveles con tope de adivinanzas puede hacer falta añadir pistas.
  if (D.maxGuesses < 1e8 && !acceptable(chosen)) {
    let extra = 40;
    while (extra-- > 0 && !acceptable(chosen)) {
      const cands = [];
      for (let j = 0; j < pool.length; j++) if (!used.has(j)) cands.push(j);
      const j = weightedPick(rng, cands, (jj) => wOf(pool[jj]) / (1 + 0.6 * (usedType[pool[jj].t] || 0)));
      if (j === null) break;
      take(j);
    }
    if (!acceptable(chosen)) return null;
  }
  let order = rng.shuffle(chosen.slice());
  let current = chosen.slice();
  for (const j of order) {
    const without = current.filter((x) => x !== j);
    if (without.length < 2) continue;
    if (acceptable(without)) current = without;
  }
  return { defs: current.map((j) => pool[j]), pool };
}

function compileAllFromComp(list) {
  const cons = { un: [], bin: [], cnt: [], all: [] };
  for (const k of list) { cons[k.kind].push(k); cons.all.push(k); }
  return cons;
}

// ------------------------------------------------------------ Puzzle completo
export function generatePuzzle(content, diffKey, seedStr, opts = {}) {
  const D = DIFFICULTIES[diffKey];
  const rng = makeRng(hashStr(seedStr + '|' + diffKey));
  let best = null;
  const t0 = Date.now();
  for (let attempt = 0; attempt < D.attempts; attempt++) {
    const scene = buildScene(rng, content, D);
    if (!scene) continue;
    const ctx = makeCtx(scene, content);
    const picked = pickClues(rng, scene, ctx, content, D);
    if (!picked) continue;
    const cons = compileAll(picked.defs, ctx);
    const rate = solve(ctx, cons, 2, 2, false, 300);
    const rating = { guesses: rate.aborted ? 999 : rate.guesses, nodes: rate.nodes, clues: picked.defs.length };
    const puzzle = assemble(scene, ctx, picked.defs, rating, content, diffKey, seedStr, rng);
    const ok = (D.minGuesses === undefined || rating.guesses >= D.minGuesses);
    if (!best || (ok && !best.ok)) best = { puzzle, ok };
    if (ok) break;
    if (opts.onProgress) opts.onProgress(attempt + 1, D.attempts);
  }
  if (!best) throw new Error('No se pudo generar el puzzle (' + diffKey + ', ' + seedStr + ')');
  best.puzzle.rating.ms = Date.now() - t0;
  return best.puzzle;
}

function clueSortKey(c) {
  const ps = [];
  if (c.a !== undefined) ps.push(c.a);
  if (c.b !== undefined) ps.push(c.b);
  return ps.length ? Math.min(...ps) : -1;
}

function assemble(scene, ctx, defs, rating, content, diffKey, seedStr, rng) {
  const clues = defs.slice().sort((x, y) => clueSortKey(x) - clueSortKey(y));
  const mansion = rng.pick(content.GAME.mansions);
  return {
    v: 1, id: diffKey + ':' + seedStr, diff: diffKey, seed: seedStr,
    N: scene.N, K: scene.K, mansion,
    roomOf: scene.roomOf, roomTypes: scene.typeIds,
    itemAt: scene.itemAt, decorAt: scene.decorAt, weaponOfRoom: scene.weaponOfRoom,
    persons: scene.persons, victim: scene.victim, murderer: scene.murderer,
    crimeRoom: scene.crimeRoom, weapon: scene.weaponOfRoom[scene.crimeRoom],
    solution: scene.solution, clues, rating,
  };
}

// Reconstruye lo necesario para validar un puzzle ya generado (tests / pistas).
export function verifyPuzzle(content, puz, cap = 2) {
  const scene = {
    N: puz.N, K: puz.K, roomOf: puz.roomOf, itemAt: puz.itemAt, weaponOfRoom: puz.weaponOfRoom,
    victim: puz.victim,
  };
  const ctx = makeCtx(scene, content);
  const cons = compileAll(puz.clues, ctx);
  const r = solve(ctx, cons, cap, 1, true, 2e6);
  return { count: r.count, sols: r.sols, aborted: r.aborted, ctx, cons };
}

export { makeCtx, compileAll, compileClue, finalCheck };
