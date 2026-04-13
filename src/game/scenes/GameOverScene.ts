import * as Phaser from 'phaser';

export default class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private won: boolean = false;

  constructor() {
    super('GameOverScene');
  }

  init(data: { score: number, won?: boolean }) {
    this.score = data.score;
    this.won = data.won || false;
  }

  create() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const titleText = this.won ? 'SYSTEM UNLOCKED' : 'SYSTEM FAILURE';
    const titleColor = this.won ? '#00ff00' : '#ff0055';

    this.add.text(width / 2, height / 2 - 100, titleText, {
      fontSize: '56px',
      color: titleColor,
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 2,
      shadow: { blur: 10, color: titleColor, fill: true }
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 - 10, `⭐ ${this.score}`, {
      fontSize: '32px',
      color: '#00ffff',
      shadow: { blur: 5, color: '#00ffff', fill: true }
    }).setOrigin(0.5);

    const bestScore = localStorage.getItem('gravityFlipBestScore') || '0';
    this.add.text(width / 2, height / 2 + 35, `🌟 BEST: ${bestScore}`, {
      fontSize: '24px',
      color: '#ffaa00',
      shadow: { blur: 5, color: '#ffaa00', fill: true }
    }).setOrigin(0.5);

    const restartBtn = this.add.text(width / 2, height / 2 + 120, '> REBOOT <', {
      fontSize: '28px',
      color: '#000000',
      backgroundColor: '#00ffff',
      padding: { x: 24, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    // Pulse animation for restart button
    this.tweens.add({
      targets: restartBtn,
      alpha: 0.7,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    restartBtn.on('pointerdown', () => {
      this.scene.start('GameScene');
    });
    
    this.time.delayedCall(500, () => {
      this.input.keyboard!.once('keydown-SPACE', () => {
        this.scene.start('GameScene');
      });
    });
  }
}
