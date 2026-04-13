export const createPlayer = (ctx: Phaser.Scene) => {
  let player: Phaser.Physics.Arcade.Sprite;

  // Player texture generation (Circle with red glow)
  const playerGraphics = ctx.make.graphics({ x: 0, y: 0 });

  // Outer glow
  playerGraphics.fillStyle(0xff0000, 0.2);
  playerGraphics.fillCircle(24, 24, 24);
  // Inner glow
  playerGraphics.fillStyle(0xff0000, 0.5);
  playerGraphics.fillCircle(24, 24, 16);
  // Core
  playerGraphics.fillStyle(0xffffff, 1);
  playerGraphics.fillCircle(24, 24, 10);

  playerGraphics.generateTexture('playerTexture', 48, 48);

  // Add player
  player = ctx.physics.add.sprite(20, 384, 'playerTexture');

  // Adjust physics body to match the core
  player.body?.setCircle(10, 14, 14);
  player.setBounce(0.1);
  player.setCollideWorldBounds(true);

  return player;
};
