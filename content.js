// ============================================================================
//  CONTENIDO DEL JUEGO  ·  Todo lo que el generador usa para montar puzzles.
//
//  Para añadir un sprite NO hace falta tocar este archivo: basta con dejar el
//  PNG en la carpeta indicada (ver README.md). Mientras no exista el PNG, el
//  juego dibuja el emoji / círculo de color de aquí como sustituto.
// ============================================================================

export const GAME = {
  title: 'Murdoku',
  subtitle: 'Un crimen. Un asesino. Una cuadrícula.',
  epoch: '2026-10-14',            // día 1 del "Caso del día"
  mansions: [
    'Villaverde', 'Montealegre', 'Altamira', 'Roncesvalles', 'Valdecruces',
    'Peñalba', 'Torrebruna', 'Fontanar', 'Belmonte', 'Sierra Oscura',
  ],
};

// --- Personajes (sprite: sprites/characters/<id>.png, opcional <id>_dead.png) ---
// mark: la letra que se usa en las marcas a lápiz (mejor que no se repita).
// g: 'm' / 'f' para concordar las frases ("sentado" / "sentada").
export const CHARACTERS = [
  { id: 'alfredo',   name: 'Alfredo',   mark: 'A', g: 'm', role: 'El mayordomo',     color: '#4f6d9a' },
  { id: 'beatriz',   name: 'Beatriz',   mark: 'B', g: 'f', role: 'La condesa',       color: '#9b59b6' },
  { id: 'candido',   name: 'Cándido',   mark: 'C', g: 'm', role: 'El cocinero',      color: '#d9822b' },
  { id: 'dolores',   name: 'Dolores',   mark: 'D', g: 'f', role: 'La doncella',      color: '#e05c8a' },
  { id: 'eusebio',   name: 'Eusebio',   mark: 'E', g: 'm', role: 'El párroco',       color: '#7a5a3f' },
  { id: 'fernanda',  name: 'Fernanda',  mark: 'F', g: 'f', role: 'La viuda',         color: '#3b3b4a' },
  { id: 'gregorio',  name: 'Gregorio',  mark: 'G', g: 'm', role: 'El jardinero',     color: '#4f9d5d' },
  { id: 'herminia',  name: 'Herminia',  mark: 'H', g: 'f', role: 'La doctora',       color: '#2aa7a0' },
  { id: 'ismael',    name: 'Ismael',    mark: 'I', g: 'm', role: 'El coronel',       color: '#b83b3b' },
  { id: 'julia',     name: 'Julia',     mark: 'J', g: 'f', role: 'La actriz',        color: '#c2417a' },
  { id: 'leandro',   name: 'Leandro',   mark: 'L', g: 'm', role: 'El marqués',       color: '#b8931f' },
  { id: 'mercedes',  name: 'Mercedes',  mark: 'M', g: 'f', role: 'El ama de llaves', color: '#5d6b2f' },
];

// --- Mobiliario (sprite: sprites/items/<id>.png) ---
//  walk : true  → se puede estar encima (sentado, tumbado, de pie)
//         false → obstáculo: nadie puede ocupar esa casilla
//  shape: 'one'  → 1 casilla
//         'pair' → 2 casillas seguidas (sprite dibujado en horizontal, el doble de ancho que de alto;
//                  si el mueble va en vertical, el juego lo gira)
//         'area' → rectángulo de varias casillas (size: [mín, máx] casillas). El sprite es una
//                  baldosa que se repite en cada casilla.
//  around: el mueble se coloca pegado a alguno de estos (las sillas, alrededor de las mesas)
//  wall  : se coloca preferentemente contra una pared
//  part/prep: cómo se dice estar encima ("sentad" + o/a + " en"), solo para los transitables
export const ITEMS = [
  // --- transitables ---
  { id: 'silla',      name: 'silla',            det: 'una', walk: true,  shape: 'one',  part: 'sentad', prep: 'en',    around: ['mesa', 'mesa_larga', 'escritorio'], emoji: '🪑' },
  { id: 'sillon',     name: 'sillón',           det: 'un',  walk: true,  shape: 'one',  part: 'sentad', prep: 'en',    emoji: '💺' },
  { id: 'sofa',       name: 'sofá',             det: 'un',  walk: true,  shape: 'pair', part: 'sentad', prep: 'en',    wall: true, emoji: '🛋️' },
  { id: 'cama',       name: 'cama',             det: 'una', walk: true,  shape: 'pair', part: 'tumbad', prep: 'en',    wall: true, emoji: '🛏️' },
  { id: 'alfombra',   name: 'alfombra',         det: 'una', walk: true,  shape: 'area', size: [2, 6], part: '', prep: 'sobre', emoji: '' },
  { id: 'banco',      name: 'banco',            det: 'un',  walk: true,  shape: 'pair', part: 'sentad', prep: 'en',    emoji: '🪵' },
  { id: 'taburete',   name: 'taburete',         det: 'un',  walk: true,  shape: 'one',  part: 'sentad', prep: 'en',    around: ['bar', 'billar'], emoji: '' },
  { id: 'inodoro',    name: 'inodoro',          det: 'un',  walk: true,  shape: 'one',  part: 'sentad', prep: 'en',    wall: true, emoji: '🚽' },
  // --- obstáculos ---
  { id: 'mesa',       name: 'mesa',             det: 'una', walk: false, shape: 'area', size: [1, 4], emoji: '' },
  { id: 'mesa_larga', name: 'mesa de banquete', det: 'una', walk: false, shape: 'area', size: [2, 6], emoji: '' },
  { id: 'escritorio', name: 'escritorio',       det: 'un',  walk: false, shape: 'pair', emoji: '🖋️' },
  { id: 'planta',     name: 'planta',           det: 'una', walk: false, shape: 'one',  emoji: '🪴' },
  { id: 'piano',      name: 'piano',            det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '🎹' },
  { id: 'chimenea',   name: 'chimenea',         det: 'una', walk: false, shape: 'one',  wall: true, emoji: '🔥' },
  { id: 'tele',       name: 'televisor',        det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '📺' },
  { id: 'estanteria', name: 'estantería',       det: 'una', walk: false, shape: 'pair', wall: true, emoji: '📚' },
  { id: 'armario',    name: 'armario',          det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🚪' },
  { id: 'mesilla',    name: 'mesilla',          det: 'una', walk: false, shape: 'one',  around: ['cama'], emoji: '🕯️' },
  { id: 'tocador',    name: 'tocador',          det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '💄' },
  { id: 'nevera',     name: 'nevera',           det: 'una', walk: false, shape: 'one',  wall: true, emoji: '🧊' },
  { id: 'horno',      name: 'horno',            det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🍳' },
  { id: 'fregadero',  name: 'fregadero',        det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🚰' },
  { id: 'banera',     name: 'bañera',           det: 'una', walk: false, shape: 'pair', wall: true, emoji: '🛁' },
  { id: 'lavabo',     name: 'lavabo',           det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🚿' },
  { id: 'globo',      name: 'globo terráqueo',  det: 'un',  walk: false, shape: 'one',  emoji: '🌍' },
  { id: 'aparador',   name: 'aparador',         det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '🗄️' },
  { id: 'caja_fuerte',name: 'caja fuerte',      det: 'una', walk: false, shape: 'one',  wall: true, emoji: '🔐' },
  { id: 'archivador', name: 'archivador',       det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🗂️' },
  { id: 'fuente',     name: 'fuente',           det: 'una', walk: false, shape: 'one',  emoji: '⛲' },
  { id: 'estatua',    name: 'estatua',          det: 'una', walk: false, shape: 'one',  emoji: '🗿' },
  { id: 'rosal',      name: 'rosal',            det: 'un',  walk: false, shape: 'one',  emoji: '🌹' },
  { id: 'barril',     name: 'barril',           det: 'un',  walk: false, shape: 'one',  emoji: '🛢️' },
  { id: 'botellero',  name: 'botellero',        det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '🍾' },
  { id: 'caja',       name: 'caja de madera',   det: 'una', walk: false, shape: 'one',  emoji: '📦' },
  { id: 'perchero',   name: 'perchero',         det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🧥' },
  { id: 'reloj',      name: 'reloj de pie',     det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🕰️' },
  { id: 'altar',      name: 'altar',            det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '✝️' },
  { id: 'billar',     name: 'mesa de billar',   det: 'una', walk: false, shape: 'pair', emoji: '🎱' },
  { id: 'bar',        name: 'barra de bar',     det: 'una', walk: false, shape: 'pair', wall: true, emoji: '🥃' },
];

// --- Tipos de habitación (suelo: sprites/floors/<id>.png, una baldosa por casilla) ---
// furnish: lista de muebles en orden de colocación.
//   n: [mín, máx] unidades · p: probabilidad de que aparezca (por defecto 1)
export const ROOM_TYPES = [
  { id: 'cocina', name: 'cocina', art: 'la', label: 'Cocina', color: '#e6d9a6', furnish: [
    { t: 'mesa', n: [1, 1] }, { t: 'silla', n: [1, 3] }, { t: 'nevera', n: [1, 1], p: 0.8 }, { t: 'horno', n: [1, 1], p: 0.8 }, { t: 'fregadero', n: [1, 1], p: 0.6 }] },
  { id: 'salon', name: 'salón', art: 'el', label: 'Salón', color: '#d9b8a0', furnish: [
    { t: 'alfombra', n: [1, 1], p: 0.8 }, { t: 'sofa', n: [1, 1] }, { t: 'sillon', n: [1, 2], p: 0.8 }, { t: 'piano', n: [1, 1], p: 0.5 }, { t: 'chimenea', n: [1, 1], p: 0.5 }, { t: 'tele', n: [1, 1], p: 0.5 }, { t: 'planta', n: [1, 2], p: 0.7 }] },
  { id: 'dormitorio', name: 'dormitorio', art: 'el', label: 'Dormitorio', color: '#c9c3e3', furnish: [
    { t: 'cama', n: [1, 1] }, { t: 'mesilla', n: [1, 2], p: 0.8 }, { t: 'alfombra', n: [1, 1], p: 0.6 }, { t: 'armario', n: [1, 1], p: 0.7 }, { t: 'tocador', n: [1, 1], p: 0.4 }, { t: 'sillon', n: [1, 1], p: 0.3 }] },
  { id: 'bano', name: 'baño', art: 'el', label: 'Baño', color: '#b9dde4', furnish: [
    { t: 'banera', n: [1, 1], p: 0.8 }, { t: 'inodoro', n: [1, 1] }, { t: 'lavabo', n: [1, 1], p: 0.8 }, { t: 'planta', n: [1, 1], p: 0.3 }] },
  { id: 'biblioteca', name: 'biblioteca', art: 'la', label: 'Biblioteca', color: '#c8b08a', furnish: [
    { t: 'estanteria', n: [1, 2] }, { t: 'alfombra', n: [1, 1], p: 0.6 }, { t: 'sillon', n: [1, 2] }, { t: 'mesa', n: [1, 1], p: 0.5 }, { t: 'silla', n: [1, 2], p: 0.7 }, { t: 'globo', n: [1, 1], p: 0.5 }] },
  { id: 'comedor', name: 'comedor', art: 'el', label: 'Comedor', color: '#e0c4b0', furnish: [
    { t: 'mesa_larga', n: [1, 1] }, { t: 'silla', n: [2, 5] }, { t: 'aparador', n: [1, 1], p: 0.6 }, { t: 'planta', n: [1, 1], p: 0.5 }, { t: 'chimenea', n: [1, 1], p: 0.3 }] },
  { id: 'despacho', name: 'despacho', art: 'el', label: 'Despacho', color: '#b7c4a8', furnish: [
    { t: 'escritorio', n: [1, 1] }, { t: 'silla', n: [1, 2] }, { t: 'caja_fuerte', n: [1, 1], p: 0.5 }, { t: 'archivador', n: [1, 1], p: 0.6 }, { t: 'sillon', n: [1, 1], p: 0.6 }, { t: 'alfombra', n: [1, 1], p: 0.4 }, { t: 'planta', n: [1, 1], p: 0.4 }] },
  { id: 'invernadero', name: 'invernadero', art: 'el', label: 'Invernadero', color: '#b4dcae', furnish: [
    { t: 'planta', n: [2, 4] }, { t: 'banco', n: [1, 1] }, { t: 'fuente', n: [1, 1], p: 0.5 }, { t: 'sillon', n: [1, 1], p: 0.4 }] },
  { id: 'bodega', name: 'bodega', art: 'la', label: 'Bodega', color: '#a99a8a', furnish: [
    { t: 'barril', n: [2, 3] }, { t: 'botellero', n: [1, 1] }, { t: 'caja', n: [1, 2], p: 0.7 }, { t: 'taburete', n: [1, 1], p: 0.5 }] },
  { id: 'vestibulo', name: 'vestíbulo', art: 'el', label: 'Vestíbulo', color: '#dccfb4', furnish: [
    { t: 'alfombra', n: [1, 1], p: 0.8 }, { t: 'perchero', n: [1, 1] }, { t: 'reloj', n: [1, 1], p: 0.7 }, { t: 'banco', n: [1, 1], p: 0.6 }, { t: 'planta', n: [1, 2], p: 0.6 }] },
  { id: 'capilla', name: 'capilla', art: 'la', label: 'Capilla', color: '#d4c6dc', furnish: [
    { t: 'altar', n: [1, 1] }, { t: 'banco', n: [1, 3] }, { t: 'alfombra', n: [1, 1], p: 0.5 }, { t: 'estatua', n: [1, 1], p: 0.5 }] },
  { id: 'billar', name: 'sala de billar', art: 'la', label: 'Billar', color: '#9fc7a3', furnish: [
    { t: 'billar', n: [1, 1] }, { t: 'bar', n: [1, 1], p: 0.7 }, { t: 'taburete', n: [1, 3] }, { t: 'sillon', n: [1, 1], p: 0.6 }] },
  { id: 'jardin', name: 'jardín', art: 'el', label: 'Jardín', color: '#a8d59a', furnish: [
    { t: 'fuente', n: [1, 1], p: 0.7 }, { t: 'banco', n: [1, 2] }, { t: 'estatua', n: [1, 1], p: 0.6 }, { t: 'rosal', n: [1, 3] }, { t: 'planta', n: [1, 2], p: 0.5 }] },
];

// Índices para búsqueda rápida (no tocar).
function index(list) { const m = {}; for (const x of list) m[x.id] = x; return m; }
export const CONTENT = {
  GAME, CHARACTERS, ITEMS, ROOM_TYPES,
  charMap: index(CHARACTERS), itemMap: index(ITEMS), roomTypeMap: index(ROOM_TYPES),
};
export default CONTENT;
