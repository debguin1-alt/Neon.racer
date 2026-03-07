// Player class
class Player {
    constructor(engine, x, y) {
        this.engine = engine;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;

        this.laneWidth = 100;
        this.currentLane = 2;
        this.targetX = x;
        this.laneCooldown = 0;

        // Tilt for lane-change animation
        this.tilt = 0;        // current visual tilt (radians)
        this.targetTilt = 0;

        this.speed = 0;
        this.maxSpeed = 8;
        this.acceleration = 0.3;

        this.alive = true;
        this.invincible = false;
        this.invincibleTime = 0;

        this.color = '#00f5ff';
        this.glowColor = 'rgba(0, 245, 255, 0.5)';
        this.sprite = null;
        this.animationFrame = 0;
        this.animationSpeed = 0.15;
    }

    setSprite(sprite) { this.sprite = sprite; }

    update(deltaTime, input) {
        if (!this.alive) return;
        const dt = deltaTime / 16.67;

        // Invincibility
        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            if (this.invincibleTime <= 0) { this.invincible = false; this.invincibleTime = 0; }
        }

        // Lane movement with cooldown
        this.laneCooldown -= deltaTime;
        const prevLane = this.currentLane;
        if (this.laneCooldown <= 0) {
            if (input.left && this.currentLane > 0) {
                this.currentLane--;
                this.targetX = this.getLaneX(this.currentLane);
                this.laneCooldown = 150;
            } else if (input.right && this.currentLane < 4) {
                this.currentLane++;
                this.targetX = this.getLaneX(this.currentLane);
                this.laneCooldown = 150;
            }
        }

        // Tilt toward direction of movement
        if (this.currentLane < prevLane) this.targetTilt = -0.18;
        else if (this.currentLane > prevLane) this.targetTilt = 0.18;
        else this.targetTilt = 0;

        // Smooth tilt
        this.tilt += (this.targetTilt - this.tilt) * 0.18 * dt;

        // Smooth slide to lane
        const diff = this.targetX - this.x;
        this.x += diff * 0.15 * dt;

        const roadWidth = 500;
        const roadLeft = (this.engine.width - roadWidth) / 2;
        this.x = Math.max(roadLeft + 4, Math.min(roadLeft + roadWidth - this.width - 4, this.x));

        this.animationFrame += this.animationSpeed * dt;
        if (this.animationFrame >= 2) this.animationFrame = 0;

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

        if (this.invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.save();
        // Tilt around car center
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.tilt);
        ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

        if (this.sprite) {
            const frame = Math.floor(this.animationFrame);
            this.engine.drawSprite(this.sprite, this.x, this.y, this.width, this.height, frame);
        } else {
            ctx.shadowColor = this.glowColor;
            ctx.shadowBlur = 20;

            // Car body
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x + 5, this.y + 10, this.width - 10, this.height - 20);
            // Wider midsection
            ctx.fillRect(this.x + 3, this.y + 20, this.width - 6, this.height - 35);
            // Windshield
            ctx.fillStyle = 'rgba(100,220,255,0.35)';
            ctx.fillRect(this.x + 9, this.y + 12, this.width - 18, 13);
            // Rear window
            ctx.fillRect(this.x + 10, this.y + this.height - 22, this.width - 20, 10);
            // Headlights (forward = bottom of screen since top-down)
            ctx.shadowColor = '#ffff88';
            ctx.shadowBlur = 12;
            ctx.fillStyle = '#ffffaa';
            ctx.fillRect(this.x + 5, this.y + this.height - 10, 10, 6);
            ctx.fillRect(this.x + this.width - 15, this.y + this.height - 10, 10, 6);
            // Neon underglow
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(this.x + 5, this.y + this.height - 12);
            ctx.lineTo(this.x + this.width - 5, this.y + this.height - 12);
            ctx.stroke();
            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        ctx.restore();
        ctx.globalAlpha = 1.0;
    }

    getBounds() {
        // Slightly inset for fairer collision
        return {
            x: this.x + 4,
            y: this.y + 4,
            width: this.width - 8,
            height: this.height - 8
        };
    }

    setInvincible(duration) {
        this.invincible = true;
        this.invincibleTime = duration || 2000;
    }

    die() { this.alive = false; }

    reset(x, y) {
        this.x = x; this.y = y;
        this.currentLane = 2;
        this.targetX = x;
        this.speed = 0;
        this.tilt = 0; this.targetTilt = 0;
        this.alive = true;
        this.invincible = false;
        this.invincibleTime = 0;
        this.laneCooldown = 0;
    }
}

window.Player = Player;
