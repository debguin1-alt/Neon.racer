// Collision Detection System
class CollisionSystem {
    constructor() {
        this.collisions = [];
    }
    
    // AABB (Axis-Aligned Bounding Box) collision
    checkAABB(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // Circle collision
    checkCircle(circle1, circle2) {
        const dx = circle1.x - circle2.x;
        const dy = circle1.y - circle2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < circle1.radius + circle2.radius;
    }
    
    // Circle vs Rectangle collision
    checkCircleRect(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < circle.radius;
    }
    
    // Point in rectangle
    pointInRect(point, rect) {
        return point.x >= rect.x &&
               point.x <= rect.x + rect.width &&
               point.y >= rect.y &&
               point.y <= rect.y + rect.height;
    }
    
    // Get all collisions between two arrays of objects
    checkAllCollisions(objects1, objects2) {
        const collisions = [];
        
        for (let i = 0; i < objects1.length; i++) {
            for (let j = 0; j < objects2.length; j++) {
                if (this.checkAABB(objects1[i], objects2[j])) {
                    collisions.push({
                        obj1: objects1[i],
                        obj2: objects2[j],
                        index1: i,
                        index2: j
                    });
                }
            }
        }
        
        return collisions;
    }
    
    // Spatial partitioning helper (simple grid-based)
    createGrid(width, height, cellSize) {
        return {
            width,
            height,
            cellSize,
            cols: Math.ceil(width / cellSize),
            rows: Math.ceil(height / cellSize),
            cells: {}
        };
    }
    
    getCellKey(x, y, grid) {
        const col = Math.floor(x / grid.cellSize);
        const row = Math.floor(y / grid.cellSize);
        return `${col},${row}`;
    }
    
    insertIntoGrid(obj, grid) {
        const key = this.getCellKey(obj.x + obj.width / 2, obj.y + obj.height / 2, grid);
        if (!grid.cells[key]) {
            grid.cells[key] = [];
        }
        grid.cells[key].push(obj);
    }
    
    getNearbyObjects(obj, grid) {
        const nearby = [];
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        
        // Check current cell and adjacent cells
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const x = centerX + dx * grid.cellSize;
                const y = centerY + dy * grid.cellSize;
                const key = this.getCellKey(x, y, grid);
                
                if (grid.cells[key]) {
                    nearby.push(...grid.cells[key]);
                }
            }
        }
        
        return nearby;
    }
    
    clearGrid(grid) {
        grid.cells = {};
    }
}

// Export as global
window.CollisionSystem = CollisionSystem;
