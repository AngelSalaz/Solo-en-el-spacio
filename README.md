# Solo en el Espacio (Alone in the Space)

Escape game point-and-click de terror psicológico ambientado en un orbiter. León debe reparar los
sistemas de su nave mientras las sombras de su tripulación lo vigilan.

**Stack:** Phaser 3 · TypeScript · Vite · Vitest · VS Code

## Comandos

| Comando | Qué hace |
|---|---|
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local con recarga en vivo (http://localhost:5173) |
| `npm run typecheck` | Revisa los tipos |
| `npm test` | Ejecuta las pruebas (lógica + integridad de datos) |
| `npm run build` | Compila a `dist/` |
| `npm run preview` | Sirve la versión compilada |

### Parámetros de URL (desarrollo)

- `?debug` dibuja el contorno de todos los hotspots.
- `?reset` borra la partida guardada.
- `?continue` carga la última partida guardada (localStorage).

## Estructura

```
src/
├── main.ts                  # configuración de Phaser
├── config.ts                # constantes (tamaño 1200x675, colores, tiempos)
├── types.ts                 # tipos de los datos (salas, hotspots, acciones, puzzles)
├── scenes/
│   ├── BootScene.ts         # carga de arte, texturas generadas, estado inicial
│   ├── RoomScene.ts         # sala: fondo + hotspots + inventario + sombras
│   └── LockPuzzleScene.ts   # cerradura de símbolos (locker 2B)
├── systems/
│   ├── GameState.ts         # banderas, inventario, recuerdos, batería, guardado (sin Phaser)
│   ├── InventorySystem.ts   # objetos y combinaciones
│   ├── ActionRunner.ts      # ejecuta acciones declaradas en JSON
│   ├── StressSystem.ts      # Calma / Inquietud / Alucinación
│   ├── ShadowSystem.ts      # sombras y "eco de oficio" (mirar 3 s)
│   └── LockLogic.ts         # lógica pura de la cerradura
├── ui/                      # Dialogue (monólogo), Hud (batería, tensión, inventario)
├── data/                    # rooms.json, items.json, puzzles.json
├── minigames/               # (próximo) M01 breakers, M02 reactantes...
└── entities/                # (reservado)
public/art/                  # fondos provisionales (reemplazar por arte final)
public/audio/
tests/                       # Vitest
docs/                        # documentos de diseño
```

## Cómo añadir contenido (sin tocar el código)

**Una vista nueva:** añade un objeto a `src/data/rooms.json` con `id`, `background` (nombre del PNG en
`public/art/`, cárgalo también en `BootScene.preload`) y sus `hotspots`.

**Un hotspot:** `rect` en coordenadas del juego (1200x675), `showIf` opcional y una lista de `actions`.

- Condiciones: `flag:x`, `!flag:x`, `item:x`, `!item:x`, `state:inquietud`, `memory:V1`.
- Acciones: `say`, `setFlag`, `give`, `take`, `goto`, `puzzle`, `memory`, `battery`.
- Usar un objeto sobre un hotspot: campo `use: [{ item, actions }]`.

**Una sombra:** campo `shadows` de la vista (`scripted: true` = siempre; si no, aleatoria con
`chance` y enfriamiento de 2.5 min). `echo` es la pista gratuita al mirarla 3 segundos.

`tests/data-integrity.test.ts` falla si un `goto`, objeto, receta o puzzle apunta a algo que no existe.

## Estado actual (v0.1)

Primer corte jugable del Acto 1: cabina de vuelo ↔ entrepuente, locker 2B con código 6-4-5
(ventanas, estación, literas), inventario con combinación de objetos, silueta de Valdés con eco de
oficio, batería de emergencia y estado de tensión. Los fondos son provisionales.

## Siguiente

1. M01 Panel de breakers (`minigames/`).
2. Bahías de aviónica y fusible puente.
3. M02 Red de reactantes y cierre del Acto 1 (recuerdo V1).
