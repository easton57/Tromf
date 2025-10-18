// Game constants and configuration

// Grid settings
export const GRID_SIZE = 40; // Number of cells in grid (increased from 30)
export const CELL_SIZE = 20; // Pixels per cell
export const GAME_WIDTH = GRID_SIZE * CELL_SIZE; // 800px
export const GAME_HEIGHT = GRID_SIZE * CELL_SIZE; // 800px

// Game settings
export const MOVE_SPEED = 120; // Milliseconds between moves (faster = smoother)
export const TRAIL_WIDTH = CELL_SIZE - 2; // Width of trail lines
export const INTERPOLATION = true; // Enable smooth movement interpolation
export const WINS_NEEDED = 3; // First to 3 wins

// Player configurations
export const PLAYER_CONFIGS = [
    {
        id: 1,
        name: 'Player 1',
        color: 0x00ffff, // Cyan
        colorString: '#00ffff',
        startX: 10,
        startY: 20,
        startDirection: 'RIGHT',
        controls: {
            up: 'UP',
            down: 'DOWN',
            left: 'LEFT',
            right: 'RIGHT'
        }
    },
    {
        id: 2,
        name: 'Player 2',
        color: 0xff0000, // Red
        colorString: '#ff0000',
        startX: 30,
        startY: 20,
        startDirection: 'LEFT',
        controls: {
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D'
        }
    },
    {
        id: 3,
        name: 'Player 3',
        color: 0x00ff00, // Green
        colorString: '#00ff00',
        startX: 20,
        startY: 10,
        startDirection: 'DOWN',
        controls: {
            up: 'I',
            down: 'K',
            left: 'J',
            right: 'L'
        }
    },
    {
        id: 4,
        name: 'Player 4',
        color: 0xffff00, // Yellow
        colorString: '#ffff00',
        startX: 20,
        startY: 30,
        startDirection: 'UP',
        controls: {
            up: 'T',
            down: 'G',
            left: 'F',
            right: 'H'
        }
    }
];

// Directions
export const DIRECTIONS = {
    UP: { x: 0, y: -1, angle: -90 },
    DOWN: { x: 0, y: 1, angle: 90 },
    LEFT: { x: -1, y: 0, angle: 180 },
    RIGHT: { x: 1, y: 0, angle: 0 }
};

// UI Colors
export const UI_COLORS = {
    background: '#0a0a0a',
    gridLine: '#1a3a4a',
    text: '#ffffff',
    textShadow: '#00ffff'
};

// Power-up settings
export const POWERUP_SPAWN_INTERVAL = 4000; // Milliseconds between power-up spawns (faster!)
export const POWERUP_DURATION = 4000; // How long power-up effects last
export const POWERUP_LIFETIME = 15000; // How long power-ups stay on field before disappearing
export const INITIAL_POWERUPS = 2; // Number of power-ups to spawn at game start

export const POWERUP_TYPES = {
    SPEED: {
        id: 'speed',
        name: 'Speed Boost',
        color: 0xff00ff, // Magenta
        colorString: '#ff00ff',
        symbol: '⚡',
        speedMultiplier: 0.5, // 50% faster (lower time = faster)
        duration: 4000
    },
    PHASE: {
        id: 'phase',
        name: 'Phase',
        color: 0x00ff88, // Cyan-green
        colorString: '#00ff88',
        symbol: '👻',
        duration: 5000
    },
    FREEZE: {
        id: 'freeze',
        name: 'Freeze',
        color: 0x4444ff, // Blue
        colorString: '#4444ff',
        symbol: '❄️',
        freezeDuration: 3000,
        range: 150 // Pixel range to freeze nearby players
    }
};


