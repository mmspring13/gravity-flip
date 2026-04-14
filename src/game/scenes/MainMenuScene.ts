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
    this.add.tileSprite(480, 270, 1100, 700, 'bg_grid_far');
    this.add.tileSprite(480, 270, 1100, 700, 'bg_grid_near');

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
      if (this.cache.audio.exists('welcome')) {
        this.sound.play('welcome');
      }
      this.scene.start('GameScene');
    });

    this.input.keyboard!.on('keydown-SPACE', () => {
      if (this.cache.audio.exists('welcome')) {
        this.sound.play('welcome');
      }
      this.scene.start('GameScene');
    });
  }

  update(time: number, delta: number) {
    // Smooth camera sway (Hotline Miami style)
    const swaySpeed = 0.0015;
    const swayAmount = 8;
    const rotAmount = 0.015;

    this.cameras.main.scrollX = Math.sin(time * swaySpeed) * swayAmount;
    this.cameras.main.scrollY = Math.cos(time * swaySpeed * 0.8) * swayAmount;
    this.cameras.main.rotation = Math.sin(time * swaySpeed * 0.5) * rotAmount;
  }
}
