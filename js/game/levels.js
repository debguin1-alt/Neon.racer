// Level System
class LevelManager {
    constructor() {
        this.currentLevel = 1;
        this.score = 0;
        this.distance = 0;
        this.coinsCollected = 0;
        
        // Level progression
        this.scorePerLevel = 500;
        this.maxLevel = 10;
        
        // Difficulty settings
        this.baseGameSpeed = 3;
        this.speedIncreasePerLevel = 0.5;
        this.difficulty = 1;
        
        // Score multiplier (modified by powerups)
        this.scoreMultiplier = 1.0;
        
        // Combo system
        this.combo = 0;
        this.comboTimer = 0;
        this.comboDuration = 3000; // ms to maintain combo
        this.lastCoinTime = 0;
        
        // Level up callback
        this.onLevelUp = null;
    }
    
    update(deltaTime) {
        const dt = deltaTime / 16.67;
        
        // Update distance
        this.distance += this.getGameSpeed() * dt * 0.1;
        
        // Update combo timer
        if (this.combo > 0) {
            this.comboTimer -= deltaTime;
            if (this.comboTimer <= 0) {
                this.combo = 0;
                this.comboTimer = 0;
            }
        }
        
        // Check for level up
        this.checkLevelUp();
    }
    
    checkLevelUp() {
        const targetLevel = Math.min(
            this.maxLevel,
            Math.floor(this.score / this.scorePerLevel) + 1
        );
        
        if (targetLevel > this.currentLevel) {
            this.levelUp(targetLevel);
        }
    }
    
    levelUp(newLevel) {
        this.currentLevel = newLevel;
        this.difficulty = newLevel;
        if (this.onLevelUp) this.onLevelUp(newLevel);
    }
    
    addScore(points) {
        this.score += Math.floor(points * this.scoreMultiplier);
    }
    
    addCoin() {
        this.coinsCollected++;
        
        // Combo: reset timer on each coin, increase combo count
        const now = performance.now();
        const timeSinceLast = now - this.lastCoinTime;
        this.lastCoinTime = now;
        
        if (timeSinceLast < this.comboDuration) {
            this.combo++;
            this.comboTimer = this.comboDuration;
        } else {
            this.combo = 1;
            this.comboTimer = this.comboDuration;
        }
        
        // Combo bonus: each coin after 3 in a row gives extra points
        const comboBonus = this.combo >= 3 ? Math.min(this.combo - 2, 5) : 0;
        const coinValue = 10 + comboBonus * 5;
        this.addScore(coinValue);
    }
    
    setScoreMultiplier(mult) {
        this.scoreMultiplier = mult;
    }
    
    getGameSpeed() {
        return this.baseGameSpeed + (this.currentLevel - 1) * this.speedIncreasePerLevel;
    }
    
    getDifficulty() {
        return this.difficulty;
    }
    
    getScoreMultiplier() {
        return this.scoreMultiplier;
    }
    
    getProgress() {
        const scoreInLevel = this.score % this.scorePerLevel;
        return scoreInLevel / this.scorePerLevel;
    }
    
    getLevel() { return this.currentLevel; }
    getScore() { return this.score; }
    getDistance() { return Math.floor(this.distance); }
    getCoins() { return this.coinsCollected; }
    getCombo() { return this.combo; }
    getComboTimeLeft() { return this.comboTimer; }
    
    reset() {
        this.currentLevel = 1;
        this.score = 0;
        this.distance = 0;
        this.coinsCollected = 0;
        this.difficulty = 1;
        this.scoreMultiplier = 1.0;
        this.combo = 0;
        this.comboTimer = 0;
        this.lastCoinTime = 0;
    }
    
    getLevelData() {
        return {
            level: this.currentLevel,
            score: this.score,
            distance: this.getDistance(),
            coins: this.coinsCollected,
            speed: this.getGameSpeed(),
            difficulty: this.difficulty,
            progress: this.getProgress(),
            combo: this.combo,
            comboTimeLeft: this.comboTimer,
            multiplier: this.scoreMultiplier
        };
    }
}

window.LevelManager = LevelManager;
