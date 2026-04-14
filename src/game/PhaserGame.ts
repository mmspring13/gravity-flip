import * as Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import MainMenuScene from './scenes/MainMenuScene';
import GameScene from './scenes/GameScene';
import GameOverScene from './scenes/GameOverScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'phaser-container',
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  backgroundColor: '#050510',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false
    }
  },
  scene: [BootScene, MainMenuScene, GameScene, GameOverScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 400,
      height: 300
    },
    max: {
      width: 1600,
      height: 1200
    }
  },
  input: {
    activePointers: 1, // Optimize for single touch
  },
  render: {
    antialias: false, // Better performance on mobile
    powerPreference: 'high-performance'
  },
  fps: {
    target: 60,
    forceSetTimeOut: true // Saves battery on mobile devices
  },
  disableContextMenu: true
};

export default config;
