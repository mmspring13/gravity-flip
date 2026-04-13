import { Scene } from 'phaser';
import {createPlayer} from "../player.ts";

export class Game extends Scene
{
    public player: Phaser.Physics.Arcade.Sprite;
    public cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    constructor ()
    {
        super('Game');
    }

    preload ()
    {
        this.load.setPath('assets');
        this.cameras.main.setBackgroundColor('#0a0a2a');

        // this.load.image('background', 'bg.png');
        this.load.image('logo', 'logo.png');
    }

    create ()
    {
        this.physics.world.setBoundsCollision(true, true, true, false);
        this.player = createPlayer(this);

        const platforms = this.physics.add.staticGroup();

        this.physics.add.collider(this.player, platforms);

        const ground = this.add.rectangle(512, 748, 1024, 40, 0x1a1a3a);
        platforms.add(ground);

        // Input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
        // this.add.image(512, 350, 'logo').setDepth(100);
        // this.add.text(512, 490, 'Make something fun!\nand share it with us:\nsupport@phaser.io', {
        //     fontFamily: 'Arial Black', fontSize: 38, color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 8,
        //     align: 'center'
        // }).setOrigin(0.5).setDepth(100);
        
    }

    update() {
        if (!this.cursors) return;

        const speed = 200;

        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-speed);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(speed);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body?.touching.down) {
            this.player.setVelocityY(-400);
        }
    }
}
