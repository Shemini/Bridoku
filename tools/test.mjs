// Uso: node tools/test.mjs [cuantos] [dificultad]
import { CONTENT } from '../content.js';
import { generatePuzzle, verifyPuzzle, DIFFICULTIES, makeCtx, compileAll, sceneOf } from '../engine.js';

const count = +(process.argv[2] || 5);
const only = process.argv[3];

// Comprobador independiente: fuerza bruta usando solo las evaluaciones "full" de cada pista.
function bruteCount(puz) {
  const ctx = makeCtx(sceneOf(puz), CONTENT);
  const cons = compileAll(puz.clues, ctx);
  const N = puz.N;
  let found = 0;
  const pos = new Array(N).fill(-1);
  const usedCol = new Array(N).fill(false);
  // persona p se coloca en fila rowOf[p]; recorremos asignaciones persona -> (fila, col) con filas y cols distintas
  const usedRow = new Array(N).fill(false);
  function rec(p) {
    if (found > 1) return;
    if (p === N) {
      const counts = new Array(puz.K).fill(0);
      for (const x of pos) counts[puz.roomOf[x]]++;
      const vr = puz.roomOf[pos[puz.victim]];
      if (counts[vr] !== 2) return;
      for (const k of cons.all) if (!k.full(pos)) return;
      found++;
      return;
    }
    for (let r = 0; r < N; r++) {
      if (usedRow[r]) continue;
      for (let c = 0; c < N; c++) {
        if (usedCol[c]) continue;
        const x = r * N + c;
        if (!puz.walk[x]) continue;
        pos[p] = x; usedRow[r] = usedCol[c] = true;
        // poda: pistas unarias/binarias ya decidibles
        let ok = true;
        for (const k of cons.un) if (k.a === p && !k.f(x)) { ok = false; break; }
        if (ok) for (const k of cons.bin) {
          if ((k.a === p && k.b < p) || (k.b === p && k.a < p)) { if (!k.f(pos[k.a], pos[k.b])) { ok = false; break; } }
        }
        if (ok) rec(p + 1);
        usedRow[r] = usedCol[c] = false; pos[p] = -1;
      }
    }
  }
  rec(0);
  return found;
}

const keys = only ? [only] : Object.keys(DIFFICULTIES);
const typeUse = {};
for (const key of keys) {
  const times = [], clueCounts = [], guesses = [];
  let bad = 0;
  for (let i = 0; i < count; i++) {
    const t = Date.now();
    const puz = generatePuzzle(CONTENT, key, 'test' + i);
    times.push(Date.now() - t);
    clueCounts.push(puz.clues.length);
    for (const c of puz.clues) typeUse[c.t] = (typeUse[c.t] || 0) + 1;
    guesses.push(puz.rating.guesses);
    const v = verifyPuzzle(CONTENT, puz, 3);
    let status = v.count === 1 ? 'ok' : 'FALLO(' + v.count + ')';
    if (v.count === 1 && JSON.stringify(v.sols[0]) !== JSON.stringify(puz.solution)) status = 'FALLO(solucion distinta)';
    if (puz.N <= 6) {
      const b = bruteCount(puz);
      if (b !== 1) status += ' BRUTA=' + b;
    }
    const seen = new Set();
    for (const c of puz.clues) { if (c.a !== undefined) seen.add(c.a); if (c.b !== undefined) seen.add(c.b); }
    for (let p = 0; p < puz.N; p++) if (p !== puz.victim && !seen.has(p)) status += ' SIN_PISTA(' + puz.persons[p] + ')';
    if (puz.persons[puz.victim] !== CONTENT.GAME.victim) status += ' VICTIMA=' + puz.persons[puz.victim];
    const marks = puz.persons.map((id) => CONTENT.charMap[id].mark);
    if (new Set(marks).size !== marks.length) status += ' INICIALES_REPETIDAS(' + marks.join('') + ')';
    const names = puz.persons.slice(1).map((id) => CONTENT.charMap[id].name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase());
    if (names.join() !== names.slice().sort().join()) status += ' DESORDEN';
    if (status !== 'ok') { bad++; console.log(key, i, status); }
  }
  const avg = (a) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);
  console.log(`${key.padEnd(8)} ${DIFFICULTIES[key].N}x${DIFFICULTIES[key].N}  tiempo medio ${avg(times)}ms (max ${Math.max(...times)})  pistas ${avg(clueCounts)} [${Math.min(...clueCounts)}-${Math.max(...clueCounts)}]  adivinanzas ${avg(guesses)}  fallos ${bad}/${count}`);
}

console.log('Tipos de pista usados:', Object.entries(typeUse).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join(' '));
