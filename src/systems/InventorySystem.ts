import type { ItemDef, Recipe } from '../types';
import type { GameState } from './GameState';

export class InventorySystem {
  private defs = new Map<string, ItemDef>();

  constructor(
    items: ItemDef[],
    private recipes: Recipe[],
  ) {
    for (const i of items) this.defs.set(i.id, i);
  }

  def(id: string): ItemDef {
    return this.defs.get(id) ?? { id, name: id, description: '', color: '#888888' };
  }

  /** Intenta combinar dos objetos. Devuelve la receta aplicada o null. */
  combine(state: GameState, a: string, b: string): Recipe | null {
    if (a === b) return null;
    if (!state.hasItem(a) || !state.hasItem(b)) return null;
    const r = this.recipes.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    if (!r) return null;
    state.removeItem(r.a);
    state.removeItem(r.b);
    state.addItem(r.result);
    return r;
  }
}
