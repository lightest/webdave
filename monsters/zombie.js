var Zombie = (function(){

    var states = {
        walking:    0,
        falling:    1,
        atacking:   2
        // downstairs: 3
    };

    var UPDATERATE = 5;   //how much frames per second this object should be updated
    var DOWNSAIRS_RATE = 3.5;
    var ATACK_RATE = 9;
    var REGULAR_DURATION = Game.calculateFrameDuration(UPDATERATE);
    var DOWNSTAIRS_DURATION = Game.calculateFrameDuration(DOWNSAIRS_RATE);
    var ATACK_DURATION = Game.calculateFrameDuration(ATACK_RATE);
    var CUSTOM_GRAVITY = 16;
    var VX = 80;
    var MIN_CHECKTARGET_TIMEOUT = .5;
    var MAX_CHECKTARGET_TIMEOUT = 1.5;
    var ATACK_HOLD_TIME = .12;
    var KILL_PADDING = 49;

    var VISION_DISTANCE = 270;

    function generateTimeout () {
        return Math.random() * (MAX_CHECKTARGET_TIMEOUT - MIN_CHECKTARGET_TIMEOUT) + MIN_CHECKTARGET_TIMEOUT;
    };

    function Zombie () {
        this.vx = 0;
        this.width = 35;
        this.height = 80;
        this.state = states.walking;
        this.stateLocked = false;
        this.target = null;
        this.hitPoints = 2;
        this.goreAmount = 4;
        this.score = 100;
        this.damaging = false;
        this.collidedWithPlayer = false;
        // this.nextStair = null;
        // this.canChangeToDownstairs = false;
        this.targetInRange = false;
        this.idleTimeDuration = REGULAR_DURATION;
        this.checkTargetTime = 0;
        this.checkTargetTimeout = 0;
        this.atackHoldTime = -1;

        this.downstairs = false;

        this.color = 'rgba(0,250,10,1)';

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    Zombie.prototype = new Character();

    //Overriding interface methods
    Zombie.prototype.applyVerticalSpeed = function (dt, newData) {
        newData.vy += world.gravity * dt;
        newData.y += CUSTOM_GRAVITY;
    };

    Zombie.prototype.bumpCallBack = function () {
        if(this.targetInRange && this.checkTargetTimeout == 0) {
            this.checkTargetTimeout = generateTimeout();
        }
    };

    Zombie.prototype.resetCustomData = function () {
        this.collidedWithPlayer = false;
    };

    Zombie.prototype.beforePositionUpdate = function (dt) {
        if(this.checkTargetTimeout > 0 && this.checkTargetTime < this.checkTargetTimeout) {
            this.checkTargetTime += dt;
        } else {
            this.checkTargetTime = 0;
            this.checkTargetTimeout = 0;
        }

        if(this.atackHoldTime >= 0 && this.atackHoldTime < ATACK_HOLD_TIME) {
            this.atackHoldTime += dt;
        } else if(this.atackHoldTime >= ATACK_HOLD_TIME) {
            this.atackHoldTime = -1;
            this.stateLocked = false;
            this.damaging = false;
            this.animations[states.atacking].reset();
        }

        if(this.damaging) {
            this.killZone = {
                x: this.direction > 0 ? this.x + this.width * .5 : this.x + this.width * .5 - KILL_PADDING,
                y: this.y,
                width: KILL_PADDING,
                height: this.height
            };

            if(boxCollides(this.target, this.killZone)) {
                Game.playerDeathByZombie(player);
            }
        }
    };

    Zombie.prototype.getAnimation = function () {
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

    Zombie.prototype.updateState = function () {
        if(this.idleTime > 0) { return; }

        if(this.stateLocked){ return; }

        if(this.vy > 0) {
            this.state = states.falling;
        } else {
            this.state = states.walking;
        }

        if(this.state == states.falling) {
            this.vx = 0;
            this.idleTimeDuration = DOWNSTAIRS_DURATION;
            return;
        } else {
            this.vx = VX;
            this.idleTimeDuration = REGULAR_DURATION;
        }

        if(this.collidedWithPlayer) {
            this.vx = 0;
            this.state = states.atacking;
            this.idleTimeDuration = ATACK_DURATION;
            this.stateLocked = true;
        }

        /*if(this.canChangeToDownstairs) {
            this.state = states.downstairs;
            this.vx = 0;
            this.idleTimeDuration = DOWNSTAIRS_DURATION;
        } else {
            this.idleTimeDuration = REGULAR_DURATION;
        }*/
    };

    Zombie.prototype.checkTarget = function (dt) {
        if(this.idleTime > 0) { return; }

        if(this.checkTargetTimeout) {
            return;
        }

        var distanceX = Math.floor( this.x - this.target.x );
        var distanceY = Math.floor( this.y - this.target.y );
        var distance = Math.floor( Math.sqrt( Math.pow(distanceX, 2) + Math.pow(distanceY, 2) ) );

        this.downstairs = false;

        if(distance < VISION_DISTANCE) {
            this.targetInRange = true;
            var targetBottom = this.target.y + this.target.height;
            var currentData = {
                y: this.y,
                vy: this.vy
            };
            this.applyVerticalSpeed(dt, currentData);
            var myFutureBottom = currentData.y + this.height;

            if(this.target.y > this.y && this.target.y < myFutureBottom ||
               targetBottom > this.y && targetBottom < myFutureBottom ) {
                distanceX > 0 ? this.leftDirection() : this.rightDirection();
            }

            if(targetBottom > myFutureBottom) {
                this.downstairs = true;
            }
        } else {
            this.targetInRange = false;
        }
    };

    Zombie.prototype.resolveCollision = function (collided, dt) {
        if(this.idleTime > 0) { return; }

        var reaction = null;

        if(collided instanceof SolidBody) {
            reaction = collided.getCollisionReaction(this);

            if(reaction.y != undefined && reaction.y <= this.y) {
                this.floor = collided;
            } else if(reaction.x + this.width == collided.x) {
                this.leftDirection();
                this.bumpCallBack();
            } else if (reaction.x == collided.x + collided.width) {
                this.rightDirection();
                this.bumpCallBack();
            }
        }

        if(collided instanceof Player) {
            this.collidedWithPlayer = true;
        }

        if(collided instanceof JumpableBody) {
            reaction = collided.getCollisionReaction(this);

            if(reaction.y != undefined && reaction.y <= this.y) {
                if(this.state != states.atacking && this.downstairs && this.x > collided.x && this.x + this.width < collided.x + collided.width) {
                    /*if(collided.staircase != null) {
                        this.nextStair = collided.staircase.getNextStair(collided.y);
                    }*/
                    return;
                }
                this.floor = collided;
            }
        }

        if(reaction) {
            this.applyReaction(reaction);
        }
    };

    Zombie.prototype.atackFinished = function () {
        this.atackHoldTime = 0;
    };

    Zombie.prototype.atackStarted = function () {
        this.damaging = true;
    };

    Zombie.prototype.initAnimations = function () {
        this.animations[states.walking] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 0,
                    y: 566,
                    offsetx: -6
                },
                {
                    x: 494,
                    y: 566,
                    offsetx: -8
                }
            ],
            width:     50,
            height:    80,
            frames:    4,
            animSpeed: UPDATERATE,
        }));

        this.animations[states.falling] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 988,
                    y: 566,
                    offsetx: -6
                }
            ],
            width:     50,
            height:    80,
            frames:    2,
            animSpeed: DOWNSAIRS_RATE,
        }));

        this.animations[states.atacking] = (new Sprite({
            img: this.spriteImg,
            origins:   [
                {
                    x: 200,
                    y: 566,
                    offsetx: -20
                },
                {
                    x: 694,
                    y: 566,
                    offsetx: -43
                }
            ],
            width:     98,
            height:    80,
            frames:    3,
            repeat:    false,
            animSpeed: ATACK_RATE,
            callbacks: [
                {
                    frame: 1,
                    cb:    this.atackStarted.bind(this)
                },
                {
                    frame: 2,
                    cb:    this.atackFinished.bind(this)
                }
            ]
        }));

        // this.animations[states.downstairs] = (new Sprite({
        //     img: this.spriteImg,
        //     origins:   [
        //         {
        //             x: 988,
        //             offsetx: 0
        //         }
        //     ],
        //     width:     50,
        //     height:    80,
        //     frames:    2,
        //     animSpeed: DOWNSAIRS_RATE
        // }));
    };

    return Zombie;
})();