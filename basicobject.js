var BasicObject = (function () {
    
    function BasicObject() {
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.trackedByCamera = false;
        this.imperviousToShootingRay = true;
    }

    BasicObject.prototype.update = function (dt) {};

    BasicObject.prototype.render = function (viewportContext) {};

    BasicObject.prototype.resolveCollision = function (collided, dt) {};

    BasicObject.prototype.getLinesForm = function () {
        return [
            {
                a: {x: this.x, y: this.y},
                b: {x: this.x + this.width, y: this.y}
            },
            {
                a: {x: this.x + this.width, y: this.y},
                b: {x: this.x + this.width, y: this.y + this.height}
            },
            {
                a: {x: this.x + this.width, y: this.y + this.height},
                b: {x: this.x, y: this.y + this.height}
            },
            {
                a: {x: this.x, y: this.y + this.height},
                b: {x: this.x, y: this.y}
            }
        ];
    };

    BasicObject.prototype.getRightX = function () {
        return this.x + this.width;
    };

    BasicObject.prototype.getBottomY = function () {
        return this.y + this.height;
    };

    BasicObject.prototype.setPos = function (x, y) {
        if(typeof x != 'number' && typeof y != 'number') { console.log('ERR: x and y must be numbers'); return; }
        this.x = x;
        this.y = y;
    };

    return BasicObject;
})();