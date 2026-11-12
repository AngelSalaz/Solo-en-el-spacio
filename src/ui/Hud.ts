import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import type { GameState } from '../systems/GameState';
import type { InventorySystem } from '../systems/InventorySystem';
import type { Tension } from '../types';

const TENSION_LABEL: Record<Tension, { text: string; color: string }> = {
  calma: { text: 'CALMA', color: '#5fd38d' },
  inquietud: { text: 'INQUIETUD', color: '#e8a33d' },
  alucinacion: { text: 'ALUCINACIÓN', color: '#c0392b' },
};

const SLOT_W = 58;
const SLOT_GAP = 4;
const MAX_SLOTS = 10;

/** Capa fija: batería, estado de tensión, inventario y texto de ayuda al pasar el cursor. */
export class Hud {
  private g: Phaser.GameObjects.Graphics;
  private batteryLabel: Phaser.GameObjects.Text;
  private tensionLabel: Phaser.GameObjects.Text;
  private hoverLabel: Phaser.GameObjects.Text;
  private slotObjs: Phaser.GameObjects.GameObject[] = [];
  private selected: string | null = null;

  constructor(
    private scene: Phaser.Scene,
    private state: GameState,
    private inv: InventorySystem,
    private onItemClick: (id: string) => void,
  ) {
    this.g = scene.add.graphics().setDepth(70);
    const mono = { fontFamily: 'monospace', fontSize: '13px', color: '#e6e1d6' };
    this.batteryLabel = scene.add.text(32, 24, 'BAT', mono).setDepth(72);
    this.tensionLabel = scene.add
      .text(GAME_W - 24, 24, '', { ...mono, fontSize: '14px' })
      .setOrigin(1, 0)
      .setDepth(72);
    this.hoverLabel = scene.add
      .text(GAME_W / 2, 28, '', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#e8a33d' })
      .setOrigin(0.5)
      .setDepth(72);
    this.refresh();
  }

  setHover(text: string): void {
    this.hoverLabel.setText(text);
  }

  setSelected(id: string | null): void {
    this.selected = id;
    this.refresh();
  }

  refresh(): void {
    const g = this.g;
    g.clear();

    // Batería de emergencia (solo antes de restaurar la energía)
    const showBattery = !this.state.hasFlag('energia_restaurada');
    this.batteryLabel.setVisible(showBattery);
    if (showBattery) {
      g.fillStyle(0x0a0f18, 0.9).fillRoundedRect(70, 20, 150, 24, 6);
      g.lineStyle(2, COLORS.steel).strokeRoundedRect(70, 20, 150, 24, 6);
      const w = (142 * this.state.battery) / 100;
      g.fillStyle(this.state.battery <= 20 ? COLORS.red : COLORS.amber, 0.75).fillRoundedRect(74, 24, w, 16, 4);
    }

    // Estado de tensión
    const t = TENSION_LABEL[this.state.tension];
    this.tensionLabel.setText(`● ${t.text}`).setColor(t.color);

    // Inventario
    for (const o of this.slotObjs) o.destroy();
    this.slotObjs = [];
    const total = MAX_SLOTS * (SLOT_W + SLOT_GAP) - SLOT_GAP;
    const x0 = (GAME_W - total) / 2;
    const y = GAME_H - 46;
    g.fillStyle(0x0a0f18, 0.85).fillRoundedRect(x0 - 8, y - 6, total + 16, 52, 8);
    g.lineStyle(2, COLORS.steel).strokeRoundedRect(x0 - 8, y - 6, total + 16, 52, 8);
    for (let i = 0; i < MAX_SLOTS; i++) {
      const x = x0 + i * (SLOT_W + SLOT_GAP);
      const id = this.state.items[i];
      const sel = id !== undefined && id === this.selected;
      g.fillStyle(0x141c29, 1).fillRoundedRect(x, y, SLOT_W, 40, 6);
      g.lineStyle(sel ? 3 : 2, sel ? COLORS.amber : COLORS.steel).strokeRoundedRect(x, y, SLOT_W, 40, 6);
      if (id === undefined) continue;
      const def = this.inv.def(id);
      const swatch = this.scene.add
        .rectangle(x + SLOT_W / 2, y + 12, 22, 10, Phaser.Display.Color.HexStringToColor(def.color).color)
        .setDepth(72);
      const label = this.scene.add
        .text(x + SLOT_W / 2, y + 28, def.name.slice(0, 10), { fontFamily: 'monospace', fontSize: '9px', color: '#e6e1d6' })
        .setOrigin(0.5)
        .setDepth(72);
      const hit = this.scene.add
        .rectangle(x + SLOT_W / 2, y + 20, SLOT_W, 40, 0xffffff, 0.001)
        .setDepth(73)
        .setInteractive({ useHandCursor: true });
      hit.on('pointerover', () => this.setHover(`${def.name}: ${def.description}`));
      hit.on('pointerout', () => this.setHover(''));
      hit.on('pointerdown', () => this.onItemClick(id));
      this.slotObjs.push(swatch, label, hit);
    }
  }
}
