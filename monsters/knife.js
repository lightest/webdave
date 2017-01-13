var Knife = (function () {
    function Knife () {
        this.vx = 285;
        this.width = 16;
        this.height = 4;
        this.color = 'rgba(100, 100, 100, 1)';
        this.inUse = false;
        this.imperviousToShootingRay = false;

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    Knife.prototype = new Character();

    Knife.prototype.update = function (dt) {
        this.x += this.vx * this.direction * dt;
    };

    Knife.prototype.spawn = function (x, y) {
        this.x = x;
        this.y = y;
        this.inUse = true;
    };

    Knife.prototype.getAnimation = function () {
        // if(this.state != this.prevState) {
        //     this.animations[this.state].reset();
        // }

        if(this.directionIsRight()) {
            this.animations[0].switchOrigin(0);
        } else {
            this.animations[0].switchOrigin(1);
        }

        return this.animations[0];
    };

    Knife.prototype.render = function (viewportContext) {
        viewportContext.setFillStyle( this.color );
        viewportContext.fillRect( Math.floor(this.x), Math.floor(this.y), this.width, this.height );

        this.getAnimation().render(viewportContext, Math.floor(this.x), Math.floor(this.y));
    };

    Knife.prototype.resolveCollision = function (collided, dt) {
        if(collided instanceof SolidBody || collided instanceof Player){
            this.inUse = false;
        }

        if(collided instanceof SolidBody) {
            var spark = SFXPool.allocateSparkSFX()[0];
            var x = this.direction > 0 ? this.x + this.width : this.x;
            spark.spawn(x, this.y);
        }
    };

    Knife.prototype.initAnimations = function () {
        this.animations[0] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 1091,
                    y: 566,
                    offsetx: 0
                },
                {
                    x: 1108,
                    y: 566,
                    offsetx: 0
                }
            ],
            width:     16,
            height:    4,
            frames:    1,
            animSpeed: 1,
        }));
    };

    return Knife;
})();