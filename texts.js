// Redacción de las pistas en español. Devuelve "fichas" (tokens) que la interfaz
// dibuja con colores/sprites, y una versión en texto plano para pruebas.

const P = (i) => ({ k: 'p', i });
const T = (s) => ({ k: 't', s });
const RM = (r, o = {}) => ({ k: 'room', r, ...o });
const IT = (id) => ({ k: 'item', id });
const WP = (id, o = {}) => ({ k: 'w', id, ...o });

const NUM = ['ninguna', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho'];

export function clueTokens(c, puz, content) {
  const v = c.v || 0;
  const pick = (arr) => arr[v % arr.length];
  const isV = (i) => i === puz.victim;
  const typeOf = (r) => content.roomTypeMap[puz.roomTypes[r]];
  const gen = (r, m, f) => (typeOf(r).art === 'el' ? m : f);
  const thing = (id, o) => (content.weaponMap[id] ? WP(id, o) : IT(id));
  const loc = (id) => (content.itemMap[id] ? content.itemMap[id].loc : 'ante');
  const phrase = (cat) => content.WEAPON_CATS[cat].phrase;

  switch (c.t) {
    case 'IN_ROOM':
      if (isV(c.a)) return pick([
        [T('El cuerpo de '), P(c.a), T(' fue hallado en '), RM(c.r), T('.')],
        [P(c.a), T(' apareció sin vida en '), RM(c.r), T('.')],
        [T('La víctima, '), P(c.a), T(', yacía en '), RM(c.r), T('.')]]);
      return pick([
        [P(c.a), T(' estaba en '), RM(c.r), T('.')],
        [T('Se vio a '), P(c.a), T(' en '), RM(c.r), T('.')],
        [P(c.a), T(' no salió '), RM(c.r, { de: true }), T('.')]]);
    case 'NOT_IN_ROOM':
      if (isV(c.a)) return pick([
        [T('El cuerpo de '), P(c.a), T(' no estaba en '), RM(c.r), T('.')],
        [P(c.a), T(' no murió en '), RM(c.r), T('.')],
        [T('No hallaron a '), P(c.a), T(' sin vida en '), RM(c.r), T('.')]]);
      return pick([
        [P(c.a), T(' no estaba en '), RM(c.r), T('.')],
        [T('Nadie vio a '), P(c.a), T(' en '), RM(c.r), T('.')],
        [P(c.a), T(' se mantuvo lejos '), RM(c.r, { de: true }), T('.')]]);
    case 'ON_ITEM':
      return pick([
        [P(c.a), T(` estaba ${loc(c.k)} `), thing(c.k), T('.')],
        [T('Se encontró a '), P(c.a), T(` ${loc(c.k)} `), thing(c.k), T('.')],
        [P(c.a), T(` se hallaba ${loc(c.k)} `), thing(c.k), T('.')]]);
    case 'NOT_ON_ITEM':
      return pick([
        [P(c.a), T(` no estaba ${loc(c.k)} `), thing(c.k), T('.')],
        [T('Nadie vio a '), P(c.a), T(` ${loc(c.k)} `), thing(c.k), T('.')],
        [P(c.a), T(` no se hallaba ${loc(c.k)} `), thing(c.k), T('.')]]);
    case 'NEXT_ITEM':
      return pick([
        [P(c.a), T(' estaba al lado de '), thing(c.k), T('.')],
        [T('Junto a '), P(c.a), T(' había '), thing(c.k), T('.')],
        [P(c.a), T(' estaba a un paso de '), thing(c.k), T('.')]]);
    case 'NOT_NEXT_ITEM':
      return pick([
        [P(c.a), T(' no estaba al lado de '), thing(c.k), T('.')],
        [T('Junto a '), P(c.a), T(' no había '), thing(c.k), T('.')],
        [P(c.a), T(' no estaba a un paso de '), thing(c.k), T('.')]]);
    case 'ON_EDGE':
      return pick([
        [P(c.a), T(' estaba junto a un muro exterior.')],
        [P(c.a), T(' estaba en el borde de la mansión.')],
        [T('Desde fuera se veía a '), P(c.a), T(' por una ventana.')]]);
    case 'NOT_EDGE':
      return pick([
        [P(c.a), T(' no estaba junto a ningún muro exterior.')],
        [P(c.a), T(' estaba en el interior de la mansión, lejos de las ventanas.')],
        [T('Ninguna ventana daba a donde estaba '), P(c.a), T('.')]]);
    case 'ALONE':
      return pick([
        [P(c.a), T(' estaba a solas en su habitación.')],
        [T('Nadie más compartía habitación con '), P(c.a), T('.')],
        [P(c.a), T(' no tenía compañía en su habitación.')]]);
    case 'NOT_ALONE':
      return pick([
        [P(c.a), T(' no estaba a solas.')],
        [P(c.a), T(' compartía habitación con alguien.')],
        [T('Alguien acompañaba a '), P(c.a), T(' en su habitación.')]]);
    case 'SAME_ROOM':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' estaban en la misma habitación.')],
        [P(c.a), T(' compartía habitación con '), P(c.b), T('.')],
        [T('Se vio a '), P(c.a), T(' y '), P(c.b), T(' juntos, en la misma habitación.')]]);
    case 'DIFF_ROOM':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' estaban en habitaciones distintas.')],
        [P(c.a), T(' no coincidió con '), P(c.b), T(' en ninguna habitación.')],
        [P(c.a), T(' y '), P(c.b), T(' no compartían habitación.')]]);
    case 'ADJ4':
      return pick([
        [P(c.a), T(' estaba justo al lado de '), P(c.b), T('.')],
        [P(c.a), T(' y '), P(c.b), T(' estaban pegados, lado con lado.')],
        [P(c.a), T(' y '), P(c.b), T(' estaban en casillas contiguas, sin contar diagonales.')]]);
    case 'DIAG':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' estaban en diagonal, tocándose por una esquina.')],
        [P(c.a), T(' estaba en diagonal respecto a '), P(c.b), T('.')],
        [P(c.b), T(' estaba en diagonal respecto a '), P(c.a), T('.')]]);
    case 'NOT_NEAR':
      return pick([
        [P(c.a), T(' y '), P(c.b), T(' no estaban pegados (ni en diagonal).')],
        [P(c.a), T(' mantenía las distancias con '), P(c.b), T('.')],
        [P(c.a), T(' no estaba junto a '), P(c.b), T('.')]]);
    case 'ABOVE':
      return pick([
        [P(c.a), T(' estaba más al norte que '), P(c.b), T('.')],
        [P(c.a), T(' estaba más arriba que '), P(c.b), T(' en el plano.')],
        [P(c.b), T(' estaba más al sur que '), P(c.a), T('.')]]);
    case 'LEFT':
      return pick([
        [P(c.a), T(' estaba más al oeste que '), P(c.b), T('.')],
        [P(c.a), T(' estaba más a la izquierda que '), P(c.b), T(' en el plano.')],
        [P(c.b), T(' estaba más al este que '), P(c.a), T('.')]]);
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
        [T(`Se contaron ${NUM[c.n]} personas en `), RM(c.r), T('.')]]);
    case 'ROOM_GT':
      return pick([
        [T('Había más gente en '), RM(c.r), T(' que en '), RM(c.r2), T('.')],
        [RM(c.r, { cap: true }), T(` estaba más ${gen(c.r, 'concurrido', 'concurrida')} que `), RM(c.r2), T('.')],
        [T('En '), RM(c.r), T(' había más personas que en '), RM(c.r2), T('.')]]);
    case 'ROOM_EQ':
      return pick([
        [T('Había tantas personas en '), RM(c.r), T(' como en '), RM(c.r2), T('.')],
        [RM(c.r, { cap: true }), T(' y '), RM(c.r2), T(' albergaban el mismo número de personas.')],
        [T('En '), RM(c.r), T(' y en '), RM(c.r2), T(' había la misma cantidad de gente.')]]);
    case 'CRIME_WEAPON':
      return pick([
        [T('El arma del crimen era '), WP(c.w), T('.')],
        [T('El asesino usó '), WP(c.w), T('.')],
        [WP(c.w, { cap: true }), T(' fue el arma homicida.')]]);
    case 'CRIME_NOT_WEAPON':
      return pick([
        [T('El arma del crimen no era '), WP(c.w), T('.')],
        [T('El asesino no usó '), WP(c.w), T('.')],
        [WP(c.w, { cap: true }), T(' no fue el arma homicida.')]]);
    case 'CRIME_CAT':
      return pick([
        [T(`El asesino empleó ${phrase(c.cat)}.`)],
        [T(`El arma homicida era ${phrase(c.cat)}.`)],
        [T(`Los forenses hablan de ${phrase(c.cat)}.`)]]);
    case 'CRIME_NOT_CAT':
      return pick([
        [T(`El arma homicida no era ${phrase(c.cat)}.`)],
        [T(`El asesino no empleó ${phrase(c.cat)}.`)],
        [T(`Los forenses descartan ${phrase(c.cat)}.`)]]);
    case 'CRIME_ITEM':
      return pick([
        [T('El cuerpo apareció en una habitación con '), IT(c.k), T('.')],
        [T('En la escena del crimen había '), IT(c.k), T('.')],
        [T('Junto al cuerpo, en la misma habitación, había '), IT(c.k), T('.')]]);
    case 'CRIME_NOT_ITEM':
      return pick([
        [T('En la escena del crimen no había '), IT(c.k), T('.')],
        [T('El cuerpo apareció en una habitación sin '), IT(c.k), T('.')],
        [T('La habitación del crimen no tenía '), IT(c.k), T('.')]]);
    default:
      return [T(c.t)];
  }
}

// Qué elementos del tablero afecta una pista (para resaltarlos al tocarla).
export function clueRefs(c, puz, content) {
  const refs = { rooms: [], persons: [], items: [], victim: false };
  if (c.a !== undefined) refs.persons.push(c.a);
  if (c.b !== undefined) refs.persons.push(c.b);
  if (c.r !== undefined) refs.rooms.push(c.r);
  if (c.r2 !== undefined) refs.rooms.push(c.r2);
  if (c.k) refs.items.push(c.k);
  if (c.w) refs.items.push(c.w);
  if (c.t.startsWith('CRIME_')) refs.victim = true;
  return refs;
}

export function roomText(r, puz, content, o = {}) {
  const t = content.roomTypeMap[puz.roomTypes[r]];
  let s = o.de ? (t.art === 'el' ? 'del ' + t.name : 'de la ' + t.name) : t.art + ' ' + t.name;
  if (o.cap) s = s[0].toUpperCase() + s.slice(1);
  return s;
}
export function itemText(id, content) {
  const it = content.itemMap[id];
  return it ? it.det + ' ' + it.name : id;
}
export function weaponText(id, content, o = {}) {
  const w = content.weaponMap[id];
  let s = w.art + ' ' + w.name;
  if (o.cap) s = s[0].toUpperCase() + s.slice(1);
  return s;
}
export function personName(i, puz, content) { return content.charMap[puz.persons[i]].name; }

export function tokensToText(tokens, puz, content) {
  return tokens.map((t) => {
    switch (t.k) {
      case 'p': return personName(t.i, puz, content);
      case 'room': return roomText(t.r, puz, content, t);
      case 'item': return itemText(t.id, content);
      case 'w': return weaponText(t.id, content, t);
      default: return t.s;
    }
  }).join('');
}
