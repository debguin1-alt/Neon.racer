// Game Loop Manager
class GameLoop {
    constructor() {
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.frameId = null;
        
        // Fixed timestep for physics (60 FPS)
        this.fixedDelta = 1000 / 60;
        this.maxFrameTime = 250; // Max time between frames (prevents spiral of death)
        
        // Callbacks
        this.updateCallback = null;
        this.renderCallback = null;
        this.fixedUpdateCallback = null;
    }
    
    setCallbacks(update, render, fixedUpdate = null) {
        this.updateCallback = update;
        this.renderCallback = render;
        this.fixedUpdateCallback = fixedUpdate;
    }
    
    start() {
        if (this.running) return;
        
        this.running = true;
        this.paused = false;
        this.lastTime = performance.now();
        this.accumulator = 0;
        
        this.loop(this.lastTime);
    }
    
    stop() {
        this.running = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }
    
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
        this.lastTime = performance.now();
    }
    
    loop(currentTime) {
        if (!this.running) return;
        
        this.frameId = requestAnimationFrame((time) => this.loop(time));
        
        if (this.paused) return;
        
        // Calculate delta time
        let deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Prevent spiral of death
        if (deltaTime > this.maxFrameTime) {
            deltaTime = this.maxFrameTime;
        }
        
        // Variable timestep update (for rendering)
        if (this.updateCallback) {
            this.updateCallback(deltaTime);
        }
        
        // Fixed timestep update (for physics)
        if (this.fixedUpdateCallback) {
            this.accumulator += deltaTime;
            
            while (this.accumulator >= this.fixedDelta) {
                this.fixedUpdateCallback(this.fixedDelta);
                this.accumulator -= this.fixedDelta;
            }
        }
        
        // Render
        if (this.renderCallback) {
            const interpolation = this.accumulator / this.fixedDelta;
            this.renderCallback(interpolation);
        }
    }
    
    isPaused() {
        return this.paused;
    }
    
    isRunning() {
        return this.running;
    }
}

// Export as global
window.GameLoop = GameLoop;
