import { CELL_SIZE, POWERUP_LIFETIME } from '../utils/Constants.js';

export class PowerUp {
    constructor(scene, gridX, gridY, type) {
        console.log('PowerUp constructor called:', type.name, gridX, gridY);
        this.scene = scene;
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = type;
        this.active = true;
        this.collected = false;
        
        const x = gridX * CELL_SIZE + CELL_SIZE / 2;
        const y = gridY * CELL_SIZE + CELL_SIZE / 2;
        
        console.log('Creating graphics at pixel position:', x, y);
        // Create visual representation
        this.createGraphics(x, y);
        
        // Start spawn animation
        this.animateSpawn();
        
        // Set lifetime - despawn after a while
        this.lifetimeTimer = this.scene.time.addEvent({
            delay: POWERUP_LIFETIME,
            callback: () => this.despawn(),
            callbackScope: this
        });
    }
    
    createGraphics(x, y) {
        // Outer glow
        this.outerGlow = this.scene.add.circle(x, y, CELL_SIZE, this.type.color, 0.2);
        
        // Middle glow
        this.glow = this.scene.add.circle(x, y, CELL_SIZE * 0.7, this.type.color, 0.4);
        
        // Main circle
        this.sprite = this.scene.add.circle(x, y, CELL_SIZE * 0.5, this.type.color, 1);
        this.sprite.setStrokeStyle(2, 0xffffff);
        
        // Symbol/Icon text
        this.symbol = this.scene.add.text(x, y, this.type.symbol, {
            fontSize: '24px',
            fontFamily: 'Arial'
        });
        this.symbol.setOrigin(0.5);
        
        // Start pulse animation
        this.scene.tweens.add({
            targets: [this.outerGlow, this.glow],
            scale: 1.2,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Rotate symbol
        this.scene.tweens.add({
            targets: this.symbol,
            angle: 360,
            duration: 3000,
            repeat: -1,
            ease: 'Linear'
        });
    }
    
    animateSpawn() {
        // Start small and grow
        this.sprite.setScale(0);
        this.glow.setScale(0);
        this.outerGlow.setScale(0);
        this.symbol.setScale(0);
        
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.outerGlow, this.symbol],
            scale: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
    
    despawn() {
        if (!this.active) return;
        
        this.active = false;
        
        // Shrink away
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.outerGlow, this.symbol],
            scale: 0,
            alpha: 0,
            duration: 200,
            ease: 'Back.easeIn',
            onComplete: () => this.destroy()
        });
    }
    
    collect(player) {
        if (this.collected || !this.active) return;
        
        this.collected = true;
        this.active = false;
        
        // Cancel lifetime timer
        if (this.lifetimeTimer) {
            this.lifetimeTimer.remove();
        }
        
        // Collection animation
        const targetX = player.sprite.x;
        const targetY = player.sprite.y;
        
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.outerGlow, this.symbol],
            x: targetX,
            y: targetY,
            scale: 0.3,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => this.destroy()
        });
        
        // Create collection particle effect
        this.createCollectionEffect();
    }
    
    createCollectionEffect() {
        const x = this.sprite.x;
        const y = this.sprite.y;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.scene.add.circle(x, y, 3, this.type.color);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 30,
                y: y + Math.sin(angle) * 30,
                alpha: 0,
                duration: 400,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    checkCollision(player) {
        if (!this.active || this.collected || !player.alive) return false;
        
        return player.gridX === this.gridX && player.gridY === this.gridY;
    }
    
    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.glow) this.glow.destroy();
        if (this.outerGlow) this.outerGlow.destroy();
        if (this.symbol) this.symbol.destroy();
        if (this.lifetimeTimer) this.lifetimeTimer.remove();
    }
}

