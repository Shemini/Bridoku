// Uso: node tools/show.mjs <dificultad> <semilla>   -> imprime un puzzle en texto
import { CONTENT } from '../content.js';
import { generatePuzzle } from '../engine.js';
import { clueTokens, tokensToText, roomText } from '../texts.js';

const diff = process.argv[2] || 'normal';
const seed = process.argv[3] || 'demo';
const puz = generatePuzzle(CONTENT, diff, seed);
const N = puz.N;
console.log(`# ${puz.id}  ${N}x${N}  mansión ${puz.mansion}  (${puz.rating.ms}ms, ${puz.rating.clues} pistas, adivinanzas ${puz.rating.guesses})`);
console.log('Salas:', puz.roomTypes.map((t, i) => `${i}=${t}`).join(' '));
for (let r = 0; r < N; r++) {
  let line = '';
  for (let c = 0; c < N; c++) {
    const x = r * N + c;
    const it = puz.itemAt[x] || '.';
    line += `${puz.roomOf[x]}:${it.slice(0, 5).padEnd(5)} `;
  }
  console.log(line);
}
console.log('Víctima:', CONTENT.charMap[puz.persons[puz.victim]].name, '· Asesino:', CONTENT.charMap[puz.persons[puz.murderer]].name, '· Arma:', puz.weapon, '· Sala del crimen:', puz.crimeRoom);
console.log('Solución:');
for (let r = 0; r < N; r++) {
  let line = '';
  for (let c = 0; c < N; c++) {
    const p = puz.solution.indexOf(r * N + c);
    line += (p >= 0 ? CONTENT.charMap[puz.persons[p]].name.slice(0, 4) : '----').padEnd(6);
  }
  console.log(line);
}
console.log('Pistas:');
for (const c of puz.clues) console.log(' -', tokensToText(clueTokens(c, puz, CONTENT), puz, CONTENT), `[${c.t}]`);
