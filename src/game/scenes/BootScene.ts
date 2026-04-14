import * as Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Load sounds
    this.load.audio('collect_snowflake', 'assets/sound/collect_snowflake.wav');
    this.load.audio('collect_diamond', 'assets/sound/collect_diamond.wav');
    this.load.audio('welcome', 'assets/sound/welcome.wav');
    this.load.audio('player_die', 'assets/sound/player_die.wav');
    this.load.audio('bgm_music', 'assets/sound/bgm_music_3.mp3');
    this.load.audio('game_win', 'assets/sound/game_win.wav');
    this.load.audio('collect_star', 'assets/sound/collect_coin.mp3');
    this.load.audio('collect_immortal', 'assets/sound/collect_immortal.wav');
    this.load.audio('spawn_obstacle', 'assets/sound/spawn_obstacle.ogg');
    this.load.audio('sound_spike', 'assets/sound/sound_spike.wav');
    this.load.audio('sound_block', 'assets/sound/sound_block.wav');
    this.load.audio('sound_moving_block', 'assets/sound/sound_moving_block.wav');
    this.load.audio('sound_vertical_block', 'assets/sound/sound_vertical_block.wav');
    this.load.audio('sound_sawblade', 'assets/sound/sound_sawblade.mp3');
    this.load.audio('sound_spinner', 'assets/sound/sound_spinner.wav');
    this.load.audio('obstacle_hum', 'assets/sound/obstacle_hum.wav');
    this.load.audio('sawblade_hum', 'assets/sound/sound_sawblade.mp3');
    this.load.audio('gravity_switch_on', 'assets/sound/gravity_switch_on.wav');
    this.load.audio('gravity_switch_off', 'assets/sound/gravity_switch_off.wav');
    this.load.audio('spinner_hum', 'assets/sound/spinner_hum.mp3');

    // Generate graphics for the game
    const graphics = this.make.graphics({ x: 0, y: 0 });

    // Player (Neon Cyan)
    graphics.lineStyle(2, 0x00ffff, 1);
    graphics.fillStyle(0x004488, 1);
    graphics.fillRect(1, 1, 30, 30);
    graphics.strokeRect(1, 1, 30, 30);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(20, 8, 6, 6); // Eye
    graphics.generateTexture('player', 32, 32);
    graphics.clear();

    // Spike Up (Neon Pink)
    graphics.lineStyle(2, 0xff0055, 1);
    graphics.fillStyle(0x880022, 1);
    graphics.beginPath();
    graphics.moveTo(16, 1);
    graphics.lineTo(31, 31);
    graphics.lineTo(1, 31);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.generateTexture('spike_up', 32, 32);
    graphics.clear();

    // Spike Down (Neon Pink)
    graphics.lineStyle(2, 0xff0055, 1);
    graphics.fillStyle(0x880022, 1);
    graphics.beginPath();
    graphics.moveTo(1, 1);
    graphics.lineTo(31, 1);
    graphics.lineTo(16, 31);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.generateTexture('spike_down', 32, 32);
    graphics.clear();

    // Block (Neon Orange)
    graphics.lineStyle(2, 0xffaa00, 1);
    graphics.fillStyle(0x885500, 1);
    graphics.fillRect(1, 1, 30, 62);
    graphics.strokeRect(1, 1, 30, 62);
    graphics.generateTexture('block', 32, 64);
    graphics.clear();

    // Block Vertical Moving (Neon Green)
    graphics.lineStyle(2, 0x00ff00, 1);
    graphics.fillStyle(0x005500, 1);
    graphics.fillRect(1, 1, 30, 62);
    graphics.strokeRect(1, 1, 30, 62);
    graphics.generateTexture('block_green', 32, 64);
    graphics.clear();

    // Platform Ceiling
    graphics.lineStyle(2, 0x00ffcc, 1);
    graphics.fillStyle(0x002233, 1);
    graphics.fillRect(0, 0, 2100, 240);
    graphics.strokeRect(1, 1, 2098, 238);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(0, 239);
    graphics.lineTo(2100, 239);
    graphics.strokePath();
    graphics.generateTexture('platform_top', 2100, 240);
    graphics.clear();

    // Platform Floor
    graphics.lineStyle(2, 0x00ffcc, 1);
    graphics.fillStyle(0x002233, 1);
    graphics.fillRect(0, 0, 2100, 240);
    graphics.strokeRect(1, 1, 2098, 238);
    graphics.lineStyle(2, 0xffffff, 1);
    graphics.beginPath();
    graphics.moveTo(0, 1);
    graphics.lineTo(2100, 1);
    graphics.strokePath();
    graphics.generateTexture('platform_bottom', 2100, 240);
    graphics.clear();

    // Enemy (Neon Purple Sawblade)
    graphics.lineStyle(2, 0xcc00ff, 1);
    graphics.fillStyle(0x440088, 1);
    graphics.beginPath();
    graphics.arc(16, 16, 14, 0, Math.PI * 2);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.moveTo(16, 2); graphics.lineTo(16, 30);
    graphics.moveTo(2, 16); graphics.lineTo(30, 16);
    graphics.strokePath();
    graphics.generateTexture('enemy', 32, 32);
    graphics.clear();

    // Particle
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(8, 8, 8);
    graphics.generateTexture('particle', 16, 16);
    graphics.clear();

    // Speed Line
    graphics.fillStyle(0x00ffff, 0.5);
    graphics.fillRect(0, 0, 64, 2);
    graphics.generateTexture('speed_line', 64, 2);
    graphics.clear();

    // Coin (Neon Yellow Star)
    graphics.lineStyle(2, 0xffff00, 1);
    graphics.fillStyle(0x888800, 1);
    graphics.beginPath();
    const cx = 16, cy = 16, outerRadius = 14, innerRadius = 6;
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) graphics.moveTo(px, py);
      else graphics.lineTo(px, py);
    }
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.generateTexture('coin', 32, 32);
    graphics.clear();

    // Spinner (Neon Orange Cross)
    graphics.lineStyle(2, 0xff5500, 1);
    graphics.fillStyle(0xaa2200, 1);
    graphics.fillRect(28, 1, 8, 62);
    graphics.fillRect(1, 28, 62, 8);
    graphics.strokeRect(28, 1, 8, 62);
    graphics.strokeRect(1, 28, 62, 8);
    graphics.generateTexture('spinner', 64, 64);
    graphics.clear();

    // Diamond (Neon Light Blue)
    graphics.lineStyle(2, 0x00aaff, 1);
    graphics.fillStyle(0x0055aa, 1);
    graphics.beginPath();
    graphics.moveTo(16, 2);
    graphics.lineTo(30, 16);
    graphics.lineTo(16, 30);
    graphics.lineTo(2, 16);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    graphics.generateTexture('diamond', 32, 32);
    graphics.clear();

    // Snowflake (Cyan)
    graphics.lineStyle(3, 0x00ffff, 1);
    graphics.beginPath();
    graphics.moveTo(16, 2); graphics.lineTo(16, 30);
    graphics.moveTo(2, 16); graphics.lineTo(30, 16);
    graphics.moveTo(6, 6); graphics.lineTo(26, 26);
    graphics.moveTo(6, 26); graphics.lineTo(26, 6);
    graphics.strokePath();
    graphics.generateTexture('snowflake', 32, 32);
    graphics.clear();

    // Immortal (Valorant style)
    graphics.lineStyle(2, 0xff3366, 1);
    graphics.fillStyle(0xaa1133, 1);
    graphics.beginPath();
    graphics.moveTo(16, 2);
    graphics.lineTo(28, 12);
    graphics.lineTo(24, 30);
    graphics.lineTo(16, 24);
    graphics.lineTo(8, 30);
    graphics.lineTo(4, 12);
    graphics.closePath();
    graphics.fillPath();
    graphics.strokePath();
    // Inner triangle
    graphics.fillStyle(0xff3366, 1);
    graphics.beginPath();
    graphics.moveTo(16, 8);
    graphics.lineTo(22, 14);
    graphics.lineTo(16, 20);
    graphics.lineTo(10, 14);
    graphics.closePath();
    graphics.fillPath();
    graphics.generateTexture('immortal', 32, 32);
    graphics.clear();

    // Frozen Overlay
    graphics.fillStyle(0x00ffff, 0.05);
    graphics.fillRect(0, 0, 2000, 1200);
    graphics.lineStyle(15, 0x00ffff, 0.3);
    graphics.strokeRect(50, 70, 1900, 1060);
    graphics.fillStyle(0x00ffff, 0.4);
    for(let i = 40; i < 1960; i += 30) {
      graphics.fillTriangle(i, 60, i + 15, 60 + Math.random() * 40 + 20, i + 30, 60);
      graphics.fillTriangle(i, 1140, i + 15, 1140 - (Math.random() * 40 + 20), i + 30, 1140);
    }
    for(let i = 60; i < 1140; i += 30) {
      graphics.fillTriangle(40, i, 40 + Math.random() * 40 + 20, i + 15, 40, i + 30);
      graphics.fillTriangle(1960, i, 1960 - (Math.random() * 40 + 20), i + 15, 1960, i + 30);
    }
    graphics.generateTexture('frozen_overlay', 2000, 1200);
    graphics.clear();

    // Background Grid Far
    graphics.lineStyle(1, 0x111122, 1);
    for (let i = 0; i < 128; i += 32) {
      graphics.moveTo(i, 0);
      graphics.lineTo(i, 128);
      graphics.moveTo(0, i);
      graphics.lineTo(128, i);
    }
    graphics.generateTexture('bg_grid_far', 128, 128);
    graphics.clear();

    // Background Grid Near
    graphics.lineStyle(1, 0x222244, 1);
    for (let i = 0; i < 128; i += 64) {
      graphics.moveTo(i, 0);
      graphics.lineTo(i, 128);
      graphics.moveTo(0, i);
      graphics.lineTo(128, i);
    }
    graphics.generateTexture('bg_grid_near', 128, 128);
    graphics.clear();
  }

  create() {
    this.scene.start('MainMenuScene');
  }
}
