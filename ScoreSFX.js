var ScoreSFX = (function () {

    var LIFE_TIME = 1;
    var ONE_UP_LIFE_TIME = 2;
    
    function ScoreSFX () {
        this.vy = -50;
        this.score = 0;
        this.imperviousToShootingRay = false;
        this.inUse = false;
        this.lifeTime = 0;

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    ScoreSFX.prototype = new BasicObject();

    ScoreSFX.prototype.update = function (dt) {
        this.y += this.vy * dt;
        this.lifeTime += dt;
        var lifetime = this.score == 1 ? ONE_UP_LIFE_TIME : LIFE_TIME;
        if(this.lifeTime >= lifetime) {
            this.inUse = false;
            this.lifeTime = 0;
        }
    };

    ScoreSFX.prototype.spawn = function (x, y) {
        this.x = x;
        this.y = y;
        this.inUse = true;
        this.lifeTime = 0;
    };

    ScoreSFX.prototype.render = function (viewportContext) {
        if(Game.debugSettings.drawStats) {
            viewportContext.fillText(this.score, this.x, this.y);
        }
        var animation = this.animations[this.score];
        if(animation) {
            animation.render(viewportContext, Math.floor(this.x), Math.floor(this.y));
        }
    };

    ScoreSFX.prototype.initAnimations = function () {
        this.animations[100] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2781
                }
            ],
            width:     48,
            height:    32,
            frames:    1,
            animSpeed: 60
        }));

        this.animations[200] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2829
                }
            ],
            width:     48,
            height:    32,
            frames:    1,
            animSpeed: 60
        }));

        this.animations[400] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2877
                }
            ],
            width:     48,
            height:    32,
            frames:    1,
            animSpeed: 60
        }));

        this.animations[1] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 3021
                }
            ],
            width:     48,
            height:    32,
            frames:    1,
            animSpeed: 60
        }));
    };

    return ScoreSFX;
})();