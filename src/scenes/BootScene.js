export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }
    
    preload() {
        // Create loading text
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
            fontSize: '24px',
            fill: '#00ffff',
            fontFamily: 'Arial'
        });
        loadingText.setOrigin(0.5);
        
        // Music removed - enjoy the silence!
    }
    
    create() {
        // Initialize game data
        this.registry.set('playerCount', 2); // Default to 2 players
        
        // Initialize win counters
        this.registry.set('playerWins', [0, 0, 0, 0]); // Wins for each player
        
        // Go to menu
        this.scene.start('MenuScene');
    }
}


