import * as Phaser from 'phaser';

export default class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.cameras.main.setBackgroundColor('#050510');
    this.add.tileSprite(400, 300, 800, 600, 'bg_grid_far');
    this.add.tileSprite(400, 300, 800, 600, 'bg_grid_near');

    // Title
    this.add.text(width / 2, height / 2 - 80, 'GRAVITY FLIP', {
      fontSize: '64px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2,
      shadow: { blur: 15, color: '#00ffff', fill: true }
    }).setOrigin(0.5);

    // Start Button
    const startBtn = this.add.text(width / 2, height / 2 + 60, '> START GAME <', {
      fontSize: '32px',
      color: '#000000',
      backgroundColor: '#00ffff',
      padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Pulse animation for start button
    this.tweens.add({
      targets: startBtn,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    startBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      this.scene.start('GameScene');
    });
  }
}
