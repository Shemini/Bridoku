# Murdoku · juego web para móvil

Rompecabezas de lógica en el que hay que colocar a todos los personajes en una mansión y descubrir **quién es el asesino y con qué arma**. Los casos se **generan automáticamente** (todos con solución única garantizada) y hay un **caso del día** igual para todos.

Está hecho como web app (PWA): se puede jugar desde el navegador o instalarla en la pantalla de inicio para que se vea **a pantalla completa, como una aplicación**, y funciona **sin conexión**.

---

## 1. Probarlo en tu ordenador

Los archivos usan módulos de JavaScript, así que **no se puede abrir con doble clic** en `index.html`; necesita un servidor web (cualquiera vale). La forma más rápida, con Python:

```
cd murdoku
python3 -m http.server 8000
```

y abre `http://localhost:8000`. (Para probarlo con el móvil en la misma wifi: `http://IP-DE-TU-PC:8000`.)

## 2. Publicarlo (Netlify)

1. Entra en <https://app.netlify.com/drop>.
2. Arrastra **la carpeta `murdoku` entera**.
3. Listo: te da una dirección `https://algo.netlify.app`.

También sirve subirlo a un repositorio de GitHub y conectarlo a Netlify, igual que con GROOM. No hay nada que compilar.

> Si cambias archivos de código y quieres forzar que todos los móviles lo recarguen, cambia el nombre de la caché en `sw.js` (`murdoku-v1` → `murdoku-v2`).

## 3. Que se vea como una app a pantalla completa

- **Android (Chrome):** menú ⋮ → *Instalar aplicación*. Se abre a pantalla completa, sin barra del navegador, y en vertical.
- **iPhone / iPad (Safari):** botón *Compartir* → *Añadir a pantalla de inicio*. Se abre sin barras de Safari. (iOS no permite el modo pantalla completa dentro de Safari; la forma de conseguirlo es esta.)
- Dentro del navegador, en Android, el juego intenta entrar en pantalla completa al empezar un caso (se puede desactivar en *Ajustes*).
- El botón *Atrás* del móvil cierra ventanas y vuelve al menú en lugar de salir de la app.

---

## 4. Tus sprites

Los sprites son archivos **PNG** que dejas en la carpeta `sprites/`. **No hay que tocar código**: si el archivo existe, el juego lo usa; si no existe, dibuja un sustituto provisional (emoji o un círculo de color con la inicial). Puedes ir sustituyéndolos poco a poco.

| Carpeta | Qué va | Nombre del archivo |
|---|---|---|
| `sprites/characters/` | Personajes | `alfredo.png`, `irene.png`… y, opcional, `alfredo_dead.png` (cuando ese personaje es la víctima) |
| `sprites/items/` | Muebles | `sofa.png`, `cama.png`, `nevera.png`… |
| `sprites/weapons/` | Armas | `cuchillo.png`, `candelabro.png`… |
| `sprites/floors/` | Suelo de cada tipo de habitación | `cocina.png`, `salon.png`… |
| `sprites/decor/` | Adornos que solo decoran | `alfombra.png`, `cuadro.png`… |

La lista completa de nombres está en **`sprites/LISTA.md`**. Dentro del juego, **Ajustes → Galería de sprites** enseña cuáles ya están colocados y cuáles faltan.

**Formato recomendado**

- PNG con **fondo transparente** (menos los suelos), **cuadrados**, todos del mismo tamaño dentro de su categoría. 64×64 va bien; si haces pixel art de 16×16 o 32×32 también: se amplía **sin suavizar**, así que se ve nítido.
- **Personajes:** de pie, centrados, ocupando casi todo el cuadro.
- **Muebles y armas:** una pieza por casilla. Los personajes se dibujan encima del mueble, así que conviene que lo importante quede en la parte alta.
- **Suelos:** una baldosa que se repite en cada casilla de la habitación; si encaja consigo misma sin costuras, mejor.
- Cada puzle usa solo una parte: 4–7 habitaciones, 5–8 personajes y unas pocas armas, elegidos al azar.

### Añadir personajes, muebles, armas o habitaciones nuevas

Todo vive en `content.js`, en listas muy simples. Por ejemplo, para un personaje nuevo se añade una línea:

```js
{ id: 'marta', name: 'Marta', role: 'La periodista', color: '#7a4fb0', emoji: '📰' },
```

y se deja `sprites/characters/marta.png`. Un mueble nuevo (`id`, `name`, `det` = «un/una», `loc` = «en» si te sientas/estás encima o «ante» si estás delante, `emoji` provisional) debe además añadirse en `items:` de la habitación donde puede aparecer. Más personajes, habitaciones y muebles = más variedad.

---

## 5. Cómo funciona

**Reglas del puzle.** Hay un personaje por fila y por columna de una cuadrícula N×N. La víctima estaba en una habitación con un arma y solo había otra persona con ella: el asesino. Las pistas son siempre verdaderas.

**Generador** (`engine.js`):

1. Divide la cuadrícula en habitaciones, coloca muebles y armas, y elige una solución válida.
2. Genera todas las pistas verdaderas posibles (más de 25 tipos: dónde estaba alguien, con quién, junto a qué mueble, quién estaba más al norte/oeste, cuántas personas había en una habitación, qué arma o escena del crimen se descarta…).
3. Elige un conjunto de pistas y **comprueba con un solucionador que existe una única solución**; después quita todas las pistas que sobren.
4. Los casos Fáciles se aseguran además de poder resolverse solo por deducción, sin tener que probar suerte.

Es determinista: la misma semilla da exactamente el mismo caso en cualquier móvil (por eso el **caso del día** es igual para todos y no necesita servidor). Los casos libres usan una semilla aleatoria.

| Nivel | Cuadrícula | Habitaciones |
|---|---|---|
| Fácil | 5×5 | 4 |
| Normal | 6×6 | 5 |
| Difícil | 7×7 | 6 |
| Experto | 8×8 | 7 |

**Caso del día.** La dificultad sube durante la semana: lunes y martes Fácil, miércoles y jueves Normal, viernes y sábado Difícil, domingo Experto (se cambia en `DAILY_BY_DOW`, al principio de `app.js`).

**Velocidad.** Se genera en un *Web Worker* para no bloquear la pantalla. En un móvil normal: Fácil/Normal/Difícil, menos de un par de segundos; Experto puede tardar unos segundos más (sale una animación de «Investigando el caso…»).

**Pruebas.** Con Node instalado:

```
node tools/test.mjs 20          # genera 20 puzles por nivel y verifica unicidad
node tools/show.mjs normal abc  # imprime un puzle en texto
```

## 6. Archivos

```
index.html · style.css · app.js     interfaz y juego
engine.js                           generador y solucionador
texts.js                            redacción de las pistas
content.js                          personajes, muebles, armas, habitaciones
worker.js · sw.js                   generación en segundo plano · modo sin conexión
manifest.webmanifest · icons/       instalación como app
sprites/                            tus PNG
tools/                              pruebas
```

El nombre del juego se cambia en `content.js` (`GAME.title`) y en `manifest.webmanifest` / `index.html`. «Murdoku» es también el nombre con el que se conoce este tipo de puzle y existen otras apps con ese nombre; si algún día lo publicas más allá de uso personal, quizá te convenga uno propio.
