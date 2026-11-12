import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W, SAVE_KEY, START_VIEW } from '../config';
import itemsData from '../data/items.json';
import { GameState } from '../systems/GameState';
import type { SaveData } from '../systems/GameState';
import { InventorySystem } from '../systems/InventorySystem';
import type { ItemDef, Recipe } from '../types';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    const t = this.add
      .text(GAME_W / 2, GAME_H / 2, 'Cargando…', { fontFamily: 'monospace', fontSize: '18px', color: '#6b7685' })
      .setOrigin(0.5);
    this.load.on('progress', (v: number) => t.setText(`Cargando… ${Math.round(v * 100)}%`));
    this.load.image('cabina_estacion', 'art/cabina_estacion.png');
    this.load.image('entrepuente_lockers', 'art/entrepuente_lockers.png');
  }

  create(): void {
    this.makeShadowTexture();
    this.makeVignetteTexture();

    const state = new GameState(START_VIEW);
    const params = new URLSearchParams(window.location.search);
    if (params.has('reset')) localStorage.removeItem(SAVE_KEY);
    if (params.has('continue')) {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) state.restore(JSON.parse(raw) as SaveData);
    }
    state.onChange(() => localStorage.setItem(SAVE_KEY, JSON.stringify(state.serialize())));

    const inv = new InventorySystem(itemsData.items as ItemDef[], itemsData.recipes as Recipe[]);
    this.registry.set('state', state);
    this.registry.set('inventory', inv);

    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.scene.start('Room');
  }

  /** Silueta genérica de sombra (cabeza + torso) generada por código. */
  private makeShadowTexture(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x04060a, 1).lineStyle(3, 0x33465e, 1);
    g.fillCircle(60, 40, 28).strokeCircle(60, 40, 28);
    g.fillRoundedRect(18, 74, 84, 170, 26).strokeRoundedRect(18, 74, 84, 170, 26);
    g.generateTexture('shadow', 120, 260);
    g.destroy();
  }

  private makeVignetteTexture(): void {
    const tex = this.textures.createCanvas('vignette', GAME_W, GAME_H);
    if (!tex) return;
    const ctx = tex.getContext();
    const grd = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, GAME_H * 0.35, GAME_W / 2, GAME_H / 2, GAME_W * 0.65);
    grd.addColorStop(0, 'rgba(0,0,0,0)');
    grd.addColorStop(1, 'rgba(0,0,0,0.75)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, GAME_W, GAME_H);
    tex.refresh();
  }
}
