import { LightCycle } from '../entities/LightCycle.js';
import { PowerUp } from '../entities/PowerUp.js';
import { GAME_WIDTH, GAME_HEIGHT, CELL_SIZE, GRID_SIZE, MOVE_SPEED, PLAYER_CONFIGS, POWERUP_SPAWN_INTERVAL, POWERUP_TYPES, INITIAL_POWERUPS, WINS_NEEDED, DIRECTIONS } from '../utils/Constants.js';

export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    init() {
        this.players = [];
        this.powerUps = [];
        this.moveTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.gameStarted = false;
        this.countdownValue = 3;
        this.enemyCount = this.registry.get('enemyCount') || 1;
        this.aiUpdateTimer = 0;
    }
    
    create() {
        // Draw grid
        this.drawGrid();
        
        // Get player count from registry
        const playerCount = this.registry.get('playerCount') || 2;
        
        // Create human player (always first)
        const humanPlayer = new LightCycle(this, PLAYER_CONFIGS[0]);
        humanPlayer.isAI = false;
        humanPlayer.name = 'Player';
        this.players.push(humanPlayer);
        
        // Create AI enemies
        for (let i = 1; i < playerCount; i++) {
            const enemy = new LightCycle(this, PLAYER_CONFIGS[i]);
            enemy.isAI = true;
            enemy.name = `Enemy ${i}`;
            this.players.push(enemy);
        }
        
        // Setup input
        this.setupInput();
        
        // Create UI
        this.createUI();
        
        // Countdown before start
        this.startCountdown();
    }
    
    drawGrid() {
        const graphics = this.add.graphics();
        
        // Set line style for grid lines
        graphics.lineStyle(1, 0x1a3a4a, 0.6);
        
        // Draw all vertical lines in one path
        graphics.beginPath();
        for (let x = 0; x <= GRID_SIZE; x++) {
            const xPos = x * CELL_SIZE;
            graphics.moveTo(xPos, 0);
            graphics.lineTo(xPos, GAME_HEIGHT);
        }
        graphics.strokePath();
        
        // Draw all horizontal lines in one path
        graphics.beginPath();
        for (let y = 0; y <= GRID_SIZE; y++) {
            const yPos = y * CELL_SIZE;
            graphics.moveTo(0, yPos);
            graphics.lineTo(GAME_WIDTH, yPos);
        }
        graphics.strokePath();
        
        // Draw border with thicker, more visible line
        graphics.lineStyle(2, 0x00ffff, 0.8);
        graphics.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // Set depth to ensure grid is behind everything
        graphics.setDepth(-1);
    }
    
    setupInput() {
        // Create keyboard inputs for human player only
        this.input.keyboard.on('keydown', (event) => {
            if (!this.gameStarted) return;
            
            const humanPlayer = this.players[0]; // First player is always human
            if (!humanPlayer.alive) return;
            
            const controls = humanPlayer.config.controls;
            const key = event.key.toUpperCase();
            
            if (key === controls.up || key === 'ARROWUP' && controls.up === 'UP') {
                humanPlayer.setDirection('UP');
            } else if (key === controls.down || key === 'ARROWDOWN' && controls.down === 'DOWN') {
                humanPlayer.setDirection('DOWN');
            } else if (key === controls.left || key === 'ARROWLEFT' && controls.left === 'LEFT') {
                humanPlayer.setDirection('LEFT');
            } else if (key === controls.right || key === 'ARROWRIGHT' && controls.right === 'RIGHT') {
                humanPlayer.setDirection('RIGHT');
            }
        });
    }
    
    createUI() {
        // Get win counts
        const playerWins = this.registry.get('playerWins') || [0, 0, 0, 0];
        
        // Player status indicators with win counts
        this.statusTexts = [];
        const startY = 10;
        const spacing = 25;
        
        this.players.forEach((player, index) => {
            const wins = playerWins[index];
            const playerType = player.isAI ? 'AI' : 'HUMAN';
            const text = this.add.text(10, startY + index * spacing, 
                `${player.name} (${playerType}): ALIVE | Wins: ${wins}/${WINS_NEEDED}`, {
                fontSize: '16px',
                fill: player.config.colorString,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            });
            text.setShadow(1, 1, '#000000', 2);
            this.statusTexts.push(text);
        });
        
        // Countdown text (hidden initially)
        this.countdownText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '', {
            fontSize: '72px',
            fill: '#00ffff',
            fontFamily: 'Arial, sans-serif',
            fontStyle: 'bold'
        });
        this.countdownText.setOrigin(0.5);
        this.countdownText.setShadow(0, 0, '#00ffff', 20, true, true);
        this.countdownText.setVisible(false);
    }
    
    startCountdown() {
        this.countdownText.setVisible(true);
        this.countdownText.setText(this.countdownValue.toString());
        
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.countdownValue--;
                
                if (this.countdownValue > 0) {
                    this.countdownText.setText(this.countdownValue.toString());
                } else {
                    this.countdownText.setText('GO!');
                    this.time.delayedCall(500, () => {
                        this.countdownText.setVisible(false);
                        this.gameStarted = true;
                        
                        // Spawn initial power-ups when game starts
                        this.spawnInitialPowerUps();
                    });
                }
            },
            repeat: 3
        });
    }
    
    spawnInitialPowerUps() {
        console.log('Spawning initial power-ups:', INITIAL_POWERUPS);
        // Spawn multiple power-ups at game start
        for (let i = 0; i < INITIAL_POWERUPS; i++) {
            this.time.delayedCall(i * 500, () => {
                this.spawnPowerUp();
            });
        }
    }
    
    update(time, delta) {
        if (!this.gameStarted) return;
        
        // Update move timer
        this.moveTimer += delta;
        
        // Update power-up spawn timer
        this.powerUpSpawnTimer += delta;
        if (this.powerUpSpawnTimer >= POWERUP_SPAWN_INTERVAL) {
            this.powerUpSpawnTimer = 0;
            this.spawnPowerUp();
        }
        
        // Update AI timer
        this.aiUpdateTimer += delta;
        if (this.aiUpdateTimer >= 100) { // AI updates every 100ms for more responsiveness
            this.aiUpdateTimer = 0;
            this.updateAI();
        }
        
        // Calculate interpolation progress (how far between grid moves)
        let moveSpeed = MOVE_SPEED;
        
        // Check if any player has speed boost
        this.players.forEach(player => {
            if (player.alive && player.speedBoostActive) {
                // Use faster speed for this player
                const deltaRatio = Math.min(delta / (MOVE_SPEED * POWERUP_TYPES.SPEED.speedMultiplier), 1);
                player.updateVisuals(deltaRatio);
            } else {
                const deltaRatio = Math.min(delta / MOVE_SPEED, 1);
                player.updateVisuals(deltaRatio);
            }
        });
        
        // Update game logic at appropriate speed for each player
        this.players.forEach(player => {
            if (player.alive && player.speedBoostActive) {
                player.speedMoveTimer = (player.speedMoveTimer || 0) + delta;
                if (player.speedMoveTimer >= MOVE_SPEED * POWERUP_TYPES.SPEED.speedMultiplier) {
                    player.speedMoveTimer = 0;
                    this.updateSinglePlayer(player);
                }
            }
        });
        
        if (this.moveTimer >= MOVE_SPEED) {
            this.moveTimer = 0;
            this.updateGame();
        }
        
        // Check power-up collisions
        this.checkPowerUpCollisions();
    }
    
    updateGame() {
        // Move all alive players (except those with speed boost)
        this.players.forEach(player => {
            if (player.alive && !player.speedBoostActive) {
                player.update();
            }
        });
        
        // Check collisions
        this.players.forEach(player => {
            if (player.alive && player.checkCollision(this.players)) {
                player.eliminate();
                this.updatePlayerStatus(player);
            }
        });
        
        // Check for game over
        const alivePlayers = this.players.filter(p => p.alive);
        if (alivePlayers.length <= 1) {
            this.endGame(alivePlayers[0]);
        }
    }
    
    updateSinglePlayer(player) {
        if (player.alive) {
            player.update();
            
            // Check collisions
            if (player.checkCollision(this.players)) {
                player.eliminate();
                this.updatePlayerStatus(player);
                
                // Check for game over
                const alivePlayers = this.players.filter(p => p.alive);
                if (alivePlayers.length <= 1) {
                    this.endGame(alivePlayers[0]);
                }
            }
        }
    }
    
    updateAI() {
        // Update AI players
        this.players.forEach(player => {
            if (player.isAI && player.alive && !player.frozen) {
                this.makeAIDecision(player);
            }
        });
    }
    
    makeAIDecision(player) {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const currentDir = player.direction;
        
        // Get possible directions (can't reverse)
        const possibleDirections = directions.filter(dir => {
            return !this.isReverseDirection(currentDir, dir);
        });
        
        // Check which directions are safe
        const safeDirections = possibleDirections.filter(dir => {
            return this.isDirectionSafe(player, dir);
        });
        
        // If no safe directions due to dead-end detection, fall back to basic safety check
        if (safeDirections.length === 0) {
            const basicSafeDirections = possibleDirections.filter(dir => {
                const nextX = player.gridX + DIRECTIONS[dir].x;
                const nextY = player.gridY + DIRECTIONS[dir].y;
                
                // Basic wall and collision check only
                if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
                    return false;
                }
                
                // Check immediate collision
                for (const otherPlayer of this.players) {
                    if (!otherPlayer.alive) continue;
                    
                    if (otherPlayer !== player && otherPlayer.gridX === nextX && otherPlayer.gridY === nextY) {
                        return false;
                    }
                    
                    const trailToCheck = otherPlayer === player ? 
                        otherPlayer.trail.slice(0, -1) : 
                        otherPlayer.trail;
                    
                    for (const segment of trailToCheck) {
                        if (segment.x === nextX && segment.y === nextY) {
                            return false;
                        }
                    }
                }
                
                return true;
            });
            
            if (basicSafeDirections.length > 0) {
                // Choose the safest basic direction
                const dangerScores = basicSafeDirections.map(dir => ({
                    direction: dir,
                    danger: this.calculateDangerScore(player, dir)
                }));
                dangerScores.sort((a, b) => a.danger - b.danger);
                player.setDirection(dangerScores[0].direction);
                return;
            }
        }
        
        // Add minimal randomness - 3% chance to make a random move regardless of strategy
        if (Math.random() < 0.03 && safeDirections.length > 0) {
            const randomDir = safeDirections[Math.floor(Math.random() * safeDirections.length)];
            player.setDirection(randomDir);
            return;
        }
        
        // If there are safe directions, choose one
        if (safeDirections.length > 0) {
            // Prefer continuing in current direction if it's safe (but not always)
            if (safeDirections.includes(currentDir) && Math.random() < 0.75) {
                player.setDirection(currentDir);
            } else {
                // Choose the best safe direction based on strategy
                const bestDirection = this.chooseBestDirection(player, safeDirections);
                player.setDirection(bestDirection);
            }
        } else {
            // No safe directions - try to find the least dangerous
            const dangerScores = possibleDirections.map(dir => ({
                direction: dir,
                danger: this.calculateDangerScore(player, dir)
            }));
            
            // Sort by danger (lowest first) and choose the safest
            dangerScores.sort((a, b) => a.danger - b.danger);
            player.setDirection(dangerScores[0].direction);
        }
    }
    
    chooseBestDirection(player, safeDirections) {
        // Strategy: Advanced AI with targeting ALL players, power-up seeking, and self-preservation
        const alivePlayers = this.players.filter(p => p.alive && p !== player);
        if (alivePlayers.length === 0) {
            // If no other players alive, seek power-ups or move randomly
            return this.seekPowerUps(player, safeDirections);
        }
        
        // Calculate strategic scores for each direction
        const strategicScores = safeDirections.map(dir => {
            const nextX = player.gridX + DIRECTIONS[dir].x;
            const nextY = player.gridY + DIRECTIONS[dir].y;
            
            let score = 0;
            
            // 1. POWER-UP SEEKING (highest priority when available)
            const powerUpScore = this.calculatePowerUpScore(nextX, nextY);
            score += powerUpScore * 4; // High multiplier for power-ups
            
            // 2. TARGET ALL PLAYERS - Try to cut off or trap any other player
            const targetingScore = this.calculateMultiPlayerTargetingScore(player, nextX, nextY, alivePlayers);
            score += targetingScore * 3;
            
            // 3. SELF-PRESERVATION - Avoid getting trapped
            const survivalScore = this.calculateSurvivalScore(player, nextX, nextY);
            score += survivalScore * 2;
            
            // 4. DISTANCE TO CLOSEST PLAYER (secondary priority)
            const closestPlayerDistance = Math.min(...alivePlayers.map(otherPlayer => 
                Math.abs(nextX - otherPlayer.gridX) + Math.abs(nextY - otherPlayer.gridY)
            ));
            score += (20 - closestPlayerDistance) * 1.5;
            
            // 5. INTERCEPTION - Try to get in front of closest player's path
            const closestPlayer = alivePlayers.reduce((closest, otherPlayer) => {
                const closestDist = Math.abs(player.gridX - closest.gridX) + Math.abs(player.gridY - closest.gridY);
                const otherDist = Math.abs(player.gridX - otherPlayer.gridX) + Math.abs(player.gridY - otherPlayer.gridY);
                return otherDist < closestDist ? otherPlayer : closest;
            });
            
            const closestNextX = closestPlayer.gridX + DIRECTIONS[closestPlayer.direction].x;
            const closestNextY = closestPlayer.gridY + DIRECTIONS[closestPlayer.direction].y;
            const distanceToClosestPath = Math.abs(nextX - closestNextX) + Math.abs(nextY - closestNextY);
            score += (15 - distanceToClosestPath) * 2;
            
            // 6. TRAP ASSISTANCE - Help trap any player when they're cornered
            alivePlayers.forEach(otherPlayer => {
                const escapeRoutes = this.countEscapeRoutes(otherPlayer);
                if (escapeRoutes <= 2) {
                    const trapScore = this.calculateTrapScore(nextX, nextY, otherPlayer);
                    score += trapScore * 2.5;
                }
            });
            
            // 7. MOBILITY - Avoid getting too close to walls
            const wallDistance = Math.min(nextX, nextY, GRID_SIZE - 1 - nextX, GRID_SIZE - 1 - nextY);
            if (wallDistance < 2) {
                score -= 20; // Strong penalty for being very close to walls
            } else if (wallDistance < 4) {
                score -= 5; // Moderate penalty for being close to walls
            }
            
            // 8. Minimal randomness to prevent predictability
            score += (Math.random() - 0.5) * 2; // Small random factor
            
            return { direction: dir, score: score };
        });
        
        // Sort by strategic score (highest first)
        strategicScores.sort((a, b) => b.score - a.score);
        
        // 85% chance to choose the best strategic direction, 12% chance for second best, 3% for random
        const randomChoice = Math.random();
        if (randomChoice < 0.85) {
            return strategicScores[0].direction;
        } else if (randomChoice < 0.97 && strategicScores.length > 1) {
            return strategicScores[1].direction;
        } else {
            return safeDirections[Math.floor(Math.random() * safeDirections.length)];
        }
    }
    
    calculatePowerUpScore(x, y) {
        let score = 0;
        
        // Check distance to all active power-ups
        this.powerUps.forEach(powerUp => {
            if (powerUp.active) {
                const distance = Math.abs(x - powerUp.gridX) + Math.abs(y - powerUp.gridY);
                
                // Higher score for closer power-ups
                if (distance <= 3) {
                    score += 20 - distance * 3; // Very high score for nearby power-ups
                } else if (distance <= 8) {
                    score += 10 - distance; // Moderate score for distant power-ups
                }
                
                // Bonus for speed power-ups (most valuable)
                if (powerUp.type.id === 'speed') {
                    score += 5;
                }
            }
        });
        
        return score;
    }
    
    calculateMultiPlayerTargetingScore(player, nextX, nextY, alivePlayers) {
        let totalScore = 0;
        
        // Calculate targeting score for each alive player
        alivePlayers.forEach(targetPlayer => {
            const targetingScore = this.calculateTargetingScore(player, nextX, nextY, targetPlayer);
            
            // Weight the score based on how close the target is
            const distanceToTarget = Math.abs(player.gridX - targetPlayer.gridX) + Math.abs(player.gridY - targetPlayer.gridY);
            const distanceWeight = Math.max(0.5, 1.0 - (distanceToTarget / 20)); // Closer targets get higher weight
            
            totalScore += targetingScore * distanceWeight;
        });
        
        return totalScore;
    }
    
    calculateTargetingScore(player, nextX, nextY, targetPlayer) {
        let score = 0;
        
        // Try to position for future interception
        const targetX = targetPlayer.gridX;
        const targetY = targetPlayer.gridY;
        const targetDir = targetPlayer.direction;
        
        // Predict where target will be in 2-3 moves
        let predictedX = targetX;
        let predictedY = targetY;
        
        for (let i = 0; i < 3; i++) {
            predictedX += DIRECTIONS[targetDir].x;
            predictedY += DIRECTIONS[targetDir].y;
            
            // Check if predicted position is valid
            if (predictedX < 0 || predictedX >= GRID_SIZE || predictedY < 0 || predictedY >= GRID_SIZE) {
                break;
            }
            
            // Check if predicted position would collide with trails
            let wouldCollide = false;
            for (const otherPlayer of this.players) {
                if (!otherPlayer.alive) continue;
                
                const trailToCheck = otherPlayer === targetPlayer ? 
                    otherPlayer.trail.slice(0, -1) : 
                    otherPlayer.trail;
                
                for (const segment of trailToCheck) {
                    if (segment.x === predictedX && segment.y === predictedY) {
                        wouldCollide = true;
                        break;
                    }
                }
                if (wouldCollide) break;
            }
            
            if (wouldCollide) break;
            
            // Score based on how close we'd be to predicted position
            const distanceToPredicted = Math.abs(nextX - predictedX) + Math.abs(nextY - predictedY);
            score += (10 - distanceToPredicted) * (3 - i); // Higher score for closer predictions
        }
        
        return score;
    }
    
    calculateSurvivalScore(player, nextX, nextY) {
        let score = 0;
        
        // Check how many escape routes we'd have from this position
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        let futureEscapeRoutes = 0;
        
        directions.forEach(dir => {
            const testX = nextX + DIRECTIONS[dir].x;
            const testY = nextY + DIRECTIONS[dir].y;
            
            if (testX >= 0 && testX < GRID_SIZE && testY >= 0 && testY < GRID_SIZE) {
                // Simulate if this future position would be safe
                let safe = true;
                for (const otherPlayer of this.players) {
                    if (!otherPlayer.alive) continue;
                    
                    if (otherPlayer !== player && otherPlayer.gridX === testX && otherPlayer.gridY === testY) {
                        safe = false;
                        break;
                    }
                    
                    const trailToCheck = otherPlayer === player ? 
                        otherPlayer.trail.slice(0, -1) : 
                        otherPlayer.trail;
                    
                    for (const segment of trailToCheck) {
                        if (segment.x === testX && segment.y === testY) {
                            safe = false;
                            break;
                        }
                    }
                    if (!safe) break;
                }
                
                if (safe) {
                    futureEscapeRoutes++;
                }
            }
        });
        
        // Higher score for positions with more escape routes
        score += futureEscapeRoutes * 5;
        
        // Bonus for positions that don't create dead ends
        if (futureEscapeRoutes >= 3) {
            score += 10;
        }
        
        return score;
    }
    
    seekPowerUps(player, safeDirections) {
        // When no human player, focus on power-ups
        const powerUpScores = safeDirections.map(dir => {
            const nextX = player.gridX + DIRECTIONS[dir].x;
            const nextY = player.gridY + DIRECTIONS[dir].y;
            
            let score = this.calculatePowerUpScore(nextX, nextY);
            
            // Add survival score
            score += this.calculateSurvivalScore(player, nextX, nextY);
            
            return { direction: dir, score: score };
        });
        
        powerUpScores.sort((a, b) => b.score - a.score);
        return powerUpScores[0].direction;
    }
    
    countEscapeRoutes(player) {
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        let escapeRoutes = 0;
        
        directions.forEach(dir => {
            if (this.isDirectionSafe(player, dir)) {
                escapeRoutes++;
            }
        });
        
        return escapeRoutes;
    }
    
    calculateTrapScore(aiX, aiY, humanPlayer) {
        let trapScore = 0;
        
        // Check if AI position helps create a wall around human player
        const humanX = humanPlayer.gridX;
        const humanY = humanPlayer.gridY;
        
        // Check positions around human player
        const positions = [
            { x: humanX - 1, y: humanY }, // Left
            { x: humanX + 1, y: humanY }, // Right
            { x: humanX, y: humanY - 1 }, // Up
            { x: humanX, y: humanY + 1 }  // Down
        ];
        
        positions.forEach(pos => {
            // If AI is in one of these positions, it's helping trap the human
            if (pos.x === aiX && pos.y === aiY) {
                trapScore += 15;
            }
            
            // Also check if AI is creating a barrier
            const distance = Math.abs(pos.x - aiX) + Math.abs(pos.y - aiY);
            if (distance === 1) {
                trapScore += 5;
            }
        });
        
        return trapScore;
    }
    
    isReverseDirection(currentDir, newDir) {
        const reverseMap = {
            'UP': 'DOWN',
            'DOWN': 'UP',
            'LEFT': 'RIGHT',
            'RIGHT': 'LEFT'
        };
        return reverseMap[currentDir] === newDir;
    }
    
    isDirectionSafe(player, direction) {
        // Calculate next position
        const nextX = player.gridX + DIRECTIONS[direction].x;
        const nextY = player.gridY + DIRECTIONS[direction].y;
        
        // Check wall collision
        if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
            return false;
        }
        
        // Check collision with all players' trails and current positions
        for (const otherPlayer of this.players) {
            if (!otherPlayer.alive) continue;
            
            // Check current position of other players
            if (otherPlayer !== player && otherPlayer.gridX === nextX && otherPlayer.gridY === nextY) {
                return false;
            }
            
            // Check trail segments
            const trailToCheck = otherPlayer === player ? 
                otherPlayer.trail.slice(0, -1) : // For self, exclude the very last segment
                otherPlayer.trail; // For others, check all trail segments
            
            for (const segment of trailToCheck) {
                if (segment.x === nextX && segment.y === nextY) {
                    return false;
                }
            }
        }
        
        // Additional check: Look ahead 2-3 moves to avoid getting trapped
        if (this.wouldCreateDeadEnd(player, nextX, nextY)) {
            return false;
        }
        
        return true;
    }
    
    wouldCreateDeadEnd(player, nextX, nextY) {
        // Simulate moving to nextX, nextY and check if we'd be trapped
        const directions = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        let availableMoves = 0;
        
        directions.forEach(dir => {
            const testX = nextX + DIRECTIONS[dir].x;
            const testY = nextY + DIRECTIONS[dir].y;
            
            // Check if this simulated move would be safe
            if (testX >= 0 && testX < GRID_SIZE && testY >= 0 && testY < GRID_SIZE) {
                // Check if this position would collide with trails
                let safe = true;
                for (const otherPlayer of this.players) {
                    if (!otherPlayer.alive) continue;
                    
                    // Check current position
                    if (otherPlayer !== player && otherPlayer.gridX === testX && otherPlayer.gridY === testY) {
                        safe = false;
                        break;
                    }
                    
                    // Check trail segments
                    const trailToCheck = otherPlayer === player ? 
                        otherPlayer.trail.slice(0, -1) : 
                        otherPlayer.trail;
                    
                    for (const segment of trailToCheck) {
                        if (segment.x === testX && segment.y === testY) {
                            safe = false;
                            break;
                        }
                    }
                    if (!safe) break;
                }
                
                if (safe) {
                    availableMoves++;
                }
            }
        });
        
        // If we'd have only 1 or 0 moves available, it's a potential dead end
        return availableMoves <= 1;
    }
    
    calculateDangerScore(player, direction) {
        // Calculate next position
        const nextX = player.gridX + DIRECTIONS[direction].x;
        const nextY = player.gridY + DIRECTIONS[direction].y;
        
        let dangerScore = 0;
        
        // Check wall proximity
        const wallDistance = Math.min(nextX, nextY, GRID_SIZE - 1 - nextX, GRID_SIZE - 1 - nextY);
        if (wallDistance < 3) {
            dangerScore += 10 - wallDistance;
        }
        
        // Check trail proximity
        for (const otherPlayer of this.players) {
            if (!otherPlayer.alive) continue;
            
            const trailToCheck = otherPlayer === player ? 
                otherPlayer.trail.slice(0, -1) : 
                otherPlayer.trail;
            
            for (const segment of trailToCheck) {
                const distance = Math.abs(segment.x - nextX) + Math.abs(segment.y - nextY);
                if (distance < 3) {
                    dangerScore += 5 - distance;
                }
            }
        }
        
        return dangerScore;
    }
    
    spawnPowerUp() {
        console.log('Attempting to spawn power-up...');
        // Find a safe spawn location
        let attempts = 0;
        let gridX, gridY;
        let safe = false;
        
        while (!safe && attempts < 50) {
            gridX = Phaser.Math.Between(3, GRID_SIZE - 4);
            gridY = Phaser.Math.Between(3, GRID_SIZE - 4);
            
            // Check if location is clear of trails
            safe = true;
            for (const player of this.players) {
                for (const segment of player.trail) {
                    const dist = Math.abs(segment.x - gridX) + Math.abs(segment.y - gridY);
                    if (dist < 3) {
                        safe = false;
                        break;
                    }
                }
                if (!safe) break;
            }
            
            attempts++;
        }
        
        if (safe) {
            // Randomly select a power-up type
            const types = Object.values(POWERUP_TYPES);
            const randomType = types[Phaser.Math.Between(0, types.length - 1)];
            
            console.log('Spawning power-up:', randomType.name, 'at', gridX, gridY);
            const powerUp = new PowerUp(this, gridX, gridY, randomType);
            this.powerUps.push(powerUp);
            console.log('Power-ups count:', this.powerUps.length);
        } else {
            console.log('Failed to find safe spawn location after', attempts, 'attempts');
        }
    }
    
    checkPowerUpCollisions() {
        this.powerUps = this.powerUps.filter(powerUp => {
            if (!powerUp.active) return false;
            
            for (const player of this.players) {
                if (powerUp.checkCollision(player)) {
                    powerUp.collect(player);
                    this.applyPowerUpToPlayer(player, powerUp.type);
                    return false;
                }
            }
            
            return true;
        });
    }
    
    applyPowerUpToPlayer(player, powerUpType) {
        if (powerUpType.id === 'freeze') {
            // Freeze nearby opponents
            const playerX = player.gridX * CELL_SIZE + CELL_SIZE / 2;
            const playerY = player.gridY * CELL_SIZE + CELL_SIZE / 2;
            
            this.players.forEach(opponent => {
                if (opponent !== player && opponent.alive) {
                    const oppX = opponent.gridX * CELL_SIZE + CELL_SIZE / 2;
                    const oppY = opponent.gridY * CELL_SIZE + CELL_SIZE / 2;
                    const distance = Phaser.Math.Distance.Between(playerX, playerY, oppX, oppY);
                    
                    if (distance <= powerUpType.range) {
                        opponent.freeze(powerUpType.freezeDuration);
                        
                        // Visual feedback
                        this.createFreezeEffect(opponent);
                    }
                }
            });
        } else {
            player.applyPowerUp(powerUpType);
        }
        
        // Show notification
        this.showPowerUpNotification(player, powerUpType);
    }
    
    createFreezeEffect(player) {
        const x = player.sprite.x;
        const y = player.sprite.y;
        
        // Create ice particles
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const particle = this.add.circle(
                x + Math.cos(angle) * 20,
                y + Math.sin(angle) * 20,
                4,
                0x4444ff
            );
            
            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 500,
                ease: 'Power2',
                onComplete: () => particle.destroy()
            });
        }
    }
    
    showPowerUpNotification(player, powerUpType) {
        const x = player.sprite.x;
        const y = player.sprite.y - 30;
        
        const text = this.add.text(x, y, powerUpType.symbol + ' ' + powerUpType.name, {
            fontSize: '16px',
            fill: powerUpType.colorString,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        text.setOrigin(0.5);
        text.setShadow(1, 1, '#000000', 3);
        
        this.tweens.add({
            targets: text,
            y: y - 30,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => text.destroy()
        });
    }
    
    updatePlayerStatus(player) {
        const index = this.players.indexOf(player);
        const playerWins = this.registry.get('playerWins') || [0, 0, 0, 0];
        if (index >= 0 && this.statusTexts[index]) {
            const playerType = player.isAI ? 'AI' : 'HUMAN';
            this.statusTexts[index].setText(`${player.name} (${playerType}): ELIMINATED | Wins: ${playerWins[index]}/${WINS_NEEDED}`);
            this.statusTexts[index].setAlpha(0.5);
        }
    }
    
    endGame(winner) {
        this.gameStarted = false;
        
        if (winner) {
            // Update win count
            const playerWins = this.registry.get('playerWins') || [0, 0, 0, 0];
            const winnerIndex = this.players.indexOf(winner);
            playerWins[winnerIndex]++;
            this.registry.set('playerWins', playerWins);
            
            // Check if winner has won the match
            if (playerWins[winnerIndex] >= WINS_NEEDED) {
                // Champion - reset wins and go to final victory screen
                this.time.delayedCall(1000, () => {
                    this.registry.set('champion', winner.name);
                    this.registry.set('championColor', winner.config.colorString);
                    this.registry.set('playerWins', [0, 0, 0, 0]); // Reset for next match
                    this.scene.start('GameOverScene');
                });
            } else {
                // Continue series - just restart round
                this.time.delayedCall(1000, () => {
                    this.registry.set('roundWinner', winner.name);
                    this.registry.set('roundWinnerColor', winner.config.colorString);
                    this.registry.set('champion', null); // Not a champion yet
                    this.scene.start('GameOverScene');
                });
            }
        } else {
            // Draw
            this.time.delayedCall(1000, () => {
                this.registry.set('roundWinner', 'No one');
                this.registry.set('roundWinnerColor', '#ffffff');
                this.registry.set('champion', null);
                this.scene.start('GameOverScene');
            });
        }
    }
}


