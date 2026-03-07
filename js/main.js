// Main Game Class
class Game {
    constructor() {
        this.state = 'loading'; // loading, menu, playing, paused, gameover
        
        // Core systems
        this.engine = new GameEngine();
        this.loop = new GameLoop();
        this.collision = new CollisionSystem();
        this.sprites = new SpriteManager();
        this.audio = new AudioManager();
        this.controls = new ControlsManager();
        this.storage = new StorageManager();
        this.ui = new UIManager(this.storage);
        
        // Game systems
        this.road = null;
        this.background = null;
        this.player = null;
        this.enemyManager = null;
        this.coinManager = null;
        this.powerupManager = null;
        this.levelManager = null;
        this.particles = null;
        
        // Input state
        this.input = {
            left: false,
            right: false
        };
        
        // Setup UI callbacks
        this.setupUICallbacks();
    }
    
    async init() {
        console.log('Initializing Neon Racer...');
        
        // Initialize engine
        if (!this.engine.init('game-canvas')) {
            console.error('Failed to initialize engine');
            return false;
        }
        
        // Load assets
        await this.loadAssets();
        
        // Initialize game systems
        this.initSystems();
        
        // Setup game loop
        this.loop.setCallbacks(
            (dt) => this.update(dt),
            (interp) => this.render(interp),
            (dt) => this.fixedUpdate(dt)
        );
        
        // Setup controls
        this.setupControls();
        
        // Load game data and show menu
        this.loadGameData();
        this.showMainMenu();
        
        console.log('Game initialized successfully');
        return true;
    }
    
    async loadAssets() {
        console.log('Loading assets...');
        
        this.ui.updateLoadingProgress(10);
        
        // Helper: try loading a sprite, fall back to generated sprite silently
        const tryLoadSprite = async (name, src, options = {}) => {
            try {
                await this.sprites.load(name, src, options);
                console.log(`✓ Loaded sprite: ${name}`);
            } catch (err) {
                console.warn(`Sprite '${name}' not found, using fallback`);
            }
        };
        
        // Try loading sprites — all failures are caught individually
        await tryLoadSprite('vehicles', 'assets/sprites/vehicles.png', { frameWidth: 40, frameHeight: 60, frames: 6 });
        await tryLoadSprite('trucks', 'assets/sprites/trucks.png', { frameWidth: 45, frameHeight: 80, frames: 3 });
        await tryLoadSprite('coin', 'assets/sprites/coin.png', { frameWidth: 32, frameHeight: 32, frames: 8 });
        await tryLoadSprite('powerups', 'assets/sprites/powerups.png', { frameWidth: 40, frameHeight: 40, frames: 3 });
        await tryLoadSprite('road', 'assets/sprites/road.png');
        await tryLoadSprite('particle', 'assets/sprites/particle.png');
        
        // Always generate fallback sprites for anything that didn't load
        if (!this.sprites.has('vehicles'))
            this.sprites.generateGradientSprite('vehicles', 40, 60, '#00f5ff', '#0088aa');
        if (!this.sprites.has('trucks'))
            this.sprites.generateGradientSprite('trucks', 45, 80, '#8338ec', '#5500aa');
        if (!this.sprites.has('coin'))
            this.sprites.generateGradientSprite('coin', 24, 24, '#ffbe0b', '#ff9500');
        if (!this.sprites.has('powerups'))
            this.sprites.generateGradientSprite('powerups', 40, 40, '#ff006e', '#8338ec');
        if (!this.sprites.has('particle'))
            this.sprites.generateColorSprite('particle', 4, 4, '#ffffff');
        
        this.ui.updateLoadingProgress(50);
        
        // Try loading sounds — all optional, failures are silent
        const tryLoadSound = async (name, src) => {
            try { await this.audio.loadSound(name, src); } catch (e) {}
        };
        const tryLoadMusic = async (name, src) => {
            try { await this.audio.loadMusic(name, src); } catch (e) {}
        };
        
        await tryLoadSound('coin', 'assets/sounds/coin.wav');
        await tryLoadSound('crash', 'assets/sounds/crash.wav');
        await tryLoadSound('powerup', 'assets/sounds/powerup.wav');
        await tryLoadSound('menu_select', 'assets/sounds/menu_select.wav');
        await tryLoadSound('levelup', 'assets/sounds/levelup.wav');
        
        this.ui.updateLoadingProgress(80);
        
        await tryLoadMusic('engine', 'assets/sounds/engine.wav');
        
        this.ui.updateLoadingProgress(100);
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    initSystems() {
        this.road = new Road(this.engine);
        this.background = new Background(this.engine);
        this.particles = new ParticleSystem(this.engine);
        this.levelManager = new LevelManager();
        
        const centerX = this.engine.width / 2 - 20;
        const playerY = this.engine.height - 120;
        
        this.player = new Player(this.engine, centerX, playerY);
        this.player.setSprite(this.sprites.get('vehicles'));
        
        this.enemyManager = new EnemyManager(this.engine, this.collision);
        this.enemyManager.setSprites(this.sprites);
        
        this.coinManager = new CoinManager(this.engine, this.collision);
        
        this.powerupManager = new PowerUpManager(this.engine, this.collision);
        
        // Apply settings
        const settings = this.storage.loadSettings();
        this.audio.setSoundEnabled(settings.soundEnabled);
        this.audio.setMusicEnabled(settings.musicEnabled);
        this.particles.setEnabled(settings.particlesEnabled);
    }
    
    setupUICallbacks() {
        this.ui.on('startGame', () => this.startGame());
        this.ui.on('pause', () => this.pauseGame());
        this.ui.on('resume', () => this.resumeGame());
        this.ui.on('restart', () => this.restartGame());
        this.ui.on('playAgain', () => this.restartGame());
        this.ui.on('mainMenu', () => this.showMainMenu());
        
        this.ui.on('soundToggle', (enabled) => this.audio.setSoundEnabled(enabled));
        this.ui.on('musicToggle', (enabled) => this.audio.setMusicEnabled(enabled));
        this.ui.on('particlesToggle', (enabled) => this.particles.setEnabled(enabled));
        
        this.ui.on('touchLeft', (pressed) => this.input.left = pressed);
        this.ui.on('touchRight', (pressed) => this.input.right = pressed);
    }
    
    setupControls() {
        // Keyboard controls are handled in update via controls manager
        // Touch controls are handled via UI manager callbacks
    }
    
    startGame() {
        console.log('Starting game...');
        
        try {
            this.state = 'playing';
            this.resetGame();
            this.ui.showScreen('game');
            this.loop.start();
            
            // Play start sound and background music
            this.audio.playSound('menu_select');
            this.audio.playMusic('engine');
            
            console.log('Game started successfully!');
        } catch (err) {
            console.error('Error starting game:', err);
            alert('Error starting game: ' + err.message);
        }
    }
    
    pauseGame() {
        if (this.state !== 'playing') return;
        
        this.state = 'paused';
        this.loop.pause();
        this.ui.showScreen('pause');
        this.audio.pauseMusic();
    }
    
    resumeGame() {
        if (this.state !== 'paused') return;
        
        this.state = 'playing';
        this.loop.resume();
        this.ui.showScreen('game');
        this.audio.resumeMusic();
    }
    
    restartGame() {
        console.log('Restarting game...');
        this.startGame();
    }
    
    showMainMenu() {
        this.state = 'menu';
        this.loop.stop();
        this.ui.showScreen('menu');
        this.loadGameData();
    }
    
    endGame() {
        console.log('Game over!');
        
        this.state = 'gameover';
        this.loop.stop();
        this.audio.stopMusic();
        
        // Save score and stats
        const levelData = this.levelManager.getLevelData();
        const isNewHighScore = this.storage.updateHighScore(levelData.score);
        this.storage.addCoins(levelData.coins);
        this.storage.incrementGamesPlayed();
        
        // Show game over screen
        this.ui.showGameOver(levelData, isNewHighScore);
    }
    
    resetGame() {
        // Reset all game systems
        const centerX = this.engine.width / 2 - 20;
        const playerY = this.engine.height - 120;
        
        this.player.reset(centerX, playerY);
        this.levelManager.reset();
        this.enemyManager.clear();
        this.coinManager.clear();
        this.powerupManager.clear();
        this.particles.clear();
        this.road.reset();
        this.background.reset();
        
        this.input.left = false;
        this.input.right = false;
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        // Update engine stats
        this.engine.updateFPS(performance.now());
        
        // Get input from keyboard or touch
        const keyLeft = this.controls.isAnyKeyPressed('ArrowLeft', 'a', 'A');
        const keyRight = this.controls.isAnyKeyPressed('ArrowRight', 'd', 'D');
        this.input.left = this.input.left || keyLeft;
        this.input.right = this.input.right || keyRight;
        
        // Update game systems
        const gameSpeed = this.levelManager.getGameSpeed();
        const difficulty = this.levelManager.getDifficulty();
        
        this.levelManager.update(deltaTime);
        this.background.update(deltaTime, gameSpeed);
        this.road.update(deltaTime, gameSpeed);
        this.player.update(deltaTime, this.input);
        this.enemyManager.update(deltaTime, gameSpeed, difficulty);
        this.coinManager.update(deltaTime, gameSpeed);
        this.powerupManager.update(deltaTime, gameSpeed);
        this.particles.update(deltaTime);
        
        // Reset touch input each frame (keyboard state is persistent via controls manager)
        // Touch presses are set via event callbacks and must be cleared after each update
        if (this.ui.elements.touchLeft || this.ui.elements.touchRight) {
            // Only reset if not currently held (events will re-set them next frame if still pressed)
            // Touch state is managed via touchstart/touchend callbacks — reset here is correct
        }
        this.input.left = false;
        this.input.right = false;
        
        // Check collisions
        this.checkCollisions();
        
        // Add distance points
        this.levelManager.addScore(Math.floor(gameSpeed * 0.1));
        
        // Update UI
        this.ui.updateGameUI(this.levelManager.getLevelData());
        
        // Create trail particles
        if (Math.random() < 0.3) {
            this.particles.createTrail(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height
            );
        }
    }
    
    fixedUpdate(deltaTime) {
        // Physics updates if needed
    }
    
    checkCollisions() {
        // Check enemy collisions
        const hitEnemy = this.enemyManager.checkCollision(this.player);
        if (hitEnemy && !this.powerupManager.isActive('shield')) {
            this.particles.createCrashEffect(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2
            );
            this.player.die();
            this.audio.playSound('crash');
            this.endGame();
            return;
        }
        
        // Check coin collisions
        const collectedCoins = this.coinManager.checkCollisions(this.player);
        for (const coin of collectedCoins) {
            this.levelManager.addCoin();
            this.particles.createCoinEffect(coin.x, coin.y);
            this.audio.playSound('coin');
        }
        
        // Check powerup collisions
        const collectedPowerups = this.powerupManager.checkCollisions(this.player);
        for (const powerup of collectedPowerups) {
            if (powerup.type === 'shield') {
                this.player.setInvincible(5000);
            }
            this.particles.createExplosion(
                powerup.x,
                powerup.y,
                15,
                { color: powerup.color }
            );
            this.audio.playSound('powerup');
        }
    }
    
    render(interpolation) {
        // Clear screen
        this.engine.clear();
        
        // Render game
        if (this.state === 'playing' || this.state === 'paused') {
            this.background.render();
            this.road.render();
            this.coinManager.render();
            this.powerupManager.render();
            this.enemyManager.render();
            this.player.render();
            this.particles.render();
        }
    }
    
    loadGameData() {
        const gameData = this.storage.loadGameData();
        this.ui.updateMenuStats(gameData);
    }
}

// Initialize game when page loads
window.addEventListener('load', async () => {
    console.log('Page loaded, initializing game...');
    
    try {
        const game = new Game();
        const success = await game.init();
        
        if (!success) {
            console.error('Failed to initialize game');
            alert('Failed to load game. Please refresh the page.');
            return;
        }
        
        console.log('Game initialized successfully!');
        
        // Store game instance globally for debugging
        window.game = game;
        
    } catch (err) {
        console.error('Fatal error initializing game:', err);
        alert('Error loading game: ' + err.message + '\nPlease check console for details.');
    }
});

// Add error handler for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
