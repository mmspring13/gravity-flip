import * as Phaser from 'phaser';
import { t, dictionary } from '../translations';

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
  private ceiling!: Phaser.Physics.Arcade.StaticGroup | any;
  private floor!: Phaser.Physics.Arcade.StaticGroup | any;

  private biomes = [
    { key: 'BIOME_CYBER', bg: '#050510', tint: 0x00ffff, music: 'biome_cyber' },
    { key: 'BIOME_VAPOR', bg: '#1a0525', tint: 0xff00ff, music: 'biome_vapor' },
    { key: 'BIOME_TOXIC', bg: '#051505', tint: 0x00ff00, music: 'biome_toxic' },
    { key: 'BIOME_BLOOD', bg: '#1a0000', tint: 0xff3300, music: 'biome_blood' },
    { key: 'BIOME_GOLD',  bg: '#151000', tint: 0xffcc00, music: 'biome_gold' }
  ];
  private currentTint: number = 0x00ffff;
  private currentBgColorRGB!: Phaser.Display.Color;
  private currentBiomeMusic: Phaser.Sound.BaseSound | null = null;
  private speedLinesEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
  private frozenOverlay!: Phaser.GameObjects.Image;
  private freezeTween: Phaser.Tweens.Tween | null = null;
  private blinkTween: Phaser.Tweens.Tween | null = null;
  private squashTween: Phaser.Tweens.Tween | null = null;

  constructor() {
    super('GameScene');
  }

  private playSound(key: string, volume: number = 1, pan: number = 0) {
    if (this.cache.audio.exists(key)) {
      this.sound.play(key, { volume, pan });
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
    // Stop any leftover music from previous runs
    this.sound.stopAll();

    this.isGameOver = false;
    this.isFrozen = false;
    this.isImmortal = false;
    this.score = 0;
    this.lastMilestone = 0;
    this.gameSpeed = 400;
    this.savedGameSpeed = 400;

    // Reset global sound rate in case it was changed
    if ('rate' in this.sound) {
      (this.sound as any).rate = 1.0;
    }

    // Background
    this.currentTint = 0x00ffff;
    this.currentBgColorRGB = Phaser.Display.Color.HexStringToColor('#050510');
    this.cameras.main.setBackgroundColor(this.currentBgColorRGB);

    this.bgFar = this.add.tileSprite(640, 310, 1400, 700, 'bg_grid_far').setTint(this.currentTint);
    this.bgNear = this.add.tileSprite(640, 310, 1400, 700, 'bg_grid_near').setTint(this.currentTint);

    this.playSound('bgm_music', 0.3); // Loop background music

    // Start first biome music
    const firstBiome = this.biomes[0];
    if (this.cache.audio.exists(firstBiome.music)) {
      this.currentBiomeMusic = this.sound.add(firstBiome.music, { loop: true });
      (this.currentBiomeMusic as any).setVolume(0);
      this.currentBiomeMusic.play();
      this.tweens.add({
        targets: this.currentBiomeMusic,
        volume: 0.6,
        duration: 2000
      });
    }

    // Speed Lines
    this.speedLinesEmitter = this.add.particles(0, 0, 'speed_line', {
      x: 1400,
      y: { min: 125, max: 495 },
      speed: { min: 400, max: 800 },
      angle: 180,
      lifespan: 2000,
      frequency: 100,
      blendMode: 'ADD',
      alpha: { start: 0.3, end: 0 },
      tint: this.currentTint
    });

    // Platforms
    this.ceiling = this.physics.add.staticImage(640, 60, 'platform_top').setTint(this.currentTint);
    this.floor = this.physics.add.staticImage(640, 560, 'platform_bottom').setTint(this.currentTint);

    // Player
    this.player = this.physics.add.sprite(100, 310, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.body!.gravity.y = 1500;
    this.player.body!.setSize(22, 22);
    this.player.body!.setOffset(5, 5);

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
    this.frozenOverlay = this.add.image(640, 310, 'frozen_overlay');
    this.frozenOverlay.setAlpha(0);
    this.frozenOverlay.setDepth(100);
    this.frozenOverlay.setScrollFactor(0);

    // Input
    this.input.keyboard!.on('keydown-SPACE', this.flipGravity, this);
    this.input.on('pointerdown', this.flipGravity, this);

    // Score UI
    this.scoreText = this.add.text(16, 40, '⭐ 0', { fontFamily: '"Tektur", sans-serif', fontSize: '24px', color: '#fff' });
    this.scoreText.setScrollFactor(0);

    // Timers
    this.scoreTimer = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.addScore(1);
        if (this.isFrozen) {
          this.savedGameSpeed += 3;
        } else {
          this.gameSpeed += 3; // Increase speed over time
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

    if (this.score >= 1000) {
      this.winGame();
      return;
    }

    const currentMilestone = Math.floor(this.score / 50);
    if (currentMilestone > this.lastMilestone) {
      this.lastMilestone = currentMilestone;

      const nextBiomeIndex = currentMilestone % this.biomes.length;
      const targetBiome = this.biomes[nextBiomeIndex];
      this.transitionToBiome(targetBiome);

      // Milestone
      const colorStr = '#' + targetBiome.tint.toString(16).padStart(6, '0');
      // this.cameras.main.flash(500, 255, 255, 255);
      this.cameras.main.shake(600, 0.005);

      const milestoneText = this.add.text(640, 250, `${t('ZONE_CLEARED')}\n>> ${t(targetBiome.key as keyof typeof dictionary.en)} <<`, {
        fontFamily: '"Tektur", sans-serif', fontSize: '48px', fontStyle: 'bold', color: colorStr,
        stroke: '#ffffff', strokeThickness: 2,
        align: 'center',
        shadow: { blur: 15, color: colorStr, fill: true }
      }).setOrigin(0.5);

      this.tweens.add({
        targets: milestoneText,
        y: 150, alpha: 0, duration: 2500, ease: 'Power2',
        onComplete: () => milestoneText.destroy()
      });

      if (this.isFrozen) {
        this.savedGameSpeed += 20;
      } else {
        this.gameSpeed += 20;
      }
    }
  }

  transitionToBiome(targetBiome: typeof this.biomes[0]) {
    const startTint = this.currentTint;
    const targetTint = targetBiome.tint;
    const startColor = Phaser.Display.Color.ValueToColor(startTint);
    const targetColor = Phaser.Display.Color.ValueToColor(targetTint);

    const startBgColor = this.currentBgColorRGB;
    const targetBgColor = Phaser.Display.Color.HexStringToColor(targetBiome.bg);

    // Crossfade music
    if (this.currentBiomeMusic && this.currentBiomeMusic.isPlaying) {
      const oldMusic = this.currentBiomeMusic;
      this.tweens.add({
        targets: oldMusic,
        volume: 0,
        duration: 2000,
        onComplete: () => {
          oldMusic.stop();
          oldMusic.destroy();
        }
      });
    }

    if (this.cache.audio.exists(targetBiome.music)) {
      const newMusic = this.sound.add(targetBiome.music, { loop: true });
      (newMusic as any).setVolume(0);
      newMusic.play();
      this.currentBiomeMusic = newMusic;

      this.tweens.add({
        targets: newMusic,
        volume: 0.6,
        duration: 2500
      });
    }

    this.tweens.addCounter({
      from: 0,
      to: 100,
      duration: 3000,
      onUpdate: (tween) => {
        const val = tween.getValue();
        // Grid & Platform tint
        const colorObj = Phaser.Display.Color.Interpolate.ColorWithColor(startColor, targetColor, 100, val);
        const combinedTint = Phaser.Display.Color.GetColor(colorObj.r, colorObj.g, colorObj.b);
        this.bgFar.setTint(combinedTint);
        this.bgNear.setTint(combinedTint);
        this.ceiling.setTint(combinedTint);
        this.floor.setTint(combinedTint);

        if (this.speedLinesEmitter) {
          (this.speedLinesEmitter as any).particleTint = combinedTint;
        }

        // Background Color
        const bgObj = Phaser.Display.Color.Interpolate.ColorWithColor(startBgColor, targetBgColor, 100, val);
        const newBgColor = new Phaser.Display.Color(Math.round(bgObj.r), Math.round(bgObj.g), Math.round(bgObj.b));
        this.cameras.main.setBackgroundColor(newBgColor);
      },
      onComplete: () => {
        this.currentTint = targetTint;
        this.currentBgColorRGB = targetBgColor;
      }
    });
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
    if (this.score >= 30) allowedTypes.push(3); // Enemy (Neon Purple Sawblade)
    if (this.score >= 60) allowedTypes.push(5); // Spinner (Neon Orange Cross)
    if (this.score >= 90) allowedTypes.push(6); // Block Vertical Moving (Neon Green)

    const obstacleType = Phaser.Utils.Array.GetRandom(allowedTypes);
    const x = 1350;

    this.playSound('spawn_obstacle', 0.5, 1.0); // Pan right since it spawns on the right

    if (obstacleType === 0 || obstacleType === 1) {
      const y = isTop ? 136 : 484;
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
      const y = isTop ? 152 : 468; // 120 (platform) + 32 (half of 64 height block)
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
      const y = 152; // Start at top
      const block = this.obstacles.create(x, y, 'block_green') as Phaser.Physics.Arcade.Sprite;
      block.setData('soundKey', 'sound_vertical_block');
      this.setupObstacle(block, true, false);

      this.tweens.add({
        targets: block,
        y: 468, // Move to bottom
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    } else if (obstacleType === 5) {
      // Spinner
      const y = Phaser.Math.Between(175, 445);
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
      const y = Phaser.Math.Between(175, 445);
      const enemy = this.enemies.create(x, y, 'enemy') as Phaser.Physics.Arcade.Sprite;
      enemy.setData('soundKey', 'sound_sawblade');
      enemy.setVelocityX(-this.gameSpeed * 1.3);
      enemy.body!.setCircle(14, 2, 2);
      enemy.setData('startY', y);
      enemy.setData('timeOffset', Phaser.Math.FloatBetween(0, Math.PI * 2));
    }

    // Schedule next spawn
    const delay = Phaser.Math.Between(800, 1400) * (400 / this.gameSpeed);
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
    const x = 1350;
    const y = Phaser.Math.Between(150, 470);
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
      fontFamily: '"Tektur", sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ffff00'
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
    const x = 1350;
    const y = Phaser.Math.Between(150, 470);
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

    const popup = this.add.text(diamond.x, diamond.y, '+15', {
      fontFamily: '"Tektur", sans-serif', fontSize: '28px', fontStyle: 'bold', color: '#00aaff'
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
    const x = 1350;
    const y = Phaser.Math.Between(150, 470);
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
    this.playSound('collect_snowflake', 0.8);

    const popup = this.add.text(snowflake.x, snowflake.y, t('FREEZE'), {
      fontFamily: '"Tektur", sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#00ffff'
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
    const x = 1350;
    const y = Phaser.Math.Between(150, 470);
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
    this.playSound('collect_immortal', 1.0);

    const popup = this.add.text(immortal.x, immortal.y, t('IMMORTAL'), {
      fontFamily: '"Tektur", sans-serif', fontSize: '24px', fontStyle: 'bold', color: '#ff3366'
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

    this.playSound('gravity_switch', 0.7);

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
    if (this.isImmortal) return;
    if (this.isGameOver) return;
    this.isGameOver = true;

    // Stop all looping sounds (like bgm and obstacles)
    this.sound.stopAll();

    // Reset sound rate immediately on death
    if ('rate' in this.sound) {
      (this.sound as any).rate = 1.0;
    }

    this.playSound('player_die', 1.0);

    this.physics.pause();
    this.player.setVisible(false);
    this.cameras.main.shake(400, 0.03);
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

    // Smooth camera sway (Hotline Miami style)
    const swaySpeed = 0.0015;
    const swayAmount = 8;
    const rotAmount = 0.015;

    this.cameras.main.scrollX = Math.sin(time * swaySpeed) * swayAmount;
    this.cameras.main.scrollY = Math.cos(time * swaySpeed * 0.8) * swayAmount;
    this.cameras.main.rotation = Math.sin(time * swaySpeed * 0.5) * rotAmount;

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
