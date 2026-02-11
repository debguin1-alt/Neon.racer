// Sprite Management System
class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loading = new Map();
        this.loaded = 0;
        this.total = 0;
    }
    
    load(name, src, options = {}) {
        if (this.sprites.has(name)) {
            return Promise.resolve(this.sprites.get(name));
        }
        
        if (this.loading.has(name)) {
            return this.loading.get(name);
        }
        
        this.total++;
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const sprite = {
                    name,
                    image: img,
                    width: img.width,
                    height: img.height,
                    frameWidth: options.frameWidth || img.width,
                    frameHeight: options.frameHeight || img.height,
                    frames: options.frames || 1
                };
                
                this.sprites.set(name, sprite);
                this.loading.delete(name);
                this.loaded++;
                resolve(sprite);
            };
            
            img.onerror = () => {
                console.error(`Failed to load sprite: ${name}`);
                this.loading.delete(name);
                reject(new Error(`Failed to load sprite: ${name}`));
            };
            
            img.src = src;
        });
        
        this.loading.set(name, promise);
        return promise;
    }
    
    loadMultiple(sprites) {
        const promises = sprites.map(sprite => 
            this.load(sprite.name, sprite.src, sprite.options)
        );
        return Promise.all(promises);
    }
    
    get(name) {
        return this.sprites.get(name);
    }
    
    has(name) {
        return this.sprites.has(name);
    }
    
    getLoadProgress() {
        return this.total > 0 ? (this.loaded / this.total) * 100 : 0;
    }
    
    isLoading() {
        return this.loading.size > 0;
    }
    
    clear() {
        this.sprites.clear();
        this.loading.clear();
        this.loaded = 0;
        this.total = 0;
    }
    
    // Generate simple colored rectangle sprite (fallback)
    generateColorSprite(name, width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        
        const sprite = {
            name,
            image: canvas,
            width,
            height,
            frameWidth: width,
            frameHeight: height,
            frames: 1
        };
        
        this.sprites.set(name, sprite);
        return sprite;
    }
    
    // Generate gradient sprite
    generateGradientSprite(name, width, height, color1, color2) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        const sprite = {
            name,
            image: canvas,
            width,
            height,
            frameWidth: width,
            frameHeight: height,
            frames: 1
        };
        
        this.sprites.set(name, sprite);
        return sprite;
    }
}

// Export as global
window.SpriteManager = SpriteManager;
