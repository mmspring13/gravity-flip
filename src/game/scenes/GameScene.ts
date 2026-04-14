import * as Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private enemies!: Phaser.Physics.Arcade.Group;
  private coins!: Phaser.Physics.Arcade.Group;
  private spinners!: Phaser.Physics.Arcade.Group;
  private diamonds!: Phaser.Physics.Arcade.Group;
  private snowflakes!: Phaser.Physics.Arcade.Group;
  private immortals!: Phaser.Physics.Arcade.Group;
  private floor!: Phaser.Physics.Arcade.Image;
  private ceiling!: Phaser.Physics.Arcade.Image;

  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private scoreTimer!: Phaser.Time.TimerEvent;

  private spawnTimer!: Phaser.Time.TimerEvent;
  private coinTimer!: Phaser.Time.TimerEvent;
  private diamondTimer!: Phaser.Time.TimerEvent;
  private snowflakeTimer!: Phaser.Time.TimerEvent;
  private freezeTimer!: Phaser.Time.TimerEvent;
  private immortalTimer!: Phaser.Time.TimerEvent;
  private immortalEndTimer!: Phaser.Time.TimerEvent;
  private gameSpeed: number = 200;
  private savedGameSpeed: number = 0;
  private isGameOver: boolean = false;
  private isFrozen: boolean = false;
  private isImmortal: boolean = false;
  private lastMilestone: number = 0;

  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private frozenOverlay!: Phaser.GameObjects.Image;
  private freezeTween: Phaser.Tweens.Tween | null = null;
  private blinkTween: Phaser.Tweens.Tween | null = null;
  private squashTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('GameScene');
  }

  private playSound(key: string, volume: number = 1, pan: number = 0, loop = false) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, { volume, pan, loop });
    }
  }

  private updateSpatialAudio(item: Phaser.Physics.Arcade.Sprite, defaultSoundKey: string) {
    const soundKey = item.getData('soundKey') || defaultSoundKey;
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, item.x, item.y);
    const maxDist = 800;
    const volume = Math.max(0, 1 - (dist / maxDist));
    const pan = Phaser.Math.Clamp((item.x - this.player.x) / 400, -1, 1);

    let soundInstance = item.getData('soundInstance');
    if (!soundInstance && this.cache.audio.exists(soundKey)) {
      soundInstance = this.sound.add(soundKey, { loop: true });
      soundInstance.play();
      item.setData('soundInstance', soundInstance);

      item.on('destroy', () => {
        this.tweens.add({
          targets: soundInstance,
          volume: 0,
          duration: 500,
          ease: 'Sine.easeOut',
          onComplete: () => {
            soundInstance.stop();
            soundInstance.destroy();
          }
        });
      });
    }

    if (soundInstance) {
      soundInstance.setVolume(volume * 0.5);
      soundInstance.setPan(pan);
    }
  }

  create() {
    this.isGameOver = false;
    this.isFrozen = false;
    this.isImmortal = false;
    this.score = 0;
    this.lastMilestone = 0;
    this.gameSpeed = 300;
    this.savedGameSpeed = 300;

    // Reset global sound rate in case it was changed
    if ('rate' in this.sound) {
      (this.sound as any).rate = 1.0;
    }

    // Background
    this.cameras.main.setBackgroundColor('#050510');
    this.bgFar = this.add.tileSprite(400, 300, 900, 700, 'bg_grid_far');
    this.bgNear = this.add.tileSprite(400, 300, 900, 700, 'bg_grid_near');

    this.playSound('bgm_music', 0.3, 0, true); // Loop background music

    // Speed Lines
    this.add.particles(0, 0, 'speed_line', {
      x: 850,
      y: { min: 50, max: 550 },
      speed: { min: 400, max: 800 },
      angle: 180,
      lifespan: 2000,
      frequency: 100,
      blendMode: 'ADD',
      alpha: { start: 0.3, end: 0 }
    });

    // Platforms
    this.ceiling = this.physics.add.staticImage(800, 16, 'platform_top');
    this.floor = this.physics.add.staticImage(800, 584, 'platform_bottom');

    // Player
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body!.gravity.y = 1000;

    // Particle trail
    const particles = this.add.particles(0, 0, 'player', {
      speed: { min: 50, max: 150 },
      angle: { min: 160, max: 200 },
      scale: { start: 0.4, end: 0 },
      blendMode: 'ADD',
      lifespan: 400,
      alpha: { start: 0.6, end: 0 },
      tint: 0x00ffff,
      frequency: 50
    });
    particles.startFollow(this.player);

    // Obstacles Group
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Enemies Group
    this.enemies = this.physics.add.group({
      allowGravity: false,
      immovable: true
    });

    // Coins and Spinners
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.spinners = this.physics.add.group({ allowGravity: false, immovable: true });
    this.diamonds = this.physics.add.group({ allowGravity: false, immovable: true });
    this.snowflakes = this.physics.add.group({ allowGravity: false, immovable: true });
    this.immortals = this.physics.add.group({ allowGravity: false, immovable: true });

    // Collisions
    this.physics.add.collider(this.player, this.floor);
    this.physics.add.collider(this.player, this.ceiling);
    this.physics.add.overlap(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.spinners, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.coins, this.collectCoin, undefined, this);
    this.physics.add.overlap(this.player, this.diamonds, this.collectDiamond, undefined, this);
    this.physics.add.overlap(this.player, this.snowflakes, this.collectSnowflake, undefined, this);
    this.physics.add.overlap(this.player, this.immortals, this.collectImmortal, undefined, this);

    // Frozen Overlay
    this.frozenOverlay = this.add.image(400, 300, 'frozen_overlay');
    this.frozenOverlay.setAlpha(0);
    this.frozenOverlay.setDepth(100);
    this.frozenOverlay.setScrollFactor(0);

    // Input
    this.input.keyboard!.on('keydown-SPACE', this.flipGravity, this);
    this.input.on('pointerdown', this.flipGravity, this);

    // Score UI
    this.scoreText = this.add.text(16, 40, '⭐ 0', { fontSize: '24px', color: '#fff' });
    this.scoreText.setScrollFactor(0);

    // Timers
    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.addScore(1);
        if (this.isFrozen) {
          this.savedGameSpeed += 5;
        } else {
          this.gameSpeed += 5; // Increase speed over time
        }
      },
      loop: true
    });

    this.spawnObstacle();
    this.spawnCoin();
    this.spawnDiamond();
    this.spawnSnowflake();
    this.spawnImmortal();
  }

  addScore(points: number) {
    if (this.isGameOver) return;

    this.score += points;
    this.scoreText.setText(`⭐ ${this.score}`);

    if (this.score >= 6400) {
      this.winGame();
      return;
    }

    const currentMilestone = Math.floor(this.score / 50);
    if (currentMilestone > this.lastMilestone) {
      this.lastMilestone = currentMilestone;

      // Milestone
      this.cameras.main.flash(200, 0, 255, 255);
      this.cameras.main.shake(300, 0.015);
      const milestoneText = this.add.text(400, 300, 'SPEED UP!', {
        fontSize: '48px', fontStyle: 'bold', color: '#00ffff',
        stroke: '#ffffff', strokeThickness: 2,
        shadow: { blur: 10, color: '#00ffff', fill: true }
      }).setOrigin(0.5);
      this.tweens.add({
        targets: milestoneText,
        y: 200, alpha: 0, duration: 1000,
        onComplete: () => milestoneText.destroy()
      });
      if (this.isFrozen) {
        this.savedGameSpeed += 24;
      } else {
        this.gameSpeed += 24;
      }
    }
  }

  addMagicEffect(item: Phaser.Physics.Arcade.Sprite, color: number) {
    const emitter = this.add.particles(0, 0, 'particle', {
      scale: { start: 0.3, end: 0 },
      alpha: { start: 0.6, end: 0 },
      blendMode: 'ADD',
      lifespan: 600,
      tint: color,
      frequency: 150,
      speed: 20,
      angle: { min: 0, max: 360 }
    });
    emitter.startFollow(item);
    item.setData('emitter', emitter);
  }

  spawnObstacle() {
    if (this.isGameOver) return;

    const isTop = Phaser.Math.Between(0, 1) === 0;

    // Determine allowed obstacle types based on score
    const allowedTypes = [0, 1, 2, 4]; // spikes, blocks, moving blocks
    // if (this.score >= 32) allowedTypes.push(3); // Enemy (Neon Purple Sawblade)
    // if (this.score >= 60) allowedTypes.push(5); // Spinner (Neon Orange Cross)
    // if (this.score >= 102) allowedTypes.push(6); // Block Vertical Moving (Neon Green)
    if (this.score >= 1) allowedTypes.push(3); // Enemy (Neon Purple Sawblade)
    if (this.score >= 1) allowedTypes.push(5); // Spinner (Neon Orange Cross)
    if (this.score >= 1) allowedTypes.push(6); // Block Vertical Moving (Neon Green)

    const obstacleType = Phaser.Utils.Array.GetRandom(allowedTypes);
    const x = 850;

    this.playSound('spawn_obstacle', 0.3); // Pan right since it spawns on the right

    if (obstacleType === 0 || obstacleType === 1) {
      const y = isTop ? 48 : 552;
      const texture = isTop ? 'spike_down' : 'spike_up';

      const spike1 = this.obstacles.create(x, y, texture) as Phaser.Physics.Arcade.Sprite;
      spike1.setData('soundKey', 'sound_spike');
      this.setupObstacle(spike1, isTop, true);

      if (obstacleType === 1) {
        const spike2 = this.obstacles.create(x + 32, y, texture) as Phaser.Physics.Arcade.Sprite;
        spike2.setData('soundKey', 'sound_spike');
        this.setupObstacle(spike2, isTop, true);
      }
    } else if (obstacleType === 2 || obstacleType === 4) {
      // Block
      const y = isTop ? 64 : 536; // 32 (platform) + 32 (half of 64 height block)
      const block = this.obstacles.create(x, y, 'block') as Phaser.Physics.Arcade.Sprite;
      block.setData('soundKey', obstacleType === 2 ? 'sound_block' : 'sound_moving_block');
      this.setupObstacle(block, isTop, false);

      if (obstacleType === 4) {
        // Moving block
        this.tweens.add({
          targets: block,
          y: isTop ? y + 60 : y - 60,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    } else if (obstacleType === 6) {
      // Vertical moving block (top to down)
      const y = 64; // Start at top
      const block = this.obstacles.create(x, y, 'block_green') as Phaser.Physics.Arcade.Sprite;
      block.setData('soundKey', 'sound_vertical_block');
      this.setupObstacle(block, true, false);

      this.tweens.add({
        targets: block,
        y: 536, // Move to bottom
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else if (obstacleType === 5) {
      // Spinner
      const y = Phaser.Math.Between(150, 450);
      const spinner = this.spinners.create(x, y, 'spinner') as Phaser.Physics.Arcade.Sprite;
      spinner.setData('soundKey', 'sound_spinner');
      spinner.setVelocityX(-this.gameSpeed);
      spinner.body!.setCircle(24, 8, 8);
      this.tweens.add({
        targets: spinner,
        angle: 360,
        duration: 1500,
        repeat: -1
      });
    } else {
      // Flying Enemy
      const y = Phaser.Math.Between(150, 450);
      const enemy = this.enemies.create(x, y, 'enemy') as Phaser.Physics.Arcade.Sprite;
      enemy.setData('soundKey', 'sound_sawblade');
      enemy.setVelocityX(-this.gameSpeed * 1.3);
      enemy.body!.setCircle(14, 2, 2);
      enemy.setData('startY', y);
      enemy.setData('timeOffset', Phaser.Math.FloatBetween(0, Math.PI * 2));
    }

    // Schedule next spawn
    const delay = Phaser.Math.Between(1000, 2000) * (300 / this.gameSpeed);
    this.spawnTimer = this.time.delayedCall(delay, this.spawnObstacle, [], this);
  }

  setupObstacle(obstacle: Phaser.Physics.Arcade.Sprite, isTop: boolean, isSpike: boolean) {
    obstacle.setVelocityX(-this.gameSpeed);
    if (isSpike) {
      obstacle.body!.setSize(16, 24);
      obstacle.body!.setOffset(8, isTop ? 0 : 8);
    } else {
      obstacle.body!.setSize(24, 60);
      obstacle.body!.setOffset(4, 2);
    }
  }

  spawnCoin() {
    if (this.isGameOver) return;
    const x = 850;
    const y = Phaser.Math.Between(100, 500);
    const coin = this.coins.create(x, y, 'coin') as Phaser.Physics.Arcade.Sprite;
    coin.setVelocityX(-this.gameSpeed);
    coin.body!.setCircle(16);

    this.tweens.add({
      targets: coin,
      y: y - 20,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.addMagicEffect(coin, 0xffff00);

    const delay = Phaser.Math.Between(2000, 5000);
    this.coinTimer = this.time.delayedCall(delay, this.spawnCoin, [], this);
  }

  collectCoin(player: any, coin: any) {
    coin.getData('emitter')?.destroy();
    coin.destroy();
    this.addScore(5);
    this.playSound('collect_star', 0.6);

    // Floating text
    const popup = this.add.text(coin.x, coin.y, '+5', {
      fontSize: '24px', fontStyle: 'bold', color: '#ffff00'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup,
      y: coin.y - 50,
      alpha: 0,
      duration: 800,
      onComplete: () => popup.destroy()
    });

    // Particle burst
    const burst = this.add.particles(coin.x, coin.y, 'particle', {
      speed: 100, scale: { start: 0.3, end: 0 },
      blendMode: 'ADD', lifespan: 300, tint: 0xffff00,
      quantity: 5, emitting: false
    });
    burst.explode();
  }

  spawnDiamond() {
    if (this.isGameOver) return;
    const x = 850;
    const y = Phaser.Math.Between(100, 500);
    const diamond = this.diamonds.create(x, y, 'diamond') as Phaser.Physics.Arcade.Sprite;
    diamond.setVelocityX(-this.gameSpeed);
    diamond.body!.setCircle(16);

    this.tweens.add({
      targets: diamond, y: y - 20, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.addMagicEffect(diamond, 0x00aaff);

    const delay = Phaser.Math.Between(25000, 45000); // Very rarely
    this.diamondTimer = this.time.delayedCall(delay, this.spawnDiamond, [], this);
  }

  collectDiamond(player: any, diamond: any) {
    diamond.getData('emitter')?.destroy();
    diamond.destroy();
    this.addScore(15);
    this.playSound('collect_diamond', 0.8);
    this.cameras.main.shake(150, 0.01);

    const popup = this.add.text(diamond.x, diamond.y, '+15', {
      fontSize: '28px', fontStyle: 'bold', color: '#00aaff'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup, y: diamond.y - 50, alpha: 0, duration: 800, onComplete: () => popup.destroy()
    });

    const burst = this.add.particles(diamond.x, diamond.y, 'particle', {
      speed: 150, scale: { start: 0.4, end: 0 },
      blendMode: 'ADD', lifespan: 400, tint: 0x00aaff,
      quantity: 10, emitting: false
    });
    burst.explode();
  }

  spawnSnowflake() {
    if (this.isGameOver) return;
    const x = 850;
    const y = Phaser.Math.Between(100, 500);
    const snowflake = this.snowflakes.create(x, y, 'snowflake') as Phaser.Physics.Arcade.Sprite;
    snowflake.setVelocityX(-this.gameSpeed);
    snowflake.body!.setCircle(16);

    this.tweens.add({
      targets: snowflake, angle: 360, duration: 3000, repeat: -1
    });

    this.addMagicEffect(snowflake, 0x00ffff);

    const delay = Phaser.Math.Between(15000, 30000); // Rarely
    this.snowflakeTimer = this.time.delayedCall(delay, this.spawnSnowflake, [], this);
  }

  collectSnowflake(player: any, snowflake: any) {
    snowflake.getData('emitter')?.destroy();
    snowflake.destroy();
    this.playSound('collect_snowflake', 0.4);

    this.cameras.main.shake(200, 0.015);

    const popup = this.add.text(snowflake.x, snowflake.y, 'FREEZE!', {
      fontSize: '24px', fontStyle: 'bold', color: '#00ffff'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup, y: snowflake.y - 50, alpha: 0, duration: 800, onComplete: () => popup.destroy()
    });

    const burst = this.add.particles(snowflake.x, snowflake.y, 'particle', {
      speed: 100, scale: { start: 0.3, end: 0 },
      blendMode: 'ADD', lifespan: 300, tint: 0x00ffff,
      quantity: 8, emitting: false
    });
    burst.explode();

    if (!this.isFrozen) {
      this.isFrozen = true;
      this.savedGameSpeed = this.gameSpeed;
      this.gameSpeed = this.gameSpeed * 0.5; // Slow down

      // Slow down all sounds and music
      if ('rate' in this.sound) {
        this.tweens.add({
          targets: this.sound,
          rate: 0.5,
          duration: 800,
          ease: 'Sine.easeOut'
        });
      }

      this.frozenOverlay.setAlpha(0);
      this.freezeTween = this.tweens.add({
        targets: this.frozenOverlay,
        alpha: 0.7,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }

    if (this.freezeTimer) this.freezeTimer.remove();
    this.freezeTimer = this.time.delayedCall(8000, () => {
      this.isFrozen = false;
      this.gameSpeed = this.savedGameSpeed;

      // Restore sound rate
      if ('rate' in this.sound) {
        this.tweens.add({
          targets: this.sound,
          rate: 1.0,
          duration: 500,
          ease: 'Sine.easeIn'
        });
      }

      if (this.freezeTween) this.freezeTween.stop();
      this.tweens.add({
        targets: this.frozenOverlay,
        alpha: 0,
        duration: 500
      });
    }, [], this);
  }

  spawnImmortal() {
    if (this.isGameOver) return;
    const x = 850;
    const y = Phaser.Math.Between(100, 500);
    const immortal = this.immortals.create(x, y, 'immortal') as Phaser.Physics.Arcade.Sprite;
    immortal.setVelocityX(-this.gameSpeed);
    immortal.body!.setCircle(16);

    this.tweens.add({
      targets: immortal, y: y - 20, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut'
    });

    this.addMagicEffect(immortal, 0xff3366);

    const delay = Phaser.Math.Between(35000, 60000); // Very rarely
    this.immortalTimer = this.time.delayedCall(delay, this.spawnImmortal, [], this);
  }

  collectImmortal(player: any, immortal: any) {
    immortal.getData('emitter')?.destroy();
    immortal.destroy();
    this.playSound('collect_immortal', 0.6);

    this.cameras.main.shake(200, 0.02);

    const popup = this.add.text(immortal.x, immortal.y, 'IMMORTAL!', {
      fontSize: '24px', fontStyle: 'bold', color: '#ff3366'
    }).setOrigin(0.5);

    this.tweens.add({
      targets: popup, y: immortal.y - 50, alpha: 0, duration: 800, onComplete: () => popup.destroy()
    });

    const burst = this.add.particles(immortal.x, immortal.y, 'particle', {
      speed: 150, scale: { start: 0.4, end: 0 },
      blendMode: 'ADD', lifespan: 400, tint: 0xff3366,
      quantity: 12, emitting: false
    });
    burst.explode();

    this.isImmortal = true;

    if (this.blinkTween) this.blinkTween.stop();
    this.player.setAlpha(1);
    this.blinkTween = this.tweens.add({
      targets: this.player,
      alpha: 0.2,
      duration: 150,
      yoyo: true,
      repeat: -1
    });

    if (this.immortalEndTimer) this.immortalEndTimer.remove();
    this.immortalEndTimer = this.time.delayedCall(6000, () => {
      this.isImmortal = false;
      if (this.blinkTween) {
        this.blinkTween.stop();
        this.player.setAlpha(1);
      }
    }, [], this);
  }

  flipGravity() {
    if (this.isGameOver) return;

    this.cameras.main.shake(100, 0.005);

    if (this.player.flipY) {
      this.playSound('gravity_switch_off', 0.1);
    } else {
      this.playSound('gravity_switch_on', 0.1);
    }

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.gravity.y *= -1;
    this.player.setFlipY(body.gravity.y < 0);

    // Squash and stretch effect
    if (this.squashTween) {
      this.squashTween.stop();
    }
    this.player.setScale(1);

    this.squashTween = this.tweens.add({
      targets: this.player,
      scaleY: 1.5,
      scaleX: 0.5,
      duration: 150,
      yoyo: true,
      ease: 'Sine.easeInOut'
    });

    // Mid-air flip burst
    const burst = this.add.particles(this.player.x, this.player.y, 'particle', {
      speed: 150,
      scale: { start: 0.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 300,
      tint: 0x00ffff,
      quantity: 10,
      emitting: false
    });
    burst.explode();
  }

  winGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop all looping sounds (like bgm and obstacles)
    this.sound.stopAll();

    // Reset sound rate immediately on win
    if ('rate' in this.sound) {
      (this.sound as any).rate = 1.0;
    }

    this.playSound('game_win', 1.0);

    this.physics.pause();
    this.player.setVisible(false);
    this.cameras.main.flash(800, 255, 255, 255);

    this.scoreTimer.remove();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.coinTimer) this.coinTimer.remove();
    if (this.diamondTimer) this.diamondTimer.remove();
    if (this.snowflakeTimer) this.snowflakeTimer.remove();
    if (this.freezeTimer) this.freezeTimer.remove();
    if (this.immortalTimer) this.immortalTimer.remove();
    if (this.immortalEndTimer) this.immortalEndTimer.remove();
    if (this.blinkTween) this.blinkTween.stop();

    // Grand explosion
    const explosion = this.add.particles(this.player.x, this.player.y, 'particle', {
      speed: { min: 200, max: 600 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      blendMode: 'ADD',
      lifespan: 1500,
      tint: [0x00ff00, 0x00ffff, 0xffffff],
      quantity: 100,
      emitting: false
    });
    explosion.explode();

    // Save best score
    const bestScore = localStorage.getItem('gravityFlipBestScore') || '0';
    if (this.score > parseInt(bestScore)) {
      localStorage.setItem('gravityFlipBestScore', this.score.toString());
    }

    this.time.delayedCall(2000, () => {
      this.scene.start('GameOverScene', { score: this.score, won: true });
    });
  }

  hitObstacle() {
    return
    if (this.isImmortal) return;
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop all looping sounds (like bgm and obstacles)
    this.sound.stopAll();

    // Reset sound rate immediately on death
    if ('rate' in this.sound) {
      (this.sound as any).rate = 1.0;
    }

    this.playSound('player_die', 0.8);

    this.physics.pause();
    this.player.setVisible(false);
    // this.cameras.main.shake(400, 0.03);
    this.cameras.main.flash(300, 255, 0, 0);
    this.scoreTimer.remove();
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.coinTimer) this.coinTimer.remove();
    if (this.diamondTimer) this.diamondTimer.remove();
    if (this.snowflakeTimer) this.snowflakeTimer.remove();
    if (this.freezeTimer) this.freezeTimer.remove();
    if (this.immortalTimer) this.immortalTimer.remove();
    if (this.immortalEndTimer) this.immortalEndTimer.remove();
    if (this.blinkTween) this.blinkTween.stop();
    this.player.setAlpha(1);

    // Massive explosion
    const explosion = this.add.particles(this.player.x, this.player.y, 'particle', {
      speed: { min: 100, max: 400 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0 },
      blendMode: 'ADD',
      lifespan: 800,
      tint: [0xff0055, 0xffaa00, 0xffffff],
      quantity: 50,
      emitting: false
    });
    explosion.explode();

    // Save best score
    const bestScore = localStorage.getItem('gravityFlipBestScore') || '0';
    if (this.score > parseInt(bestScore)) {
      localStorage.setItem('gravityFlipBestScore', this.score.toString());
    }

    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }

  update(time: number, delta: number) {
    if (this.isGameOver) return;

    const swaySpeed = 0.0015;
    const swayAmount = 8;
    const rotAmount = 0.015;

    this.cameras.main.scrollX = Math.sin(time * swaySpeed) * swayAmount;
    this.cameras.main.scrollY = Math.cos(time * swaySpeed * 0.2) * swayAmount;
    this.cameras.main.rotation = Math.sin(time * swaySpeed * 0.2) * rotAmount;

    // Player movement sound (mocked as continuous hum/footsteps)
    // this.playSound('player_move', 0.2);

    // Scroll background (parallax)
    this.bgFar.tilePositionX += (this.gameSpeed * 0.2) * (delta / 1000);
    this.bgNear.tilePositionX += (this.gameSpeed * 0.5) * (delta / 1000);

    // Clean up off-screen obstacles
    this.obstacles.getChildren().forEach((child) => {
      const obstacle = child as Phaser.Physics.Arcade.Sprite;
      this.updateSpatialAudio(obstacle, 'obstacle_hum');
      if (obstacle.x < -50) {
        obstacle.destroy();
      } else {
        // Update speed in case it increased
        obstacle.setVelocityX(-this.gameSpeed);
      }
    });

    // Update enemies
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      this.updateSpatialAudio(enemy, 'sawblade_hum');
      if (enemy.x < -50) {
        enemy.destroy();
      } else {
        enemy.setVelocityX(-this.gameSpeed * 1.3);
        enemy.rotation -= 0.1;

        // Sine wave movement
        const startY = enemy.getData('startY');
        const timeOffset = enemy.getData('timeOffset');
        enemy.y = startY + Math.sin(time / 200 + timeOffset) * 80;
      }
    });

    // Clean up coins and spinners
    this.coins.getChildren().forEach((child) => {
      const coin = child as Phaser.Physics.Arcade.Sprite;
      if (coin.x < -50) {
        coin.getData('emitter')?.destroy();
        coin.destroy();
      }
      else coin.setVelocityX(-this.gameSpeed);
    });

    this.spinners.getChildren().forEach((child) => {
      const spinner = child as Phaser.Physics.Arcade.Sprite;
      this.updateSpatialAudio(spinner, 'spinner_hum');
      if (spinner.x < -50) spinner.destroy();
      else spinner.setVelocityX(-this.gameSpeed);
    });

    this.diamonds.getChildren().forEach((child) => {
      const diamond = child as Phaser.Physics.Arcade.Sprite;
      if (diamond.x < -50) {
        diamond.getData('emitter')?.destroy();
        diamond.destroy();
      }
      else diamond.setVelocityX(-this.gameSpeed);
    });

    this.snowflakes.getChildren().forEach((child) => {
      const snowflake = child as Phaser.Physics.Arcade.Sprite;
      if (snowflake.x < -50) {
        snowflake.getData('emitter')?.destroy();
        snowflake.destroy();
      }
      else snowflake.setVelocityX(-this.gameSpeed);
    });

    this.immortals.getChildren().forEach((child) => {
      const immortal = child as Phaser.Physics.Arcade.Sprite;
      if (immortal.x < -50) {
        immortal.getData('emitter')?.destroy();
        immortal.destroy();
      }
      else immortal.setVelocityX(-this.gameSpeed);
    });
  }
}
