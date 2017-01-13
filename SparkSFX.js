var SparkSFX = (function () {

    var LIFE_TIME = .12;
    var WIDTH = 28;
    var HEIGHT = 24;
    
    function SparkSFX () {
        this.imperviousToShootingRay = false;
        this.inUse = false;
        this.lifeTime = 0;

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    SparkSFX.prototype = new BasicObject();

    SparkSFX.prototype.update = function (dt) {
        this.lifeTime += dt;
        if(this.lifeTime >= LIFE_TIME) {
            this.inUse = false;
            this.lifeTime = 0;
        }
    };

    SparkSFX.prototype.spawn = function (x, y) {
        this.x = x - WIDTH * .5;
        this.y = y - HEIGHT * .5;
        this.inUse = true;
        this.lifeTime = 0;
    };

    SparkSFX.prototype.render = function (viewportContext) {
        var animation = this.animations[0];
        if(animation) {
            animation.render(viewportContext, Math.floor(this.x), Math.floor(this.y));
        }
    };

    SparkSFX.prototype.initAnimations = function () {
        this.animations[0] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2510
                }
            ],
            width:     WIDTH,
            height:    HEIGHT,
            frames:    1,
            animSpeed: 60
        }));
    };

    return SparkSFX;
})();