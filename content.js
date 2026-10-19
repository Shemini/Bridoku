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
// mark: la letra que se usa en las marcas a lápiz; en un mismo caso nunca se repite.
// g: 'm' / 'f' para concordar las frases ("sentado" / "sentada").
export const CHARACTERS = [
  // La víctima. Su "letra" para el lápiz es † para no chocar con los sospechosos que empiezan por S.
  { id: 'sabas', name: 'Sabas', mark: '†', g: 'm', role: 'El novio', color: '#2d2b38' },
  // Sospechosos (en cada caso salen unos pocos, nunca dos con la misma inicial).
  // g: 'm'/'f' para concordar "sentado/sentada"; color: el de su ficha y sus marcas a lápiz.
  { id: 'adrian', name: 'Adrián', mark: 'A', g: 'm', color: '#c53939' },
  { id: 'africa', name: 'África', mark: 'A', g: 'f', color: '#3052a6' },
  { id: 'alba', name: 'Alba', mark: 'A', g: 'f', color: '#8bc539' },
  { id: 'alejandro', name: 'Alejandro', mark: 'A', g: 'm', color: '#a63097' },
  { id: 'alex', name: 'Álex', mark: 'A', g: 'm', color: '#39c5ae' },
  { id: 'alfonso', name: 'Alfonso', mark: 'A', g: 'm', color: '#a66f30' },
  { id: 'alfre', name: 'Alfre', mark: 'A', g: 'm', color: '#5c39c5' },
  { id: 'alicia', name: 'Alicia', mark: 'A', g: 'f', color: '#35a630' },
  { id: 'almu', name: 'Almu', mark: 'A', g: 'f', color: '#c53968' },
  { id: 'alvaro', name: 'Alvaro', mark: 'A', g: 'm', color: '#3079a6' },
  { id: 'ana', name: 'Ana', mark: 'A', g: 'f', color: '#bac539' },
  { id: 'ana_mari', name: 'Ana Mari', mark: 'A', g: 'f', color: '#8d30a6' },
  { id: 'andrea', name: 'Andrea', mark: 'A', g: 'f', color: '#39c57f' },
  { id: 'angela', name: 'Ángela', mark: 'A', g: 'f', color: '#a64830' },
  { id: 'anselmo', name: 'Anselmo', mark: 'A', g: 'm', color: '#3945c5' },
  { id: 'antonio', name: 'Antonio', mark: 'A', g: 'm', color: '#5ca630' },
  { id: 'bea', name: 'Bea', mark: 'B', g: 'f', color: '#c53997' },
  { id: 'beatriz', name: 'Beatriz', mark: 'B', g: 'f', color: '#30a1a6' },
  { id: 'belen', name: 'Belén', mark: 'B', g: 'f', color: '#c5a239' },
  { id: 'blanca', name: 'Blanca', mark: 'B', g: 'f', color: '#6530a6' },
  { id: 'borja', name: 'Borja', mark: 'B', g: 'm', color: '#39c550' },
  { id: 'bravo', name: 'Bravo', mark: 'B', g: 'f', color: '#a6303f' },
  { id: 'carlos', name: 'Carlos', mark: 'C', g: 'm', color: '#3974c5' },
  { id: 'carlota', name: 'Carlota', mark: 'C', g: 'f', color: '#83a630' },
  { id: 'carmen', name: 'Carmen', mark: 'C', g: 'f', color: '#c539c5' },
  { id: 'chapa', name: 'Chapa', mark: 'C', g: 'm', color: '#30a683' },
  { id: 'chicho', name: 'Chicho', mark: 'C', g: 'm', color: '#c57339' },
  { id: 'clara', name: 'Clara', mark: 'C', g: 'f', color: '#3e30a6' },
  { id: 'coral', name: 'Coral', mark: 'C', g: 'f', color: '#51c539' },
  { id: 'cristina', name: 'Cristina', mark: 'C', g: 'f', color: '#a63066' },
  { id: 'cucho', name: 'Cucho', mark: 'C', g: 'm', color: '#39a3c5' },
  { id: 'cuco', name: 'Cuco', mark: 'C', g: 'm', color: '#a6a030' },
  { id: 'cucu', name: 'Cucu', mark: 'C', g: 'm', color: '#9639c5' },
  { id: 'cuqui', name: 'Cuqui', mark: 'C', g: 'f', color: '#30a65b' },
  { id: 'dani', name: 'Dani', mark: 'D', g: 'm', color: '#c54439' },
  { id: 'david', name: 'David', mark: 'D', g: 'm', color: '#3049a6' },
  { id: 'dioni', name: 'Dioni', mark: 'D', g: 'm', color: '#80c539' },
  { id: 'elena', name: 'Elena', mark: 'E', g: 'f', color: '#a6308e' },
  { id: 'emi', name: 'Emi', mark: 'E', g: 'f', color: '#39c5b9' },
  { id: 'emma', name: 'Emma', mark: 'E', g: 'f', color: '#a67930' },
  { id: 'ernesto', name: 'Ernesto', mark: 'E', g: 'm', color: '#6739c5' },
  { id: 'espe', name: 'Espe', mark: 'E', g: 'f', color: '#30a634' },
  { id: 'estela', name: 'Estela', mark: 'E', g: 'f', color: '#c5395d' },
  { id: 'fernandez', name: 'Fernández', mark: 'F', g: 'f', color: '#3070a6' },
  { id: 'ivan', name: 'Iván', mark: 'I', g: 'm', color: '#afc539' },
  { id: 'jaime', name: 'Jaime', mark: 'J', g: 'm', color: '#9630a6' },
  { id: 'jason', name: 'Jason', mark: 'J', g: 'm', color: '#39c58a' },
  { id: 'javi', name: 'Javi', mark: 'J', g: 'm', color: '#a65130' },
  { id: 'joaquin', name: 'Joaquín', mark: 'J', g: 'm', color: '#393ac5' },
  { id: 'juan', name: 'Juan', mark: 'J', g: 'm', color: '#53a630' },
  { id: 'juan_manuel', name: 'Juan Manuel', mark: 'J', g: 'm', color: '#c5398c' },
  { id: 'julia', name: 'Julia', mark: 'J', g: 'f', color: '#3098a6' },
  { id: 'karen', name: 'Karen', mark: 'K', g: 'f', color: '#c5ad39' },
  { id: 'kate', name: 'Kate', mark: 'K', g: 'f', color: '#6f30a6' },
  { id: 'kike', name: 'Kike', mark: 'K', g: 'm', color: '#39c55b' },
  { id: 'kiko', name: 'Kiko', mark: 'K', g: 'm', color: '#a63035' },
  { id: 'laura', name: 'Laura', mark: 'L', g: 'f', color: '#3969c5' },
  { id: 'lina', name: 'Lina', mark: 'L', g: 'f', color: '#7aa630' },
  { id: 'lucia', name: 'Lucía', mark: 'L', g: 'f', color: '#c539ba' },
  { id: 'luis', name: 'Luis', mark: 'L', g: 'm', color: '#30a68c' },
  { id: 'luz', name: 'Luz', mark: 'L', g: 'f', color: '#c57e39' },
  { id: 'magda', name: 'Magda', mark: 'M', g: 'f', color: '#4730a6' },
  { id: 'maite', name: 'Maite', mark: 'M', g: 'f', color: '#46c539' },
  { id: 'mamen', name: 'Mamen', mark: 'M', g: 'f', color: '#a6305d' },
  { id: 'manolo', name: 'Manolo', mark: 'M', g: 'm', color: '#3998c5' },
  { id: 'marco', name: 'Marco', mark: 'M', g: 'm', color: '#a2a630' },
  { id: 'marga', name: 'Marga', mark: 'M', g: 'f', color: '#a139c5' },
  { id: 'maria', name: 'María', mark: 'M', g: 'f', color: '#30a665' },
  { id: 'mariajo', name: 'Mariajo', mark: 'M', g: 'f', color: '#c54f39' },
  { id: 'marija', name: 'Marija', mark: 'M', g: 'f', color: '#303fa6' },
  { id: 'mario', name: 'Mario', mark: 'M', g: 'm', color: '#75c539' },
  { id: 'marta', name: 'Marta', mark: 'M', g: 'f', color: '#a63084' },
  { id: 'miguel', name: 'Miguel', mark: 'M', g: 'm', color: '#39c5c4' },
  { id: 'myriam', name: 'Myriam', mark: 'M', g: 'f', color: '#a68230' },
  { id: 'nacho', name: 'Nacho', mark: 'N', g: 'm', color: '#7239c5' },
  { id: 'nadia', name: 'Nadia', mark: 'N', g: 'f', color: '#30a63d' },
  { id: 'naza', name: 'Naza', mark: 'N', g: 'f', color: '#c53952' },
  { id: 'nene', name: 'Nene', mark: 'N', g: 'm', color: '#3067a6' },
  { id: 'nieto', name: 'Nieto', mark: 'N', g: 'f', color: '#a3c539' },
  { id: 'nono', name: 'Nono', mark: 'N', g: 'm', color: '#9f30a6' },
  { id: 'nora', name: 'Nora', mark: 'N', g: 'f', color: '#39c595' },
  { id: 'oscar', name: 'Oscar', mark: 'O', g: 'm', color: '#a65b30' },
  { id: 'pablo', name: 'Pablo', mark: 'P', g: 'm', color: '#4339c5' },
  { id: 'pache', name: 'Pache', mark: 'P', g: 'f', color: '#4aa630' },
  { id: 'pacita', name: 'Pacita', mark: 'P', g: 'f', color: '#c53981' },
  { id: 'paqui', name: 'Paqui', mark: 'P', g: 'f', color: '#308ea6' },
  { id: 'paquillo', name: 'Paquillo', mark: 'P', g: 'm', color: '#c5b839' },
  { id: 'pearson', name: 'Pearson', mark: 'P', g: 'm', color: '#7830a6' },
  { id: 'pepa', name: 'Pepa', mark: 'P', g: 'f', color: '#39c566' },
  { id: 'pepe', name: 'Pepe', mark: 'P', g: 'm', color: '#a63330' },
  { id: 'pepita', name: 'Pepita', mark: 'P', g: 'f', color: '#395ec5' },
  { id: 'pilar', name: 'Pilar', mark: 'P', g: 'f', color: '#71a630' },
  { id: 'pura', name: 'Pura', mark: 'P', g: 'f', color: '#c539af' },
  { id: 'queti', name: 'Queti', mark: 'Q', g: 'f', color: '#30a695' },
  { id: 'quitin', name: 'Quitín', mark: 'Q', g: 'm', color: '#c58939' },
  { id: 'raquel', name: 'Raquel', mark: 'R', g: 'f', color: '#5130a6' },
  { id: 'rocio', name: 'Rocío', mark: 'R', g: 'f', color: '#3bc539' },
  { id: 'sofia', name: 'Sofía', mark: 'S', g: 'f', color: '#a63054' },
  { id: 'susana', name: 'Susana', mark: 'S', g: 'f', color: '#398cc5' },
  { id: 'tere', name: 'Tere', mark: 'T', g: 'f', color: '#98a630' },
  { id: 'veronica', name: 'Verónica', mark: 'V', g: 'f', color: '#ac39c5' },
  { id: 'victoria', name: 'Victoria', mark: 'V', g: 'f', color: '#30a66e' },
  { id: 'wes', name: 'Wes', mark: 'W', g: 'm', color: '#c55a39' },
  { id: 'yaiza', name: 'Yaiza', mark: 'Y', g: 'f', color: '#3036a6' },
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
