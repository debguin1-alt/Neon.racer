// Game Engine Core
class GameEngine {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.width = 0;
        this.height = 0;
        this.scale = 1;
        this.initialized = false;
        
        // Performance tracking
        this.fps = 60;
        this.frameCount = 0;
        this.lastFrameTime = 0;
    }
    
    init(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found');
            return false;
        }
        
        this.ctx = this.canvas.getContext('2d', {
            alpha: false,
            desynchronized: true
        });
        
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.initialized = true;
        return true;
    }
    
    resize() {
        // Set ideal game dimensions
        const targetWidth = 800;
        const targetHeight = 600;
        const aspectRatio = targetWidth / targetHeight;
        
        // Get available space
        let width = window.innerWidth;
        let height = window.innerHeight;
        
        // Calculate scale to fit screen while maintaining aspect ratio
        if (width / height > aspectRatio) {
            width = height * aspectRatio;
        } else {
            height = width / aspectRatio;
        }
        
        // Set display size
        this.canvas.style.width = width + 'px';
        this.canvas.style.height = height + 'px';
        
        // Set actual size in memory (scaled for retina displays)
        const scale = window.devicePixelRatio || 1;
        this.canvas.width = targetWidth * scale;
        this.canvas.height = targetHeight * scale;
        
        // Normalize coordinate system
        this.ctx.scale(scale, scale);
        
        this.width = targetWidth;
        this.height = targetHeight;
        this.scale = scale;
        
        // Update image smoothing
        this.ctx.imageSmoothingEnabled = false;
    }
    
    clear(color = '#1a1a2e') {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }
    
    drawRect(x, y, width, height, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width, height);
    }
    
    drawCircle(x, y, radius, color) {
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawLine(x1, y1, x2, y2, color, width = 1) {
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    drawImage(image, x, y, width, height) {
        if (image && image.complete) {
            this.ctx.drawImage(image, x, y, width, height);
        }
    }
    
    drawSprite(sprite, x, y, width, height, frame = 0) {
        if (!sprite || !sprite.image || !sprite.image.complete) return;
        
        const frameWidth = sprite.frameWidth || sprite.image.width;
        const frameHeight = sprite.frameHeight || sprite.image.height;
        const framesPerRow = Math.floor(sprite.image.width / frameWidth);
        
        const srcX = (frame % framesPerRow) * frameWidth;
        const srcY = Math.floor(frame / framesPerRow) * frameHeight;
        
        this.ctx.drawImage(
            sprite.image,
            srcX, srcY, frameWidth, frameHeight,
            x, y, width, height
        );
    }
    
    drawText(text, x, y, options = {}) {
        const {
            font = '20px Arial',
            color = '#ffffff',
            align = 'left',
            baseline = 'top',
            shadow = null
        } = options;
        
        this.ctx.font = font;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
        this.ctx.textBaseline = baseline;
        
        if (shadow) {
            this.ctx.shadowColor = shadow.color || 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = shadow.blur || 4;
            this.ctx.shadowOffsetX = shadow.offsetX || 2;
            this.ctx.shadowOffsetY = shadow.offsetY || 2;
        }
        
        this.ctx.fillText(text, x, y);
        
        // Reset shadow
        if (shadow) {
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 0;
        }
    }
    
    measureText(text, font = '20px Arial') {
        this.ctx.font = font;
        return this.ctx.measureText(text);
    }
    
    updateFPS(timestamp) {
        this.frameCount++;
        const delta = timestamp - this.lastFrameTime;
        
        if (delta >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / delta);
            this.frameCount = 0;
            this.lastFrameTime = timestamp;
        }
    }
    
    getFPS() {
        return this.fps;
    }
}

// Export as global
window.GameEngine = GameEngine;
