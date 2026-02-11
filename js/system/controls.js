// Controls System
class ControlsManager {
    constructor() {
        this.keys = {};
        this.touches = {};
        this.mousePos = { x: 0, y: 0 };
        this.mouseDown = false;
        
        this.listeners = [];
        this.setupListeners();
    }
    
    setupListeners() {
        // Keyboard
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Mouse
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        
        // Touch
        window.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        window.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        window.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        
        // Prevent default behaviors
        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }
    
    handleKeyDown(e) {
        // Prevent default for game keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
            e.preventDefault();
        }
        
        this.keys[e.key] = true;
        this.keys[e.code] = true;
        
        this.notifyListeners('keydown', e);
    }
    
    handleKeyUp(e) {
        this.keys[e.key] = false;
        this.keys[e.code] = false;
        
        this.notifyListeners('keyup', e);
    }
    
    handleMouseMove(e) {
        this.mousePos.x = e.clientX;
        this.mousePos.y = e.clientY;
        
        this.notifyListeners('mousemove', e);
    }
    
    handleMouseDown(e) {
        this.mouseDown = true;
        this.notifyListeners('mousedown', e);
    }
    
    handleMouseUp(e) {
        this.mouseDown = false;
        this.notifyListeners('mouseup', e);
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            this.touches[touch.identifier] = {
                x: touch.clientX,
                y: touch.clientY,
                startX: touch.clientX,
                startY: touch.clientY
            };
        }
        
        this.notifyListeners('touchstart', e);
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        for (let i = 0; i < e.touches.length; i++) {
            const touch = e.touches[i];
            if (this.touches[touch.identifier]) {
                this.touches[touch.identifier].x = touch.clientX;
                this.touches[touch.identifier].y = touch.clientY;
            }
        }
        
        this.notifyListeners('touchmove', e);
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        for (let i = 0; i < e.changedTouches.length; i++) {
            const touch = e.changedTouches[i];
            delete this.touches[touch.identifier];
        }
        
        this.notifyListeners('touchend', e);
    }
    
    isKeyPressed(key) {
        return this.keys[key] || false;
    }
    
    isAnyKeyPressed(...keys) {
        return keys.some(key => this.isKeyPressed(key));
    }
    
    getMousePos() {
        return { ...this.mousePos };
    }
    
    isMouseDown() {
        return this.mouseDown;
    }
    
    getTouches() {
        return { ...this.touches };
    }
    
    hasTouches() {
        return Object.keys(this.touches).length > 0;
    }
    
    addEventListener(type, callback) {
        this.listeners.push({ type, callback });
    }
    
    removeEventListener(callback) {
        this.listeners = this.listeners.filter(l => l.callback !== callback);
    }
    
    notifyListeners(type, event) {
        this.listeners
            .filter(l => l.type === type)
            .forEach(l => l.callback(event));
    }
    
    reset() {
        this.keys = {};
        this.touches = {};
        this.mouseDown = false;
    }
    
    // Helper methods for game controls
    getHorizontalInput() {
        let input = 0;
        
        // Keyboard
        if (this.isAnyKeyPressed('ArrowLeft', 'a', 'A', 'KeyA')) {
            input -= 1;
        }
        if (this.isAnyKeyPressed('ArrowRight', 'd', 'D', 'KeyD')) {
            input += 1;
        }
        
        return input;
    }
    
    getVerticalInput() {
        let input = 0;
        
        // Keyboard
        if (this.isAnyKeyPressed('ArrowUp', 'w', 'W', 'KeyW')) {
            input -= 1;
        }
        if (this.isAnyKeyPressed('ArrowDown', 's', 'S', 'KeyS')) {
            input += 1;
        }
        
        return input;
    }
}

// Export as global
window.ControlsManager = ControlsManager;
