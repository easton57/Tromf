import { GAME_WIDTH, GAME_HEIGHT } from '../utils/Constants.js';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameOverScene' });
    }
    
    create() {
        const centerX = GAME_WIDTH / 2;
        const centerY = GAME_HEIGHT / 2;
        
        // Check if this is a championship win or just a round win
        const champion = this.registry.get('champion');
        const roundWinner = this.registry.get('roundWinner');
        const winnerColor = champion ? 
            (this.registry.get('championColor') || '#ffff00') : 
            (this.registry.get('roundWinnerColor') || '#ffffff');
        
        if (champion) {
            // Championship win - someone reached 3 wins
            const title = this.add.text(centerX, centerY - 100, '🏆 CHAMPION 🏆', {
                fontSize: '56px',
                fill: '#ffff00',
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            });
            title.setOrigin(0.5);
            title.setShadow(0, 0, '#ffff00', 20, true, true);
            
            // Winner announcement
            const winnerText = this.add.text(centerX, centerY, 
                `${champion} Wins the Match!`, {
                fontSize: '40px',
                fill: winnerColor,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            });
            winnerText.setOrigin(0.5);
            winnerText.setShadow(0, 0, winnerColor, 15, true, true);
            
            // Animate winner text
            this.tweens.add({
                targets: winnerText,
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
            
            // New Match button
            this.createButton(centerX, centerY + 100, 'NEW MATCH', () => {
                this.scene.start('MenuScene');
            });
        } else {
            // Round win - continue the series
            const title = this.add.text(centerX, centerY - 100, 'ROUND OVER', {
                fontSize: '48px',
                fill: '#ffffff',
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            });
            title.setOrigin(0.5);
            title.setShadow(0, 0, '#ffffff', 10, true, true);
            
            // Winner announcement
            const winnerText = this.add.text(centerX, centerY, 
                (roundWinner === 'No one' || !roundWinner) ? 'Draw!' : `${roundWinner} Wins the Round!`, {
                fontSize: '36px',
                fill: winnerColor,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            });
            winnerText.setOrigin(0.5);
            winnerText.setShadow(0, 0, winnerColor, 15, true, true);
            
            // Next Round button
            this.createButton(centerX, centerY + 100, 'NEXT ROUND', () => {
                const onlineMode = this.registry.get('onlineMode');
                if (onlineMode) {
                    this.scene.start('LobbyScene');
                } else {
                    this.scene.start('GameScene');
                }
            });
        }
        
        // Instructions
        const instructions = this.add.text(centerX, centerY + 180, 
            'Click button or press SPACE to continue', {
            fontSize: '14px',
            fill: '#888888',
            fontFamily: 'Arial, sans-serif'
        });
        instructions.setOrigin(0.5);
        
        // Keyboard input
        this.input.keyboard.once('keydown-SPACE', () => {
            if (champion) {
                this.scene.start('MenuScene');
            } else {
                const onlineMode = this.registry.get('onlineMode');
                if (onlineMode) {
                    this.scene.start('LobbyScene');
                } else {
                    this.scene.start('GameScene');
                }
            }
        });
    }
    
    createButton(x, y, text, callback) {
        // Button background
        const button = this.add.rectangle(x, y, 200, 50, 0x1a3a4a);
        button.setStrokeStyle(2, 0x00ffff);
        button.setInteractive({ useHandCursor: true });
        
        // Button text
        const buttonText = this.add.text(x, y, text, {
            fontSize: '20px',
            fill: '#00ffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        // Hover effects
        button.on('pointerover', () => {
            button.setFillStyle(0x2a5a6a);
            button.setStrokeStyle(3, 0x00ffff);
            buttonText.setScale(1.05);
        });
        
        button.on('pointerout', () => {
            button.setFillStyle(0x1a3a4a);
            button.setStrokeStyle(2, 0x00ffff);
            buttonText.setScale(1);
        });
        
        button.on('pointerdown', () => {
            button.setFillStyle(0x00ffff);
            buttonText.setFill('#000000');
        });
        
        button.on('pointerup', () => {
            callback();
        });
    }
}


