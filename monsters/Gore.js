var Gore = (function () {

    var LIFE_TIME = .7;

    var states = {
        falling: 0,
        rising:  1,
        lying:   2
    };

    function initAnimations () {
        this.animations[states.falling] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2354,
                },
                {
                    x: 2414,
                }
            ],
            width:     30,
            height:    28,
            frames:    2,
            animSpeed: 10,
        }));

        this.animations[states.rising] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2234,
                },
                {
                    x: 2294,
                }
            ],
            width:     30,
            height:    28,
            frames:    2,
            animSpeed: 10,
        }));

        this.animations[states.lying] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2474,
                }
            ],
            width:     32,
            height:    28,
            frames:    1,
            animSpeed: 10,
        }));
    };

    function Gore () {
        this.width = 32;
        this.height = 28;
        this.inUse = false;
        this.layingCounter = 0;
        this.state = states.rising;
        this.imperviousToShootingRay = false;
        this.color = 'cyan';

        this.animations = [];
        this.spriteImg = resources.get('player');

        initAnimations.call(this);
    };

    Gore.prototype = new Character();

    Gore.prototype.spawn = function (x, y, vx, vy) {
        this.x = x;
        this.y = y;
        this.vx = vx || 150;
        this.vy = vy || 0;
        this.inUse = true;
        this.layingCounter = 0;
    };

    Gore.prototype.updateState = function () {
        this.prevState = this.state;

        if(this.vy < 0) {
            this.state = states.rising;
        } else if(this.vy > 0){
            this.state = states.falling;
        } else {
            this.state = states.lying;
        }
    };

    Gore.prototype.resolveCollision = function (collided, dt) {
        var reaction = null;
        if(collided instanceof SolidBody || collided instanceof JumpableBody) {
            reaction = collided.getCollisionReaction(this);
        }

        if(reaction) {
            if(reaction.y != undefined && reaction.y <= this.y) {
                this.vx = 0;
                this.layingCounter += dt;
                if(this.layingCounter >= LIFE_TIME) {
                    this.inUse = false;
                    this.layingCounter = 0;
                }
            } else if (reaction.x != undefined) {
                this.vx *= .5;
                this.switchDirection();
            }

            this.applyReaction(reaction, {ignorvx: true});
        }
    };

    Gore.prototype.getAnimation = function () {
        if(this.state != this.prevState) {
            this.animations[this.state].reset();
        }

        if(this.directionIsRight()) {
            this.animations[this.state].switchOrigin(0);
        } else {
            this.animations[this.state].switchOrigin(1);
        }

        return this.animations[this.state];
    };

    return Gore;
})();