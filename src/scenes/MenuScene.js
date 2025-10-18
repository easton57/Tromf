import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MenuScene' });
    }
    
    create() {
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        
        // Clear online mode flag when returning to menu
        this.registry.remove('onlineMode');
        
        // Title
        const title = this.add.text(centerX, 100, 'TRON', {
            fontSize: '72px',
            fill: '#00ffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);
        title.setShadow(0, 0, '#00ffff', 10, true, true);
        
        // Subtitle
        const subtitle = this.add.text(centerX, 160, 'Light Cycle Battle', {
            fontSize: '24px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        });
        subtitle.setOrigin(0.5);
        
        // Enemy selection title
        const selectionTitle = this.add.text(centerX, 240, 'Select Number of Enemies:', {
            fontSize: '20px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        });
        selectionTitle.setOrigin(0.5);
        
        // Enemy count buttons
        const buttonY = 300;
        const buttonSpacing = 100;
        
        for (let i = 1; i <= 3; i++) {
            const buttonX = centerX - 100 + (i - 1) * buttonSpacing;
            this.createEnemyButton(buttonX, buttonY, i);
        }
        
        // Controls info
        const controlsY = 420;
        const controlsTitle = this.add.text(centerX, controlsY, 'Controls:', {
            fontSize: '18px',
            fill: '#00ffff',
            fontFamily: 'Arial, sans-serif'
        });
        controlsTitle.setOrigin(0.5);
        
        const controls = [
            'Player: Arrow Keys',
            'Enemies: AI Controlled'
        ];
        
        for (let i = 0; i < controls.length; i++) {
            const text = this.add.text(centerX, controlsY + 30 + i * 25, controls[i], {
                fontSize: '14px',
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif'
            });
            text.setOrigin(0.5);
        }
        
    }
    
    createEnemyButton(x, y, enemyCount) {
        // Button background
        const button = this.add.rectangle(x, y, 80, 80, 0x1a3a4a);
        button.setStrokeStyle(2, 0x00ffff);
        button.setInteractive({ useHandCursor: true });
        
        // Button text
        const text = this.add.text(x, y, enemyCount.toString(), {
            fontSize: '36px',
            fill: '#00ffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        
        // Hover effects
        button.on('pointerover', () => {
            button.setFillStyle(0x2a5a6a);
            button.setStrokeStyle(3, 0x00ffff);
            text.setScale(1.1);
        });
        
        button.on('pointerout', () => {
            button.setFillStyle(0x1a3a4a);
            button.setStrokeStyle(2, 0x00ffff);
            text.setScale(1);
        });
        
        button.on('pointerdown', () => {
            button.setFillStyle(0x00ffff);
            text.setFill('#000000');
        });
        
        button.on('pointerup', () => {
            // Set total player count (1 human + enemyCount AI)
            this.registry.set('playerCount', enemyCount + 1);
            this.registry.set('enemyCount', enemyCount);
            this.scene.start('GameScene');
        });
    }
}


