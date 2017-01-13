/*
 * @desc: holds sprite image source object
 *        defines the frames and the animation speed
 */

var Sprite = (function () {
    function Sprite (opts) {
        this.finished = false;
        this.img = opts.img || null;
        this.width = opts.width || 0;
        this.height = opts.height || 0;
        this.frames = opts.frames || 0;
        this.repeat = opts.repeat != undefined ? opts.repeat : true;

        this.currentFrame = 0;
        this.frameTime = 0;
        this.frameDuration = Game.calculateFrameDuration(opts.animSpeed || 60);

        this.origins = [];
        this.currentOrigin = 0;

        for(var i = 0; i < opts.origins.length; i++){
            var origin = {
                x:       opts.origins[i].x || 0,
                y:       opts.origins[i].y || 0,
                offsetx: opts.origins[i].offsetx || 0,
                offsety: opts.origins[i].offsety || 0
            };
            this.origins.push(origin);
        }

        this.callbacks = [];
        var len = opts.callbacks ? opts.callbacks.length : 0;
        for(var i = 0; i < len; i++){
            if(typeof opts.callbacks[i].cb === 'function'){
                this.callbacks[opts.callbacks[i].frame] = opts.callbacks[i].cb;
            }
        }
    };

    Sprite.prototype.reset = function () {
        this.finished = false;
        this.currentFrame = 0;
        this.frameTime = 0;
    };

    Sprite.prototype.update = function (dt) {
        if(this.finished) { return; }

        this.frameTime += dt;

        if(this.frameTime >= this.frameDuration) {
            if(this.callbacks[this.currentFrame]) {
                this.callbacks[this.currentFrame]();
            }

            this.frameTime = 0;

            if(this.currentFrame == this.frames - 1){
                if(!this.repeat){
                    this.finished = true;
                    return;
                }
                this.currentFrame = 0
            } else {
                this.currentFrame++;
            }
        }
    };

    Sprite.prototype.switchOrigin = function (origin, reset) {
        if(reset){
            this.reset();
        }

        if(origin > this.origins.length - 1) {
            origin = this.origins.length - 1;
        } else if(origin < 0) {
            origin = 0;
        }

        this.currentOrigin = origin;
    };

    Sprite.prototype.render = function (viewportContext, dx, dy) {
        var origin = this.origins[this.currentOrigin];
        var x = origin.x + this.width * this.currentFrame;
        dx = Math.floor(dx);
        dy = Math.floor(dy);
        viewportContext.drawImage(this.img, x, origin.y, this.width, this.height, dx + origin.offsetx, dy + origin.offsety, this.width, this.height);
    };

    return Sprite;
})();