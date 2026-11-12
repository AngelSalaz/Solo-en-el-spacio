import { describe, expect, it } from 'vitest';
import { GameState } from '../src/systems/GameState';
import { InventorySystem } from '../src/systems/InventorySystem';
import { computeTension } from '../src/systems/StressSystem';
import { checkCode, wrapDigit } from '../src/systems/LockLogic';
import { runActions } from '../src/systems/ActionRunner';
import type { ActionHost } from '../src/systems/ActionRunner';
import itemsData from '../src/data/items.json';
import type { ItemDef, Recipe } from '../src/types';

const makeInv = () => new InventorySystem(itemsData.items as ItemDef[], itemsData.recipes as Recipe[]);

describe('GameState', () => {
  it('gestiona banderas e inventario sin duplicados', () => {
    const s = new GameState('a');
    expect(s.addItem('linterna')).toBe(true);
    expect(s.addItem('linterna')).toBe(false);
    expect(s.hasItem('linterna')).toBe(true);
    expect(s.removeItem('linterna')).toBe(true);
    expect(s.removeItem('linterna')).toBe(false);
    s.setFlag('x');
    expect(s.hasFlag('x')).toBe(true);
    s.setFlag('x', false);
    expect(s.hasFlag('x')).toBe(false);
  });

  it('evalúa condiciones con negación', () => {
    const s = new GameState('a');
    expect(s.check(['!item:linterna'])).toBe(true);
    s.addItem('linterna');
    expect(s.check(['item:linterna', '!flag:visto'])).toBe(true);
    s.setFlag('visto');
    expect(s.check(['item:linterna', '!flag:visto'])).toBe(false);
    expect(s.check(['state:inquietud'])).toBe(true);
    expect(s.check()).toBe(true);
  });

  it('limita la batería entre 0 y 100', () => {
    const s = new GameState('a');
    s.consumeBattery(30);
    expect(s.battery).toBe(70);
    s.consumeBattery(500);
    expect(s.battery).toBe(0);
  });

  it('guarda y restaura la partida', () => {
    const s = new GameState('a');
    s.addItem('cinta');
    s.setFlag('f');
    s.unlockMemory('V1');
    s.setView('b');
    const data = s.serialize();
    const t = new GameState('a');
    t.restore(JSON.parse(JSON.stringify(data)));
    expect(t.hasItem('cinta')).toBe(true);
    expect(t.hasFlag('f')).toBe(true);
    expect(t.memories.has('V1')).toBe(true);
    expect(t.currentView).toBe('b');
  });

  it('notifica los cambios y permite cancelar la suscripción', () => {
    const s = new GameState('a');
    let n = 0;
    const off = s.onChange(() => n++);
    s.setFlag('a');
    off();
    s.setFlag('b');
    expect(n).toBe(1);
  });
});

describe('InventorySystem', () => {
  it('combina cable + fusible en fusible puente', () => {
    const s = new GameState('a');
    const inv = makeInv();
    s.addItem('cable');
    s.addItem('fusible');
    const r = inv.combine(s, 'fusible', 'cable');
    expect(r?.result).toBe('fusible_puente');
    expect(s.hasItem('fusible_puente')).toBe(true);
    expect(s.hasItem('cable')).toBe(false);
  });

  it('une las tres páginas en dos pasos', () => {
    const s = new GameState('a');
    const inv = makeInv();
    ['pagina1', 'pagina2', 'pagina3'].forEach((i) => s.addItem(i));
    expect(inv.combine(s, 'pagina1', 'pagina2')?.result).toBe('pagina12');
    expect(inv.combine(s, 'pagina12', 'pagina3')?.result).toBe('procedimiento');
    expect(s.items).toEqual(['procedimiento']);
  });

  it('rechaza combinaciones inválidas', () => {
    const s = new GameState('a');
    const inv = makeInv();
    s.addItem('cinta');
    s.addItem('linterna');
    expect(inv.combine(s, 'cinta', 'linterna')).toBeNull();
    expect(inv.combine(s, 'cinta', 'cinta')).toBeNull();
    expect(s.items).toHaveLength(2);
  });
});

describe('StressSystem', () => {
  it('calcula el estado de tensión', () => {
    const base = { co2: 0, hasFlag: () => false };
    expect(computeTension(base)).toBe('inquietud');
    expect(computeTension({ co2: 80, hasFlag: () => false })).toBe('alucinacion');
    expect(computeTension({ co2: 10, hasFlag: (f) => f === 'sistemas_estables' })).toBe('calma');
  });
});

describe('LockLogic', () => {
  it('valida el código 6-4-5 del locker 2B', () => {
    expect(checkCode([6, 4, 5], [6, 4, 5])).toBe(true);
    expect(checkCode([6, 4, 5], [6, 5, 4])).toBe(false);
    expect(checkCode([6, 4, 5], [6, 4])).toBe(false);
  });
  it('las ruedas dan la vuelta entre 0 y 9', () => {
    expect(wrapDigit(9, 1)).toBe(0);
    expect(wrapDigit(0, -1)).toBe(9);
    expect(wrapDigit(4, 1)).toBe(5);
  });
});

describe('ActionRunner', () => {
  it('ejecuta acciones y se detiene tras un goto', () => {
    const state = new GameState('a');
    const said: string[] = [];
    let went = '';
    const host: ActionHost = {
      state,
      say: (t) => said.push(t),
      goto: (v) => (went = v),
      openPuzzle: () => {},
      onMemory: () => {},
      itemName: (id) => id,
    };
    runActions(
      [
        { type: 'give', item: 'linterna' },
        { type: 'setFlag', flag: 'ok' },
        { type: 'goto', view: 'b' },
        { type: 'say', text: 'no debe salir' },
      ],
      host,
    );
    expect(state.hasItem('linterna')).toBe(true);
    expect(state.hasFlag('ok')).toBe(true);
    expect(went).toBe('b');
    expect(said).toEqual(['Obtienes: linterna.']);
  });
});
