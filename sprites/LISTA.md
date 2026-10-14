# Lista de sprites

Generada a partir de `content.js`. Dentro del juego, **Ajustes → Galería de sprites** muestra cuáles ya están puestos.

Todos en PNG. Fondo transparente salvo los suelos.

## Personajes — `sprites/characters/`

De pie, centrados, cuadrados (p. ej. 64×64). Opcional: `<id>_dead.png` para cuando ese personaje es la víctima.

| Archivo | Personaje | Letra en el lápiz |
|---|---|---|
| `alfredo.png` | Alfredo — El mayordomo | A |
| `beatriz.png` | Beatriz — La condesa | B |
| `candido.png` | Cándido — El cocinero | C |
| `dolores.png` | Dolores — La doncella | D |
| `eusebio.png` | Eusebio — El párroco | E |
| `fernanda.png` | Fernanda — La viuda | F |
| `gregorio.png` | Gregorio — El jardinero | G |
| `herminia.png` | Herminia — La doctora | H |
| `ismael.png` | Ismael — El coronel | I |
| `julia.png` | Julia — La actriz | J |
| `leandro.png` | Leandro — El marqués | L |
| `mercedes.png` | Mercedes — El ama de llaves | M |

## Muebles — `sprites/items/`

Vistos desde arriba, como en un plano. Los personajes se dibujan encima de los muebles que se pueden pisar.

| Archivo | Qué es | Forma | ¿Se puede pisar? |
|---|---|---|---|
| `silla.png` | una silla | 1 casilla · cuadrado | sí |
| `sillon.png` | un sillón | 1 casilla · cuadrado | sí |
| `sofa.png` | un sofá | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | sí |
| `cama.png` | una cama | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | sí |
| `alfombra.png` | una alfombra | bloque de 2–6 casillas · sprite = baldosa cuadrada que se repite | sí |
| `banco.png` | un banco | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | sí |
| `taburete.png` | un taburete | 1 casilla · cuadrado | sí |
| `inodoro.png` | un inodoro | 1 casilla · cuadrado | sí |
| `mesa.png` | una mesa | bloque de 1–4 casillas · sprite = baldosa cuadrada que se repite | no (obstáculo) |
| `mesa_larga.png` | una mesa de banquete | bloque de 2–6 casillas · sprite = baldosa cuadrada que se repite | no (obstáculo) |
| `escritorio.png` | un escritorio | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `planta.png` | una planta | 1 casilla · cuadrado | no (obstáculo) |
| `piano.png` | un piano | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `chimenea.png` | una chimenea | 1 casilla · cuadrado | no (obstáculo) |
| `tele.png` | un televisor | 1 casilla · cuadrado | no (obstáculo) |
| `estanteria.png` | una estantería | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `armario.png` | un armario | 1 casilla · cuadrado | no (obstáculo) |
| `mesilla.png` | una mesilla | 1 casilla · cuadrado | no (obstáculo) |
| `tocador.png` | un tocador | 1 casilla · cuadrado | no (obstáculo) |
| `nevera.png` | una nevera | 1 casilla · cuadrado | no (obstáculo) |
| `horno.png` | un horno | 1 casilla · cuadrado | no (obstáculo) |
| `fregadero.png` | un fregadero | 1 casilla · cuadrado | no (obstáculo) |
| `banera.png` | una bañera | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `lavabo.png` | un lavabo | 1 casilla · cuadrado | no (obstáculo) |
| `globo.png` | un globo terráqueo | 1 casilla · cuadrado | no (obstáculo) |
| `aparador.png` | un aparador | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `caja_fuerte.png` | una caja fuerte | 1 casilla · cuadrado | no (obstáculo) |
| `archivador.png` | un archivador | 1 casilla · cuadrado | no (obstáculo) |
| `fuente.png` | una fuente | 1 casilla · cuadrado | no (obstáculo) |
| `estatua.png` | una estatua | 1 casilla · cuadrado | no (obstáculo) |
| `rosal.png` | un rosal | 1 casilla · cuadrado | no (obstáculo) |
| `barril.png` | un barril | 1 casilla · cuadrado | no (obstáculo) |
| `botellero.png` | un botellero | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `caja.png` | una caja de madera | 1 casilla · cuadrado | no (obstáculo) |
| `perchero.png` | un perchero | 1 casilla · cuadrado | no (obstáculo) |
| `reloj.png` | un reloj de pie | 1 casilla · cuadrado | no (obstáculo) |
| `altar.png` | un altar | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `billar.png` | una mesa de billar | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |
| `bar.png` | una barra de bar | 2 casillas · sprite horizontal 2:1 (p. ej. 128×64); en vertical se gira solo | no (obstáculo) |

## Suelos — `sprites/floors/`

Una baldosa cuadrada que se repite en cada casilla de la habitación. Si no existe, se usa un color liso.

| Archivo | Habitación |
|---|---|
| `cocina.png` | la cocina |
| `salon.png` | el salón |
| `dormitorio.png` | el dormitorio |
| `bano.png` | el baño |
| `biblioteca.png` | la biblioteca |
| `comedor.png` | el comedor |
| `despacho.png` | el despacho |
| `invernadero.png` | el invernadero |
| `bodega.png` | la bodega |
| `vestibulo.png` | el vestíbulo |
| `capilla.png` | la capilla |
| `billar.png` | la sala de billar |
| `jardin.png` | el jardín |

Las puertas y ventanas se dibujan con estilos (no necesitan sprite).
