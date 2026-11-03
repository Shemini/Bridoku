// Uso: node tools/check-dailies.mjs 2026-10-01 2026-11-03 [dificultad]
// Comprueba por fuerza bruta que cada caso diario de esas fechas tiene una única solución.
import { CONTENT } from '../content.js';
import { generatePuzzle, verifyPuzzle, DIFFICULTIES, makeCtx, compileAll, sceneOf } from '../engine.js';
const src = (await import('fs')).readFileSync(new URL('./test.mjs', import.meta.url), 'utf8');
const bruteCount = new Function('makeCtx', 'compileAll', 'sceneOf', 'CONTENT', src.slice(src.indexOf('function bruteCount'), src.indexOf('\nconst keys')) + '\nreturn bruteCount;')(makeCtx, compileAll, sceneOf, CONTENT);
const [from, to, onlyDiff] = process.argv.slice(2);
const days = []; for (let d = new Date(from + 'T12:00:00Z'); d <= new Date(to + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + 1)) days.push(d.toISOString().slice(0, 10));
for (const day of days) for (const diff of (onlyDiff ? [onlyDiff] : Object.keys(DIFFICULTIES))) {
  const puz = generatePuzzle(CONTENT, diff, 'D' + day);
  const t = Date.now(); const b = bruteCount(puz); const v = verifyPuzzle(CONTENT, puz, 3);
  console.log(day, diff.padEnd(8), 'bruta=' + b, 'motor=' + v.count, (Date.now() - t) + 'ms', b === 1 && v.count === 1 ? '' : '  <<<<< ');
}
