// ============================================================================
//  IDIOMAS · textos de la interfaz en español e inglés.
//  Para añadir un idioma: una entrada más en LANGS y en STR (las claves que
//  falten se muestran en español).
// ============================================================================

export const LANGS = [
  { id: 'es', label: 'ES', name: 'Español' },
  { id: 'en', label: 'EN', name: 'English' },
];

const browser = typeof window !== 'undefined';
let lang = 'es';
if (browser) {
  try {
    const saved = JSON.parse(localStorage.getItem('mdk.lang') || 'null');
    if (saved && LANGS.some((l) => l.id === saved)) lang = saved;
    else lang = (navigator.language || 'es').toLowerCase().startsWith('es') ? 'es' : 'en';
  } catch (e) { /* sin almacenamiento */ }
}

export const getLang = () => lang;
export function setLang(l) {
  if (!LANGS.some((x) => x.id === l)) return;
  lang = l;
  if (browser) {
    try { localStorage.setItem('mdk.lang', JSON.stringify(l)); } catch (e) { /* nada */ }
    document.documentElement.lang = l;
  }
}
export function nextLang() { const i = LANGS.findIndex((l) => l.id === lang); return LANGS[(i + 1) % LANGS.length].id; }

const pl = (n, one, many) => (n === 1 ? one : many);

const STR = {
  es: {
    eyebrow: 'Rompecabezas de lógica',
    subtitle: 'Una boda. Un novio muerto. Una cuadrícula.',
    todayCases: 'Casos de hoy',
    streak: ({ n }) => `🔥 Racha ${n}`,
    todayInfo: 'Un caso por dificultad. Son los mismos para todo el mundo y cambian cada día.',
    inProgress: 'En curso',
    resumeInfo: ({ t }) => `Tienes un caso del archivo a medias · ${t}`,
    continue: 'Continuar',
    archiveBtn: '📅 Archivo de casos anteriores',
    howto: 'Cómo se juega',
    settings: 'Ajustes',
    fine: 'Los casos se generan en tu dispositivo · funciona sin conexión',
    language: 'Idioma',
    stSolved: ({ t }) => `✓ ${t}`,
    stPlaying: ({ t }) => `En curso · ${t}`,
    stNew: 'Sin empezar',
    plan: ({ n, s }) => `Plano ${n}×${n} · ${s} sospechosos`,
    'diff.facil': 'Fácil', 'diff.normal': 'Normal', 'diff.dificil': 'Difícil', 'diff.experto': 'Experto',
    caseN: ({ n }) => `Caso #${n}`,
    freeCase: 'Caso libre',
    archiveTitle: 'Archivo de casos',
    prevMonth: 'Mes anterior', nextMonth: 'Mes siguiente',
    weekHead: ['L', 'M', 'X', 'J', 'V', 'S', 'D'],
    archiveHint: 'Cada cuadradito es una dificultad (Fácil, Normal, Difícil, Experto): relleno si está resuelto, a medias si está en curso.',
    backCalendar: '‹ Volver al calendario',
    months: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    wdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayLong: ({ wd, d, m }) => `${wd} ${d} de ${m}`,
    dayShort: ({ d, m }) => `${d} ${m.slice(0, 3)}`,
    loading: ['Investigando el caso…', 'Interrogando a los invitados…', 'Repasando el seating plan…', 'Comprobando coartadas…', 'Revisando las fotos del photocall…', 'Cerrando las puertas de la finca…'],
    tapSkip: 'Toca para continuar',
    notAvailable: 'Ese caso aún no está disponible',
    fsIos: '📲 Jugar a pantalla completa',
    fsBtn: '⛶ Pantalla completa',
    fsFail: 'Tu navegador no permite pantalla completa aquí',
    iosTitle: 'Pantalla completa en iPhone',
    iosBody: ({ chrome }) => `
    <p>En iPhone, Safari no permite que una web ocupe toda la pantalla. La solución es <b>añadir Bridoku a la pantalla de inicio</b>: desde su icono se abre como una app, sin barras del navegador y también sin conexión.</p>
    <ol class="steps">
      ${chrome
        ? '<li>Toca el botón <b>Compartir</b> <span class="ios-share" aria-hidden="true"></span> junto a la barra de direcciones.</li>'
        : '<li>Toca el botón <b>Compartir</b> <span class="ios-share" aria-hidden="true"></span> de Safari. En iOS 26, si no lo ves, toca primero <b>···</b> abajo a la derecha.</li>'}
      <li>Elige <b>Añadir a pantalla de inicio</b> (si no aparece, desliza la lista o toca <b>Ver más</b>).</li>
      <li>Deja activado <b>Abrir como app web</b> y toca <b>Añadir</b>.</li>
      <li>Abre <b>Bridoku</b> desde el nuevo icono.</li>
    </ol>
    <p class="hint">Ojo: el iPhone guarda por separado el progreso de la app y el de Safari, así que los casos empezados aquí no aparecerán en la app.</p>`,
    gotIt: 'Entendido',
    menu: 'Menú', hint: 'Pista', check: 'Revisar', help: 'Ayuda',
    intro: ({ venue, name, role, him }) => `Finca ${venue}: <b>${name}</b>, ${role}, ha aparecido sin vida. ¿Quién estuvo a solas con ${him}?`,
    him: 'él', her: 'ella',
    clues: 'Pistas',
    used: ({ n, m }) => `${n}/${m} usadas`,
    victimRule: ({ v }) => `${v} estaba a solas con su asesino: en su habitación solo había otra persona.`,
    markUsed: 'Marcar como usada',
    modeErase: '<b class="m-erase">Borrar</b> toca casillas para vaciarlas por completo',
    modeEmpty: '<b class="m-empty">Vacía</b> toca casillas donde no puede haber nadie',
    modeNone: 'Elige un personaje y toca una casilla',
    modePen: ({ n }) => `<b class="m-pen">Lápiz</b> posibles casillas de <b>${n}</b>`,
    modeSol: ({ n }) => `<b class="m-sol">Colocar</b> <b>${n}</b> · toca su casilla`,
    tPen: 'Lápiz', tEmpty: 'Vacía', tErase: 'Borrar', tUndo: 'Deshacer', tAccuse: 'Acusar',
    lockedCell: 'Esta casilla la reveló una pista',
    blockedCell: 'Ahí hay un mueble: nadie puede ocupar esa casilla',
    removeFirst: 'Primero quita al personaje de esa casilla',
    pickFirst: 'Elige primero un personaje de la lista',
    hasSolution: 'Esa casilla ya tiene una solución',
    allGood: 'Ya está todo bien colocado. ¡Acusa al culpable!',
    hintShown: ({ n }) => `${n} estaba aquí (pista revelada)`,
    checkOk: 'Todo lo que has marcado es correcto ✔︎',
    checkNothing: 'Aún no hay nada que revisar',
    badSol: ({ n }) => `${n} ${pl(n, 'personaje mal colocado', 'personajes mal colocados')}`,
    badEmp: ({ n }) => `${n} ${pl(n, 'casilla marcada', 'casillas marcadas')} como vacía sin estarlo`,
    badPen: ({ n }) => `al lápiz de ${n} ${pl(n, 'personaje', 'personajes')} le falta su casilla real`,
    accuseText: ({ v }) => `El asesino es la única persona que estuvo a solas con <b>${v}</b> en su habitación. ¿Quién fue?`,
    accuseTitle: '¿Quién fue?',
    pickSuspect: 'Elige a un sospechoso',
    wrongAccuse: ({ n }) => `❌ ${n} no estuvo a solas con la víctima`,
    story: ({ m, v, room }) => `${m} estuvo a solas con ${v} en ${room}.`,
    solvedTitle: '¡Caso resuelto!', closedTitle: 'Caso cerrado',
    isMurderer: ({ n, f }) => `${n} es ${f ? 'la asesina' : 'el asesino'}`,
    statHints: ({ n }) => `💡 ${n} ${pl(n, 'pista', 'pistas')}`,
    statChecks: ({ n }) => `✔︎ ${n} ${pl(n, 'revisión', 'revisiones')}`,
    statWrong: ({ n }) => `❌ ${n} ${pl(n, 'fallo', 'fallos')}`,
    share: 'Compartir resultado',
    nextCase: ({ d, day }) => `Siguiente: ${d} del ${day}`,
    archiveShort: '📅 Archivo de casos',
    backHome: 'Volver al inicio',
    streakOf: ({ n }) => `🔥 racha de ${n}`,
    shareText: ({ title, num, diff, t, h, c }) => `${title} · ${num} · ${diff}\n✅ Resuelto en ${t} · 💡 ${h} · ✔︎ ${c}`,
    copied: 'Resultado copiado',
    howtoBody: ({ v, ic }) => `
    <p>En plena boda, <b>${v}</b> ha aparecido sin vida en algún rincón de la finca. Todos los personajes, <b>incluida la víctima</b>, están en el plano. Colócalos a todos y descubre quién estuvo a solas con él.</p>
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
      <li><b>${ic.lapiz} Lápiz:</b> con un personaje elegido, anota dónde <i>podría</i> estar. Tocar de nuevo borra la marca. Las marcas se conservan debajo de una solución y reaparecen si la quitas.</li>
      <li><b>${ic.vacio} Vacía:</b> oscurece casillas donde estás seguro de que no hay nadie.</li>
      <li><b>${ic.goma} Borrar:</b> vacía por completo cada casilla que toques.</li>
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
    </ul>`,
    letsGo: '¡A investigar!',
    sRowcol: 'Oscurecer filas y columnas ocupadas', sRowcolSub: 'Al colocar a alguien, su fila y columna se oscurecen.',
    sConf: 'Marcar conflictos', sConfSub: 'Borde rojo si dos soluciones comparten fila o columna, o si repites personaje.',
    sTimer: 'Mostrar el cronómetro', sTimerSub: 'El tiempo se sigue contando aunque lo ocultes.',
    sVib: 'Vibración', sVibSub: 'Respuesta háptica al tocar (si tu móvil lo permite).',
    sFs: 'Pantalla completa automática', sFsSub: 'En móviles, al empezar un caso.',
    sprites: 'Galería de sprites',
    reset: 'Borrar todo el progreso',
    resetConfirm: '¿Borrar todos los casos y estadísticas de este dispositivo?',
    galHint: 'Los que aparecen en gris aún usan un dibujo provisional. Deja el PNG con ese nombre en su carpeta y se usará solo.',
    galChars: 'Personajes', galItems: 'Muebles', galFloors: 'Suelos',
    galTile: 'baldosa', galWalk: 'se pisa',
  },

  en: {
    eyebrow: 'Logic puzzle',
    subtitle: 'A wedding. A dead groom. A grid.',
    todayCases: "Today's cases",
    streak: ({ n }) => `🔥 Streak ${n}`,
    todayInfo: 'One case per difficulty. Everyone gets the same ones, and they change every day.',
    inProgress: 'In progress',
    resumeInfo: ({ t }) => `You have an unfinished case from the archive · ${t}`,
    continue: 'Continue',
    archiveBtn: '📅 Past cases archive',
    howto: 'How to play',
    settings: 'Settings',
    fine: 'Cases are generated on your device · works offline',
    language: 'Language',
    stSolved: ({ t }) => `✓ ${t}`,
    stPlaying: ({ t }) => `In progress · ${t}`,
    stNew: 'Not started',
    plan: ({ n, s }) => `${n}×${n} map · ${s} suspects`,
    'diff.facil': 'Easy', 'diff.normal': 'Normal', 'diff.dificil': 'Hard', 'diff.experto': 'Expert',
    caseN: ({ n }) => `Case #${n}`,
    freeCase: 'Free case',
    archiveTitle: 'Case archive',
    prevMonth: 'Previous month', nextMonth: 'Next month',
    weekHead: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
    archiveHint: 'Each little square is a difficulty (Easy, Normal, Hard, Expert): filled if solved, half-filled if in progress.',
    backCalendar: '‹ Back to the calendar',
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    wdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayLong: ({ wd, d, m }) => `${wd}, ${m} ${d}`,
    dayShort: ({ d, m }) => `${m.slice(0, 3)} ${d}`,
    loading: ['Investigating the case…', 'Questioning the guests…', 'Checking the seating plan…', 'Verifying alibis…', 'Going through the photo booth pictures…', 'Locking the estate gates…'],
    tapSkip: 'Tap to continue',
    notAvailable: "That case isn't available yet",
    fsIos: '📲 Play full screen',
    fsBtn: '⛶ Full screen',
    fsFail: "Your browser doesn't allow full screen here",
    iosTitle: 'Full screen on iPhone',
    iosBody: ({ chrome }) => `
    <p>On iPhone, Safari doesn't let a website take up the whole screen. The fix is to <b>add Bridoku to your Home Screen</b>: from its icon it opens like an app, without browser bars, and it also works offline.</p>
    <ol class="steps">
      ${chrome
        ? '<li>Tap the <b>Share</b> button <span class="ios-share" aria-hidden="true"></span> next to the address bar.</li>'
        : '<li>Tap Safari\'s <b>Share</b> button <span class="ios-share" aria-hidden="true"></span>. On iOS 26, if you can\'t see it, first tap <b>···</b> at the bottom right.</li>'}
      <li>Choose <b>Add to Home Screen</b> (if it isn't there, scroll the list or tap <b>View More</b>).</li>
      <li>Leave <b>Open as Web App</b> on and tap <b>Add</b>.</li>
      <li>Open <b>Bridoku</b> from the new icon.</li>
    </ol>
    <p class="hint">Note: the iPhone keeps the app's progress separate from Safari's, so cases started here won't show up in the app.</p>`,
    gotIt: 'Got it',
    menu: 'Menu', hint: 'Hint', check: 'Check', help: 'Help',
    intro: ({ venue, name, role, him }) => `${venue} estate: <b>${name}</b>, ${role}, has been found dead. Who was alone with ${him}?`,
    him: 'him', her: 'her',
    clues: 'Clues',
    used: ({ n, m }) => `${n}/${m} used`,
    victimRule: ({ v }) => `${v} was alone with the killer: only one other person was in the room.`,
    markUsed: 'Mark as used',
    modeErase: '<b class="m-erase">Erase</b> tap squares to clear them completely',
    modeEmpty: '<b class="m-empty">Empty</b> tap squares where nobody can be',
    modeNone: 'Pick a character and tap a square',
    modePen: ({ n }) => `<b class="m-pen">Pencil</b> possible squares for <b>${n}</b>`,
    modeSol: ({ n }) => `<b class="m-sol">Place</b> <b>${n}</b> · tap their square`,
    tPen: 'Pencil', tEmpty: 'Empty', tErase: 'Erase', tUndo: 'Undo', tAccuse: 'Accuse',
    lockedCell: 'This square was revealed by a hint',
    blockedCell: "There's furniture there: nobody can stand on that square",
    removeFirst: 'First remove the character from that square',
    pickFirst: 'Pick a character from the list first',
    hasSolution: 'That square already has an answer',
    allGood: 'Everything is placed correctly. Accuse the culprit!',
    hintShown: ({ n }) => `${n} was here (hint revealed)`,
    checkOk: 'Everything you marked is correct ✔︎',
    checkNothing: 'Nothing to check yet',
    badSol: ({ n }) => `${n} ${pl(n, 'character', 'characters')} in the wrong place`,
    badEmp: ({ n }) => `${n} ${pl(n, 'square', 'squares')} marked empty that ${pl(n, "isn't", "aren't")}`,
    badPen: ({ n }) => `the pencil marks for ${n} ${pl(n, 'character are', 'characters are')} missing their real square`,
    accuseText: ({ v }) => `The killer is the only person who was alone with <b>${v}</b> in the room. Who was it?`,
    accuseTitle: 'Who did it?',
    pickSuspect: 'Pick a suspect',
    wrongAccuse: ({ n }) => `❌ ${n} wasn't alone with the victim`,
    story: ({ m, v, room }) => `${m} was alone with ${v} in ${room}.`,
    solvedTitle: 'Case solved!', closedTitle: 'Case closed',
    isMurderer: ({ n }) => `${n} is the killer`,
    statHints: ({ n }) => `💡 ${n} ${pl(n, 'hint', 'hints')}`,
    statChecks: ({ n }) => `✔︎ ${n} ${pl(n, 'check', 'checks')}`,
    statWrong: ({ n }) => `❌ ${n} ${pl(n, 'miss', 'misses')}`,
    share: 'Share result',
    nextCase: ({ d, day }) => `Next: ${d} for ${day}`,
    archiveShort: '📅 Case archive',
    backHome: 'Back to home',
    streakOf: ({ n }) => `🔥 ${n}-day streak`,
    shareText: ({ title, num, diff, t, h, c }) => `${title} · ${num} · ${diff}\n✅ Solved in ${t} · 💡 ${h} · ✔︎ ${c}`,
    copied: 'Result copied',
    howtoBody: ({ v, ic }) => `
    <p>In the middle of the wedding, <b>${v}</b> has been found dead somewhere on the estate. Every character, <b>the victim included</b>, is on the map. Place them all and find out who was alone with him.</p>
    <h4>The rules</h4>
    <ul>
      <li>There is exactly <b>one person per row and one per column</b>.</li>
      <li>Nobody can be on a square with an <b>obstacle</b> (tables, plants, pianos, wardrobes…): those squares are darkened. People can be <b>on</b> chairs, armchairs, sofas, beds, benches or rugs.</li>
      <li>Clues are always <b>true</b>.</li>
      <li>The victim was <b>alone with the killer</b>: only one other person was in the room.</li>
    </ul>
    <h4>Marking</h4>
    <ul>
      <li><b>Place:</b> tap a character, then their square. Tap the same square again to remove them.</li>
      <li><b>${ic.lapiz} Pencil:</b> with a character selected, note where they <i>could</i> be. Tap again to remove the mark. Marks stay under an answer and come back if you remove it.</li>
      <li><b>${ic.vacio} Empty:</b> darkens squares where you're sure nobody is.</li>
      <li><b>${ic.goma} Erase:</b> completely clears every square you tap.</li>
      <li>The row and column of each answer darken automatically; if two answers clash or you place someone twice, they're outlined in <b style="color:#ff8b7d">red</b>.</li>
      <li>Tap a clue to see what it refers to on the map; tick ✓ to cross it off.</li>
    </ul>
    <h4>Reading the clues</h4>
    <ul>
      <li><b>Next to</b>: an adjacent square (up, down, left or right) <u>in the same room</u>. A wall in between doesn't count, and neither do diagonals.</li>
      <li><b>Doors and windows</b> are in the walls: "by a window" means being on a square that touches that wall.</li>
      <li><b>Up, down, left and right</b> refer to the map as you see it.</li>
      <li>"Next to the plant" means the only plant on the map. If there are several, the clue says "next to <b>one of the</b> plants": any of them counts (tapping the clue lights them all up).</li>
      <li>"In the same row as the piano": the piano is in that row, in any room.</li>
    </ul>`,
    letsGo: "Let's investigate!",
    sRowcol: 'Darken occupied rows and columns', sRowcolSub: 'When you place someone, their row and column darken.',
    sConf: 'Highlight conflicts', sConfSub: 'Red outline if two answers share a row or column, or if you place someone twice.',
    sTimer: 'Show the timer', sTimerSub: 'Time keeps counting even if you hide it.',
    sVib: 'Vibration', sVibSub: 'Haptic feedback on tap (if your phone supports it).',
    sFs: 'Automatic full screen', sFsSub: 'On phones, when starting a case.',
    sprites: 'Sprite gallery',
    reset: 'Delete all progress',
    resetConfirm: 'Delete all cases and stats on this device?',
    galHint: 'Greyed-out ones still use a placeholder. Drop a PNG with that name into its folder and it will be used automatically.',
    galChars: 'Characters', galItems: 'Furniture', galFloors: 'Floors',
    galTile: 'tile', galWalk: 'walkable',
  },
};

// tr('clave', {variables}) → texto en el idioma actual (si falta, en español)
export function tr(key, vars) {
  const v = (STR[lang] && STR[lang][key] !== undefined) ? STR[lang][key] : STR.es[key];
  if (v === undefined) return key;
  return typeof v === 'function' ? v(vars || {}) : v;
}
