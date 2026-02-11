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
    }
    
    update(deltaTime) {
        const dt = deltaTime / 16.67;
        
        // Update distance
        this.distance += this.getGameSpeed() * dt * 0.1;
        
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
    }
    
    addScore(points) {
        const multiplier = this.getScoreMultiplier();
        this.score += Math.floor(points * multiplier);
    }
    
    addCoin() {
        this.coinsCollected++;
        this.addScore(10); // Base coin value
    }
    
    getGameSpeed() {
        return this.baseGameSpeed + (this.currentLevel - 1) * this.speedIncreasePerLevel;
    }
    
    getDifficulty() {
        return this.difficulty;
    }
    
    getScoreMultiplier() {
        return 1.0; // Can be modified by powerups
    }
    
    getProgress() {
        const scoreInLevel = this.score % this.scorePerLevel;
        return scoreInLevel / this.scorePerLevel;
    }
    
    getLevel() {
        return this.currentLevel;
    }
    
    getScore() {
        return this.score;
    }
    
    getDistance() {
        return Math.floor(this.distance);
    }
    
    getCoins() {
        return this.coinsCollected;
    }
    
    reset() {
        this.currentLevel = 1;
        this.score = 0;
        this.distance = 0;
        this.coinsCollected = 0;
        this.difficulty = 1;
    }
    
    // Get level stats for display
    getLevelData() {
        return {
            level: this.currentLevel,
            score: this.score,
            distance: this.getDistance(),
            coins: this.coinsCollected,
            speed: this.getGameSpeed(),
            difficulty: this.difficulty,
            progress: this.getProgress()
        };
    }
}

// Export as global
window.LevelManager = LevelManager;
