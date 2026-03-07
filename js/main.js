// Safe roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        r = Math.min(r, w / 2, h / 2);
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.arcTo(x + w, y, x + w, y + r, r);
        this.lineTo(x + w, y + h - r);
        this.arcTo(x + w, y + h, x + w - r, y + h, r);
        this.lineTo(x + r, y + h);
        this.arcTo(x, y + h, x, y + h - r, r);
        this.lineTo(x, y + r);
        this.arcTo(x, y, x + r, y, r);
        this.closePath();
        return this;
    };
}

// Main Game Class
class Game {
    constructor() {
        this.state = 'loading';

        this.engine    = new GameEngine();
        this.loop      = new GameLoop();
        this.collision = new CollisionSystem();
        this.sprites   = new SpriteManager();
        this.audio     = new AudioManager();
        this.controls  = new ControlsManager();
        this.storage   = new StorageManager();
        this.ui        = new UIManager(this.storage);

        this.road         = null;
        this.background   = null;
        this.player       = null;
        this.enemyManager = null;
        this.coinManager  = null;
        this.powerupManager = null;
        this.levelManager = null;
        this.particles    = null;

        this.input = { left: false, right: false };

        // Level-up flash
        this.levelUpFlash = { active: false, timer: 0, duration: 1500, level: 1 };

        // Near-miss popup
        this.nearMissPopup = { active: false, timer: 0, duration: 900 };

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
        this.ui.updateLoadingProgress(10);

        const trySprite = async (name, src, opts = {}) => {
            try { await this.sprites.load(name, src, opts); } catch (e) {}
        };

        await trySprite('vehicles', 'assets/sprites/vehicles.png', { frameWidth: 40, frameHeight: 60, frames: 6 });
        await trySprite('trucks',   'assets/sprites/trucks.png',   { frameWidth: 45, frameHeight: 80, frames: 3 });
        await trySprite('coin',     'assets/sprites/coin.png',     { frameWidth: 32, frameHeight: 32, frames: 8 });
        await trySprite('powerups', 'assets/sprites/powerups.png', { frameWidth: 40, frameHeight: 40, frames: 3 });
        await trySprite('road',     'assets/sprites/road.png');
        await trySprite('particle', 'assets/sprites/particle.png');

        if (!this.sprites.has('vehicles')) this.sprites.generateGradientSprite('vehicles', 40, 60, '#00f5ff', '#0088aa');
        if (!this.sprites.has('trucks'))   this.sprites.generateGradientSprite('trucks',   45, 80, '#8338ec', '#5500aa');
        if (!this.sprites.has('coin'))     this.sprites.generateGradientSprite('coin',     24, 24, '#ffbe0b', '#ff9500');
        if (!this.sprites.has('powerups')) this.sprites.generateGradientSprite('powerups', 40, 40, '#ff006e', '#8338ec');
        if (!this.sprites.has('particle')) this.sprites.generateColorSprite('particle',     4,  4, '#ffffff');

        this.ui.updateLoadingProgress(50);

        const trySound = async (n, s) => { try { await this.audio.loadSound(n, s); } catch(e){} };
        const tryMusic = async (n, s) => { try { await this.audio.loadMusic(n, s); } catch(e){} };

        await trySound('coin',        'assets/sounds/coin.wav');
        await trySound('crash',       'assets/sounds/crash.wav');
        await trySound('powerup',     'assets/sounds/powerup.wav');
        await trySound('menu_select', 'assets/sounds/menu_select.wav');
        await trySound('levelup',     'assets/sounds/levelup.wav');

        this.ui.updateLoadingProgress(80);
        await tryMusic('engine', 'assets/sounds/engine.wav');
        this.ui.updateLoadingProgress(100);
        await new Promise(r => setTimeout(r, 500));
    }

    initSystems() {
        this.road       = new Road(this.engine);
        this.background = new Background(this.engine);
        this.particles  = new ParticleSystem(this.engine);
        this.levelManager = new LevelManager();

        this.levelManager.onLevelUp = (newLevel) => {
            this.levelUpFlash.active = true;
            this.levelUpFlash.timer  = this.levelUpFlash.duration;
            this.levelUpFlash.level  = newLevel;
            this.audio.playSound('levelup');
        };

        const centerX = this.engine.width / 2 - 20;
        const playerY = this.engine.height - 120;

        this.player = new Player(this.engine, centerX, playerY);
        this.player.setSprite(this.sprites.get('vehicles'));

        this.enemyManager   = new EnemyManager(this.engine, this.collision);
        this.enemyManager.setSprites(this.sprites);

        this.coinManager    = new CoinManager(this.engine, this.collision);
        this.powerupManager = new PowerUpManager(this.engine, this.collision);

        const s = this.storage.loadSettings();
        this.audio.setSoundEnabled(s.soundEnabled);
        this.audio.setMusicEnabled(s.musicEnabled);
        this.particles.setEnabled(s.particlesEnabled);
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
            if ((e.key === 'Enter' || e.key === ' ') && this.state === 'menu') {
                this.startGame();
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
        const isNewHS   = this.storage.updateHighScore(levelData.score);
        this.storage.addCoins(levelData.coins);
        this.storage.incrementGamesPlayed();

        this.ui.showGameOver(levelData, isNewHS);
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

        this.levelUpFlash.active  = false;
        this.nearMissPopup.active = false;
        this.input.left = false;
        this.input.right = false;
    }

    update(deltaTime) {
        if (this.state !== 'playing') return;

        this.engine.updateFPS(performance.now());

        // Keyboard input
        const kL = this.controls.isAnyKeyPressed('ArrowLeft',  'a', 'A');
        const kR = this.controls.isAnyKeyPressed('ArrowRight', 'd', 'D');
        this.input.left  = this.input.left  || kL;
        this.input.right = this.input.right || kR;

        const gameSpeed  = this.levelManager.getGameSpeed();
        const difficulty = this.levelManager.getDifficulty();

        // Multiplier powerup
        this.levelManager.setScoreMultiplier(
            this.powerupManager.isActive('multiplier') ? 2.0 : 1.0
        );

        this.levelManager.update(deltaTime);
        this.background.update(deltaTime, gameSpeed);
        this.road.update(deltaTime, gameSpeed);
        this.player.update(deltaTime, this.input);
        this.enemyManager.update(deltaTime, gameSpeed, difficulty);
        this.coinManager.update(deltaTime, gameSpeed);
        this.powerupManager.update(deltaTime, gameSpeed);
        this.particles.update(deltaTime);

        // Magnet
        this.powerupManager.applyMagnet(this.coinManager, this.player);

        // Reset input
        this.input.left  = false;
        this.input.right = false;

        this.checkCollisions();

        // Distance score
        this.levelManager.addScore(Math.floor(gameSpeed * 0.1));

        this.ui.updateGameUI(this.levelManager.getLevelData());

        // Trail particles
        if (Math.random() < 0.3) {
            this.particles.createTrail(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height
            );
        }

        // Timers
        if (this.levelUpFlash.active) {
            this.levelUpFlash.timer -= deltaTime;
            if (this.levelUpFlash.timer <= 0) this.levelUpFlash.active = false;
        }
        if (this.nearMissPopup.active) {
            this.nearMissPopup.timer -= deltaTime;
            if (this.nearMissPopup.timer <= 0) this.nearMissPopup.active = false;
        }
    }

    fixedUpdate(deltaTime) {}

    checkCollisions() {
        // Enemy collision
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

        // Near misses
        const nearMisses = this.enemyManager.checkNearMisses(this.player);
        for (const nm of nearMisses) {
            const bonus = 25;
            this.levelManager.addScore(bonus);
            this.nearMissPopup.active = true;
            this.nearMissPopup.timer  = this.nearMissPopup.duration;
            // Spark effect
            this.particles.createExplosion(
                nm.x + nm.width / 2,
                nm.y + nm.height / 2,
                8,
                { color: '#ffbe0b', speed: 4, size: 3, life: 0.5 }
            );
        }

        // Coins
        const collectedCoins = this.coinManager.checkCollisions(this.player);
        for (const coin of collectedCoins) {
            this.levelManager.addCoin();
            this.particles.createCoinEffect(coin.x, coin.y);
            this.audio.playSound('coin');
        }

        // Powerups
        const collectedPowerups = this.powerupManager.checkCollisions(this.player);
        for (const powerup of collectedPowerups) {
            if (powerup.type === 'shield') this.player.setInvincible(5000);
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

            this.powerupManager.renderShieldEffect(this.engine.ctx, this.player);
            this.player.render();
            this.particles.render();

            this._renderPowerupHUD();
            this._renderCombo();
            if (this.nearMissPopup.active)  this._renderNearMiss();
            if (this.levelUpFlash.active)   this._renderLevelUpFlash();
        }
    }

    _renderPowerupHUD() {
        const ctx = this.engine.ctx;
        const types  = ['shield', 'magnet', 'multiplier'];
        const colors = { shield: '#8338ec', magnet: '#ff006e', multiplier: '#00f5ff' };
        const labels = { shield: 'SHIELD',  magnet: 'MAGNET',  multiplier: '2× SCORE' };
        const icons  = { shield: '🛡',      magnet: '🧲',      multiplier: '2×' };

        let yOff = 80;
        const barW = 130, barH = 8;
        const x = this.engine.width - barW - 20;

        for (const type of types) {
            if (!this.powerupManager.isActive(type)) continue;

            const progress = this.powerupManager.getTimeRemaining(type) / this.powerupManager.getMaxDuration(type);
            const col = colors[type];

            // Card bg
            ctx.fillStyle = 'rgba(5,8,20,0.85)';
            ctx.beginPath();
            ctx.roundRect(x - 10, yOff - 12, barW + 20, 36, 7);
            ctx.fill();
            ctx.strokeStyle = col;
            ctx.lineWidth = 1;
            ctx.stroke();

            // Label
            ctx.fillStyle = col;
            ctx.font = 'bold 11px Orbitron, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(icons[type] + ' ' + labels[type], x, yOff + 1);

            // Bar track
            ctx.fillStyle = 'rgba(255,255,255,0.08)';
            ctx.fillRect(x, yOff + 13, barW, barH);

            // Bar fill with glow
            ctx.fillStyle = col;
            ctx.shadowColor = col;
            ctx.shadowBlur = 8;
            ctx.fillRect(x, yOff + 13, barW * progress, barH);
            ctx.shadowBlur = 0;

            yOff += 46;
        }
    }

    _renderCombo() {
        const combo = this.levelManager.getCombo();
        if (combo < 3) return;

        const ctx = this.engine.ctx;
        // Fade out in last 600ms of combo window
        const timeLeft = this.levelManager.getComboTimeLeft();
        const alpha = timeLeft < 600 ? timeLeft / 600 : 1;
        const pulse = 1 + 0.08 * Math.sin(Date.now() / 90);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ffbe0b';
        ctx.shadowBlur = 25;
        ctx.fillStyle = '#ffbe0b';
        ctx.font = `bold ${Math.floor(30 * pulse)}px Orbitron, monospace`;
        ctx.fillText(`${combo}× COMBO!`, this.engine.width / 2, 58);
        ctx.restore();
    }

    _renderNearMiss() {
        const ctx = this.engine.ctx;
        const prog  = this.nearMissPopup.timer / this.nearMissPopup.duration;
        const alpha = prog < 0.2 ? prog / 0.2 : prog;
        const scale = 1 + (1 - prog) * 0.3;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.engine.width / 2, this.engine.height / 2 - 60);
        ctx.scale(scale, scale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff006e';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff006e';
        ctx.font = 'bold 26px Orbitron, monospace';
        ctx.fillText('NEAR MISS! +25', 0, 0);
        ctx.restore();
    }

    _renderLevelUpFlash() {
        const ctx = this.engine.ctx;
        const progress = this.levelUpFlash.timer / this.levelUpFlash.duration;
        // Fade in fast, hold, fade out
        const alpha = progress > 0.8 ? (1 - progress) / 0.2 : progress < 0.15 ? progress / 0.15 : 1;

        ctx.save();
        ctx.globalAlpha = alpha * 0.3;
        ctx.fillStyle = '#00f5ff';
        ctx.fillRect(0, 0, this.engine.width, this.engine.height);

        ctx.globalAlpha = alpha;
        const scale = 0.8 + progress * 0.2;
        ctx.translate(this.engine.width / 2, this.engine.height / 2);
        ctx.scale(scale, scale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#00f5ff';
        ctx.shadowBlur = 50;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 52px Orbitron, monospace';
        ctx.fillText(`LEVEL ${this.levelUpFlash.level}`, 0, -10);
        ctx.font = 'bold 20px Orbitron, monospace';
        ctx.fillStyle = '#00f5ff';
        ctx.shadowBlur = 20;
        ctx.fillText('SPEED UP!', 0, 44);
        ctx.restore();
    }

    loadGameData() {
        const gameData = this.storage.loadGameData();
        this.ui.updateMenuStats(gameData);
    }
}

// Initialize
window.addEventListener('load', async () => {
    try {
        const game = new Game();
        const ok = await game.init();
        if (!ok) { alert('Failed to load game. Please refresh.'); return; }
        window.game = game;
    } catch (err) {
        console.error('Fatal error initializing game:', err);
        alert('Error loading game: ' + err.message);
    }
});

window.addEventListener('error',              (e) => console.error('Unhandled error:', e.error));
window.addEventListener('unhandledrejection', (e) => console.error('Unhandled rejection:', e.reason));
