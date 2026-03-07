// Main Game Class
class Game {
    constructor() {
        this.state = 'loading';
        
        this.engine = new GameEngine();
        this.loop = new GameLoop();
        this.collision = new CollisionSystem();
        this.sprites = new SpriteManager();
        this.audio = new AudioManager();
        this.controls = new ControlsManager();
        this.storage = new StorageManager();
        this.ui = new UIManager(this.storage);
        
        this.road = null;
        this.background = null;
        this.player = null;
        this.enemyManager = null;
        this.coinManager = null;
        this.powerupManager = null;
        this.levelManager = null;
        this.particles = null;
        
        this.input = { left: false, right: false };
        
        // Level-up flash overlay
        this.levelUpFlash = { active: false, timer: 0, duration: 1200, level: 1 };
        
        this.setupUICallbacks();
        this.setupKeyboardShortcuts();
    }
    
    async init() {
        console.log('Initializing Neon Racer...');
        
        if (!this.engine.init('game-canvas')) {
            console.error('Failed to initialize engine');
            return false;
        }
        
        await this.loadAssets();
        this.initSystems();
        
        this.loop.setCallbacks(
            (dt) => this.update(dt),
            (interp) => this.render(interp),
            (dt) => this.fixedUpdate(dt)
        );
        
        this.loadGameData();
        this.showMainMenu();
        
        console.log('Game initialized successfully');
        return true;
    }
    
    async loadAssets() {
        console.log('Loading assets...');
        
        this.ui.updateLoadingProgress(10);
        
        const tryLoadSprite = async (name, src, options = {}) => {
            try {
                await this.sprites.load(name, src, options);
            } catch (e) {
                console.warn(`Sprite '${name}' missing, using fallback`);
            }
        };
        
        await tryLoadSprite('vehicles', 'assets/sprites/vehicles.png', { frameWidth: 40, frameHeight: 60, frames: 6 });
        await tryLoadSprite('trucks',   'assets/sprites/trucks.png',   { frameWidth: 45, frameHeight: 80, frames: 3 });
        await tryLoadSprite('coin',     'assets/sprites/coin.png',     { frameWidth: 32, frameHeight: 32, frames: 8 });
        await tryLoadSprite('powerups', 'assets/sprites/powerups.png', { frameWidth: 40, frameHeight: 40, frames: 3 });
        await tryLoadSprite('road',     'assets/sprites/road.png');
        await tryLoadSprite('particle', 'assets/sprites/particle.png');
        
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
        
        const tryLoadSound = async (name, src) => {
            try { await this.audio.loadSound(name, src); } catch (e) {}
        };
        const tryLoadMusic = async (name, src) => {
            try { await this.audio.loadMusic(name, src); } catch (e) {}
        };
        
        await tryLoadSound('coin',        'assets/sounds/coin.wav');
        await tryLoadSound('crash',       'assets/sounds/crash.wav');
        await tryLoadSound('powerup',     'assets/sounds/powerup.wav');
        await tryLoadSound('menu_select', 'assets/sounds/menu_select.wav');
        await tryLoadSound('levelup',     'assets/sounds/levelup.wav');
        
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
        
        // Hook level-up event
        this.levelManager.onLevelUp = (newLevel) => {
            this.levelUpFlash.active = true;
            this.levelUpFlash.timer = this.levelUpFlash.duration;
            this.levelUpFlash.level = newLevel;
            this.audio.playSound('levelup');
        };
        
        const centerX = this.engine.width / 2 - 20;
        const playerY = this.engine.height - 120;
        
        this.player = new Player(this.engine, centerX, playerY);
        this.player.setSprite(this.sprites.get('vehicles'));
        
        this.enemyManager = new EnemyManager(this.engine, this.collision);
        this.enemyManager.setSprites(this.sprites);
        
        this.coinManager = new CoinManager(this.engine, this.collision);
        this.powerupManager = new PowerUpManager(this.engine, this.collision);
        
        const settings = this.storage.loadSettings();
        this.audio.setSoundEnabled(settings.soundEnabled);
        this.audio.setMusicEnabled(settings.musicEnabled);
        this.particles.setEnabled(settings.particlesEnabled);
    }
    
    setupUICallbacks() {
        this.ui.on('startGame',  () => this.startGame());
        this.ui.on('pause',      () => this.pauseGame());
        this.ui.on('resume',     () => this.resumeGame());
        this.ui.on('restart',    () => this.restartGame());
        this.ui.on('playAgain',  () => this.restartGame());
        this.ui.on('mainMenu',   () => this.showMainMenu());
        
        this.ui.on('soundToggle',     (e) => this.audio.setSoundEnabled(e));
        this.ui.on('musicToggle',     (e) => this.audio.setMusicEnabled(e));
        this.ui.on('particlesToggle', (e) => this.particles.setEnabled(e));
        
        this.ui.on('touchLeft',  (p) => { this.input.left  = p; });
        this.ui.on('touchRight', (p) => { this.input.right = p; });
    }
    
    setupKeyboardShortcuts() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === 'playing') this.pauseGame();
                else if (this.state === 'paused') this.resumeGame();
            }
            if (e.key === 'Enter' || e.key === ' ') {
                if (this.state === 'menu') this.startGame();
            }
        });
    }
    
    startGame() {
        try {
            this.state = 'playing';
            this.resetGame();
            this.ui.showScreen('game');
            this.loop.start();
            this.audio.playSound('menu_select');
            this.audio.playMusic('engine');
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
    
    restartGame() { this.startGame(); }
    
    showMainMenu() {
        this.state = 'menu';
        this.loop.stop();
        this.ui.showScreen('menu');
        this.loadGameData();
    }
    
    endGame() {
        this.state = 'gameover';
        this.loop.stop();
        this.audio.stopMusic();
        
        const levelData = this.levelManager.getLevelData();
        const isNewHighScore = this.storage.updateHighScore(levelData.score);
        this.storage.addCoins(levelData.coins);
        this.storage.incrementGamesPlayed();
        
        this.ui.showGameOver(levelData, isNewHighScore);
    }
    
    resetGame() {
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
        
        this.levelUpFlash.active = false;
        this.input.left = false;
        this.input.right = false;
    }
    
    update(deltaTime) {
        if (this.state !== 'playing') return;
        
        this.engine.updateFPS(performance.now());
        
        // Keyboard input (persistent while key held)
        const keyLeft  = this.controls.isAnyKeyPressed('ArrowLeft',  'a', 'A');
        const keyRight = this.controls.isAnyKeyPressed('ArrowRight', 'd', 'D');
        this.input.left  = this.input.left  || keyLeft;
        this.input.right = this.input.right || keyRight;
        
        const gameSpeed  = this.levelManager.getGameSpeed();
        const difficulty = this.levelManager.getDifficulty();
        
        // Apply multiplier from powerup
        const mult = this.powerupManager.isActive('multiplier') ? 2.0 : 1.0;
        this.levelManager.setScoreMultiplier(mult);
        
        this.levelManager.update(deltaTime);
        this.background.update(deltaTime, gameSpeed);
        this.road.update(deltaTime, gameSpeed);
        this.player.update(deltaTime, this.input);
        this.enemyManager.update(deltaTime, gameSpeed, difficulty);
        this.coinManager.update(deltaTime, gameSpeed);
        this.powerupManager.update(deltaTime, gameSpeed);
        this.particles.update(deltaTime);
        
        // Magnet: pull coins to player
        this.powerupManager.applyMagnet(this.coinManager, this.player);
        
        // Reset input for next frame
        this.input.left  = false;
        this.input.right = false;
        
        this.checkCollisions();
        
        // Distance score
        this.levelManager.addScore(Math.floor(gameSpeed * 0.1));
        
        // Update UI
        this.ui.updateGameUI(this.levelManager.getLevelData());
        
        // Particle trail
        if (Math.random() < 0.3) {
            this.particles.createTrail(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height
            );
        }
        
        // Level-up flash timer
        if (this.levelUpFlash.active) {
            this.levelUpFlash.timer -= deltaTime;
            if (this.levelUpFlash.timer <= 0) this.levelUpFlash.active = false;
        }
    }
    
    fixedUpdate(deltaTime) {}
    
    checkCollisions() {
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
        
        const collectedCoins = this.coinManager.checkCollisions(this.player);
        for (const coin of collectedCoins) {
            this.levelManager.addCoin();
            this.particles.createCoinEffect(coin.x, coin.y);
            this.audio.playSound('coin');
        }
        
        const collectedPowerups = this.powerupManager.checkCollisions(this.player);
        for (const powerup of collectedPowerups) {
            if (powerup.type === 'shield') {
                this.player.setInvincible(5000);
            }
            this.particles.createExplosion(powerup.x, powerup.y, 15, { color: powerup.color });
            this.audio.playSound('powerup');
        }
    }
    
    render(interpolation) {
        this.engine.clear();
        
        if (this.state === 'playing' || this.state === 'paused') {
            this.background.render();
            this.road.render();
            this.coinManager.render();
            this.powerupManager.render();
            this.enemyManager.render();
            
            // Shield ring around player
            this.powerupManager.renderShieldEffect(this.engine.ctx, this.player);
            
            this.player.render();
            this.particles.render();
            
            // Active powerup HUD bars
            this._renderPowerupHUD();
            
            // Combo display
            this._renderCombo();
            
            // Level-up flash
            if (this.levelUpFlash.active) {
                this._renderLevelUpFlash();
            }
        }
    }
    
    _renderPowerupHUD() {
        const ctx = this.engine.ctx;
        const types = ['shield', 'magnet', 'multiplier'];
        const colors = { shield: '#8338ec', magnet: '#ff006e', multiplier: '#00f5ff' };
        const labels = { shield: '🛡 SHIELD', magnet: '🧲 MAGNET', multiplier: '2× SCORE' };
        
        let yOff = 80;
        const barW = 120;
        const barH = 8;
        const x = this.engine.width - barW - 16;
        
        for (const type of types) {
            if (!this.powerupManager.isActive(type)) continue;
            
            const remaining = this.powerupManager.getTimeRemaining(type);
            const max = this.powerupManager.getMaxDuration(type);
            const progress = remaining / max;
            const col = colors[type];
            
            // Background
            ctx.fillStyle = 'rgba(10,14,39,0.8)';
            ctx.beginPath();
            ctx.roundRect(x - 8, yOff - 10, barW + 16, 32, 6);
            ctx.fill();
            
            // Label
            ctx.fillStyle = col;
            ctx.font = '10px Orbitron, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(labels[type], x, yOff - 8);
            
            // Bar bg
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(x, yOff + 4, barW, barH);
            
            // Bar fill
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = 6;
            ctx.fillRect(x, yOff + 4, barW * progress, barH);
            ctx.shadowBlur = 0;
            
            yOff += 42;
        }
    }
    
    _renderCombo() {
        const combo = this.levelManager.getCombo();
        if (combo < 3) return;
        
        const ctx = this.engine.ctx;
        const pulse = 1 + 0.1 * Math.sin(Date.now() / 100);
        const alpha = Math.min(1, this.levelManager.getComboTimeLeft() / 500);
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `bold ${Math.floor(28 * pulse)}px Orbitron, monospace`;
        ctx.fillStyle = '#ffbe0b';
        ctx.shadowColor = '#ffbe0b';
        ctx.shadowBlur = 20;
        ctx.fillText(`${combo}× COMBO!`, this.engine.width / 2, 60);
        ctx.restore();
    }
    
    _renderLevelUpFlash() {
        const ctx = this.engine.ctx;
        const progress = this.levelUpFlash.timer / this.levelUpFlash.duration;
        const alpha = progress < 0.2 ? progress / 0.2 : progress > 0.7 ? (progress - 0.7) / 0.3 : 1;
        
        // Flash overlay
        ctx.save();
        ctx.globalAlpha = alpha * 0.35;
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(0, 0, this.engine.width, this.engine.height);
        ctx.globalAlpha = alpha;
        
        // Level-up text
        const scale = 1 + (1 - progress) * 0.5;
        ctx.translate(this.engine.width / 2, this.engine.height / 2);
        ctx.scale(scale, scale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 40;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Orbitron, monospace';
        ctx.fillText(`LEVEL ${this.levelUpFlash.level}`, 0, 0);
        ctx.font = 'bold 22px Orbitron, monospace';
        ctx.fillStyle = '#00f5ff';
        ctx.fillText('SPEED UP!', 0, 46);
        ctx.restore();
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
        
        window.game = game;
        
    } catch (err) {
        console.error('Fatal error initializing game:', err);
        alert('Error loading game: ' + err.message + '\nPlease check console for details.');
    }
});

window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});
