// Novia caminante: cruza la pantalla, se detiene EXACTAMENTE en el centro para mirar
// con la lupa y sigue andando. Línea de tiempo determinista y en bucle.
const SHEET = 'sprites/walker/sheet.png';
const META = { fw: 87, fh: 112, n: 55,
  walkA: [0, 11], exit: [12, 26], hold: [27, 34], out: [35, 42], walkB: [43, 54] };
const WALK_FPS = 14, EXIT_FPS = 12, HOLD_FPS = 4, HOLD_TIMES = 2, VT = 34; // VT: px de sprite por segundo (objetivo)

export function noviaWalker(lane, opts = {}) {
  const S = opts.scale || (lane.clientWidth < 520 ? 2 : 3);
  const FW = META.fw * S, FH = META.fh * S, N = META.n;
  const W = lane.clientWidth;
  const spr = document.createElement('div');
  spr.className = 'walker-sprite';
  spr.style.cssText = `position:absolute;left:0;bottom:${-2 * S}px;width:${FW}px;height:${FH}px;` +
    `background:url(${SHEET}) 0 0/${FW * N}px ${FH}px no-repeat;image-rendering:pixelated;will-change:transform`;
  lane.appendChild(spr);

  // --- línea de tiempo ---
  const nExit = META.exit[1] - META.exit[0] + 1, nOut = META.out[1] - META.out[0] + 1;
  const ease = (i, n, up) => Math.pow(up ? i / n : 1 - i / n, 1.5);
  let sumExit = 0; for (let i = 0; i < nExit; i++) sumExit += ease(i, nExit, false) / EXIT_FPS;
  const x0 = -FW, xc = (W - FW) / 2, Tc = 12 / WALK_FPS, dist = xc - x0;
  const k = Math.max(1, Math.round((dist / (VT * S) - sumExit) / Tc));
  const V = dist / (k * Tc + sumExit);            // velocidad ajustada: para en el centro justo
  const steps = []; // {t, x, f, dt, dx}
  let t = 0, x = x0;
  const push = (f, dt, dx) => { steps.push({ t, x, f, dt, dx }); t += dt; x += dx; };
  for (let c = 0; c < k; c++) for (let f = META.walkA[0]; f <= META.walkA[1]; f++) push(f, 1 / WALK_FPS, V / WALK_FPS);
  for (let i = 0; i < nExit; i++) push(META.exit[0] + i, 1 / EXIT_FPS, V * ease(i, nExit, false) / EXIT_FPS);
  for (let r = 0; r < HOLD_TIMES; r++) for (let f = META.hold[0]; f <= META.hold[1]; f++) push(f, 1 / HOLD_FPS, 0);
  for (let i = 0; i < nOut; i++) push(META.out[0] + i, 1 / EXIT_FPS, V * ease(i, nOut, true) / EXIT_FPS);
  while (x < W) for (let f = META.walkB[0]; f <= META.walkB[1]; f++) push(f, 1 / WALK_FPS, V / WALK_FPS);
  const total = t;

  let raf = 0, start = performance.now(), last = -1, doneRes;
  const done = new Promise((res) => { doneRes = res; });
  function frame(now) {
    const el = (now - start) / 1000;
    if (opts.once && el >= total) { spr.style.transform = `translateX(${W + 10}px)`; doneRes(); return; }
    const tt = el % total;
    let lo = 0, hi = steps.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (steps[m].t <= tt) lo = m; else hi = m - 1; }
    const s = steps[lo];
    const px = Math.round((s.x + s.dx * Math.min(1, (tt - s.t) / s.dt)) / S) * S;
    spr.style.transform = `translateX(${px}px)`;
    if (s.f !== last) { spr.style.backgroundPositionX = `${-s.f * FW}px`; last = s.f; }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return {
    done,
    stop() { cancelAnimationFrame(raf); spr.remove(); doneRes(); },
    info: { S, k, V, xc, x0, total, steps },
  };
}
