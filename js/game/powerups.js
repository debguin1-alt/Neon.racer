// PowerUp class
class PowerUp {
    constructor(engine, lane, type, y = -50) {
        this.engine = engine;
        this.lane = lane;
        this.type = type; // 'shield', 'magnet', 'multiplier'
        
        // Position
        const roadWidth = 500;
        const roadLeft = (engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        this.x = roadLeft + laneWidth * lane + laneWidth / 2;
        this.y = y;
        
        // Size
        this.size = 30;
        this.width = this.size;
        this.height = this.size;
        
        // Visual
        this.colors = {
            shield: '#8338ec',
            magnet: '#ff006e',
            multiplier: '#00f5ff'
        };
        this.color = this.colors[type];
        this.rotation = 0;
        this.rotationSpeed = 0.05;
        
        // State
        this.active = true;
        this.collected = false;
        
        // Animation
        this.bobPhase = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.08;
        this.bobAmount = 5;
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        // Move down
        this.y += gameSpeed * dt;
        
        // Update animation
        this.rotation += this.rotationSpeed * dt;
        this.bobPhase += this.bobSpeed * dt;
        
        // Deactivate if off screen
        if (this.y > this.engine.height + 50) {
            this.active = false;
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        // Bob effect
        const bobOffset = Math.sin(this.bobPhase) * this.bobAmount;
        const renderY = this.y + bobOffset;
        
        // Glow effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        
        ctx.save();
        ctx.translate(this.x, renderY);
        ctx.rotate(this.rotation);
        
        // Draw powerup based on type
        if (this.type === 'shield') {
            this.drawShield(ctx);
        } else if (this.type === 'magnet') {
            this.drawMagnet(ctx);
        } else if (this.type === 'multiplier') {
            this.drawMultiplier(ctx);
        }
        
        ctx.restore();
        
        // Reset shadow
        ctx.shadowBlur = 0;
    }
    
    drawShield(ctx) {
        // Shield icon
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(this.size / 2, 0);
        ctx.lineTo(0, this.size / 2);
        ctx.lineTo(-this.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Inner glow
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawMagnet(ctx) {
        // Magnet icon (U shape)
        const size = this.size / 2;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, size, Math.PI, 0, false);
        ctx.stroke();
        
        // Ends
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(-size - 3, 0, 6, size / 2);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(size - 3, 0, 6, size / 2);
    }
    
    drawMultiplier(ctx) {
        // 2x text
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2x', 0, 0);
        
        // Circle background
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    getBounds() {
        return {
            x: this.x - this.size / 2,
            y: this.y - this.size / 2,
            width: this.size,
            height: this.size
        };
    }
    
    collect() {
        this.collected = true;
        this.active = false;
    }
}

// PowerUp Manager
class PowerUpManager {
    constructor(engine, collisionSystem) {
        this.engine = engine;
        this.collisionSystem = collisionSystem;
        this.powerups = [];
        
        // Spawn settings
        this.spawnTimer = 0;
        this.spawnInterval = 8000; // ms
        this.types = ['shield', 'magnet', 'multiplier'];
        
        // Active effects
        this.activeEffects = {
            shield: { active: false, duration: 0 },
            magnet: { active: false, duration: 0 },
            multiplier: { active: false, duration: 0 }
        };
    }
    
    spawn(lane, type, y = -50) {
        const powerup = new PowerUp(this.engine, lane, type, y);
        this.powerups.push(powerup);
        return powerup;
    }
    
    update(deltaTime, gameSpeed) {
        // Update active effects
        for (const type in this.activeEffects) {
            const effect = this.activeEffects[type];
            if (effect.active) {
                effect.duration -= deltaTime;
                if (effect.duration <= 0) {
                    effect.active = false;
                    effect.duration = 0;
                }
            }
        }
        
        // Spawn powerups
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnPowerUp();
        }
        
        // Update all powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            powerup.update(deltaTime, gameSpeed);
            
            // Remove inactive powerups
            if (!powerup.active) {
                this.powerups.splice(i, 1);
            }
        }
    }
    
    spawnPowerUp() {
        const lane = Math.floor(Math.random() * 5);
        const type = this.types[Math.floor(Math.random() * this.types.length)];
        this.spawn(lane, type);
    }
    
    render() {
        for (const powerup of this.powerups) {
            powerup.render();
        }
    }
    
    checkCollisions(player) {
        const collected = [];
        const playerBounds = player.getBounds();
        
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            const powerupBounds = powerup.getBounds();
            
            if (this.collisionSystem.checkAABB(playerBounds, powerupBounds)) {
                powerup.collect();
                this.activatePowerUp(powerup.type);
                collected.push(powerup);
                this.powerups.splice(i, 1);
            }
        }
        
        return collected;
    }
    
    activatePowerUp(type) {
        const durations = {
            shield: 5000,
            magnet: 7000,
            multiplier: 10000
        };
        
        this.activeEffects[type].active = true;
        this.activeEffects[type].duration = durations[type];
    }
    
    isActive(type) {
        return this.activeEffects[type].active;
    }
    
    getTimeRemaining(type) {
        return this.activeEffects[type].duration;
    }
    
    clear() {
        this.powerups = [];
        this.spawnTimer = 0;
        
        // Clear active effects
        for (const type in this.activeEffects) {
            this.activeEffects[type].active = false;
            this.activeEffects[type].duration = 0;
        }
    }
    
    getCount() {
        return this.powerups.length;
    }
}

// Export as global
window.PowerUp = PowerUp;
window.PowerUpManager = PowerUpManager;
