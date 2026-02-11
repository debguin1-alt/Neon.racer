// Particle System
class ParticleSystem {
    constructor(engine) {
        this.engine = engine;
        this.particles = [];
        this.maxParticles = 500;
        this.enabled = true;
    }
    
    createParticle(x, y, options = {}) {
        if (!this.enabled || this.particles.length >= this.maxParticles) {
            return null;
        }
        
        const particle = {
            x,
            y,
            vx: options.vx || (Math.random() - 0.5) * 4,
            vy: options.vy || (Math.random() - 0.5) * 4,
            size: options.size || 3,
            color: options.color || '#ffffff',
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            decay: options.decay || 0.02,
            gravity: options.gravity || 0,
            friction: options.friction || 0.98,
            alpha: options.alpha || 1.0
        };
        
        this.particles.push(particle);
        return particle;
    }
    
    createExplosion(x, y, count = 20, options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = options.speed || 3;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: options.size || 4,
                color: options.color || '#ff006e',
                life: options.life || 1.0,
                decay: options.decay || 0.015,
                gravity: options.gravity || 0.1
            });
        }
    }
    
    createTrail(x, y, color = '#00f5ff', count = 5) {
        for (let i = 0; i < count; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                {
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 2 + 1,
                    size: Math.random() * 3 + 2,
                    color,
                    life: 0.5,
                    decay: 0.03,
                    gravity: -0.05
                }
            );
        }
    }
    
    createCoinEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 2;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                size: Math.random() * 4 + 2,
                color: '#ffbe0b',
                life: 0.8,
                decay: 0.02,
                gravity: 0.2
            });
        }
    }
    
    createCrashEffect(x, y) {
        // Main explosion
        this.createExplosion(x, y, 30, {
            speed: 5,
            size: 6,
            color: '#ff006e',
            life: 1.2,
            decay: 0.01,
            gravity: 0.15
        });
        
        // Secondary sparks
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 3;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: Math.random() * 3 + 1,
                color: Math.random() > 0.5 ? '#ffbe0b' : '#ffffff',
                life: 0.6,
                decay: 0.025,
                gravity: 0.3
            });
        }
    }
    
    update(deltaTime) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // Apply physics
            p.vy += p.gravity * dt;
            p.vx *= p.friction;
            p.vy *= p.friction;
            
            // Update life
            p.life -= p.decay * dt;
            p.alpha = p.life / p.maxLife;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render() {
        if (!this.enabled) return;
        
        const ctx = this.engine.ctx;
        
        for (const p of this.particles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1.0;
    }
    
    clear() {
        this.particles = [];
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clear();
        }
    }
    
    getParticleCount() {
        return this.particles.length;
    }
}

// Export as global
window.ParticleSystem = ParticleSystem;
