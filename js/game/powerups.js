// PowerUp class
class PowerUp {
    constructor(engine, lane, type, y = -50) {
        this.engine = engine;
        this.lane = lane;
        this.type = type;
        
        const roadWidth = 500;
        const roadLeft = (engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        this.x = roadLeft + laneWidth * lane + laneWidth / 2;
        this.y = y;
        
        this.size = 30;
        this.width = this.size;
        this.height = this.size;
        
        this.colors = {
            shield: '#8338ec',
            magnet: '#ff006e',
            multiplier: '#00f5ff'
        };
        this.color = this.colors[type];
        this.rotation = 0;
        this.rotationSpeed = 0.05;
        
        this.active = true;
        this.collected = false;
        
        this.bobPhase = Math.random() * Math.PI * 2;
        this.bobSpeed = 0.08;
        this.bobAmount = 5;
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67;
        this.y += gameSpeed * dt;
        this.rotation += this.rotationSpeed * dt;
        this.bobPhase += this.bobSpeed * dt;
        if (this.y > this.engine.height + 50) this.active = false;
    }
    
    render() {
        const ctx = this.engine.ctx;
        const bobOffset = Math.sin(this.bobPhase) * this.bobAmount;
        const renderY = this.y + bobOffset;
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 20;
        ctx.save();
        ctx.translate(this.x, renderY);
        ctx.rotate(this.rotation);
        
        if (this.type === 'shield') this.drawShield(ctx);
        else if (this.type === 'magnet') this.drawMagnet(ctx);
        else if (this.type === 'multiplier') this.drawMultiplier(ctx);
        
        ctx.restore();
        ctx.shadowBlur = 0;
    }
    
    drawShield(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -this.size / 2);
        ctx.lineTo(this.size / 2, 0);
        ctx.lineTo(0, this.size / 2);
        ctx.lineTo(-this.size / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
        // Shield label
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🛡', 0, 1);
    }
    
    drawMagnet(ctx) {
        const size = this.size / 2;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, -4, size, Math.PI, 0, false);
        ctx.stroke();
        ctx.fillStyle = '#ff4466';
        ctx.fillRect(-size - 3, -4, 6, size / 2 + 4);
        ctx.fillStyle = '#44ffaa';
        ctx.fillRect(size - 3, -4, 6, size / 2 + 4);
    }
    
    drawMultiplier(ctx) {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Orbitron, monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('2×', 0, 1);
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
        
        this.spawnTimer = 0;
        this.spawnInterval = 8000;
        this.types = ['shield', 'magnet', 'multiplier'];
        
        this.activeEffects = {
            shield:     { active: false, duration: 0, maxDuration: 5000 },
            magnet:     { active: false, duration: 0, maxDuration: 7000 },
            multiplier: { active: false, duration: 0, maxDuration: 10000 }
        };
    }
    
    spawn(lane, type, y = -50) {
        const powerup = new PowerUp(this.engine, lane, type, y);
        this.powerups.push(powerup);
        return powerup;
    }
    
    update(deltaTime, gameSpeed) {
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
        
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this.spawnPowerUp();
        }
        
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.update(deltaTime, gameSpeed);
            if (!p.active) this.powerups.splice(i, 1);
        }
    }
    
    spawnPowerUp() {
        const lane = Math.floor(Math.random() * 5);
        const type = this.types[Math.floor(Math.random() * this.types.length)];
        this.spawn(lane, type);
    }
    
    render() {
        for (const p of this.powerups) p.render();
        
        // Render active shield ring on player (caller passes player pos via renderShieldEffect)
    }
    
    renderShieldEffect(ctx, player) {
        if (!this.activeEffects.shield.active) return;
        const progress = this.activeEffects.shield.duration / this.activeEffects.shield.maxDuration;
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        ctx.save();
        ctx.strokeStyle = `rgba(131, 56, 236, ${0.4 + 0.4 * Math.sin(Date.now() / 150)})`;
        ctx.lineWidth = 3;
        ctx.shadowColor = '#8338ec';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(cx, cy, 36, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
    
    checkCollisions(player) {
        const collected = [];
        const playerBounds = player.getBounds();
        
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (this.collisionSystem.checkAABB(playerBounds, p.getBounds())) {
                p.collect();
                this.activatePowerUp(p.type);
                collected.push(p);
                this.powerups.splice(i, 1);
            }
        }
        return collected;
    }
    
    activatePowerUp(type) {
        const d = this.activeEffects[type];
        d.active = true;
        d.duration = d.maxDuration;
    }
    
    isActive(type) { return this.activeEffects[type].active; }
    getTimeRemaining(type) { return this.activeEffects[type].duration; }
    getMaxDuration(type) { return this.activeEffects[type].maxDuration; }
    
    // Pull coins toward player if magnet active
    applyMagnet(coinManager, player) {
        if (!this.activeEffects.magnet.active) return;
        const cx = player.x + player.width / 2;
        const cy = player.y + player.height / 2;
        const range = 180;
        
        for (const coin of coinManager.coins) {
            if (!coin.active || coin.collected) continue;
            const dx = cx - coin.x;
            const dy = cy - coin.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < range) {
                const force = (1 - dist / range) * 8;
                coin.x += (dx / dist) * force;
                coin.y += (dy / dist) * force;
            }
        }
    }
    
    clear() {
        this.powerups = [];
        this.spawnTimer = 0;
        for (const type in this.activeEffects) {
            this.activeEffects[type].active = false;
            this.activeEffects[type].duration = 0;
        }
    }
    
    getCount() { return this.powerups.length; }
}

window.PowerUp = PowerUp;
window.PowerUpManager = PowerUpManager;
