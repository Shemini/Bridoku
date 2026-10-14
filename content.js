// ============================================================================
//  CONTENIDO DEL JUEGO  ·  Todo lo que el generador usa para montar puzzles.
//
//  Para añadir un sprite NO hace falta tocar este archivo: basta con dejar el
//  PNG en la carpeta indicada (ver README.md). Mientras no exista el PNG, el
//  juego dibuja el emoji / círculo de color de aquí como sustituto.
//
//  Para añadir un personaje, mueble, habitación o arma nuevos, se añade una
//  línea en la lista correspondiente (y su PNG con el mismo "id").
// ============================================================================

export const GAME = {
  title: 'Murdoku',
  subtitle: 'Un crimen. Un asesino. Una cuadrícula.',
  // Día 1 del "Caso del día" (sirve solo para numerar los casos).
  epoch: '2026-10-14',
  mansions: [
    'Villaverde', 'Montealegre', 'Altamira', 'Roncesvalles', 'Valdecruces',
    'Peñalba', 'Torrebruna', 'Fontanar', 'Belmonte', 'Sierra Oscura',
  ],
};

// --- Personajes (sprite: sprites/characters/<id>.png, opcional <id>_dead.png) ---
export const CHARACTERS = [
  { id: 'alfredo',   name: 'Alfredo',   role: 'El mayordomo',   color: '#4f6d9a', emoji: '🤵' },
  { id: 'irene',     name: 'Irene',     role: 'La condesa',     color: '#9b59b6', emoji: '👸' },
  { id: 'ramon',     name: 'Ramón',     role: 'El chef',        color: '#d9822b', emoji: '🧑‍🍳' },
  { id: 'lola',      name: 'Lola',      role: 'La doncella',    color: '#e05c8a', emoji: '🧹' },
  { id: 'anselmo',   name: 'Anselmo',   role: 'El párroco',     color: '#7a5a3f', emoji: '⛪' },
  { id: 'esperanza', name: 'Esperanza', role: 'La viuda',       color: '#3b3b4a', emoji: '🖤' },
  { id: 'paco',      name: 'Paco',      role: 'El jardinero',   color: '#4f9d5d', emoji: '🌿' },
  { id: 'elena',     name: 'Elena',     role: 'La doctora',     color: '#2aa7a0', emoji: '🩺' },
  { id: 'bruno',     name: 'Bruno',     role: 'El coronel',     color: '#b83b3b', emoji: '🎖️' },
  { id: 'alvaro',    name: 'Álvaro',    role: 'El marqués',     color: '#c9a227', emoji: '🎩' },
];

// --- Mobiliario (sprite: sprites/items/<id>.png) ---
// det: "un"/"una"   loc: cómo se dice que alguien está en esa casilla ("en" / "ante")
export const ITEMS = [
  // cocina
  { id: 'nevera',      name: 'nevera',            det: 'una', loc: 'ante', emoji: '🧊' },
  { id: 'horno',       name: 'horno',             det: 'un',  loc: 'ante', emoji: '🍳' },
  { id: 'fregadero',   name: 'fregadero',         det: 'un',  loc: 'ante', emoji: '🚰' },
  { id: 'mesa',        name: 'mesa',              det: 'una', loc: 'ante', emoji: '🍽️' },
  // salón
  { id: 'sofa',        name: 'sofá',              det: 'un',  loc: 'en',   emoji: '🛋️' },
  { id: 'chimenea',    name: 'chimenea',          det: 'una', loc: 'ante', emoji: '🔥' },
  { id: 'piano',       name: 'piano',             det: 'un',  loc: 'ante', emoji: '🎹' },
  { id: 'sillon',      name: 'sillón',            det: 'un',  loc: 'en',   emoji: '💺' },
  // dormitorio
  { id: 'cama',        name: 'cama',              det: 'una', loc: 'en',   emoji: '🛏️' },
  { id: 'armario',     name: 'armario',           det: 'un',  loc: 'ante', emoji: '🚪' },
  { id: 'tocador',     name: 'tocador',           det: 'un',  loc: 'ante', emoji: '💄' },
  { id: 'mesilla',     name: 'mesilla',           det: 'una', loc: 'ante', emoji: '🕯️' },
  // baño
  { id: 'banera',      name: 'bañera',            det: 'una', loc: 'en',   emoji: '🛁' },
  { id: 'inodoro',     name: 'inodoro',           det: 'un',  loc: 'ante', emoji: '🚽' },
  { id: 'lavabo',      name: 'lavabo',            det: 'un',  loc: 'ante', emoji: '🚿' },
  { id: 'espejo',      name: 'espejo',            det: 'un',  loc: 'ante', emoji: '🪞' },
  // biblioteca
  { id: 'estanteria',  name: 'estantería',        det: 'una', loc: 'ante', emoji: '📚' },
  { id: 'globo',       name: 'globo terráqueo',   det: 'un',  loc: 'ante', emoji: '🌍' },
  { id: 'escalera',    name: 'escalera de mano',  det: 'una', loc: 'ante', emoji: '🪜' },
  // comedor
  { id: 'mesa_larga',  name: 'mesa de banquete',  det: 'una', loc: 'ante', emoji: '🍷' },
  { id: 'aparador',    name: 'aparador',          det: 'un',  loc: 'ante', emoji: '🗄️' },
  { id: 'silla',       name: 'silla',             det: 'una', loc: 'en',   emoji: '🪑' },
  // despacho
  { id: 'escritorio',  name: 'escritorio',        det: 'un',  loc: 'ante', emoji: '🖋️' },
  { id: 'caja_fuerte', name: 'caja fuerte',       det: 'una', loc: 'ante', emoji: '🔐' },
  { id: 'archivador',  name: 'archivador',        det: 'un',  loc: 'ante', emoji: '🗂️' },
  // invernadero / jardín
  { id: 'maceta',      name: 'maceta',            det: 'una', loc: 'ante', emoji: '🪴' },
  { id: 'fuente',      name: 'fuente',            det: 'una', loc: 'ante', emoji: '⛲' },
  { id: 'banco',       name: 'banco',             det: 'un',  loc: 'en',   emoji: '🪵' },
  { id: 'estatua',     name: 'estatua',           det: 'una', loc: 'ante', emoji: '🗿' },
  { id: 'rosal',       name: 'rosal',             det: 'un',  loc: 'ante', emoji: '🌹' },
  // bodega
  { id: 'barril',      name: 'barril',            det: 'un',  loc: 'ante', emoji: '🛢️' },
  { id: 'botellero',   name: 'botellero',         det: 'un',  loc: 'ante', emoji: '🍾' },
  { id: 'caja',        name: 'caja de madera',    det: 'una', loc: 'ante', emoji: '📦' },
  // vestíbulo
  { id: 'perchero',    name: 'perchero',          det: 'un',  loc: 'ante', emoji: '🧥' },
  { id: 'reloj',       name: 'reloj de pie',      det: 'un',  loc: 'ante', emoji: '🕰️' },
  // capilla
  { id: 'altar',       name: 'altar',             det: 'un',  loc: 'ante', emoji: '✝️' },
  { id: 'vidriera',    name: 'vidriera',          det: 'una', loc: 'ante', emoji: '🪟' },
  // sala de billar
  { id: 'billar',      name: 'mesa de billar',    det: 'una', loc: 'ante', emoji: '🎱' },
  { id: 'bar',         name: 'barra de bar',      det: 'una', loc: 'ante', emoji: '🥃' },
  { id: 'taburete',    name: 'taburete',          det: 'un',  loc: 'en',   emoji: '🪑' },
];

// --- Armas (sprite: sprites/weapons/<id>.png) --- Cada puzzle usa unas pocas.
export const WEAPONS = [
  { id: 'cuchillo',      name: 'cuchillo',       art: 'el', cat: 'cortante',    emoji: '🔪' },
  { id: 'hacha',         name: 'hacha',          art: 'el', cat: 'cortante',    emoji: '🪓' },
  { id: 'abrecartas',    name: 'abrecartas',     art: 'el', cat: 'cortante',    emoji: '🗡️' },
  { id: 'candelabro',    name: 'candelabro',     art: 'el', cat: 'contundente', emoji: '🕯️' },
  { id: 'llave_inglesa', name: 'llave inglesa',  art: 'la', cat: 'contundente', emoji: '🔧' },
  { id: 'atizador',      name: 'atizador',       art: 'el', cat: 'contundente', emoji: '⚒️' },
  { id: 'estatuilla',    name: 'estatuilla',     art: 'la', cat: 'contundente', emoji: '🏆' },
  { id: 'cuerda',        name: 'cuerda',         art: 'la', cat: 'asfixia',     emoji: '🪢' },
  { id: 'corbata',       name: 'corbata',        art: 'la', cat: 'asfixia',     emoji: '👔' },
  { id: 'veneno',        name: 'veneno',         art: 'el', cat: 'veneno',      emoji: '🧪' },
  { id: 'revolver',      name: 'revólver',       art: 'el', cat: 'fuego',       emoji: '🔫' },
];

export const WEAPON_CATS = {
  cortante:    { phrase: 'un arma cortante' },
  contundente: { phrase: 'un arma contundente' },
  asfixia:     { phrase: 'un arma de asfixia' },
  veneno:      { phrase: 'un veneno' },
  fuego:       { phrase: 'un arma de fuego' },
};

// --- Decorado puramente estético (sprite: sprites/decor/<id>.png). No cuenta para las pistas. ---
export const DECOR = [
  { id: 'alfombra',  emoji: '🟫' },
  { id: 'cuadro',    emoji: '🖼️' },
  { id: 'lampara',   emoji: '💡' },
  { id: 'cortina',   emoji: '🎀' },
  { id: 'flores',    emoji: '💐' },
];

// --- Tipos de habitación (suelo: sprites/floors/<id>.png, una baldosa por casilla) ---
// items: muebles que puede contener.   decor: adornos que puede llevar.
export const ROOM_TYPES = [
  { id: 'cocina',      name: 'cocina',          art: 'la', label: 'Cocina',      color: '#e6d9a6', items: ['nevera', 'horno', 'fregadero', 'mesa'],            decor: ['alfombra'] },
  { id: 'salon',       name: 'salón',           art: 'el', label: 'Salón',       color: '#d9b8a0', items: ['sofa', 'chimenea', 'piano', 'sillon'],             decor: ['alfombra', 'cuadro'] },
  { id: 'dormitorio',  name: 'dormitorio',      art: 'el', label: 'Dormitorio',  color: '#c9c3e3', items: ['cama', 'armario', 'tocador', 'mesilla'],           decor: ['alfombra', 'cortina'] },
  { id: 'bano',        name: 'baño',            art: 'el', label: 'Baño',        color: '#b9dde4', items: ['banera', 'inodoro', 'lavabo', 'espejo'],           decor: ['alfombra'] },
  { id: 'biblioteca',  name: 'biblioteca',      art: 'la', label: 'Biblioteca',  color: '#c8b08a', items: ['estanteria', 'sillon', 'globo', 'escalera'],       decor: ['alfombra', 'lampara'] },
  { id: 'comedor',     name: 'comedor',         art: 'el', label: 'Comedor',     color: '#e0c4b0', items: ['mesa_larga', 'aparador', 'silla', 'chimenea'],     decor: ['alfombra', 'cuadro'] },
  { id: 'despacho',    name: 'despacho',        art: 'el', label: 'Despacho',    color: '#b7c4a8', items: ['escritorio', 'caja_fuerte', 'archivador', 'sillon'], decor: ['alfombra', 'lampara'] },
  { id: 'invernadero', name: 'invernadero',     art: 'el', label: 'Invernadero', color: '#b4dcae', items: ['maceta', 'fuente', 'banco', 'estatua'],            decor: ['flores'] },
  { id: 'bodega',      name: 'bodega',          art: 'la', label: 'Bodega',      color: '#a99a8a', items: ['barril', 'botellero', 'caja', 'escalera'],         decor: [] },
  { id: 'vestibulo',   name: 'vestíbulo',       art: 'el', label: 'Vestíbulo',   color: '#dccfb4', items: ['perchero', 'espejo', 'reloj', 'banco'],            decor: ['alfombra', 'cuadro'] },
  { id: 'capilla',     name: 'capilla',         art: 'la', label: 'Capilla',     color: '#d4c6dc', items: ['altar', 'banco', 'vidriera', 'estatua'],           decor: ['alfombra'] },
  { id: 'billar',      name: 'sala de billar',  art: 'la', label: 'Sala de billar', color: '#9fc7a3', items: ['billar', 'bar', 'taburete', 'sillon'],          decor: ['lampara', 'cuadro'] },
  { id: 'jardin',      name: 'jardín',          art: 'el', label: 'Jardín',      color: '#a8d59a', items: ['fuente', 'banco', 'estatua', 'rosal'],             decor: ['flores'] },
];

// Índices para búsqueda rápida (no tocar).
function index(list) { const m = {}; for (const x of list) m[x.id] = x; return m; }
export const CONTENT = {
  GAME, CHARACTERS, ITEMS, WEAPONS, WEAPON_CATS, DECOR, ROOM_TYPES,
  charMap: index(CHARACTERS), itemMap: index(ITEMS), weaponMap: index(WEAPONS),
  decorMap: index(DECOR), roomTypeMap: index(ROOM_TYPES),
};
export default CONTENT;
