// ============================================================================
//  CONTENIDO DEL JUEGO (BRIDOKU) · Todo lo que el generador usa para montar puzzles.
//
//  Para añadir un sprite NO hace falta tocar este archivo: basta con dejar el
//  PNG en la carpeta indicada (ver README.md). Mientras no exista el PNG, el
//  juego dibuja el emoji / círculo de color de aquí como sustituto.
// ============================================================================

export const GAME = {
  title: 'Bridoku',
  subtitle: 'Una boda. Un novio muerto. Una cuadrícula.',
  epoch: '2026-10-01',            // primer día de los casos diarios (y del archivo)
  victim: 'sabas',                // la víctima es siempre este personaje
  venues: [                       // nombres de las fincas
    'El Encinar', 'Los Almendros', 'La Alameda', 'Valdeolivo', 'El Rosal',
    'Las Dehesas', 'Monteclaro', 'La Fuente Vieja', 'El Castañar', 'Villa Azahar',
  ],
};

// --- Personajes (sprite: sprites/characters/<id>.png, opcional <id>_dead.png) ---
// mark: la letra que se usa en las marcas a lápiz (mejor que no se repita).
// g: 'm' / 'f' para concordar las frases ("sentado" / "sentada").
export const CHARACTERS = [
  { id: 'sabas',   name: 'Sabas',   mark: 'S', g: 'm', role: 'El novio',              color: '#2d2b38' },
  { id: 'amparo',  name: 'Amparo',  mark: 'A', g: 'f', role: 'La suegra',             color: '#9b59b6' },
  { id: 'bernardo',name: 'Bernardo',mark: 'B', g: 'm', role: 'El padrino',            color: '#4f6d9a' },
  { id: 'carmela', name: 'Carmela', mark: 'C', g: 'f', role: 'La madrina',            color: '#c2417a' },
  { id: 'dani',    name: 'Dani',    mark: 'D', g: 'm', role: 'El DJ',                 color: '#2aa7a0' },
  { id: 'encarna', name: 'Encarna', mark: 'E', g: 'f', role: 'La wedding planner',    color: '#d9822b' },
  { id: 'fermin',  name: 'Fermín',  mark: 'F', g: 'm', role: 'El cura',               color: '#7a5a3f' },
  { id: 'gloria',  name: 'Gloria',  mark: 'G', g: 'f', role: 'La florista',           color: '#4f9d5d' },
  { id: 'hugo',    name: 'Hugo',    mark: 'H', g: 'm', role: 'El fotógrafo',          color: '#5b5f6e' },
  { id: 'ines',    name: 'Inés',    mark: 'I', g: 'f', role: 'La dama de honor',      color: '#e05c8a' },
  { id: 'javi',    name: 'Javi',    mark: 'J', g: 'm', role: 'El ex de la novia',     color: '#b83b3b' },
  { id: 'lucia',   name: 'Lucía',   mark: 'L', g: 'f', role: 'La prima soltera',      color: '#8a6fd1' },
  { id: 'manolo',  name: 'Manolo',  mark: 'M', g: 'm', role: 'El tío de la barra libre', color: '#b8931f' },
  { id: 'nacho',   name: 'Nacho',   mark: 'N', g: 'm', role: 'El camarero',           color: '#3e7cb1' },
  { id: 'rocio',   name: 'Rocío',   mark: 'R', g: 'f', role: 'La chef del catering',  color: '#5d6b2f' },
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
  { id: 'silla',        name: 'silla',              det: 'una', walk: true,  shape: 'one',  part: 'sentad', prep: 'en', around: ['mesa', 'mesa_larga'], emoji: '🪑' },
  { id: 'sillon',       name: 'sillón',             det: 'un',  walk: true,  shape: 'one',  part: 'sentad', prep: 'en', emoji: '💺' },
  { id: 'sofa',         name: 'sofá',               det: 'un',  walk: true,  shape: 'pair', part: 'sentad', prep: 'en', wall: true, emoji: '🛋️' },
  { id: 'cama',         name: 'cama',               det: 'una', walk: true,  shape: 'pair', part: 'tumbad', prep: 'en', wall: true, emoji: '🛏️' },
  { id: 'alfombra',     name: 'alfombra',           det: 'una', walk: true,  shape: 'area', size: [2, 6], part: '', prep: 'sobre', emoji: '' },
  { id: 'banco',        name: 'banco',              det: 'un',  walk: true,  shape: 'pair', part: 'sentad', prep: 'en', emoji: '🪵' },
  { id: 'taburete',     name: 'taburete',           det: 'un',  walk: true,  shape: 'one',  part: 'sentad', prep: 'en', around: ['bar', 'mesa_alta'], emoji: '' },
  { id: 'tumbona',      name: 'tumbona',            det: 'una', walk: true,  shape: 'pair', part: 'tumbad', prep: 'en', emoji: '🏖️' },
  { id: 'inodoro',      name: 'inodoro',            det: 'un',  walk: true,  shape: 'one',  part: 'sentad', prep: 'en', wall: true, emoji: '🚽' },
  // --- obstáculos ---
  { id: 'mesa',         name: 'mesa',               det: 'una', walk: false, shape: 'area', size: [1, 4], emoji: '' },
  { id: 'mesa_larga',   name: 'mesa del banquete',  det: 'una', walk: false, shape: 'area', size: [2, 6], emoji: '' },
  { id: 'mesa_regalos', name: 'mesa de regalos',    det: 'una', walk: false, shape: 'area', size: [2, 3], emoji: '🎁' },
  { id: 'mesa_alta',    name: 'mesa alta',          det: 'una', walk: false, shape: 'one',  emoji: '🍸' },
  { id: 'tarta',        name: 'tarta nupcial',      det: 'una', walk: false, shape: 'one',  emoji: '🎂' },
  { id: 'planta',       name: 'planta',             det: 'una', walk: false, shape: 'one',  emoji: '🪴' },
  { id: 'arco',         name: 'arco floral',        det: 'un',  walk: false, shape: 'pair', emoji: '💐' },
  { id: 'altar',        name: 'altar',              det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '✝️' },
  { id: 'piano',        name: 'piano',              det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '🎹' },
  { id: 'chimenea',     name: 'chimenea',           det: 'una', walk: false, shape: 'one',  wall: true, emoji: '🔥' },
  { id: 'armario',      name: 'armario',            det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🚪' },
  { id: 'mesilla',      name: 'mesilla',            det: 'una', walk: false, shape: 'one',  around: ['cama'], emoji: '🕯️' },
  { id: 'tocador',      name: 'tocador',            det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '💄' },
  { id: 'espejo',       name: 'espejo de pie',      det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🪞' },
  { id: 'maniqui',      name: 'maniquí con el vestido', plural: 'maniquíes con vestido', det: 'un', walk: false, shape: 'one', emoji: '👰' },
  { id: 'perchero',     name: 'perchero',           det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🧥' },
  { id: 'cubitera',     name: 'cubitera de champán',det: 'una', walk: false, shape: 'one',  emoji: '🍾' },
  { id: 'nevera',       name: 'nevera',             det: 'una', walk: false, shape: 'one',  wall: true, emoji: '🧊' },
  { id: 'horno',        name: 'horno',              det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🍳' },
  { id: 'fregadero',    name: 'fregadero',          det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🚰' },
  { id: 'lavabo',       name: 'lavabo',             det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🚿' },
  { id: 'cabina_dj',    name: 'cabina del DJ',      det: 'una', walk: false, shape: 'pair', wall: true, emoji: '🎧' },
  { id: 'altavoz',      name: 'altavoz',            det: 'un',  walk: false, shape: 'one',  wall: true, emoji: '🔊' },
  { id: 'photocall',    name: 'photocall',          plural: 'photocalls', det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '📸' },
  { id: 'baul',         name: 'baúl de disfraces',  plural: 'baúles de disfraces', det: 'un',  walk: false, shape: 'one',  emoji: '🧳' },
  { id: 'libro_firmas', name: 'libro de firmas',    det: 'un',  walk: false, shape: 'one',  emoji: '📖' },
  { id: 'fuente',       name: 'fuente',             det: 'una', walk: false, shape: 'one',  emoji: '⛲' },
  { id: 'estatua',      name: 'estatua',            det: 'una', walk: false, shape: 'one',  emoji: '🗿' },
  { id: 'rosal',        name: 'rosal',              det: 'un',  walk: false, shape: 'one',  emoji: '🌹' },
  { id: 'sombrilla',    name: 'sombrilla',          det: 'una', walk: false, shape: 'one',  emoji: '⛱️' },
  { id: 'barril',       name: 'barril',             det: 'un',  walk: false, shape: 'one',  emoji: '🛢️' },
  { id: 'botellero',    name: 'botellero',          det: 'un',  walk: false, shape: 'pair', wall: true, emoji: '🍷' },
  { id: 'caja',         name: 'caja de botellas',   det: 'una', walk: false, shape: 'one',  emoji: '📦' },
  { id: 'bar',          name: 'barra',              det: 'una', walk: false, shape: 'pair', wall: true, emoji: '🥂' },
];

// --- Estancias (suelo: sprites/floors/<id>.png, una baldosa por casilla) ---
// furnish: lista de muebles en orden de colocación.
//   n: [mín, máx] unidades · p: probabilidad de que aparezca (por defecto 1)
// outdoor: al aire libre (sin ventanas)
export const ROOM_TYPES = [
  { id: 'suite', name: 'suite nupcial', art: 'la', label: 'Suite nupcial', color: '#e8cfd6', furnish: [
    { t: 'cama', n: [1, 1] }, { t: 'mesilla', n: [1, 2], p: 0.8 }, { t: 'alfombra', n: [1, 1], p: 0.6 }, { t: 'sillon', n: [1, 1], p: 0.5 },
    { t: 'cubitera', n: [1, 1], p: 0.5 }, { t: 'tocador', n: [1, 1], p: 0.4 }, { t: 'chimenea', n: [1, 1], p: 0.3 }] },
  { id: 'vestidor', name: 'vestidor de la novia', art: 'el', label: 'Vestidor', color: '#f0dfe8', furnish: [
    { t: 'maniqui', n: [1, 1] }, { t: 'espejo', n: [1, 1] }, { t: 'sillon', n: [1, 2] }, { t: 'tocador', n: [1, 1], p: 0.6 },
    { t: 'perchero', n: [1, 1], p: 0.6 }, { t: 'alfombra', n: [1, 1], p: 0.5 }] },
  { id: 'capilla', name: 'capilla', art: 'la', label: 'Capilla', color: '#d4c6dc', furnish: [
    { t: 'altar', n: [1, 1] }, { t: 'banco', n: [1, 3] }, { t: 'alfombra', n: [1, 1], p: 0.6 }, { t: 'planta', n: [1, 2], p: 0.5 }, { t: 'estatua', n: [1, 1], p: 0.3 }] },
  { id: 'banquete', name: 'salón de banquetes', art: 'el', label: 'Banquete', color: '#ead6bf', furnish: [
    { t: 'mesa_larga', n: [1, 1] }, { t: 'silla', n: [2, 5] }, { t: 'tarta', n: [1, 1], p: 0.7 }, { t: 'piano', n: [1, 1], p: 0.3 }, { t: 'planta', n: [1, 1], p: 0.4 }] },
  { id: 'pista', name: 'pista de baile', art: 'la', label: 'Pista de baile', color: '#cfc4e6', furnish: [
    { t: 'cabina_dj', n: [1, 1] }, { t: 'altavoz', n: [1, 2] }, { t: 'mesa_alta', n: [1, 1], p: 0.6 }, { t: 'taburete', n: [1, 2], p: 0.8 }] },
  { id: 'jardin', name: 'jardín', art: 'el', label: 'Jardín', color: '#a8d59a', outdoor: true, furnish: [
    { t: 'arco', n: [1, 1], p: 0.7 }, { t: 'banco', n: [1, 2] }, { t: 'fuente', n: [1, 1], p: 0.6 }, { t: 'rosal', n: [1, 3] }, { t: 'estatua', n: [1, 1], p: 0.4 }] },
  { id: 'cocina', name: 'cocina del catering', art: 'la', label: 'Cocina', color: '#e6d9a6', furnish: [
    { t: 'mesa', n: [1, 1] }, { t: 'silla', n: [1, 2] }, { t: 'nevera', n: [1, 1], p: 0.8 }, { t: 'horno', n: [1, 1], p: 0.8 },
    { t: 'fregadero', n: [1, 1], p: 0.6 }, { t: 'tarta', n: [1, 1], p: 0.3 }] },
  { id: 'barra', name: 'barra libre', art: 'la', label: 'Barra libre', color: '#d9b8a0', furnish: [
    { t: 'bar', n: [1, 1] }, { t: 'taburete', n: [1, 3] }, { t: 'mesa_alta', n: [1, 1], p: 0.6 }, { t: 'botellero', n: [1, 1], p: 0.4 }, { t: 'planta', n: [1, 1], p: 0.4 }] },
  { id: 'photocall', name: 'rincón del photocall', art: 'el', label: 'Photocall', color: '#f2d9b8', furnish: [
    { t: 'photocall', n: [1, 1] }, { t: 'sillon', n: [1, 1] }, { t: 'baul', n: [1, 1], p: 0.7 }, { t: 'alfombra', n: [1, 1], p: 0.5 }, { t: 'planta', n: [1, 1], p: 0.4 }] },
  { id: 'recepcion', name: 'recepción', art: 'la', label: 'Recepción', color: '#dccfb4', furnish: [
    { t: 'mesa_regalos', n: [1, 1] }, { t: 'libro_firmas', n: [1, 1], p: 0.8 }, { t: 'perchero', n: [1, 1], p: 0.7 }, { t: 'banco', n: [1, 1], p: 0.6 }, { t: 'planta', n: [1, 2], p: 0.5 }] },
  { id: 'aseo', name: 'aseo', art: 'el', label: 'Aseo', color: '#b9dde4', furnish: [
    { t: 'inodoro', n: [1, 1] }, { t: 'lavabo', n: [1, 1], p: 0.9 }, { t: 'espejo', n: [1, 1], p: 0.6 }, { t: 'planta', n: [1, 1], p: 0.3 }] },
  { id: 'terraza', name: 'terraza', art: 'la', label: 'Terraza', color: '#c9dcb4', outdoor: true, furnish: [
    { t: 'mesa', n: [1, 1] }, { t: 'silla', n: [1, 3] }, { t: 'sombrilla', n: [1, 1], p: 0.7 }, { t: 'tumbona', n: [1, 1], p: 0.7 }, { t: 'planta', n: [1, 2], p: 0.6 }] },
  { id: 'bodega', name: 'bodega', art: 'la', label: 'Bodega', color: '#a99a8a', furnish: [
    { t: 'barril', n: [2, 3] }, { t: 'botellero', n: [1, 1] }, { t: 'caja', n: [1, 2], p: 0.7 }, { t: 'mesa_alta', n: [1, 1], p: 0.4 }, { t: 'taburete', n: [1, 1], p: 0.5 }] },
];

// Índices para búsqueda rápida (no tocar).
function index(list) { const m = {}; for (const x of list) m[x.id] = x; return m; }
export const CONTENT = {
  GAME, CHARACTERS, ITEMS, ROOM_TYPES,
  charMap: index(CHARACTERS), itemMap: index(ITEMS), roomTypeMap: index(ROOM_TYPES),
};
export default CONTENT;
