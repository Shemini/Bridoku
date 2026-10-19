# Bridoku · juego web para móvil

Rompecabezas de lógica con temática de boda, al estilo de los libros de Murdoku de Manuel Garand. En plena boda, **Sabas, el novio, aparece muerto**: hay que colocar a todos los invitados en el plano de la finca y descubrir **quién estuvo a solas con él**. Los casos se **generan automáticamente** (todos con solución única garantizada) y cada día hay **cuatro casos nuevos, uno por dificultad**, iguales para todos. Los de días anteriores siguen disponibles en el **archivo**.

Está hecho como web app (PWA): se puede jugar desde el navegador o instalarla en la pantalla de inicio para que se vea **a pantalla completa, como una aplicación**, y funciona **sin conexión**.

---

## 1. Probarlo en tu ordenador

Los archivos usan módulos de JavaScript, así que **no se puede abrir con doble clic** en `index.html`; necesita un servidor web (cualquiera vale). La forma más rápida, con Python:

```
cd bridoku
python3 -m http.server 8000
```

y abre `http://localhost:8000`. (Para probarlo con el móvil en la misma wifi: `http://IP-DE-TU-PC:8000`.)

## 2. Publicarlo (Netlify)

1. Entra en <https://app.netlify.com/drop>.
2. Arrastra **la carpeta del juego entera**.
3. Listo: te da una dirección `https://algo.netlify.app`.

También sirve subirlo a un repositorio de GitHub y conectarlo a Netlify, igual que con GROOM. No hay nada que compilar.

> Si cambias archivos de código y quieres forzar que todos los móviles lo recarguen, cambia el nombre de la caché en `sw.js` (`bridoku-v1` → `bridoku-v2`).

## 3. Que se vea como una app a pantalla completa

- **Android (Chrome):** menú ⋮ → *Instalar aplicación*. Se abre a pantalla completa, sin barra del navegador, y en vertical.
- **iPhone / iPad (Safari):** botón *Compartir* → *Añadir a pantalla de inicio*. Se abre sin barras de Safari. (iOS no permite el modo pantalla completa dentro de Safari; la forma de conseguirlo es esta.)
- Dentro del navegador, en Android, el juego intenta entrar en pantalla completa al empezar un caso (se puede desactivar en *Ajustes*).
- El botón *Atrás* del móvil cierra ventanas y vuelve al menú en lugar de salir de la app.

---

## 4. Tus sprites

Los sprites son archivos **PNG** que dejas en la carpeta `sprites/`. **No hay que tocar código**: si el archivo existe, el juego lo usa; si no, dibuja un sustituto provisional (emoji, forma de color o círculo con la inicial). Puedes ir sustituyéndolos poco a poco.

| Carpeta | Qué va | Ejemplo |
|---|---|---|
| `sprites/characters/` | Personajes (y, opcional, `<id>_dead.png` para cuando son la víctima) | `alfredo.png` |
| `sprites/items/` | Muebles, vistos desde arriba | `cama.png`, `silla.png`, `mesa.png` |
| `sprites/floors/` | Suelo de cada tipo de habitación (baldosa) | `cocina.png` |

La lista completa de nombres, con la forma de cada mueble, está en **`sprites/LISTA.md`**. Dentro del juego, **Ajustes → Galería de sprites** muestra cuáles faltan.

**Formas de los muebles** (importante para dibujarlos):

- **1 casilla** (silla, planta, sillón…): sprite cuadrado, p. ej. 64×64.
- **2 casillas** (cama, sofá, bañera, piano, banco…): sprite **horizontal el doble de ancho que de alto** (p. ej. 128×64). Si el mueble cae en vertical, el juego lo gira 90°.
- **Bloques** (mesas y alfombras): ocupan un rectángulo de varias casillas. El sprite es **una baldosa cuadrada** que se repite en cada casilla del bloque.

Pixel art pequeño (16×16, 32×32) se amplía sin suavizar, así que se ve nítido.

### Añadir personajes, muebles o habitaciones

Todo vive en `content.js`:

- **Víctima:** `GAME.victim` (ahora `'sabas'`). Siempre aparece y siempre es la víctima.
- **Personaje:** `{ id: 'olga', name: 'Olga', mark: 'O', g: 'f', role: 'La cuñada', color: '#7a4fb0' }`. `mark` es la letra que sale en las marcas a lápiz: conviene que no se repita (el generador evita juntar dos personajes con la misma letra). `g` sirve para concordar «sentado/sentada».
- **Mueble:** `walk: true` si se puede estar encima (sentado, tumbado…) y `false` si es obstáculo. `shape`: `'one'`, `'pair'` o `'area'` (con `size: [mín, máx]` casillas). `around: ['mesa']` hace que se coloque pegado a una mesa (así salen las sillas alrededor). `wall: true` lo arrima a una pared.
- **Habitación:** su lista `furnish` dice qué muebles lleva, cuántos (`n: [mín, máx]`) y con qué probabilidad (`p`).

---

## 5. Cómo funciona

**Reglas** (las de los libros de Murdoku de Manuel Garand):

- Plano N×N con N personas, la víctima incluida: **una por fila y una por columna**.
- **Nadie puede estar en una casilla con obstáculo** (mesas, plantas, pianos, armarios…). Sí sobre sillas, sillones, sofás, camas, bancos, taburetes o alfombras.
- **Puertas y ventanas están en los muros**, no ocupan casilla. «Junto a una ventana» = la casilla toca ese muro.
- **«Al lado de»** = casilla contigua (no en diagonal) **dentro de la misma habitación**.
- La víctima (siempre Sabas) estaba **a solas con el asesino**: en su habitación solo había otra persona. No hay armas.
- **Todos los sospechosos tienen al menos una pista** que los menciona. La víctima no necesita pista propia: su «pista» es que estaba a solas con el asesino (aparece fija al principio de la lista). Nunca se da una pista que diga directamente con quién estaba Sabas en su habitación.

**Tipos de pista** (40, cada una con varias redacciones):

- **Habitación:** estaba o no estaba en ella.
- **Muebles:** sentado/tumbado en…, al lado de…, sobre el suelo desnudo, la única persona sentada en…, nadie estaba en…
- **Muros:** junto a una ventana o una puerta, junto a un muro exterior.
- **Filas y columnas:** en la misma fila o columna que un mueble, en la fila de más arriba, en la columna de más a la derecha…
- **Entre personas** (pocas, como mucho una o dos por caso): misma habitación o distinta, a solas con…, en diagonal, más arriba o más a la izquierda que…, exactamente una o dos filas o columnas de distancia.

Cuando una pista habla de un mueble que se repite en el plano, lo dice: «junto al rosal» si solo hay uno, «junto a uno de los rosales» si hay varios (vale cualquiera).
- **Recuentos:** cuánta gente había en una habitación, comparaciones entre habitaciones, cuántas habitaciones quedaron vacías.
- **Escena del crimen:** qué muebles o ventanas había donde apareció el cuerpo.

**Generador** (`engine.js`):

1. Divide el plano en estancias de la finca (suite nupcial, vestidor de la novia, capilla, salón de banquetes, pista de baile, barra libre, photocall, jardín, terraza, cocina del catering, recepción, aseo, bodega) y las amuebla: cama de 2 casillas, mesa del banquete con sillas alrededor, tarta, arco floral, cabina del DJ, alfombras continuas…
2. Pone puertas entre habitaciones (todas quedan comunicadas) y ventanas en los muros exteriores.
3. Elige una solución válida y genera todas las pistas verdaderas posibles.
4. Selecciona pistas hasta que un solucionador comprueba que hay **una única solución**, se asegura de que cada sospechoso tenga al menos una, y luego quita todas las que sobran. Los Fáciles, además, se resuelven sin tener que probar suerte.

Es determinista: la misma semilla da el mismo caso en cualquier móvil (así el **caso del día** es igual para todos sin servidor).

| Nivel | Plano | Sospechosos | Habitaciones |
|---|---|---|---|
| Fácil | 5×5 | 4 | 4 |
| Normal | 6×6 | 5 | 5 |
| Difícil | 7×7 | 6 | 6 |
| Experto | 8×8 | 7 | 7 |

**Sospechosos.** La lista está en `content.js` (`CHARACTERS`): más de 100 invitados reales, de los que cada caso escoge unos pocos al azar sin repetir inicial. En la interfaz (bandeja, acusación, pistas) aparecen en orden alfabético, con Sabas siempre primero. Sabas usa † como marca de lápiz para no chocar con los sospechosos que empiezan por S.

**Casos diarios y archivo.** Cada día hay un caso de cada dificultad. Se generan a partir de la fecha (semilla `D2026-10-18`, por ejemplo), así que no hay que guardarlos en ningún sitio: cualquier móvil genera exactamente el mismo caso para la misma fecha y dificultad. El archivo muestra un calendario desde `GAME.epoch` en `content.js` (el 1 de octubre de 2026) hasta hoy, con el estado de cada caso. No hay casos aleatorios.

> Ojo: si se cambia el generador o el contenido (`engine.js`, `content.js`), los casos de cada fecha cambian. Los que alguien tenga empezados o resueltos se conservan tal cual, porque cada partida guarda su propio caso.

**Marcado tipo sudoku**

- Toca un personaje y luego una casilla para **colocarlo**. Tocar otra vez la misma casilla lo quita.
- **✏️ Lápiz:** anota dónde podría estar el personaje elegido; tocar de nuevo quita la marca. Las marcas se conservan debajo de una solución y reaparecen al quitarla.
- **⬛ Vacía:** oscurece casillas donde no puede haber nadie.
- **🧽 Borrar:** vacía por completo cada casilla que toques.
- Se oscurecen solas las casillas con obstáculo y las filas y columnas de cada solución.
- **Borde rojo** si dos soluciones comparten fila o columna, o si un personaje está colocado dos veces.
- **Deshacer**, **💡 Pista** (revela a un personaje) y **✔︎ Revisar** (señala errores sin dar la solución).

**Pruebas** (con Node):

```
node tools/test.mjs 20          # 20 casos por nivel, verifica solución única
node tools/show.mjs normal abc  # imprime un caso en texto
```

## 6. Archivos

```
index.html · style.css · app.js     interfaz y juego
engine.js                           generador y solucionador
texts.js                            redacción de las pistas
content.js                          personajes, muebles, habitaciones
worker.js · sw.js                   generación en segundo plano · modo sin conexión
manifest.webmanifest · icons/       instalación como app
sprites/                            tus PNG
tools/                              pruebas
```

El nombre del juego se cambia en `content.js` (`GAME.title`) y en `manifest.webmanifest` / `index.html`.
