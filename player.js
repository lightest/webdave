var Player = (function () {

    function ShootingRay () {
        this.a = { x: 0, y: 0 };
        this.b = { x: 0, y: 0 };
    };

    function buildShootingRays () {
        var rays = [];
        for(var i = 0; i < 3; i++) {
            rays.push(new ShootingRay());
        }

        return rays;
    };

    function oneUp (object) {
        davesLeft++;
        var scoresfx = SFXPool.allocateScoreSFX()[0];
        scoresfx.score = 1;
        scoresfx.spawn(object.x, object.y - 35);
        audioAPI.playSound(this.sounds.oneUp, false);
    };

    var states = {
        standing:      0,
        falling:       1,
        jumping:       2,
        running:       3,
        aimup:         4,
        aimdown:       5,
        aimstraight:   6,
        reloading:     7,
        floating:      8,
        shootUp:       9,
        shootDown:     10,
        shootStraight: 11,
        openingDoor:   12,
        enteringDoor:  13
    };

    var davesLeft = 3;

    var smokeSpawnOffsets = {
        up: {
            x: 27,
            y: -16,
        },
        down: {
            x: 38,
            y: 31,
        },
        straight: {
            x: 40,
            y: 5
        }
    };

    var VX            = 200;
    var JUMP_SPEED_0  = -315;
    var AIR_DRAG      = 1500;
    var floatingSpeed = -200;
    var FALLITIMEOUT  = .7; //just for sake of replica quality (dave moves his legs while falling)
    var JUMP_TIME     = .208;
    var IDLETIMEOUT   = .4;
    var RECOIL        = 500;
    var JUMP_SHIFT    = 250;
    var MAXAMMO       = 8;
    var RIGHTOFFSET   = -4;
    var LEFTOFFSET    = -14;
    var ammoOffset    = 20;


    function Player() {
        this.width = 30;
        this.height = 64;
        this.recoil = 0;
        this.ammo = 8;
        this.jumpSpeed = 0;
        this.idleTime = 0;
        this.fallingTime = -1;
        this.jumpTime = -1;
        this.state = states.standing;
        this.prevState = this.state;
        this.stateLocked = false;
        this.shooting = false;
        this.grounded = true;
        this.downstairs = false;
        this.prevy = 0;
        this.imperviousToShootingRay = false;
        this.facedWardrobe = null;
        this.facedPortal = null;
        this.shootingRays = buildShootingRays();
        this.hitPoint = null; // preserved only for debug ray rendering
        this.hitPoints = [];
        this.canPlayCeilBump = true;
        this.airDrag = 0;

        this.sounds = {
            shoot:    resources.get('shoot'),
            reload:   resources.get('reload'),
            jump:     resources.get('jump'),
            land:     resources.get('land'),
            ceilBump: resources.get('ceilBump'),
            shoothit: resources.get('shoothit'),
            doorOpen: resources.get('doorOpen'),
            oneUp:    resources.get('oneUp'),
            noAmmo:   resources.get('noAmmo')
        };

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.ammoAnimations = [];

        this.initAnimations();
    };

    Player.prototype = new Character();

    Player.prototype.setInitialPosition = function(x, y) {
        if(!x || !y) { return; }
            
        this.x = x;
        this.y = y;

        this.rightDirection();
    };

    Player.prototype.update = function(dt) {
        var animation = this.getAnimation();

        if(!this.stateLocked && this.state != states.aimdown && this.state != states.falling && keyboard.pressed[keyboard.keys.SPACE] && this.jumpTime < JUMP_TIME) {
            if(this.grounded) {
                audioAPI.playSound(this.sounds.jump, true, true);
            }
            this.jumpSpeed = JUMP_SPEED_0 - world.getMaxVY() - world.gravity * dt;
            this.jumpTime += dt;
        } else if(!keyboard.pressed[keyboard.keys.SPACE]) {
            if(this.grounded) {
                this.jumpTime = 0;
                this.airDrag = 0;
            } else {
                this.jumpTime = JUMP_TIME;
            }
        }

        if(keyboard.pressed[keyboard.keys.LEFT]) {
            if(this.grounded) {
                this.vx = -VX;
                this.airDrag = -VX;
            } else {
                this.airDrag = Math.max(-VX, this.airDrag - AIR_DRAG * dt);
                this.vx = this.airDrag;
            }
            if(this.directionIsRight()) {
                if(this.state == states.running) {
                    animation.reset();
                }
                if(this.vx <= 0) {
                    this.leftDirection();
                }
            }
        } else if(keyboard.pressed[keyboard.keys.RIGHT]) {
            if(this.grounded) {
                this.vx = VX;
                this.airDrag = VX;
            } else {
                this.airDrag = Math.min(VX, this.airDrag + AIR_DRAG * dt);
                this.vx = this.airDrag;
            }
            if(this.directionIsLeft()) {
                if(this.state == states.running) {
                    animation.reset();
                }
                if(this.vx >= 0) {
                    this.rightDirection();    
                }
            }
        } else {
            this.vx = 0;
        }

        if(this.vy == 0 && (keyboard.pressed[keyboard.keys.UP] || keyboard.pressed[keyboard.keys.DOWN])) {
            this.vx = 0;
        }

        if(this.vy == 0) {
            if(this.stateLocked) {
                this.vx = 0;
            }
        }

        if(this.shooting) {
            this.stopShoot();
        }

        if(this.state == states.standing || this.state == states.reloading) {
            this.idleTime += dt;
        } else {
            this.idleTime = 0;
        }

        if(this.fallingTime >= 0 && this.state == states.falling) {
            this.fallingTime += dt;
        }

        animation.update(dt);

        this.vx += this.recoil;

        if(!this.grounded) {
            this.jumpSpeed = Math.min(0, this.jumpSpeed + world.gravity * dt);
        }
        this.vy = world.getMaxVY() + this.jumpSpeed;
        debug.update('player vy', this.vy | 0);

        this.prevx = this.x;
        this.prevy = this.y;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.recoil = 0;
    };

    Player.prototype.updateState = function(dt) {
        this.prevState = this.state;

        if(this.stateLocked) { return; }

        this.downstairs = false;

        if(this.vy < floatingSpeed) {
            this.state = states.jumping;
            this.grounded = false;
        } else if((this.vy < 0 && this.vy >= floatingSpeed) || (this.fallingTime >= FALLITIMEOUT && this.vy > 0)) {
            this.state = states.floating;
            this.grounded = false;
        } else if(this.vy > 0){
            this.state = states.falling;
            this.grounded = false;
            if(this.fallingTime == -1) {
                this.fallingTime = 0;
            }
        } else if(this.grounded) {
            this.state = states.standing;
            this.fallingTime = -1;
        }

        if(this.state == states.falling || this.state == states.jumping || this.state == states.floating) { return; }

        if(this.idleTime >= IDLETIMEOUT && this.ammo < MAXAMMO) {
            this.state = states.reloading;
        }

        if(keyboard.pressed[keyboard.keys.DOWN] && keyboard.pressed[keyboard.keys.SPACE]){
            this.downstairs = true;
        }

        if(this.vx != 0) {
            this.state = states.running;
        }

        if(keyboard.pressed[keyboard.keys.UP]) {
            if(this.facedWardrobe) {
                this.state = states.openingDoor;
                this.stateLocked = true;
            } else if(this.facedPortal) {
                if(this.facedPortal.isOpened()) {
                    this.state = states.enteringDoor;
                } else {
                    this.state = states.openingDoor;
                }
                this.stateLocked = true;
            } else {
                this.state = states.aimup;
            }
        } else if(keyboard.pressed[keyboard.keys.DOWN]) {
            this.state = states.aimdown;
        }

        if(keyboard.pressed[keyboard.keys.ALT]) {
            if(!this.shooting){
                if(this.state == states.aimup) {
                    this.state = states.shootUp;
                } else if (this.state == states.aimdown) {
                    this.state = states.shootDown;
                } else {
                    this.state = states.shootStraight;
                }
            }
        } else {
            this.shooting = false;
        }

        if(this.state == states.shootUp || this.state == states.shootDown || this.state == states.shootStraight) {
            if(this.state == states.shootStraight) {
                this.stateLocked = true;
            } else {
                this.shooting = true;
                this.stateLocked = true;
                this.shoot();
            }
        }
    };

    Player.prototype.getShootingRays = function () {
        if(this.shootingRays[0].b.x == this.shootingRays[0].a.x) {
            return null;
        }
        return this.shootingRays;
    };

    Player.prototype.shoot = function () {
        if(this.ammo == 0) {
            audioAPI.playSound(this.sounds.noAmmo);
            this.stateLocked = false;
            return false;
        }

        // if(this.directionIsRight()) {
        //     this.recoil = -500;
        // } else {
        //     this.recoil = 500;
        // }

        var x = 0, y = 0;
        var smokeSFX = SFXPool.allocateSmokeSFX()[0];
        if(this.state == states.shootUp) {
            smokeSFX.switchToUp();
            x = this.x + this.width * .5 + smokeSpawnOffsets.up.x * this.direction;
            y = this.y + smokeSpawnOffsets.up.y;
        } else if (this.state == states.shootDown) {
            smokeSFX.switchToDown();
            x = this.x + this.width * .5 + smokeSpawnOffsets.down.x * this.direction;
            y = this.y + smokeSpawnOffsets.down.y;
        } else if (this.state == states.shootStraight) {
            smokeSFX.switchToStraight();
            x = this.x + this.width * .5 + smokeSpawnOffsets.straight.x * this.direction;
            y = this.y + smokeSpawnOffsets.straight.y;
        }

        if(this.directionIsRight()) {
            smokeSFX.rightDirection();
        } else {
            smokeSFX.leftDirection();
        }

        smokeSFX.spawn(x, y);

        this.ammo--;
        for(var i = 0; i < this.shootingRays.length; i++) {
            this.shootingRays[i].a.x = this.x + this.width * .5;
            this.shootingRays[i].b.x = this.shootingRays[i].a.x + this.direction;
        }
        
        if(this.state == states.shootUp || this.state == states.aimup) {
            for(var i = 0; i < this.shootingRays.length; i++) {
                this.shootingRays[i].a.y = this.y + this.height * .3;
                this.shootingRays[i].b.y = this.shootingRays[i].a.y - (.9 - .2 * i);
            }
        } else if(this.state == states.shootDown || this.state == states.aimdown) {
            for(var i = 0; i < this.shootingRays.length; i++) {
                this.shootingRays[i].a.y = this.y + this.height * .45;
                this.shootingRays[i].b.y = this.shootingRays[i].a.y + (.3 + .15 * i);
            }
        } else if(this.state == states.shootStraight || this.state == states.running || this.state == states.standing) {
            for(var i = 0; i < this.shootingRays.length; i++) {
                this.shootingRays[i].a.y = this.y + this.height * .45;
                this.shootingRays[i].b.y = this.shootingRays[i].a.y - (.01 - .01 * i);
            }
        }

        return true;
    };

    Player.prototype.shootSuccess = function (hitPoint, hitPoints) {
        if(!hitPoint) {
            return;
        }

        var spark = SFXPool.allocateSparkSFX()[0];
        spark.spawn(hitPoint.x, hitPoint.y);
        //play successshoot sound
        this.hitPoint = hitPoint;
        this.hitPoints = hitPoints;
        audioAPI.playSound(this.sounds.shoothit);
    };

    Player.prototype.shootFail = function () {
        audioAPI.playSound(this.sounds.shoot);
    };

    Player.prototype.stopShoot = function () {
        for(var i = 0; i < this.shootingRays.length; i++) {
            this.shootingRays[i].b.x = this.shootingRays[i].a.x;
            this.shootingRays[i].b.y = this.shootingRays[i].a.y;
        }
    };

    Player.prototype.shootFinishedCallBack = function () {
        this.stateLocked = false;
    };

    Player.prototype.shootrecoilCallBack = function () {
        if(this.directionIsRight()) {
            this.recoil = -RECOIL;
        } else {
            this.recoil = RECOIL;
        }
    };

    Player.prototype.shootStraightCallBack = function () {
        this.shooting = true;
        if( this.shoot() ) {
            this.shootrecoilCallBack();
        }
    };

    Player.prototype.openedDoorCallBack = function () {
        if(this.facedWardrobe) {
            this.facedWardrobe.open();
            this.facedWardrobe = null;
        } else if(this.facedPortal) {
            this.facedPortal.open();
            this.facedPortal = null;
        }
        audioAPI.playSound(this.sounds.doorOpen);
        this.stateLocked = false;
    };

    Player.prototype.enterDoorCallBack = function () {
        if(this.facedPortal.exit != null) {
            this.stateLocked = false;
        }
        
        if(this.facedPortal) {
            this.facedPortal.enter(this);
            this.facedPortal = null;
        }
    };

    Player.prototype.reloadGun = function () {
        if(this.ammo == MAXAMMO) { return; }
        this.ammo++;
        audioAPI.playSound(this.sounds.reload);
    };

    Player.prototype.renderRay = function (viewportContext, ray) {
        viewportContext.setStrokeStyle('red');
        viewportContext.getContext().beginPath();
        viewportContext.moveTo(Math.floor(ray.a.x), Math.floor(ray.a.y));
        viewportContext.lineTo(Math.floor(ray.b.x), Math.floor(ray.b.y));
        viewportContext.getContext().closePath();
        viewportContext.getContext().stroke();
    };

    Player.prototype.getAnimation = function () {
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

    Player.prototype.getAmmoAnimation = function () {
        return this.ammoAnimations[this.ammo];
    };

    Player.prototype.render = function(viewportContext) {
        if(Game.debugSettings.drawStats) {
            viewportContext.setFillStyle( 'black' );
            viewportContext.fillText( 'state: ' + this.state, Math.floor(this.x), Math.floor(this.y) - 15 );
            viewportContext.fillText( 'direction: ' + this.direction, Math.floor(this.x), Math.floor(this.y) - 3 );
        }
        
        if(Game.debugSettings.drawBoundingBox) {
            viewportContext.setFillStyle( 'rgba(0,250,200,1)' );
            viewportContext.fillRect( Math.floor(this.x), Math.floor(this.y), this.width, this.height );
        }

        if(Game.debugSettings.drawBoundingBox && this.hitPoint != null) {
            for(var i = 0; i < this.hitPoints.length; i++) {
                this.renderRay(viewportContext, {a: this.shootingRays[i].a, b: this.hitPoints[i]});
            }
            this.hitPoints = [];
            // this.renderRay(viewportContext, {a: this.shootingRays.a, b: this.hitPoint});
            // this.hitPoint = null;
        }

        this.getAnimation().render(viewportContext, this.x, this.y);
        var viewportContextBounds = viewportContext.getBounds();
        this.getAmmoAnimation().render(viewportContext, viewportContextBounds.x, viewportContextBounds.y);
    };

    Player.prototype.obtainScore = function (object) {
        if(!object || object.score == undefined) { return; }

        if(object.score == 1) {
            oneUp.call(this, object);
        } else {
            this.score += object.score;
            var scoresfx = SFXPool.allocateScoreSFX()[0];
            scoresfx.score = object.score;
            scoresfx.spawn(object.x, object.y);

            if(this.score % 10000 == 0) {
                oneUp.call(this, object);
            }
        }
    };

    Player.prototype.resolveCollision = function(collided, dt) {
        var landed = false;
        var reaction = null;
        var reactionConfig = {
            ignorx: false,
            ignory: false,
            ignorvx: false,
            ignorvy: false
        };

        if(collided instanceof Knife) {
            Game.playerDeathByKnife(this);
            return;
        }

        if(collided instanceof SolidBody) {
            reaction = collided.getCollisionReaction(this);

            if(reaction.y != undefined && reaction.y <= this.y && collided.y > this.y) {
                if(!this.grounded) {
                    landed = true;
                    this.grounded = true;
                }
            } else if (reaction.y != undefined && reaction.y > this.y && collided.y < this.y) {
                this.grounded = false;
                reactionConfig.ignorvy = true;
                this.jumpSpeed = -world.getMaxVY();
                if(this.canPlayCeilBump) {
                    this.canPlayCeilBump = false;
                    audioAPI.playSound(this.sounds.ceilBump, true, false, function () { player.canPlayCeilBump = true; });
                }
            }
        }

        if(collided instanceof JumpableBody) {
            if(this.downstairs) {
                return;
            }

            reaction = collided.getCollisionReaction(this);

            if(reaction.y != undefined && reaction.y <= this.y) {
                if(!this.grounded) {
                    landed = true;
                    this.grounded = true;
                }
            }
        }

        if(collided instanceof Wardrobe) {
            if((this.state == states.standing || this.state == states.running) && keyboard.pressed[keyboard.keys.UP] && !collided.isOpened() && this.x >= collided.x) {
                this.facedWardrobe = collided;
                reaction = collided.getCollisionReaction(this);
            }
        }

        if(collided instanceof Teleport) {
            if((this.state == states.standing || this.state == states.running) && keyboard.pressed[keyboard.keys.UP] && this.x >= collided.x) {
                this.facedPortal = collided;
                reaction = collided.getCollisionReaction(this);
            }
        }

        if(collided instanceof Score) {
            this.obtainScore(collided);
        }

        if(reaction) {
            this.applyReaction(reaction, reactionConfig);
        }

        if(landed) {
            if(this.directionIsLeft()) {
                this.x -= JUMP_SHIFT * dt;
            } else {
                this.x += JUMP_SHIFT * dt;
            }
            audioAPI.playSound(this.sounds.land);
        }
    };

    Player.prototype.getStandingSprite = function () {
        return this.animations[states.standing];
    };

    Player.prototype.getLives = function () {
        return davesLeft;
    };

    Player.prototype.death = function () {
        davesLeft--;
    };

    Player.prototype.floatingCallBack = function () {
        this.fallingTime = -1;
    };

    Player.prototype.reset = function (preserveScore, preserveLives) {
        if(!preserveLives) {
            davesLeft = 3;
        }

        if(!preserveScore) {
            this.score = 0;
        }

        this.recoil = 0;
        this.ammo = 8;
        this.idleTime = 0;
        this.state = states.standing;
        this.prevState = this.state;
        this.stateLocked = false;
        this.shooting = false;
        this.grounded = true;
        this.downstairs = false;
        this.prevy = 0;
        this.facedWardrobe = null;
        this.facedPortal = null;
        this.shootingRays = buildShootingRays();
        this.hitPoint = null;
        this.hitPoints = [];
    };

    Player.prototype.initAnimations = function () {
        var ammoSpriteWidth = 70;
        for(var i = this.ammo; i >= 0; i--) {
            this.ammoAnimations.unshift(new Sprite({
                img: this.spriteImg,
                origins: [
                    {
                        x: 1456 + ammoSpriteWidth * i,
                        offsetx: ammoOffset,
                        offsety: ammoOffset
                    }
                ],
                width: ammoSpriteWidth,
                height: 32,
                frames: 1
            }));
        }

        this.animations[states.standing] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 0,
                    offsetx: RIGHTOFFSET
                },
                {
                    x: 384,
                    offsetx: LEFTOFFSET
                }
            ],
            width:     48,
            height:    64,
            frames:    1,
            animSpeed: 60,
        }));

        this.animations[states.falling] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 336,
                    offsetx: RIGHTOFFSET
                },
                {
                    x: 720,
                    offsetx: LEFTOFFSET
                }
            ],
            width:     48,
            height:    64,
            frames:    1,
            animSpeed: 60,
        }));

        this.animations[states.jumping] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 240,
                    offsetx: RIGHTOFFSET - 2
                },
                {
                    x: 624,
                    offsetx: LEFTOFFSET
                }
            ],
            width:     48,
            height:    64,
            frames:    1,
            animSpeed: 60,
        }));

        this.animations[states.floating] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 288,
                    offsetx: RIGHTOFFSET
                },
                {
                    x: 672,
                    offsetx: LEFTOFFSET
                }
            ],
            width:     48,
            height:    64,
            frames:    1,
            animSpeed: 3,
            callbacks : [
                {
                    frame: 0,
                    cb:    this.floatingCallBack.bind(this)
                }
            ]
        }));

        this.animations[states.running] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 48,
                    offsetx: RIGHTOFFSET - 4
                },
                {
                    x: 432,
                    offsetx: LEFTOFFSET + 4
                }
            ],
            width:     48,
            height:    64,
            frames:    4,
            animSpeed: 13
        }));

        this.animations[states.aimup] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 980,
                    offsetx: RIGHTOFFSET + 2
                },
                {
                    x: 1276,
                    offsetx: LEFTOFFSET + 4
                }
            ],
            width:     42,
            height:    64,
            frames:    1,
            animSpeed: 13
        }));

        this.animations[states.aimdown] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 1064,
                    offsetx: RIGHTOFFSET + 2
                },
                {
                    x: 1360,
                    offsetx: LEFTOFFSET - 2
                }
            ],
            width:     48,
            height:    64,
            frames:    1,
            animSpeed: 13
        }));

        this.animations[states.aimstraight] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 864,
                    offsetx: RIGHTOFFSET + 6
                },
                {
                    x: 1160,
                    offsetx: LEFTOFFSET - 12
                }
            ],
            width:     54,
            height:    64,
            frames:    1,
            animSpeed: 5
        }));

        this.animations[states.shootUp] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 980,
                    offsetx: RIGHTOFFSET + 2
                },
                {
                    x: 1276,
                    offsetx: LEFTOFFSET + 4
                }
            ],
            width:     42,
            height:    64,
            frames:    2,
            animSpeed: 5,
            callbacks: [
                {
                    frame: 0,
                    cb:    this.shootrecoilCallBack.bind(this)
                },
                {
                    frame: 1,
                    cb:    this.shootFinishedCallBack.bind(this)
                }
            ]
        }));

        this.animations[states.shootDown] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 1064,
                    offsetx: RIGHTOFFSET + 2
                },
                {
                    x: 1360,
                    offsetx: LEFTOFFSET - 2
                }
            ],
            width:     48,
            height:    64,
            frames:    2,
            animSpeed: 5,
            callbacks: [
                {
                    frame: 0,
                    cb:    this.shootrecoilCallBack.bind(this)
                },
                {
                    frame: 1,
                    cb:    this.shootFinishedCallBack.bind(this)
                }
            ]
        }));

        this.animations[states.shootStraight] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 864,
                    offsetx: RIGHTOFFSET + 6
                },
                {
                    x: 1160,
                    offsetx: LEFTOFFSET - 12
                }
            ],
            width:     58,
            height:    64,
            frames:    2,
            animSpeed: 5,
            callbacks: [
                {
                    frame: 0,
                    cb:    this.shootStraightCallBack.bind(this)
                },
                {
                    frame: 1,
                    cb:    this.shootFinishedCallBack.bind(this)
                }
            ]
        }));

        this.animations[states.reloading] = (new Sprite({
            img: this.spriteImg,
            origins: [
                {
                    x: 768,
                    offsetx: -7
                }
            ],
            width: 48,
            height: 64,
            frames: 2,
            animSpeed: 3.6,
            callbacks: [
                {
                    frame: 0,
                    cb:    this.reloadGun.bind(this)
                }
            ]
        }));

        this.animations[states.openingDoor] = (new Sprite({
            img: this.spriteImg,
            origins: [
                {
                    x: 2086
                }
            ],
            width: 36,
            height: 64,
            frames: 1,
            animSpeed: 2,
            callbacks: [{
                frame: 0,
                cb:    this.openedDoorCallBack.bind(this)
            }]
        }));

        this.animations[states.enteringDoor] = (new Sprite({
            img: this.spriteImg,
            origins: [
                {
                    x: 2122
                }
            ],
            width: 36,
            height: 64,
            frames: 3,
            repeat: false,
            animSpeed: 3.5,
            callbacks: [{
                frame: 2,
                cb:    this.enterDoorCallBack.bind(this)
            }]
        }));
    };

    return Player;
})();