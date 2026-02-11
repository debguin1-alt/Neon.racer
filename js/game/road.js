// Road System
class Road {
    constructor(engine) {
        this.engine = engine;
        
        // Road dimensions
        this.roadWidth = 500;
        this.roadLeft = (engine.width - this.roadWidth) / 2;
        this.laneWidth = this.roadWidth / 5;
        
        // Colors
        this.roadColor = '#1a1a2e';
        this.grassColor = '#16213e';
        this.lineColor = '#ffbe0b';
        this.edgeLineColor = '#ffffff';
        
        // Animation
        this.lineOffset = 0;
        this.lineHeight = 40;
        this.lineGap = 20;
        this.lineWidth = 8;
        
        // Speed
        this.scrollSpeed = 0;
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67; // Normalize to 60fps
        
        this.scrollSpeed = gameSpeed;
        this.lineOffset += this.scrollSpeed * dt;
        
        // Reset line offset when it exceeds one segment
        const segmentLength = this.lineHeight + this.lineGap;
        if (this.lineOffset >= segmentLength) {
            this.lineOffset -= segmentLength;
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        // Draw grass (background)
        ctx.fillStyle = this.grassColor;
        ctx.fillRect(0, 0, this.engine.width, this.engine.height);
        
        // Draw road
        ctx.fillStyle = this.roadColor;
        ctx.fillRect(this.roadLeft, 0, this.roadWidth, this.engine.height);
        
        // Draw edge lines
        ctx.fillStyle = this.edgeLineColor;
        ctx.fillRect(this.roadLeft - 4, 0, 4, this.engine.height);
        ctx.fillRect(this.roadLeft + this.roadWidth, 0, 4, this.engine.height);
        
        // Draw lane dividers
        ctx.fillStyle = this.lineColor;
        
        for (let lane = 1; lane < 5; lane++) {
            const x = this.roadLeft + this.laneWidth * lane - this.lineWidth / 2;
            
            // Draw dashed lines
            for (let y = -this.lineHeight; y < this.engine.height; y += this.lineHeight + this.lineGap) {
                const lineY = y + this.lineOffset;
                ctx.fillRect(x, lineY, this.lineWidth, this.lineHeight);
            }
        }
        
        // Draw gradient shadow on edges for depth
        const gradient1 = ctx.createLinearGradient(this.roadLeft - 50, 0, this.roadLeft, 0);
        gradient1.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient1.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient1;
        ctx.fillRect(this.roadLeft - 50, 0, 50, this.engine.height);
        
        const gradient2 = ctx.createLinearGradient(this.roadLeft + this.roadWidth, 0, this.roadLeft + this.roadWidth + 50, 0);
        gradient2.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
        gradient2.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient2;
        ctx.fillRect(this.roadLeft + this.roadWidth, 0, 50, this.engine.height);
    }
    
    reset() {
        this.lineOffset = 0;
        this.scrollSpeed = 0;
    }
    
    getRoadBounds() {
        return {
            left: this.roadLeft,
            right: this.roadLeft + this.roadWidth,
            width: this.roadWidth
        };
    }
    
    getLaneX(lane) {
        return this.roadLeft + this.laneWidth * lane + this.laneWidth / 2;
    }
}

// Background parallax system
class Background {
    constructor(engine) {
        this.engine = engine;
        this.layers = [];
        
        // Create parallax layers
        this.createLayers();
    }
    
    createLayers() {
        // Far mountains/hills
        this.layers.push({
            y: 0,
            speed: 0.1,
            color: 'rgba(138, 56, 236, 0.2)',
            height: 100,
            pattern: 'mountains'
        });
        
        // Mid-ground objects
        this.layers.push({
            y: 0,
            speed: 0.3,
            color: 'rgba(0, 245, 255, 0.15)',
            height: 80,
            pattern: 'buildings'
        });
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67;
        
        for (const layer of this.layers) {
            layer.y += gameSpeed * layer.speed * dt;
            
            // Reset when scrolled too far
            if (layer.y >= this.engine.height) {
                layer.y -= this.engine.height;
            }
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        for (const layer of this.layers) {
            ctx.fillStyle = layer.color;
            
            // Draw pattern based on type
            if (layer.pattern === 'mountains') {
                this.drawMountains(layer);
            } else if (layer.pattern === 'buildings') {
                this.drawBuildings(layer);
            }
        }
    }
    
    drawMountains(layer) {
        const ctx = this.engine.ctx;
        const y = this.engine.height - layer.height;
        
        ctx.beginPath();
        ctx.moveTo(0, this.engine.height);
        
        for (let x = 0; x < this.engine.width; x += 100) {
            const peakHeight = Math.random() * layer.height;
            ctx.lineTo(x + 50, y - peakHeight + layer.y % 200);
        }
        
        ctx.lineTo(this.engine.width, this.engine.height);
        ctx.closePath();
        ctx.fill();
    }
    
    drawBuildings(layer) {
        const ctx = this.engine.ctx;
        const roadBounds = { left: 0, right: this.engine.width };
        
        for (let x = 0; x < this.engine.width; x += 60) {
            const buildingHeight = Math.random() * layer.height + 40;
            const y = this.engine.height - buildingHeight + (layer.y % this.engine.height);
            
            if (y < this.engine.height) {
                ctx.fillRect(x, y, 40, buildingHeight);
            }
        }
    }
    
    reset() {
        for (const layer of this.layers) {
            layer.y = 0;
        }
    }
}

// Export as global
window.Road = Road;
window.Background = Background;
