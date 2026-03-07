// Enemy Vehicle class
class Enemy {
    constructor(engine, lane, speed, type = 'car') {
        this.engine = engine;
        this.lane = lane;
        this.type = type;

        const roadWidth = 500;
        const roadLeft = (engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        this.x = roadLeft + laneWidth * lane + laneWidth / 2 - 20;
        this.y = -80;

        this.width = type === 'truck' ? 45 : 40;
        this.height = type === 'truck' ? 80 : 60;

        this.baseSpeed = speed;
        this.speed = speed;

        this.colors = {
            car:   ['#ff006e', '#8338ec', '#00f5ff', '#ffbe0b'],
            truck: ['#e63946', '#457b9d', '#2a9d8f']
        };
        this.color = this.colors[type][Math.floor(Math.random() * this.colors[type].length)];

        this.active = true;
        this.nearMissed = false; // track if player already got near-miss credit
    }

    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67;
        this.speed = this.baseSpeed + gameSpeed;
        this.y += this.speed * dt;
        if (this.y > this.engine.height + 100) this.active = false;
    }

    render() {
        const ctx = this.engine.ctx;
        ctx.save();
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;

        if (this.type === 'truck') {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 2, this.y, this.width - 4, this.height);
            ctx.fillStyle = this._shade(this.color, -30);
            ctx.fillRect(this.x + 4, this.y + this.height - 28, this.width - 8, 26);
            ctx.fillStyle = 'rgba(100,200,255,0.4)';
            ctx.fillRect(this.x + 7, this.y + this.height - 24, this.width - 14, 14);
            ctx.fillStyle = 'rgba(255,255,255,0.12)';
            ctx.fillRect(this.x + 2, this.y + 4, this.width - 4, 6);
            ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x + 3, this.y, 8, 5);
            ctx.fillRect(this.x + this.width - 11, this.y, 8, 5);
        } else {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 6, this.y + 5, this.width - 12, this.height - 10);
            ctx.fillRect(this.x + 3, this.y + 15, this.width - 6, this.height - 30);
            ctx.fillStyle = 'rgba(100,200,255,0.4)';
            ctx.fillRect(this.x + 8, this.y + this.height - 22, this.width - 16, 12);
            ctx.fillRect(this.x + 9, this.y + 8, this.width - 18, 9);
            ctx.strokeStyle = this.color; ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.moveTo(this.x + 3, this.y + this.height - 5);
            ctx.lineTo(this.x + this.width - 3, this.y + this.height - 5);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 8;
            ctx.fillStyle = '#ff4444';
            ctx.fillRect(this.x + 4, this.y + 5, 7, 4);
            ctx.fillRect(this.x + this.width - 11, this.y + 5, 7, 4);
        }
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    _shade(color, pct) {
        const n = parseInt(color.replace('#',''), 16);
        const a = Math.round(2.55 * pct);
        const R = Math.max(0, Math.min(255, (n >> 16) + a));
        const G = Math.max(0, Math.min(255, (n >> 8 & 0xff) + a));
        const B = Math.max(0, Math.min(255, (n & 0xff) + a));
        return '#' + (0x1000000 + R*0x10000 + G*0x100 + B).toString(16).slice(1);
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }
    // Slightly expanded bounds for near-miss detection
    getNearMissBounds(margin = 20) {
        return { x: this.x - margin, y: this.y - margin, width: this.width + margin*2, height: this.height + margin*2 };
    }
}

// Enemy Manager
class EnemyManager {
    constructor(engine, collisionSystem) {
        this.engine = engine;
        this.collisionSystem = collisionSystem;
        this.enemies = [];
        this.carSprite = null;
        this.truckSprite = null;

        this.spawnTimer = 0;
        this.spawnInterval = 1500;
        this.minSpawnInterval = 500;
        this.baseSpeed = 3;
        this.truckChance = 0.2;
    }

    setSprites(spriteManager) {
        this.carSprite   = spriteManager.get('vehicles') || null;
        this.truckSprite = spriteManager.get('trucks')   || null;
    }

    spawn(lane, speed, type = 'car') {
        const enemy = new Enemy(this.engine, lane, speed, type);
        this.enemies.push(enemy);
        return enemy;
    }

    update(deltaTime, gameSpeed, difficulty) {
        this.spawnInterval = Math.max(this.minSpawnInterval, 1500 - difficulty * 100);
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnEnemy(gameSpeed, difficulty);
        }
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update(deltaTime, gameSpeed);
            if (!this.enemies[i].active) this.enemies.splice(i, 1);
        }
    }

    _spawnEnemy(gameSpeed, difficulty) {
        const lane = Math.floor(Math.random() * 5);
        const safe = !this.enemies.some(e => e.lane === lane && e.y < 120);
        if (!safe) return;
        const type  = Math.random() < this.truckChance ? 'truck' : 'car';
        const speed = this.baseSpeed + Math.random() * 2 + difficulty * 0.3;
        this.spawn(lane, speed, type);
    }

    render() {
        for (const e of this.enemies) e.render();
    }

    checkCollision(player) {
        if (player.invincible) return null;
        const pb = player.getBounds();
        for (const e of this.enemies) {
            if (this.collisionSystem.checkAABB(pb, e.getBounds())) return e;
        }
        return null;
    }

    // Returns enemies the player just barely passed (near miss)
    checkNearMisses(player) {
        const pb = player.getBounds();
        const nearMisses = [];
        for (const e of this.enemies) {
            if (e.nearMissed) continue;
            // Only count when enemy has just passed the player (enemy top > player bottom)
            if (e.y > pb.y + pb.height) {
                const nm = e.getNearMissBounds(18);
                if (this.collisionSystem.checkAABB(pb, nm)) {
                    e.nearMissed = true;
                    nearMisses.push(e);
                }
            }
        }
        return nearMisses;
    }

    clear() { this.enemies = []; this.spawnTimer = 0; }
    getCount() { return this.enemies.length; }
}

window.Enemy = Enemy;
window.EnemyManager = EnemyManager;
