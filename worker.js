// Genera los puzzles en segundo plano para que la pantalla no se quede congelada.
import { generatePuzzle } from './engine.js';
import { CONTENT } from './content.js';

self.onmessage = (e) => {
  const { id, diff, seed } = e.data;
  try {
    self.postMessage({ id, puzzle: generatePuzzle(CONTENT, diff, seed) });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message ? err.message : err) });
  }
};
