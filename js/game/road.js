// Road System
class Road {
    constructor(engine) {
        this.engine = engine;
        
        this.roadWidth = 500;
        this.roadLeft = (engine.width - this.roadWidth) / 2;
        this.laneWidth = this.roadWidth / 5;
        
        this.roadColor = '#1a1a2e';
        this.grassColor = '#16213e';
        this.lineColor = '#ffbe0b';
        this.edgeLineColor = '#ffffff';
        
        this.lineOffset = 0;
        this.lineHeight = 40;
        this.lineGap = 20;
        this.lineWidth = 8;
        
        this.scrollSpeed = 0;
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67;
        this.scrollSpeed = gameSpeed;
        this.lineOffset += this.scrollSpeed * dt;
        
        const segmentLength = this.lineHeight + this.lineGap;
        if (this.lineOffset >= segmentLength) {
            this.lineOffset -= segmentLength;
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        
        ctx.fillStyle = this.grassColor;
        ctx.fillRect(0, 0, this.engine.width, this.engine.height);
        
        ctx.fillStyle = this.roadColor;
        ctx.fillRect(this.roadLeft, 0, this.roadWidth, this.engine.height);
        
        // Edge lines
        ctx.fillStyle = this.edgeLineColor;
        ctx.fillRect(this.roadLeft - 4, 0, 4, this.engine.height);
        ctx.fillRect(this.roadLeft + this.roadWidth, 0, 4, this.engine.height);
        
        // Lane dividers
        ctx.fillStyle = this.lineColor;
        for (let lane = 1; lane < 5; lane++) {
            const x = this.roadLeft + this.laneWidth * lane - this.lineWidth / 2;
            const segmentLength = this.lineHeight + this.lineGap;
            
            let y = -segmentLength + this.lineOffset;
            while (y < this.engine.height) {
                ctx.fillRect(x, y, this.lineWidth, this.lineHeight);
                y += segmentLength;
            }
        }
    }
    
    getLaneX(lane) {
        return this.roadLeft + this.laneWidth * lane + this.laneWidth / 2;
    }
    
    getLaneBounds() {
        return {
            left: this.roadLeft,
            right: this.roadLeft + this.roadWidth,
            laneWidth: this.laneWidth
        };
    }
    
    reset() {
        this.lineOffset = 0;
    }
}

// Background parallax system — uses pre-built geometry so no random flicker
class Background {
    constructor(engine) {
        this.engine = engine;
        this.layers = [];
        this.createLayers();
    }
    
    createLayers() {
        // Far layer: city silhouette (fixed geometry, just scrolls)
        const farBuildings = this._generateBuildings(14, 60, 120, 80, 0.08);
        this.layers.push({
            y: 0,
            speed: 0.08,
            color: 'rgba(131, 56, 236, 0.18)',
            pattern: 'buildings',
            buildings: farBuildings,
            height: 120
        });
        
        // Near layer: taller buildings
        const nearBuildings = this._generateBuildings(10, 40, 80, 110, 0.22);
        this.layers.push({
            y: 0,
            speed: 0.22,
            color: 'rgba(0, 245, 255, 0.12)',
            pattern: 'buildings',
            buildings: nearBuildings,
            height: 110
        });
    }
    
    _generateBuildings(count, minH, maxH, baseY, seed) {
        const buildings = [];
        const w = 800; // fixed reference width
        const spacing = w / count;
        for (let i = 0; i < count; i++) {
            const h = minH + ((i * 37 + Math.floor(seed * 100)) % (maxH - minH));
            buildings.push({
                x: i * spacing + (i % 3) * 8,
                w: spacing - 6,
                h,
                baseY,
                // Window pattern
                winRows: Math.floor(h / 18),
                winCols: Math.floor((spacing - 6) / 14)
            });
        }
        return buildings;
    }
    
    update(deltaTime, gameSpeed) {
        const dt = deltaTime / 16.67;
        for (const layer of this.layers) {
            layer.y += gameSpeed * layer.speed * dt;
            if (layer.y >= this.engine.height) {
                layer.y -= this.engine.height;
            }
        }
    }
    
    render() {
        const ctx = this.engine.ctx;
        for (const layer of this.layers) {
            ctx.fillStyle = layer.color;
            this._drawBuildingLayer(ctx, layer);
        }
    }
    
    _drawBuildingLayer(ctx, layer) {
        const H = this.engine.height;
        const scroll = layer.y % H;
        
        for (const b of layer.buildings) {
            const bTop = H - b.baseY - b.h + scroll;
            
            // Draw twice for seamless wrap
            for (let wrap = 0; wrap < 2; wrap++) {
                const yOff = wrap === 0 ? 0 : -H;
                const top = bTop + yOff;
                
                if (top > H || top + b.h < 0) continue;
                
                // Building body
                ctx.fillRect(b.x, top, b.w, b.h);
                
                // Windows (lit up, tiny)
                ctx.fillStyle = 'rgba(255, 255, 180, 0.35)';
                for (let r = 0; r < b.winRows; r++) {
                    for (let c = 0; c < b.winCols; c++) {
                        // Deterministic "random" lighting
                        if ((b.x + r * 7 + c * 13) % 3 !== 0) {
                            ctx.fillRect(
                                b.x + c * 14 + 3,
                                top + r * 18 + 4,
                                8, 10
                            );
                        }
                    }
                }
                ctx.fillStyle = layer.color;
            }
        }
    }
    
    reset() {
        for (const layer of this.layers) layer.y = 0;
    }
}

window.Road = Road;
window.Background = Background;
