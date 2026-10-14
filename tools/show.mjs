// Uso: node tools/show.mjs <dificultad> <semilla>   -> imprime un puzzle en texto
import { CONTENT } from '../content.js';
import { generatePuzzle } from '../engine.js';
import { clueTokens, tokensToText } from '../texts.js';

const diff = process.argv[2] || 'normal';
const seed = process.argv[3] || 'demo';
const puz = generatePuzzle(CONTENT, diff, seed);
const N = puz.N;
const name = (p) => CONTENT.charMap[puz.persons[p]].name;
console.log(`# ${puz.id}  ${N}x${N}  finca ${puz.venue}  (${puz.rating.ms}ms, ${puz.rating.clues} pistas, adivinanzas ${puz.rating.guesses})`);
console.log('Salas:', puz.roomTypes.map((t, i) => `${i}=${t}`).join(' '));
for (let r = 0; r < N; r++) {
  let line = '';
  for (let c = 0; c < N; c++) {
    const x = r * N + c;
    const o = puz.cellObj[x];
    const t = o >= 0 ? puz.objs[o].t : '';
    const p = puz.solution.indexOf(x);
    const mark = p >= 0 ? '[' + CONTENT.charMap[puz.persons[p]].mark + ']' : (puz.walk[x] ? '   ' : '###');
    const op = (puz.winAt[x] ? 'v' : ' ') + (puz.doorAt[x] ? 'p' : ' ');
    line += `${puz.roomOf[x]}:${t.slice(0, 6).padEnd(6)}${mark}${op}| `;
  }
  console.log(line);
}
console.log('Víctima:', name(puz.victim), '· Asesino:', name(puz.murderer), '· Sala del crimen:', puz.roomTypes[puz.crimeRoom]);
console.log('Pistas:');
for (const c of puz.clues) console.log(' -', tokensToText(clueTokens(c, puz, CONTENT), puz, CONTENT), `[${c.t}]`);
