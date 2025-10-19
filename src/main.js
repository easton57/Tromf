console.log('=== Tron Game Loading ===');
console.log('Loading modules...');

import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { GameOverScene } from './scenes/GameOverScene.js';
import { GAME_WIDTH, GAME_HEIGHT } from './utils/Constants.js';

console.log('All modules loaded successfully!');
console.log('Game dimensions:', GAME_WIDTH, 'x', GAME_HEIGHT);

// Main game configuration
const config = {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'game',
    backgroundColor: '#0a0a0a',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: [BootScene, MenuScene, GameScene, GameOverScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

// Create game instance
const game = new Phaser.Game(config);

// Log game start
console.log('Tromf Light Cycle Battle - Game Started');
console.log('Controls:');
console.log('  Player: Arrow Keys');
console.log('  Touch Controls: Left side = Turn Left, Right side = Turn Right');
console.log('  Enemies: AI Controlled');