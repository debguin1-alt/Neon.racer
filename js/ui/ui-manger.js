// UI Manager
class UIManager {
    constructor(storage) {
        this.storage = storage;
        this.screens = {
            loading: document.getElementById('loading-screen'),
            menu: document.getElementById('menu-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            gameover: document.getElementById('gameover-screen'),
            settings: document.getElementById('settings-screen')
        };
        
        this.elements = {
            // Loading
            loadingProgress: document.getElementById('loading-progress'),
            
            // Menu
            menuHighscore: document.getElementById('menu-highscore'),
            menuCoins: document.getElementById('menu-coins'),
            
            // Game UI
            gameScore: document.getElementById('game-score'),
            gameLevel: document.getElementById('game-level'),
            gameCoins: document.getElementById('game-coins'),
            speedFill: document.getElementById('speed-fill'),
            
            // Game Over
            finalScore: document.getElementById('final-score'),
            finalLevel: document.getElementById('final-level'),
            finalCoins: document.getElementById('final-coins'),
            highscoreContainer: document.getElementById('highscore-container'),
            
            // Touch controls
            touchControls: document.getElementById('touch-controls'),
            touchLeft: document.getElementById('touch-left'),
            touchRight: document.getElementById('touch-right'),
            
            // Settings
            soundToggle: document.getElementById('sound-toggle'),
            musicToggle: document.getElementById('music-toggle'),
            particlesToggle: document.getElementById('particles-toggle')
        };
        
        this.currentScreen = 'loading';
        this.callbacks = {};
        
        this.setupEventListeners();
        this.loadSettings();
    }
    
    setupEventListeners() {
        // Menu buttons
        document.getElementById('btn-start')?.addEventListener('click', () => 
            this.trigger('startGame'));
        document.getElementById('btn-controls')?.addEventListener('click', () => 
            this.showScreen('controls'));
        document.getElementById('btn-settings')?.addEventListener('click', () => 
            this.showScreen('settings'));
        
        // Pause buttons
        document.getElementById('pause-btn')?.addEventListener('click', () => 
            this.trigger('pause'));
        document.getElementById('btn-resume')?.addEventListener('click', () => 
            this.trigger('resume'));
        document.getElementById('btn-restart')?.addEventListener('click', () => 
            this.trigger('restart'));
        document.getElementById('btn-menu')?.addEventListener('click', () => {
            this.showScreen('menu');
            this.trigger('mainMenu');
        });
        
        // Game Over buttons
        document.getElementById('btn-play-again')?.addEventListener('click', () => 
            this.trigger('playAgain'));
        document.getElementById('btn-menu-gameover')?.addEventListener('click', () => {
            this.showScreen('menu');
            this.trigger('mainMenu');
        });
        
        // Settings buttons
        document.getElementById('btn-settings-close')?.addEventListener('click', () => 
            this.showScreen('menu'));
        document.getElementById('btn-reset-data')?.addEventListener('click', () => 
            this.resetData());
        
        // Settings toggles
        this.elements.soundToggle?.addEventListener('change', (e) => {
            this.trigger('soundToggle', e.target.checked);
            this.saveSettings();
        });
        this.elements.musicToggle?.addEventListener('change', (e) => {
            this.trigger('musicToggle', e.target.checked);
            this.saveSettings();
        });
        this.elements.particlesToggle?.addEventListener('change', (e) => {
            this.trigger('particlesToggle', e.target.checked);
            this.saveSettings();
        });
        
        // Touch controls
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        if (!this.elements.touchLeft || !this.elements.touchRight) return;
        
        // Left button
        this.elements.touchLeft.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.trigger('touchLeft', true);
        });
        this.elements.touchLeft.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.trigger('touchLeft', false);
        });
        
        // Right button
        this.elements.touchRight.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.trigger('touchRight', true);
        });
        this.elements.touchRight.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.trigger('touchRight', false);
        });
    }
    
    showScreen(screenName) {
        // Hide all screens
        for (const name in this.screens) {
            this.screens[name]?.classList.add('hidden');
        }
        
        // Show requested screen
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.currentScreen = screenName;
        }
    }
    
    updateLoadingProgress(progress) {
        if (this.elements.loadingProgress) {
            this.elements.loadingProgress.style.width = progress + '%';
        }
    }
    
    updateMenuStats(gameData) {
        if (this.elements.menuHighscore) {
            this.elements.menuHighscore.textContent = gameData.highScore.toLocaleString();
        }
        if (this.elements.menuCoins) {
            this.elements.menuCoins.textContent = gameData.totalCoins.toLocaleString();
        }
    }
    
    updateGameUI(levelData) {
        if (this.elements.gameScore) {
            this.elements.gameScore.textContent = levelData.score.toLocaleString();
        }
        if (this.elements.gameLevel) {
            this.elements.gameLevel.textContent = levelData.level;
        }
        if (this.elements.gameCoins) {
            this.elements.gameCoins.textContent = levelData.coins;
        }
        if (this.elements.speedFill) {
            const speedPercent = Math.min(100, (levelData.speed / 10) * 100);
            this.elements.speedFill.style.width = speedPercent + '%';
        }
    }
    
    showGameOver(levelData, isNewHighScore) {
        if (this.elements.finalScore) {
            this.elements.finalScore.textContent = levelData.score.toLocaleString();
        }
        if (this.elements.finalLevel) {
            this.elements.finalLevel.textContent = levelData.level;
        }
        if (this.elements.finalCoins) {
            this.elements.finalCoins.textContent = levelData.coins;
        }
        if (this.elements.highscoreContainer) {
            this.elements.highscoreContainer.style.display = isNewHighScore ? 'flex' : 'none';
        }
        
        this.showScreen('gameover');
    }
    
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
    
    trigger(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
    
    loadSettings() {
        const settings = this.storage.loadSettings();
        
        if (this.elements.soundToggle) {
            this.elements.soundToggle.checked = settings.soundEnabled;
        }
        if (this.elements.musicToggle) {
            this.elements.musicToggle.checked = settings.musicEnabled;
        }
        if (this.elements.particlesToggle) {
            this.elements.particlesToggle.checked = settings.particlesEnabled;
        }
    }
    
    saveSettings() {
        const settings = {
            soundEnabled: this.elements.soundToggle?.checked ?? true,
            musicEnabled: this.elements.musicToggle?.checked ?? true,
            particlesEnabled: this.elements.particlesToggle?.checked ?? true
        };
        
        this.storage.saveSettings(settings);
    }
    
    resetData() {
        if (confirm('Are you sure you want to reset all game data? This cannot be undone.')) {
            this.storage.clear();
            location.reload();
        }
    }
}

// Export as global
window.UIManager = UIManager;
              
