// Coin class
class Coin {
    constructor(engine, lane, y = -50) {
        this.engine = engine;
        this.lane = lane;
        
        // Position
        const roadWidth = 500;
        const roadLeft = (engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        this.x = roadLeft + laneWidth * lane + laneWidth / 2;
        this.y = y;
        
        // Size
        this.radius = 12;
        this.width = this.radius * 2;
        this.height = this.radius * 2;
        
        // Visual
        this.color = '#ffbe0b';
        this.glowColor = 'rgba(255, 190, 11, 0.5)';
        this.rotation = 0;
        this.rotationSpeed = 0.1;
        
        // State
        this.active = true;
        this.collected = false;
        
        // Animation
        this.pulsePhase = Math.random() * Math.PI * 2;
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        // Move down
        this.y += gameSpeed * dt;
        
        // Update animation
        this.rotation += this.rotationSpeed * dt;
        this.pulsePhase += 0.05 * dt;
        
        // Deactivate if off screen
        if (this.y > this.engine.height + 50) {
            this.active = false;
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        // Pulse effect
        const scale = 1 + Math.sin(this.pulsePhase) * 0.1;
        const radius = this.radius * scale;
        
        // Glow effect
        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15;
        
        // Draw coin
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner circle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
    
    collect() {
        this.collected = true;
        this.active = false;
    }
}

// Coin Manager
class CoinManager {
    constructor(engine, collisionSystem) {
        this.engine = engine;
        this.collisionSystem = collisionSystem;
        this.coins = [];
        
        // Spawn settings
        this.spawnTimer = 0;
        this.spawnInterval = 2000; // ms
        this.groupChance = 0.3; // Chance to spawn a group
    }
    
    spawn(lane, y = -50) {
        const coin = new Coin(this.engine, lane, y);
        this.coins.push(coin);
        return coin;
    }
    
    spawnGroup(startLane, count = 3) {
        // Spawn coins in a line or pattern
        for (let i = 0; i < count; i++) {
            const lane = Math.min(4, startLane + i);
            const y = -50 - i * 50; // Diagonal pattern
            this.spawn(lane, y);
        }
    }
    
    update(deltaTime, gameSpeed) {
        // Spawn coins
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnCoin();
        }
        
        // Update all coins
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            coin.update(deltaTime, gameSpeed);
            
            // Remove inactive coins
            if (!coin.active) {
                this.coins.splice(i, 1);
            }
        }
    }
    
    spawnCoin() {
        if (Math.random() < this.groupChance) {
            // Spawn a group
            const startLane = Math.floor(Math.random() * 3); // 0-2 to fit 3 coins
            const count = Math.floor(Math.random() * 2) + 3; // 3-4 coins
            this.spawnGroup(startLane, count);
        } else {
            // Spawn single coin
            const lane = Math.floor(Math.random() * 5);
            this.spawn(lane);
        }
    }
    
    render() {
        for (const coin of this.coins) {
            coin.render();
        }
    }
    
    checkCollisions(player) {
        const collected = [];
        const playerBounds = player.getBounds();
        
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            const coinBounds = coin.getBounds();
            
            if (this.collisionSystem.checkAABB(playerBounds, coinBounds)) {
                coin.collect();
                collected.push(coin);
                this.coins.splice(i, 1);
            }
        }
        
        return collected;
    }
    
    clear() {
        this.coins = [];
        this.spawnTimer = 0;
    }
    
    getCount() {
        return this.coins.length;
    }
}

// Export as global
window.Coin = Coin;
window.CoinManager = CoinManager;
