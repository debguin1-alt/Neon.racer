// Coin class
class Coin {
    constructor(engine, lane, y = -50) {
        this.engine = engine;
        this.lane = lane;

        const roadWidth = 500;
        const roadLeft = (engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        this.x = roadLeft + laneWidth * lane + laneWidth / 2;
        this.y = y;

        this.radius = 12;
        this.width = this.radius * 2;
        this.height = this.radius * 2;

        this.color = '#ffbe0b';
        this.glowColor = 'rgba(255, 190, 11, 0.5)';
        this.pulsePhase = Math.random() * Math.PI * 2;

        this.active = true;
        this.collected = false;
    }

    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67;
        this.y += gameSpeed * dt;
        this.pulsePhase += 0.05 * dt;
        if (this.y > this.engine.height + 50) this.active = false;
    }

    render() {
        const ctx = this.engine.ctx;
        const scale = 1 + Math.sin(this.pulsePhase) * 0.12;
        const r = this.radius * scale;

        ctx.shadowColor = this.glowColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fill();
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.arc(this.x - r * 0.25, this.y - r * 0.25, r * 0.45, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    getBounds() {
        return { x: this.x - this.radius, y: this.y - this.radius, width: this.radius * 2, height: this.radius * 2 };
    }

    collect() { this.collected = true; this.active = false; }
}

// Coin Manager
class CoinManager {
    constructor(engine, collisionSystem) {
        this.engine = engine;
        this.collisionSystem = collisionSystem;
        this.coins = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2000;
        this.groupChance = 0.4;
    }

    spawn(lane, y = -50) {
        const coin = new Coin(this.engine, lane, y);
        this.coins.push(coin);
        return coin;
    }

    // Coin patterns: line, arc, zigzag, column
    _spawnPattern(pattern) {
        const roadWidth = 500;
        const roadLeft = (this.engine.width - roadWidth) / 2;
        const laneWidth = roadWidth / 5;
        const startLane = Math.floor(Math.random() * 3); // lanes 0-2 so patterns fit

        switch (pattern) {
            case 'line': // horizontal row
                for (let l = startLane; l < startLane + 3; l++) {
                    this.spawn(l, -50);
                }
                break;
            case 'column': // straight ahead in one lane
                for (let i = 0; i < 5; i++) {
                    this.spawn(startLane + 1, -50 - i * 55);
                }
                break;
            case 'zigzag': // alternating lanes
                for (let i = 0; i < 5; i++) {
                    this.spawn(startLane + (i % 2) * 2, -50 - i * 55);
                }
                break;
            case 'arc': // arc shape across lanes
                const arcLanes = [0, 1, 2, 3, 4];
                const offsets  = [0, -40, -60, -40, 0]; // upward arc
                for (let i = 0; i < 5; i++) {
                    this.spawn(arcLanes[i], -50 + offsets[i]);
                }
                break;
            case 'diamond': // 2 in a V shape
                this.spawn(startLane,     -50);
                this.spawn(startLane + 1, -90);
                this.spawn(startLane + 2, -50);
                this.spawn(startLane + 1, -10);
                break;
        }
    }

    update(deltaTime, gameSpeed) {
        // Speed up coin spawning at higher speeds
        this.spawnInterval = Math.max(800, 2000 - (gameSpeed - 3) * 150);

        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnTimer = 0;
            this._spawnCoin();
        }

        for (let i = this.coins.length - 1; i >= 0; i--) {
            this.coins[i].update(deltaTime, gameSpeed);
            if (!this.coins[i].active) this.coins.splice(i, 1);
        }
    }

    _spawnCoin() {
        if (Math.random() < this.groupChance) {
            const patterns = ['line', 'column', 'zigzag', 'arc', 'diamond'];
            this._spawnPattern(patterns[Math.floor(Math.random() * patterns.length)]);
        } else {
            this.spawn(Math.floor(Math.random() * 5));
        }
    }

    render() {
        for (const coin of this.coins) coin.render();
    }

    checkCollisions(player) {
        const collected = [];
        const pb = player.getBounds();
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (this.collisionSystem.checkAABB(pb, coin.getBounds())) {
                coin.collect();
                collected.push({ x: coin.x, y: coin.y });
                this.coins.splice(i, 1);
            }
        }
        return collected;
    }

    clear() { this.coins = []; this.spawnTimer = 0; }
    getCount() { return this.coins.length; }
}

window.Coin = Coin;
window.CoinManager = CoinManager;
