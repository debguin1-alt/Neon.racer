// Storage System (LocalStorage)
class StorageManager {
    constructor(prefix = 'neonracer_') {
        this.prefix = prefix;
        this.cache = new Map();
        this.loadAll();
    }
    
    getKey(key) {
        return this.prefix + key;
    }
    
    save(key, value) {
        try {
            const fullKey = this.getKey(key);
            const jsonValue = JSON.stringify(value);
            localStorage.setItem(fullKey, jsonValue);
            this.cache.set(key, value);
            return true;
        } catch (error) {
            console.error('Failed to save to localStorage:', error);
            return false;
        }
    }
    
    load(key, defaultValue = null) {
        // Check cache first
        if (this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        try {
            const fullKey = this.getKey(key);
            const jsonValue = localStorage.getItem(fullKey);
            
            if (jsonValue === null) {
                return defaultValue;
            }
            
            const value = JSON.parse(jsonValue);
            this.cache.set(key, value);
            return value;
        } catch (error) {
            console.error('Failed to load from localStorage:', error);
            return defaultValue;
        }
    }
    
    remove(key) {
        try {
            const fullKey = this.getKey(key);
            localStorage.removeItem(fullKey);
            this.cache.delete(key);
            return true;
        } catch (error) {
            console.error('Failed to remove from localStorage:', error);
            return false;
        }
    }
    
    clear() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(this.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            this.cache.clear();
            return true;
        } catch (error) {
            console.error('Failed to clear localStorage:', error);
            return false;
        }
    }
    
    loadAll() {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(fullKey => {
                if (fullKey.startsWith(this.prefix)) {
                    const key = fullKey.substring(this.prefix.length);
                    const jsonValue = localStorage.getItem(fullKey);
                    if (jsonValue) {
                        const value = JSON.parse(jsonValue);
                        this.cache.set(key, value);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load all from localStorage:', error);
        }
    }
    
    has(key) {
        return this.cache.has(key) || localStorage.getItem(this.getKey(key)) !== null;
    }
    
    // Game-specific helpers
    saveGameData(data) {
        return this.save('gameData', data);
    }
    
    loadGameData() {
        return this.load('gameData', {
            highScore: 0,
            totalCoins: 0,
            gamesPlayed: 0,
            totalDistance: 0,
            achievements: []
        });
    }
    
    saveSettings(settings) {
        return this.save('settings', settings);
    }
    
    loadSettings() {
        return this.load('settings', {
            soundEnabled: true,
            musicEnabled: true,
            particlesEnabled: true,
            difficulty: 'normal'
        });
    }
    
    updateHighScore(score) {
        const gameData = this.loadGameData();
        if (score > gameData.highScore) {
            gameData.highScore = score;
            this.saveGameData(gameData);
            return true; // New high score!
        }
        return false;
    }
    
    addCoins(amount) {
        const gameData = this.loadGameData();
        gameData.totalCoins += amount;
        this.saveGameData(gameData);
    }
    
    incrementGamesPlayed() {
        const gameData = this.loadGameData();
        gameData.gamesPlayed++;
        this.saveGameData(gameData);
    }
    
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}

// Export as global
window.StorageManager = StorageManager;
