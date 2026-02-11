// Enemy Vehicle class
class Enemy {
    constructor(engine, lane, speed, type = 'car') {
        this.engine = engine;
        this.lane = lane;
        this.type = type;
        
        // Position
        const roadWidth = 500;
        const roadLeft = (engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        this.x = roadLeft + laneWidth * lane + laneWidth / 2 - 20;
        this.y = -80;
        
        // Size based on type
        this.width = type === 'truck' ? 45 : 40;
        this.height = type === 'truck' ? 80 : 60;
        
        // Movement
        this.baseSpeed = speed;
        this.speed = speed;
        
        // Visual
        this.colors = {
            car: ['#ff006e', '#8338ec', '#00f5ff', '#ffbe0b'],
            truck: ['#e63946', '#457b9d', '#2a9d8f']
        };
        this.color = this.colors[type][Math.floor(Math.random() * this.colors[type].length)];
        this.sprite = null;
        
        // State
        this.active = true;
    }
    
    setSprite(sprite) {
        this.sprite = sprite;
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        // Move down based on game speed
        this.speed = this.baseSpeed + gameSpeed;
        this.y += this.speed * dt;
        
        // Deactivate if off screen
        if (this.y > this.engine.height + 100) {
            this.active = false;
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        if (this.sprite) {
            // Draw sprite
            this.engine.drawSprite(this.sprite, this.x, this.y, this.width, this.height);
        } else {
            // Draw simple vehicle shape
            if (this.type === 'truck') {
                // Truck - larger, rectangular
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x, this.y, this.width, this.height);
                
                // Cab
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(this.x + 5, this.y + this.height - 25, this.width - 10, 20);
                
                // Lights
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x + 5, this.y, 8, 5);
                ctx.fillRect(this.x + this.width - 13, this.y, 8, 5);
            } else {
                // Regular car
                ctx.fillStyle = this.color;
                ctx.fillRect(this.x + 5, this.y, this.width - 10, this.height - 5);
                
                // Windshield
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(this.x + 10, this.y + this.height - 25, this.width - 20, 15);
                
                // Lights
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(this.x + 5, this.y, 10, 5);
                ctx.fillRect(this.x + this.width - 15, this.y, 10, 5);
            }
        }
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    isOffScreen() {
        return this.y > this.engine.height + 100;
    }
}

// Enemy Manager
class EnemyManager {
    constructor(engine, collisionSystem) {
        this.engine = engine;
        this.collisionSystem = collisionSystem;
        this.enemies = [];
        
        // Spawn settings
        this.spawnTimer = 0;
        this.spawnInterval = 1500; // ms
        this.minSpawnInterval = 600;
        this.baseSpeed = 3;
        this.truckChance = 0.2;
    }
    
    spawn(lane, speed, type = 'car') {
        const enemy = new Enemy(this.engine, lane, speed, type);
        this.enemies.push(enemy);
        return enemy;
    }
    
    update(deltaTime, gameSpeed, difficulty) {
        // Update spawn interval based on difficulty
        this.spawnInterval = Math.max(
            this.minSpawnInterval,
            1500 - difficulty * 100
        );
        
        // Spawn enemies
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnEnemy(gameSpeed, difficulty);
        }
        
        // Update all enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, gameSpeed);
            
            // Remove inactive enemies
            if (!enemy.active) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    spawnEnemy(gameSpeed, difficulty) {
        // Random lane
        const lane = Math.floor(Math.random() * 5);
        
        // Check if lane is safe (no recent spawns)
        const safeToSpawn = !this.enemies.some(e => 
            e.lane === lane && e.y < 100
        );
        
        if (!safeToSpawn) return;
        
        // Determine type
        const type = Math.random() < this.truckChance ? 'truck' : 'car';
        
        // Base speed with some variation
        const speed = this.baseSpeed + Math.random() * 2 + difficulty * 0.3;
        
        this.spawn(lane, speed, type);
    }
    
    render() {
        for (const enemy of this.enemies) {
            enemy.render();
        }
    }
    
    checkCollision(player) {
        if (player.invincible) return null;
        
        const playerBounds = player.getBounds();
        
        for (const enemy of this.enemies) {
            const enemyBounds = enemy.getBounds();
            
            if (this.collisionSystem.checkAABB(playerBounds, enemyBounds)) {
                return enemy;
            }
        }
        
        return null;
    }
    
    clear() {
        this.enemies = [];
        this.spawnTimer = 0;
    }
    
    getCount() {
        return this.enemies.length;
    }
}

// Export as global
window.Enemy = Enemy;
window.EnemyManager = EnemyManager;
