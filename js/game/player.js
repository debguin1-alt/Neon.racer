// Player class
class Player {
    constructor(engine, x, y) {
        this.engine = engine;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        
        // Movement
        this.speed = 0;
        this.maxSpeed = 8;
        this.acceleration = 0.3;
        this.deceleration = 0.2;
        this.turnSpeed = 5;
        
        // Lane-based movement
        this.laneWidth = 100;
        this.currentLane = 2; // Middle lane (0-4)
        this.targetX = x;
        
        // State
        this.alive = true;
        this.invincible = false;
        this.invincibleTime = 0;
        this.maxInvincibleTime = 2000;
        
        // Visual
        this.color = '#00f5ff';
        this.glowColor = 'rgba(0, 245, 255, 0.5)';
        this.sprite = null;
        this.animationFrame = 0;
        this.animationSpeed = 0.15;
    }
    
    setSprite(sprite) {
        this.sprite = sprite;
    }
    
    update(deltaTime, input) {
        if (!this.alive) return;
        
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        // Update invincibility
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) {
                this.invincible = false;
                this.invincibleTime = 0;
            }
        }
        
        // Lane-based movement
        if (input.left && this.currentLane > 0) {
            this.currentLane--;
            this.targetX = this.getLaneX(this.currentLane);
        } else if (input.right && this.currentLane < 4) {
            this.currentLane++;
            this.targetX = this.getLaneX(this.currentLane);
        }
        
        // Smooth movement to target lane
        const diff = this.targetX - this.x;
        this.x += diff * 0.15 * dt;
        
        // Clamp position
        const minX = 50;
        const maxX = this.engine.width - this.width - 50;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        
        // Update animation
        this.animationFrame += this.animationSpeed * dt;
        if (this.animationFrame >= 2) {
            this.animationFrame = 0;
        }
        
        // Update speed for visual effects
        this.speed = Math.min(this.speed + this.acceleration * dt, this.maxSpeed);
    }
    
    getLaneX(lane) {
        const roadWidth = 500;
        const roadLeft = (this.engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        return roadLeft + laneWidth * lane + laneWidth / 2 - this.width / 2;
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        // Invincibility flicker
        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.sprite) {
            // Draw sprite
            const frame = Math.floor(this.animationFrame);
            this.engine.drawSprite(this.sprite, this.x, this.y, this.width, this.height, frame);
        } else {
            // Draw simple car shape
            // Glow effect
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 20;
            
            // Main body
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, this.height - 15);
            
            // Windshield
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(this.x + 10, this.y + 15, this.width - 20, 15);
            
            // Lights
            ctx.fillStyle = '#ffbe0b';
            ctx.fillRect(this.x + 5, this.y + this.height - 8, 10, 5);
            ctx.fillRect(this.x + this.width - 15, this.y + this.height - 8, 10, 5);
            
            // Reset shadow
            ctx.shadowBlur = 0;
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    setInvincible(duration) {
        this.invincible = true;
        this.invincibleTime = duration || this.maxInvincibleTime;
    }
    
    die() {
        this.alive = false;
    }
    
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.currentLane = 2;
        this.targetX = x;
        this.speed = 0;
        this.alive = true;
        this.invincible = false;
        this.invincibleTime = 0;
    }
}

// Export as global
window.Player = Player;
