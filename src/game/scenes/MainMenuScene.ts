import * as Phaser from 'phaser';
import { t, toggleLanguage, getLanguage } from '../translations';

export default class MainMenuScene extends Phaser.Scene {
  private titleText!: Phaser.GameObjects.Text;
  private startBtn!: Phaser.GameObjects.Text;

  constructor() {
    super('MainMenuScene');
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background
    this.cameras.main.setBackgroundColor('#050510');
    this.add.tileSprite(640, 310, 1400, 700, 'bg_grid_far').setTint(0x00ffff);
    this.add.tileSprite(640, 310, 1400, 700, 'bg_grid_near').setTint(0x00ffff);

    // Title
    this.titleText = this.add.text(width / 2, height / 2 - 80, t('TITLE'), {
      fontFamily: '"Tektur", sans-serif',
      fontSize: '64px',
      color: '#00ffff',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2,
      shadow: { blur: 15, color: '#00ffff', fill: true }
    }).setOrigin(0.5);

    // Start Button
    this.startBtn = this.add.text(width / 2, height / 2 + 60, t('START_PROMPT'), {
      fontFamily: '"Tektur", sans-serif',
      fontSize: '32px',
      color: '#000000',
      backgroundColor: '#00ffff',
      padding: { x: 24, y: 12 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Language Toggle Button
    const langBtn = this.add.text(width - 40, 40, getLanguage().toUpperCase(), {
      fontFamily: '"Tektur", sans-serif',
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#ff0055',
      padding: { x: 10, y: 5 },
      fontStyle: 'bold'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    langBtn.on('pointerdown', () => {
      const newLang = toggleLanguage();
      langBtn.setText(newLang.toUpperCase());
      this.updateTexts();
    });

    // Pulse animation for start button
    this.tweens.add({
      targets: this.startBtn,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    this.startBtn.on('pointerdown', () => {
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

  updateTexts() {
    this.titleText.setText(t('TITLE'));
    this.startBtn.setText(t('START_PROMPT'));
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
