import Phaser from 'phaser';
import { COLORS, GAME_H, GAME_W } from './config';
import BootScene from './scenes/BootScene';
import LockPuzzleScene from './scenes/LockPuzzleScene';
import RoomScene from './scenes/RoomScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_W,
  height: GAME_H,
  backgroundColor: COLORS.bg,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, RoomScene, LockPuzzleScene],
});
