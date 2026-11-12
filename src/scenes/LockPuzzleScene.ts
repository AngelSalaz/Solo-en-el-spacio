import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from '../config';
import puzzlesData from '../data/puzzles.json';
import { checkCode, wrapDigit } from '../systems/LockLogic';
import type { PuzzleDef } from '../types';

const PUZZLES = puzzlesData as unknown as Record<string, PuzzleDef>;

/** Cerradura de símbolos (3 ruedas 0-9). Se muestra encima de la sala, que queda en pausa. */
export default class LockPuzzleScene extends Phaser.Scene {
  private puzzleId = '';
  private digits: number[] = [];
  private digitTexts: Phaser.GameObjects.Text[] = [];
  private message!: Phaser.GameObjects.Text;

  constructor() {
    super('LockPuzzle');
  }

  init(data: { id: string }): void {
    this.puzzleId = data.id;
  }

  create(): void {
    const def = PUZZLES[this.puzzleId];
    this.digits = def.symbols.map(() => 0);
    this.digitTexts = [];

    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.78).setInteractive();
    this.add
      .rectangle(GAME_W / 2, GAME_H / 2, 780, 400, 0x0d141f)
      .setStrokeStyle(3, 0x3d4b60);
    this.add
      .text(GAME_W / 2, GAME_H / 2 - 170, `${def.title} · CERRADURA DE ${def.symbols.length} SÍMBOLOS`, {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#6b7685',
      })
      .setOrigin(0.5);

    def.symbols.forEach((sym, i) => {
      const cx = GAME_W / 2 + (i - (def.symbols.length - 1) / 2) * 220;
      const cy = GAME_H / 2 - 20;
      this.add.rectangle(cx, cy - 55, 110, 100, 0x070b10).setStrokeStyle(2, 0x4a5a70);
      this.drawIcon(sym, cx, cy - 55);
      this.add
        .text(cx, cy - 2, sym.toUpperCase(), { fontFamily: 'monospace', fontSize: '12px', color: '#6b7685' })
        .setOrigin(0.5);
      const t = this.add
        .text(cx, cy + 50, '0', { fontFamily: 'monospace', fontSize: '60px', color: '#e8a33d' })
        .setOrigin(0.5);
      this.digitTexts.push(t);
      this.arrow(cx, cy + 10, -1, i);
      this.arrow(cx, cy + 100, +1, i);
    });

    this.message = this.add
      .text(GAME_W / 2, GAME_H / 2 + 140, '', { fontFamily: 'Georgia, serif', fontSize: '18px', color: '#c0392b' })
      .setOrigin(0.5);
    this.button(GAME_W / 2 - 100, GAME_H / 2 + 175, 'ABRIR', () => this.tryOpen(def));
    this.button(GAME_W / 2 + 100, GAME_H / 2 + 175, 'SALIR', () => this.finish(false, true));
    this.input.keyboard?.on('keydown-ESC', () => this.finish(false, true));
  }

  private arrow(x: number, y: number, delta: number, index: number): void {
    const up = delta < 0;
    const tri = this.add
      .triangle(x, y, 0, up ? 18 : 0, 18, up ? 18 : 0, 9, up ? 0 : 18, COLORS.amber)
      .setInteractive({ useHandCursor: true });
    tri.setScale(1.6);
    tri.on('pointerdown', () => {
      this.digits[index] = wrapDigit(this.digits[index], -delta);
      this.digitTexts[index].setText(String(this.digits[index]));
      this.message.setText('');
    });
  }

  private button(x: number, y: number, label: string, cb: () => void): void {
    const r = this.add
      .rectangle(x, y, 150, 40, 0x18222f)
      .setStrokeStyle(2, COLORS.amber)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '16px', color: '#e8a33d' }).setOrigin(0.5);
    r.on('pointerdown', cb);
  }

  private tryOpen(def: PuzzleDef): void {
    if (checkCode(def.code, this.digits)) {
      this.finish(true, false);
      return;
    }
    const fail = def.onFail.find((a) => a.type === 'say');
    this.message.setText(fail && fail.type === 'say' ? fail.text : 'No abre.');
    this.cameras.main.shake(180, 0.004);
  }

  private finish(solved: boolean, cancelled: boolean): void {
    this.game.events.emit('puzzle-result', { id: this.puzzleId, solved, cancelled });
    this.scene.stop();
  }

  /** Iconos simples de ventana, estación (asiento) y litera. */
  private drawIcon(kind: string, cx: number, cy: number): void {
    const g = this.add.graphics().lineStyle(3, COLORS.bone);
    if (kind === 'ventana') {
      g.strokeRect(cx - 24, cy - 18, 48, 36).lineBetween(cx, cy - 18, cx, cy + 18).lineBetween(cx - 24, cy, cx + 24, cy);
    } else if (kind === 'estación') {
      g.strokeRoundedRect(cx - 18, cy - 28, 36, 28, 8).strokeRoundedRect(cx - 26, cy - 2, 52, 22, 6);
    } else {
      g.strokeRoundedRect(cx - 32, cy - 12, 64, 26, 12).strokeCircle(cx - 18, cy + 1, 7);
    }
  }
}
