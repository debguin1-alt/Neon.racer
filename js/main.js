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
        
        try {
            this.ui.updateLoadingProgress(10);
            
            // Load all sprite images
            try {
                await this.sprites.load('vehicles', 'assets/sprites/vehicles.png', {
                    frameWidth: 40,
                    frameHeight: 60,
                    frames: 6
                });
                
                await this.sprites.load('trucks', 'assets/sprites/trucks.png', {
                    frameWidth: 45,
                    frameHeight: 80,
                    frames: 3
                });
                
                await this.sprites.load('coin', 'assets/sprites/coin.png', {
                    frameWidth: 32,
                    frameHeight: 32,
                    frames: 8
                });
                
                await this.sprites.load('powerups', 'assets/sprites/powerups.png', {
                    frameWidth: 40,
                    frameHeight: 40,
                    frames: 3
                });
                
                await this.sprites.load('road', 'assets/sprites/road.png');
                await this.sprites.load('particle', 'assets/sprites/particle.png');
                
                console.log('✓ Loaded all sprite assets');
            } catch (err) {
                console.warn('Failed to load some sprites, using fallbacks:', err);
                // Generate placeholder sprites if loading fails
                this.sprites.generateGradientSprite('player', 40, 60, '#00f5ff', '#0088aa');
                this.sprites.generateGradientSprite('enemy_car', 40, 60, '#ff006e', '#aa0044');
                this.sprites.generateGradientSprite('enemy_truck', 45, 80, '#8338ec', '#5500aa');
            }
            
            this.ui.updateLoadingProgress(50);
            
            // Load all sound effects
            try {
                await this.audio.loadSound('coin', 'assets/sounds/coin.wav');
                await this.audio.loadSound('crash', 'assets/sounds/crash.wav');
                await this.audio.loadSound('powerup', 'assets/sounds/powerup.wav');
                await this.audio.loadSound('menu_select', 'assets/sounds/menu_select.wav');
                await this.audio.loadSound('levelup', 'assets/sounds/levelup.wav');
                
                console.log('✓ Loaded all sound effects');
            } catch (err) {
                console.warn('Failed to load sounds, will use beep fallbacks:', err);
            }
            
            this.ui.updateLoadingProgress(80);
            
            // Load music
            try {
                await this.audio.loadMusic('engine', 'assets/sounds/engine.wav');
                console.log('✓ Loaded background music');
            } catch (err) {
                console.warn('Failed to load music:', err);
            }
            
            this.ui.updateLoadingProgress(100);
            
        } catch (err) {
            console.error('Error loading assets:', err);
            this.ui.updateLoadingProgress(100);
        }
        
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
        this.coinManager.setSprite(this.sprites.get('coin'));
        
        this.powerupManager = new PowerUpManager(this.engine, this.collision);
        this.powerupManager.setSprite(this.sprites.get('powerups'));
        
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
        this.input.left = this.input.left || this.controls.isAnyKeyPressed('ArrowLeft', 'a', 'A');
        this.input.right = this.input.right || this.controls.isAnyKeyPressed('ArrowRight', 'd', 'D');
        
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
        
        // Reset touch input (keyboard is handled by controls manager)
        if (!this.ui.elements.touchLeft || !this.ui.elements.touchRight) {
            this.input.left = false;
            this.input.right = false;
        }
        
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
