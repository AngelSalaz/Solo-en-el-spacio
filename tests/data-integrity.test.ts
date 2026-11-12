import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import roomsData from '../src/data/rooms.json';
import itemsData from '../src/data/items.json';
import puzzlesData from '../src/data/puzzles.json';
import type { Action, PuzzleDef, RoomView } from '../src/types';

const rooms = roomsData as unknown as RoomView[];
const puzzles = puzzlesData as unknown as Record<string, PuzzleDef>;
const itemIds = new Set(itemsData.items.map((i) => i.id));
const roomIds = new Set(rooms.map((r) => r.id));

function allActions(): Action[] {
  const out: Action[] = [];
  for (const r of rooms) {
    out.push(...(r.onEnter ?? []));
    for (const h of r.hotspots) {
      out.push(...h.actions);
      for (const u of h.use ?? []) out.push(...u.actions);
    }
  }
  for (const p of Object.values(puzzles)) out.push(...p.onSolve, ...p.onFail);
  return out;
}

describe('integridad de los datos', () => {
  it('los ids de sala son únicos', () => {
    expect(roomIds.size).toBe(rooms.length);
  });

  it('cada fondo existe en public/art', () => {
    for (const r of rooms) {
      expect(existsSync(`public/art/${r.background}.png`), r.background).toBe(true);
    }
  });

  it('los goto apuntan a salas existentes', () => {
    for (const a of allActions()) if (a.type === 'goto') expect(roomIds.has(a.view), a.view).toBe(true);
  });

  it('los objetos entregados o usados existen en items.json', () => {
    for (const a of allActions()) {
      if (a.type === 'give' || a.type === 'take') expect(itemIds.has(a.item), a.item).toBe(true);
    }
    for (const r of rooms) for (const h of r.hotspots) for (const u of h.use ?? []) expect(itemIds.has(u.item)).toBe(true);
  });

  it('los puzzles referenciados existen', () => {
    for (const a of allActions()) if (a.type === 'puzzle') expect(puzzles[a.id], a.id).toBeDefined();
  });

  it('las recetas usan objetos válidos', () => {
    for (const r of itemsData.recipes) {
      expect(itemIds.has(r.a) && itemIds.has(r.b) && itemIds.has(r.result), `${r.a}+${r.b}`).toBe(true);
    }
  });

  it('el locker 2B usa el código 6-4-5 (ventanas, estación, literas)', () => {
    expect(puzzles.locker2B.code).toEqual([6, 4, 5]);
  });
});
