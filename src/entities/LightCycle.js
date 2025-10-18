import { CELL_SIZE, DIRECTIONS, INTERPOLATION, GRID_SIZE } from '../utils/Constants.js';

export class LightCycle {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.id = config.id;
        this.name = config.name;
        this.color = config.color;
        
        // Position on grid
        this.gridX = config.startX;
        this.gridY = config.startY;
        this.direction = config.startDirection;
        this.nextDirection = config.startDirection;
        
        // Interpolation for smooth movement
        this.prevGridX = config.startX;
        this.prevGridY = config.startY;
        this.interpolationProgress = 1; // 0 to 1
        
        // State
        this.alive = true;
        this.trail = [];
        
        // Power-up states
        this.activePowerUps = [];
        this.speedBoostActive = false;
        this.phaseActive = false;
        this.frozen = false;
        this.frozenTimer = null;
        
        // Create visual representation
        this.createGraphics();
        
        // Add starting position to trail
        this.trail.push({ x: this.gridX, y: this.gridY });
    }
    
    createGraphics() {
        // Create cycle body
        const x = this.gridX * CELL_SIZE + CELL_SIZE / 2;
        const y = this.gridY * CELL_SIZE + CELL_SIZE / 2;
        
        // Graphics for trail - create FIRST so it renders behind
        this.trailGraphics = this.scene.add.graphics();
        
        // Outer glow (largest) - smoother with more layers
        this.outerGlow = this.scene.add.circle(x, y, CELL_SIZE * 0.8, this.color, 0.1);
        this.outerGlow.setBlendMode(Phaser.BlendModes.ADD);
        
        // Middle glow - smoother transition
        this.middleGlow = this.scene.add.circle(x, y, CELL_SIZE * 0.6, this.color, 0.2);
        this.middleGlow.setBlendMode(Phaser.BlendModes.ADD);
        
        // Inner glow
        this.glow = this.scene.add.circle(x, y, CELL_SIZE / 2, this.color, 0.3);
        this.glow.setBlendMode(Phaser.BlendModes.ADD);
        
        // Main cycle circle - smoother with better blending
        this.sprite = this.scene.add.circle(x, y, CELL_SIZE / 3, this.color);
        this.sprite.setStrokeStyle(2, 0xffffff, 0.8);
        this.sprite.setBlendMode(Phaser.BlendModes.NORMAL);
        
        // Add subtle pulsing animation for smoother appearance
        this.scene.tweens.add({
            targets: [this.outerGlow, this.middleGlow],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Set explicit depth to ensure sprites are on top
        this.trailGraphics.setDepth(0);
        this.outerGlow.setDepth(10);
        this.middleGlow.setDepth(11);
        this.glow.setDepth(12);
        this.sprite.setDepth(13);
    }
    
    setDirection(newDirection) {
        // Check if the new direction is not opposite to current direction
        const current = DIRECTIONS[this.direction];
        const next = DIRECTIONS[newDirection];
        
        // Can't turn 180 degrees
        if (current.x + next.x === 0 && current.y + next.y === 0) {
            return;
        }
        
        this.nextDirection = newDirection;
    }
    
    update() {
        if (!this.alive || this.frozen) return;
        
        // Update direction
        this.direction = this.nextDirection;
        
        // Store previous position for interpolation
        this.prevGridX = this.gridX;
        this.prevGridY = this.gridY;
        
        // Move to next grid position
        const dir = DIRECTIONS[this.direction];
        this.gridX += dir.x;
        this.gridY += dir.y;
        
        // Reset interpolation
        this.interpolationProgress = 0;
        
        // Update visual position (will be interpolated in updateVisuals)
        this.updateVisuals(0);
        
        // Add to trail
        this.trail.push({ x: this.gridX, y: this.gridY });
        
        // Draw trail segment
        this.drawTrailSegment();
    }
    
    updateVisuals(deltaRatio) {
        if (!this.alive) return;
        
        // Update interpolation progress
        this.interpolationProgress = Math.min(1, this.interpolationProgress + deltaRatio);
        
        // Interpolate position for smooth movement
        let displayX, displayY;
        
        if (INTERPOLATION && this.interpolationProgress < 1) {
            // Smooth interpolation using easing
            const progress = this.easeOutQuad(this.interpolationProgress);
            displayX = this.prevGridX + (this.gridX - this.prevGridX) * progress;
            displayY = this.prevGridY + (this.gridY - this.prevGridY) * progress;
        } else {
            displayX = this.gridX;
            displayY = this.gridY;
        }
        
        const x = displayX * CELL_SIZE + CELL_SIZE / 2;
        const y = displayY * CELL_SIZE + CELL_SIZE / 2;
        
        this.sprite.setPosition(x, y);
        this.glow.setPosition(x, y);
        this.middleGlow.setPosition(x, y);
        this.outerGlow.setPosition(x, y);
        
        // Update visual effects based on power-ups
        this.updatePowerUpVisuals();
    }
    
    updatePowerUpVisuals() {
        // Phase effect - make semi-transparent
        if (this.phaseActive) {
            this.sprite.setAlpha(0.5);
            this.glow.setAlpha(0.3);
            this.middleGlow.setAlpha(0.2);
            this.outerGlow.setAlpha(0.1);
            // Remove any tints
            this.sprite.setFillStyle(this.color);
            this.glow.setFillStyle(this.color, 0.3);
            this.middleGlow.setFillStyle(this.color, 0.2);
        } else if (!this.frozen) {
            this.sprite.setAlpha(1);
            this.glow.setAlpha(1);
            this.middleGlow.setAlpha(1);
            this.outerGlow.setAlpha(1);
            // Reset to original color
            this.sprite.setFillStyle(this.color);
            this.glow.setFillStyle(this.color, 0.3);
            this.middleGlow.setFillStyle(this.color, 0.2);
        }
        
        // Frozen effect - add blue tint
        if (this.frozen) {
            this.sprite.setFillStyle(0x4444ff);
            this.glow.setFillStyle(0x4444ff, 0.3);
            this.middleGlow.setFillStyle(0x4444ff, 0.2);
            this.sprite.setAlpha(0.7);
        }
    }
    
    easeOutQuad(t) {
        return t * (2 - t); // Smooth deceleration
    }
    
    drawTrailSegment() {
        if (this.trail.length < 2) return;
        
        const last = this.trail[this.trail.length - 2];
        const current = this.trail[this.trail.length - 1];
        
        const lineWidth = CELL_SIZE - 2;
        
        // Calculate smooth positions with interpolation
        const lastX = last.x * CELL_SIZE + CELL_SIZE / 2;
        const lastY = last.y * CELL_SIZE + CELL_SIZE / 2;
        const currentX = current.x * CELL_SIZE + CELL_SIZE / 2;
        const currentY = current.y * CELL_SIZE + CELL_SIZE / 2;
        
        // Draw multiple layers for smooth trail effect
        // Layer 1: Outer glow (softest)
        this.trailGraphics.lineStyle(lineWidth + 8, this.color, 0.1);
        this.trailGraphics.beginPath();
        this.trailGraphics.moveTo(lastX, lastY);
        this.trailGraphics.lineTo(currentX, currentY);
        this.trailGraphics.strokePath();
        
        // Layer 2: Middle glow
        this.trailGraphics.lineStyle(lineWidth + 4, this.color, 0.2);
        this.trailGraphics.beginPath();
        this.trailGraphics.moveTo(lastX, lastY);
        this.trailGraphics.lineTo(currentX, currentY);
        this.trailGraphics.strokePath();
        
        // Layer 3: Main trail line
        this.trailGraphics.lineStyle(lineWidth, this.color, 0.9);
        this.trailGraphics.beginPath();
        this.trailGraphics.moveTo(lastX, lastY);
        this.trailGraphics.lineTo(currentX, currentY);
        this.trailGraphics.strokePath();
        
        // Layer 4: Inner highlight for extra smoothness
        this.trailGraphics.lineStyle(lineWidth - 4, this.color, 0.6);
        this.trailGraphics.beginPath();
        this.trailGraphics.moveTo(lastX, lastY);
        this.trailGraphics.lineTo(currentX, currentY);
        this.trailGraphics.strokePath();
        
        // Add rounded caps for smoother appearance
        this.drawRoundedCap(currentX, currentY, lineWidth);
    }
    
    drawRoundedCap(x, y, radius) {
        // Draw a small circle at the end of the trail for smoother appearance
        this.trailGraphics.fillStyle(this.color, 0.8);
        this.trailGraphics.fillCircle(x, y, radius / 2);
        
        // Add a smaller inner circle for highlight
        this.trailGraphics.fillStyle(this.color, 0.4);
        this.trailGraphics.fillCircle(x, y, radius / 4);
    }
    
    checkCollision(allPlayers) {
        if (!this.alive) return false;
        
        // Phase mode - ignore collisions with trails
        if (this.phaseActive) return false;
        
        // Check wall collision
        if (this.gridX < 0 || this.gridX >= GRID_SIZE || 
            this.gridY < 0 || this.gridY >= GRID_SIZE) {
            return true;
        }
        
        // Check collision with all trails (including own)
        for (const player of allPlayers) {
            if (!player.alive) continue;
            
            // Check all trail segments except the very last one of self
            const trailToCheck = player === this ? 
                player.trail.slice(0, -1) : 
                player.trail;
            
            for (const segment of trailToCheck) {
                if (segment.x === this.gridX && segment.y === this.gridY) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    applyPowerUp(powerUpType) {
        switch(powerUpType.id) {
            case 'speed':
                this.activateSpeedBoost(powerUpType);
                break;
            case 'phase':
                this.activatePhase(powerUpType);
                break;
            case 'freeze':
                this.activateFreeze(powerUpType);
                break;
        }
    }
    
    activateSpeedBoost(powerUpType) {
        this.speedBoostActive = true;
        
        // Visual feedback - change outer glow color
        this.outerGlow.setFillStyle(powerUpType.color, 0.15);
        
        this.scene.time.delayedCall(powerUpType.duration, () => {
            this.speedBoostActive = false;
            // Reset to original color
            this.outerGlow.setFillStyle(this.color, 0.15);
        });
    }
    
    activatePhase(powerUpType) {
        this.phaseActive = true;
        
        this.scene.time.delayedCall(powerUpType.duration, () => {
            this.phaseActive = false;
        });
    }
    
    activateFreeze(powerUpType) {
        // This is called on the player who picked it up
        // It freezes nearby opponents
        // Implemented in GameScene
    }
    
    freeze(duration) {
        if (this.frozen) return;
        
        this.frozen = true;
        
        // Clear any existing freeze timer
        if (this.frozenTimer) {
            this.frozenTimer.remove();
        }
        
        this.frozenTimer = this.scene.time.delayedCall(duration, () => {
            this.unfreeze();
        });
    }
    
    unfreeze() {
        this.frozen = false;
        if (this.frozenTimer) {
            this.frozenTimer.remove();
            this.frozenTimer = null;
        }
    }
    
    eliminate() {
        this.alive = false;
        
        // Create explosion effect
        const x = this.gridX * CELL_SIZE + CELL_SIZE / 2;
        const y = this.gridY * CELL_SIZE + CELL_SIZE / 2;
        
        // Flash effect
        this.scene.tweens.add({
            targets: [this.sprite, this.glow, this.middleGlow, this.outerGlow],
            alpha: 0,
            scale: 2,
            duration: 300,
            ease: 'Power2'
        });
        
        // Fade out and remove trail
        this.scene.tweens.add({
            targets: this.trailGraphics,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                // Clear the trail completely
                this.trailGraphics.clear();
                this.trail = [];
            }
        });
        
        // Particle effect
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const particle = this.scene.add.circle(x, y, 3, this.color);
            
            this.scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 50,
                y: y + Math.sin(angle) * 50,
                alpha: 0,
                duration: 600,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
        
        // Add screen shake for impact (if camera is available)
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(200, 0.005);
        }
    }
    
    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.glow) this.glow.destroy();
        if (this.middleGlow) this.middleGlow.destroy();
        if (this.outerGlow) this.outerGlow.destroy();
        if (this.trailGraphics) this.trailGraphics.destroy();
    }
}


