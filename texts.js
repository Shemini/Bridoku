// Redacción de las pistas en español. Devuelve "fichas" (tokens) que la interfaz
// dibuja con colores/sprites, y una versión en texto plano para pruebas.

const P = (i) => ({ k: 'p', i });
const T = (s) => ({ k: 't', s });
const RM = (r, o = {}) => ({ k: 'room', r, ...o });
const IT = (id, o = {}) => ({ k: 'item', id, ...o });
const WIN = { k: 'win' };
const DOOR = { k: 'door' };

const NUM = ['ninguna', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho'];
const ROWS_TXT = ['', 'una fila', 'dos filas'];
const COLS_TXT = ['', 'una columna', 'dos columnas'];
const LINE_TXT = {
  N: 'en la fila más al norte', S: 'en la fila más al sur',
  W: 'en la columna más al oeste', E: 'en la columna más al este',
};

export function clueTokens(c, puz, content) {
  const v = c.v || 0;
  const pick = (arr) => arr[v % arr.length];
  const isV = (i) => i === puz.victim;
  const g = (i) => content.charMap[puz.persons[i]].g;
  const o = (i) => (g(i) === 'f' ? 'a' : 'o');            // sentado / sentada
  const typeOf = (r) => content.roomTypeMap[puz.roomTypes[r]];
  const gen = (r, m, f) => (typeOf(r).art === 'el' ? m : f);
  const item = (id) => content.itemMap[id];
  // "sentado en" / "tumbada en" / "sobre"
  const onTxt = (i, id) => { const it = item(id); return (it.part ? it.part + o(i) + ' ' : '') + it.prep + ' '; };
  const onGen = (id, end) => { const it = item(id); return (it.part ? it.part + end + ' ' : '') + it.prep + ' '; };

  switch (c.t) {
    case 'IN_ROOM':
      if (isV(c.a)) return pick([
        [T('El cuerpo de '), P(c.a), T(' apareció en '), RM(c.r), T('.')],
        [P(c.a), T(' fue hallad' + o(c.a) + ' sin vida en '), RM(c.r), T('.')],
        [T('La víctima, '), P(c.a), T(', yacía en '), RM(c.r), T('.')]]);
      return pick([
        [P(c.a), T(' estaba en '), RM(c.r), T('.')],
        [T('Alguien vio a '), P(c.a), T(' en '), RM(c.r), T('.')],
        [P(c.a), T(' no salió '), RM(c.r, { de: true }), T('.')]]);
    case 'NOT_IN_ROOM':
      return pick([
        [P(c.a), T(' no estaba en '), RM(c.r), T('.')],
        [T('Nadie vio a '), P(c.a), T(' en '), RM(c.r), T('.')],
        [P(c.a), T(' no pisó '), RM(c.r), T('.')]]);
    case 'ON':
      return pick([
        [P(c.a), T(' estaba ' + onTxt(c.a, c.k)), IT(c.k), T('.')],
        [T('Encontraron a '), P(c.a), T(' ' + onTxt(c.a, c.k)), IT(c.k), T('.')],
        [P(c.a), T(' estaba ' + onTxt(c.a, c.k)), IT(c.k), T('.')]]);
    case 'NOT_ON':
      return pick([
        [P(c.a), T(' no estaba ' + onTxt(c.a, c.k)), IT(c.k), T('.')],
        [P(c.a), T(' no estaba ' + onTxt(c.a, c.k)), IT(c.k), T('.')],
        [T('Nadie vio a '), P(c.a), T(' ' + onTxt(c.a, c.k)), IT(c.k), T('.')]]);
    case 'FLOOR':
      return pick([
        [P(c.a), T(' estaba de pie, sin ningún mueble ni alfombra bajo sus pies.')],
        [P(c.a), T(' estaba sobre el suelo desnudo.')],
        [P(c.a), T(' no estaba sobre ningún mueble ni alfombra.')]]);
    case 'NOT_FLOOR':
      return pick([
        [P(c.a), T(' estaba sobre un mueble o una alfombra.')],
        [P(c.a), T(' no pisaba el suelo desnudo.')],
        [P(c.a), T(' estaba sobre un mueble o una alfombra.')]]);
    case 'BESIDE':
      return pick([
        [P(c.a), T(' estaba al lado de '), IT(c.k), T('.')],
        [T('Junto a '), P(c.a), T(' había '), IT(c.k), T('.')],
        [P(c.a), T(' estaba pegad' + o(c.a) + ' a '), IT(c.k), T('.')]]);
    case 'NOT_BESIDE':
      return pick([
        [P(c.a), T(' no estaba al lado de '), IT(c.k), T('.')],
        [T('Junto a '), P(c.a), T(' no había '), IT(c.k), T('.')],
        [P(c.a), T(' no estaba al lado de '), IT(c.k), T('.')]]);
    case 'BESIDE_WIN':
      return pick([
        [P(c.a), T(' estaba junto a '), WIN, T('.')],
        [P(c.a), T(' miraba por '), WIN, T('.')],
        [P(c.a), T(' estaba al lado de '), WIN, T('.')]]);
    case 'NOT_BESIDE_WIN':
      return pick([
        [P(c.a), T(' no estaba junto a ninguna '), { k: 'win', bare: true }, T('.')],
        [P(c.a), T(' no estaba al lado de ninguna '), { k: 'win', bare: true }, T('.')],
        [P(c.a), T(' estaba lejos de las '), { k: 'win', plural: true }, T('.')]]);
    case 'BESIDE_DOOR':
      return pick([
        [P(c.a), T(' estaba junto a '), DOOR, T('.')],
        [P(c.a), T(' estaba al lado de '), DOOR, T('.')],
        [P(c.a), T(' vigilaba '), DOOR, T('.')]]);
    case 'NOT_BESIDE_DOOR':
      return pick([
        [P(c.a), T(' no estaba junto a ninguna '), { k: 'door', bare: true }, T('.')],
        [P(c.a), T(' no estaba al lado de ninguna '), { k: 'door', bare: true }, T('.')],
        [P(c.a), T(' estaba lejos de las '), { k: 'door', plural: true }, T('.')]]);
    case 'ROW_HAS':
      return pick([
        [P(c.a), T(' estaba en la misma fila que '), IT(c.k), T('.')],
        [P(c.a), T(' estaba en la misma fila que '), IT(c.k), T('.')],
        [T('En la fila de '), P(c.a), T(' había '), IT(c.k), T('.')]]);
    case 'NOT_ROW_HAS':
      return pick([
        [T('En la fila de '), P(c.a), T(' no había '), IT(c.k, { any: true }), T('.')],
        [P(c.a), T(' no estaba en la misma fila que '), IT(c.k, { any: true }), T('.')],
        [T('En la fila de '), P(c.a), T(' no había '), IT(c.k, { any: true }), T('.')]]);
    case 'COL_HAS':
      return pick([
        [P(c.a), T(' estaba en la misma columna que '), IT(c.k), T('.')],
        [P(c.a), T(' estaba en la misma columna que '), IT(c.k), T('.')],
        [T('En la columna de '), P(c.a), T(' había '), IT(c.k), T('.')]]);
    case 'NOT_COL_HAS':
      return pick([
        [T('En la columna de '), P(c.a), T(' no había '), IT(c.k, { any: true }), T('.')],
        [P(c.a), T(' no estaba en la misma columna que '), IT(c.k, { any: true }), T('.')],
        [T('En la columna de '), P(c.a), T(' no había '), IT(c.k, { any: true }), T('.')]]);
    case 'LINE':
      return pick([
        [P(c.a), T(' estaba ' + LINE_TXT[c.side] + '.')],
        [P(c.a), T(' estaba ' + LINE_TXT[c.side] + '.')],
        [T('Encontraron a '), P(c.a), T(' ' + LINE_TXT[c.side] + '.')]]);
    case 'ON_EDGE':
      return pick([
        [P(c.a), T(' estaba pegad' + o(c.a) + ' a un muro exterior de la casa.')],
        [P(c.a), T(' estaba en el borde del plano.')],
        [P(c.a), T(' estaba junto a un muro exterior.')]]);
    case 'NOT_EDGE':
      return pick([
        [P(c.a), T(' no estaba junto a ningún muro exterior.')],
        [P(c.a), T(' no estaba en el borde del plano.')],
        [P(c.a), T(' estaba en el interior de la casa, lejos de los muros exteriores.')]]);
    case 'ALONE':
      return pick([
        [P(c.a), T(' estaba sol' + o(c.a) + ' en su habitación.')],
        [T('Nadie más estaba en la habitación de '), P(c.a), T('.')],
        [P(c.a), T(' no tenía compañía.')]]);
    case 'NOT_ALONE':
      return pick([
        [P(c.a), T(' no estaba sol' + o(c.a) + '.')],
        [P(c.a), T(' compartía habitación con alguien.')],
        [T('Alguien acompañaba a '), P(c.a), T('.')]]);
    case 'SAME_ROOM':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' estaban en la misma habitación.')],
        [P(c.a), T(' compartía habitación con '), P(c.b), T('.')],
        [P(c.a), T(' y '), P(c.b), T(' coincidieron en la misma habitación.')]]);
    case 'DIFF_ROOM':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' estaban en habitaciones distintas.')],
        [P(c.a), T(' no compartía habitación con '), P(c.b), T('.')],
        [P(c.a), T(' y '), P(c.b), T(' no coincidieron.')]]);
    case 'ALONE_WITH':
      return pick([
        [P(c.a), T(' estaba a solas con '), P(c.b), T('.')],
        [P(c.a), T(' y '), P(c.b), T(' estaban sol' + (g(c.a) === 'f' && g(c.b) === 'f' ? 'as' : 'os') + ' en la misma habitación.')],
        [T('Solo '), P(c.a), T(' y '), P(c.b), T(' compartían habitación.')]]);
    case 'DIAG':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' estaban en diagonal, tocándose por una esquina.')],
        [P(c.a), T(' estaba en una casilla diagonal a la de '), P(c.b), T('.')],
        [P(c.b), T(' estaba en una casilla diagonal a la de '), P(c.a), T('.')]]);
    case 'NOT_DIAG':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' no estaban en diagonal.')],
        [P(c.a), T(' no estaba en una casilla diagonal a la de '), P(c.b), T('.')],
        [P(c.a), T(' y '), P(c.b), T(' no se tocaban por ninguna esquina.')]]);
    case 'NORTH':
      return pick([
        [P(c.a), T(' estaba más al norte que '), P(c.b), T('.')],
        [P(c.b), T(' estaba más al sur que '), P(c.a), T('.')],
        [P(c.a), T(' estaba por encima de '), P(c.b), T(' en el plano.')]]);
    case 'WEST':
      return pick([
        [P(c.a), T(' estaba más al oeste que '), P(c.b), T('.')],
        [P(c.b), T(' estaba más al este que '), P(c.a), T('.')],
        [P(c.a), T(' estaba a la izquierda de '), P(c.b), T(' en el plano.')]]);
    case 'ROW_OFF':
      return pick([
        [P(c.a), T(` estaba exactamente ${ROWS_TXT[c.k]} al norte de `), P(c.b), T('.')],
        [P(c.b), T(` estaba exactamente ${ROWS_TXT[c.k]} al sur de `), P(c.a), T('.')],
        [P(c.a), T(` estaba ${ROWS_TXT[c.k]} más al norte que `), P(c.b), T('.')]]);
    case 'COL_OFF':
      return pick([
        [P(c.a), T(` estaba exactamente ${COLS_TXT[c.k]} al oeste de `), P(c.b), T('.')],
        [P(c.b), T(` estaba exactamente ${COLS_TXT[c.k]} al este de `), P(c.a), T('.')],
        [P(c.a), T(` estaba ${COLS_TXT[c.k]} más al oeste que `), P(c.b), T('.')]]);
    case 'ROOM_COUNT':
      if (c.n === 0) return pick([
        [T('No había nadie en '), RM(c.r), T('.')],
        [RM(c.r, { cap: true }), T(` estaba ${gen(c.r, 'vacío', 'vacía')}.`)],
        [T('Nadie pisó '), RM(c.r), T('.')]]);
      if (c.n === 1) return pick([
        [T('Solo había una persona en '), RM(c.r), T('.')],
        [T('En '), RM(c.r), T(' había exactamente una persona.')],
        [T('Una única persona estaba en '), RM(c.r), T('.')]]);
      return pick([
        [T('En '), RM(c.r), T(` había exactamente ${NUM[c.n]} personas.`)],
        [RM(c.r, { cap: true }), T(` albergaba a ${NUM[c.n]} personas.`)],
        [T(`Había ${NUM[c.n]} personas en `), RM(c.r), T('.')]]);
    case 'ROOM_GT':
      return pick([
        [T('Había más gente en '), RM(c.r), T(' que en '), RM(c.r2), T('.')],
        [RM(c.r, { cap: true }), T(` estaba más ${gen(c.r, 'concurrido', 'concurrida')} que `), RM(c.r2), T('.')],
        [T('En '), RM(c.r), T(' había más personas que en '), RM(c.r2), T('.')]]);
    case 'ROOM_EQ':
      return pick([
        [T('Había tantas personas en '), RM(c.r), T(' como en '), RM(c.r2), T('.')],
        [RM(c.r, { cap: true }), T(' y '), RM(c.r2), T(' tenían el mismo número de personas.')],
        [T('En '), RM(c.r), T(' y en '), RM(c.r2), T(' había la misma cantidad de gente.')]]);
    case 'EMPTY_ROOMS':
      if (c.n === 0) return [T('No quedó ninguna habitación vacía.')];
      if (c.n === 1) return [T('Exactamente una habitación quedó vacía.')];
      return [T(`Exactamente ${NUM[c.n]} habitaciones quedaron vacías.`)];
    case 'NOBODY_ON':
      return pick([
        [T('Nadie estaba ' + onGen(c.k, 'o')), IT(c.k), T('.')],
        [T('Ninguna persona estaba ' + onGen(c.k, 'a')), IT(c.k), T('.')],
        [T('Nadie estaba ' + onGen(c.k, 'o')), IT(c.k), T('.')]]);
    case 'ONLY_ON':
      return pick([
        [P(c.a), T(' era la única persona ' + onGen(c.k, 'a')), IT(c.k), T('.')],
        [T('Solo '), P(c.a), T(' estaba ' + onTxt(c.a, c.k)), IT(c.k), T('.')],
        [P(c.a), T(' era la única persona ' + onGen(c.k, 'a')), IT(c.k), T('.')]]);
    case 'CRIME_HAS':
      return pick([
        [T('En la habitación del crimen había '), IT(c.k), T('.')],
        [T('El cuerpo apareció en una habitación con '), IT(c.k), T('.')],
        [T('En la escena del crimen había '), IT(c.k), T('.')]]);
    case 'CRIME_NOT_HAS':
      return pick([
        [T('En la habitación del crimen no había '), IT(c.k, { any: true }), T('.')],
        [T('El cuerpo apareció en una habitación sin '), IT(c.k, { bare: true }), T('.')],
        [T('En la escena del crimen no había '), IT(c.k, { any: true }), T('.')]]);
    case 'CRIME_WIN':
      return [T('La habitación del crimen tenía alguna '), { k: 'win', bare: true }, T('.')];
    case 'CRIME_NOWIN':
      return [T('La habitación del crimen no tenía '), { k: 'win', plural: true }, T('.')];
    default:
      return [T(c.t)];
  }
}

// Qué elementos del tablero afecta una pista (para resaltarlos al tocarla).
export function clueRefs(c) {
  const refs = { rooms: [], persons: [], items: [], win: false, door: false, victim: false };
  if (c.a !== undefined) refs.persons.push(c.a);
  if (c.b !== undefined) refs.persons.push(c.b);
  if (c.r !== undefined) refs.rooms.push(c.r);
  if (c.r2 !== undefined) refs.rooms.push(c.r2);
  if (c.k && typeof c.k === 'string') refs.items.push(c.k);
  if (/WIN/.test(c.t)) refs.win = true;
  if (/DOOR/.test(c.t)) refs.door = true;
  if (c.t.startsWith('CRIME_')) refs.victim = true;
  return refs;
}

export function roomText(r, puz, content, o = {}) {
  const t = content.roomTypeMap[puz.roomTypes[r]];
  let s = o.de ? (t.art === 'el' ? 'del ' + t.name : 'de la ' + t.name) : t.art + ' ' + t.name;
  if (o.cap) s = s[0].toUpperCase() + s.slice(1);
  return s;
}
// o.any → "ningún/ninguna X" · o.bare → solo el nombre
export function itemText(id, content, o = {}) {
  const it = content.itemMap[id];
  if (!it) return id;
  if (o.bare) return it.name;
  if (o.any) return (it.det === 'una' ? 'ninguna ' : 'ningún ') + it.name;
  return it.det + ' ' + it.name;
}
export function openingText(t) {
  const base = t.k === 'win' ? 'ventana' : 'puerta';
  if (t.plural) return base + 's';
  if (t.bare) return base;
  return 'una ' + base;
}
export function personName(i, puz, content) { return content.charMap[puz.persons[i]].name; }

export function tokensToText(tokens, puz, content) {
  return tokens.map((t) => {
    switch (t.k) {
      case 'p': return personName(t.i, puz, content);
      case 'room': return roomText(t.r, puz, content, t);
      case 'item': return itemText(t.id, content, t);
      case 'win': case 'door': return openingText(t);
      default: return t.s;
    }
  }).join('');
}
