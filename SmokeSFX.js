var SmokeSFX = (function () {

    var states = {
        DOWN:     0,
        UP:       1,
        STRAIGHT: 3
    };

    var LIFE_TIME = .4;
    var UPDATE_RATE = 7;
    
    function SmokeSFX () {
        this.vy = -30;
        this.imperviousToShootingRay = false;
        this.inUse = false;
        this.lifeTime = 0;
        this.width = 16;
        this.height = 16;
        this.state = states.STRAIGHT;
        this.idleTimeDuration = Game.calculateFrameDuration(UPDATE_RATE);
        this.affectedByGravity = false;
        this.imperviousToShootingRay = false;

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    SmokeSFX.prototype = new Character();

    SmokeSFX.prototype.beforePositionUpdate = function (dt) {
        this.lifeTime += dt;
        if(this.lifeTime >= LIFE_TIME) {
            this.inUse = false;
            this.lifeTime = 0;
        }
    };

    SmokeSFX.prototype.spawn = function (x, y) {
        this.x = x - this.width * .5;
        this.y = y;
        this.inUse = true;
        this.lifeTime = 0;
        var animation = this.getAnimation();
        if(animation) { animation.reset(); }
    };

    SmokeSFX.prototype.render = function (viewportContext) {
        var animation = this.getAnimation();
        if(animation) {
            animation.render(viewportContext, Math.floor(this.x), Math.floor(this.y));
        }
    };

    SmokeSFX.prototype.switchToUp = function () {
        this.state = states.UP;
    };

    SmokeSFX.prototype.switchToDown = function () {
        this.state = states.DOWN;
    };

    SmokeSFX.prototype.switchToStraight = function () {
        this.state = states.STRAIGHT;
    };

    SmokeSFX.prototype.initAnimations = function () {
        this.animations[states.DOWN] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 3071
                },
                {
                    x: 3167
                }
            ],
            width:     this.width,
            height:    this.height,
            repeat:    false,
            frames:    2,
            animSpeed: UPDATE_RATE
        }));

        this.animations[states.UP] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 3103
                },
                {
                    x: 3199
                }
            ],
            width:     this.width,
            height:    this.height,
            repeat:    false,
            frames:    2,
            animSpeed: UPDATE_RATE
        }));

        this.animations[states.STRAIGHT] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 3135
                },
                {
                    x: 3231
                }
            ],
            width:     this.width,
            height:    this.height,
            repeat:    false,
            frames:    2,
            animSpeed: UPDATE_RATE
        }));
    };

    return SmokeSFX;
})();