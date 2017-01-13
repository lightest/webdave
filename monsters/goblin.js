var Goblin = (function(){

    var states = {
        walking:    0,
        falling:    1,
        atacking:   2,
    };

    var UPDATERATE = 9;
    var ATACK_RATE = 10;
    var REGULAR_DURATION = Game.calculateFrameDuration(UPDATERATE);
    var ATACK_DURATION = Game.calculateFrameDuration(ATACK_RATE);
    var VX = 135;
    var CUSTOM_GRAVITY = 16;
    var CHANCE_TIMEOUT = .5; //sec
    var ATACK_HOLD_TIME = .192;

    var KNIFE_SPAWN_OFFSET_X = 5;
    var KNIFE_SPAWN_OFFSET_Y = 6;
    var KNIFE_THROW_MIN_DIST = 150;

    var visionDistance = 600;
    var BASE_THROW_CHANCE = .5;

    function Goblin () {
        this.vx = 0;
        this.width = 30;
        this.height = 48;
        this.hitPoints = 2;
        this.score = 100;
        this.state = states.walking;
        this.stateLocked = false;
        this.target = null;
        this.edgeDistance = 0;
        this.targetInRange = false;

        this.idleTimeDuration = REGULAR_DURATION
        this.idleTime = 0;
        this.atackHoldTime = -1;
        this.chanceTime = 0;

        this.color = 'rgba(0,150,10,1)';

        this.sounds = {
            throwKnife: resources.get('throwKnife')
        };

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    Goblin.prototype = new Character();

    Goblin.prototype.updateState = function () {
        if(this.idleTime > 0) { return; }

        if(this.stateLocked){ return; }

        this.idleTimeDuration = REGULAR_DURATION;

        if(this.vy > 0) {
            this.state = states.falling;            
        } else {
            this.state = states.walking;
        }

        if(this.state == states.falling) {
            this.vx = 0;
            return;
        } else {
            this.vx = VX;
        }
    };

    Goblin.prototype.applyVerticalSpeed = function (dt, newData) {
        newData.vy += world.gravity * dt;
        newData.y += CUSTOM_GRAVITY;
    };

    Goblin.prototype.getAnimation = function () {
        // if(this.state != this.prevState) {
        //     this.animations[this.state].reset();
        // }

        if(this.directionIsRight()) {
            this.animations[this.state].switchOrigin(0);
        } else {
            this.animations[this.state].switchOrigin(1);
        }

        return this.animations[this.state];
    };

    Goblin.prototype.beforePositionUpdate = function (dt) {
        if(this.atackHoldTime >= 0 && this.atackHoldTime < ATACK_HOLD_TIME) {
            this.atackHoldTime += dt;
        } else if(this.atackHoldTime >= ATACK_HOLD_TIME) {
            this.atackHoldTime = -1;
            this.stateLocked = false;
            this.animations[states.atacking].reset();
            this.throwKnife();
        }
    };

    Goblin.prototype.throwKnife = function () {
        var knife = SFXPool.allocateKnives()[0];
        var spawnx = 0;
        var spawny = this.y + KNIFE_SPAWN_OFFSET_Y;
        if(!knife) { return; }
        if(this.directionIsLeft()){
            knife.leftDirection();
            spawnx = this.x - KNIFE_SPAWN_OFFSET_X;
        } else {
            knife.rightDirection();
            spawnx = this.x + this.width + KNIFE_SPAWN_OFFSET_X;
        }
        knife.spawn(spawnx, spawny);
    };

    Goblin.prototype.checkTarget = function (dt) {
        if(!this.floor || this.stateLocked) { return; }

        var distanceX = Math.floor( this.x - this.target.x );
        var distanceY = Math.floor( this.y - this.target.y );
        var distance = Math.floor( Math.sqrt( Math.pow(distanceX, 2) + Math.pow(distanceY, 2) ) );

        if(distance <= visionDistance) {
            this.targetInRange = true;
            var knifeThrowY = this.y + KNIFE_SPAWN_OFFSET_Y;
            var targetBottom = this.target.y + this.target.height;

            if(this.chanceTime != 0 && this.chanceTime <= CHANCE_TIMEOUT) {
                this.chanceTime += dt;
                return;
            } else {
                this.chanceTime = 0;
            }

            if(this.target.y <= knifeThrowY && targetBottom >= knifeThrowY && distance >= KNIFE_THROW_MIN_DIST) {
                var throwChance = (distance / visionDistance) * BASE_THROW_CHANCE;
                var rnd = Math.random();
                var p_dist = Math.abs(rnd - throwChance);
                if( p_dist <= .2 ) {
                    distanceX > 0 ? this.leftDirection() : this.rightDirection();
                    this.vx = 0;
                    this.stateLocked = true;
                    this.state = states.atacking;
                    this.idleTimeDuration = ATACK_DURATION;
                    audioAPI.playSound(this.sounds.throwKnife);
                }

                this.chanceTime += dt;
            }
        } else {
            this.targetInRange = false;
        }
    };

    Goblin.prototype.resolveCollision = function (collided, dt) {
        if(this.idleTime > 0) { return; }
        var reaction = null;

        if(collided instanceof SolidBody || collided instanceof JumpableBody) {
            reaction = collided.getCollisionReaction(this);

            if(reaction.y != undefined && reaction.y <= this.y) {
                this.floor = collided;
            } else if(reaction.x + this.width == collided.x) {
                this.leftDirection();
            } else if (reaction.x == collided.x + collided.width) {
                this.rightDirection();
            }
        }

        if(reaction) {
            this.applyReaction(reaction);
        }
    };

    Goblin.prototype.atackFinished = function () {
        this.atackHoldTime = 0;
    };

    Goblin.prototype.initAnimations = function () {
        this.animations[states.walking] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 1124,
                    y: 566,
                    offsetx: -7
                },
                {
                    x: 1318,
                    y: 566,
                    offsetx: -10
                }
            ],
            width:     48,
            height:    48,
            frames:    4,
            animSpeed: UPDATERATE,
        }));

        this.animations[states.falling] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 1124,
                    y: 566,
                    offsetx: -7
                },
                {
                    x: 1318,
                    y: 566,
                    offsetx: -10
                }
            ],
            width:     48,
            height:    48,
            frames:    1,
            animSpeed: UPDATERATE,
        }));

        this.animations[states.atacking] = (new Sprite({
            img: this.spriteImg,
            origins:   [
                {
                    x: 1510,
                    y: 566,
                    offsetx: -15
                },
                {
                    x: 1744,
                    y: 566,
                    offsetx: -27
                }
            ],
            width:     78,
            height:    48,
            frames:    3,
            repeat:    false,
            animSpeed: ATACK_RATE,
            callbacks: [
                {
                    frame: 2,
                    cb: this.atackFinished.bind(this)
                }
            ]
        }));
    };

    return Goblin;
})();