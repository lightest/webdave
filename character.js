var Character = (function () {
    var DEFAULT_IDLE_TIME = Game.calculateFrameDuration(60);
    var HIT_TIME = .25;

    var directions = {
        left: -1,
        right: 1
    };

    function Character () {
        this.vx = 0;
        this.vy = 0;
        this.prevy = 0;
        this.prevx = 0;
        this.state = undefined;
        this.idleTime = 0;                          //current amount of time spent in idleness
        this.idleTimeDuration = DEFAULT_IDLE_TIME;  //how much time should be spent in idleness
        this.floor = null;
        this.affectedByGravity = true;

        // this.nextStair = null;
        this.hitPoints = 1;
        this.goreAmount = 2;
        this.score = 0;
        this.dead = false;
        this.target = null;
        this.hitTimer = -1;
        this.beingHit = false;
        this.direction = directions.left;
    };

    Character.prototype = new BasicObject();

    Character.prototype.update = function (dt) {
        this.idleTime += dt;

        this.incrementHitTimer(dt);
        if(this.idleTime < this.idleTimeDuration) {
            return;
        }

        var animation = this.getAnimation();
        if(animation) {
            animation.update(this.idleTime);
        }

        var newData = {
            x:  this.x,
            y:  this.y,
            vx: this.vx,
            vy: this.vy
        };

        this.beforePositionUpdate(this.idleTime);
        newData.x = this.makeStep(this.idleTime);
        this.applyVerticalSpeed(this.idleTime, newData);

        if(this.isPositionChangeValid(world.getLifeAreaBounds(), newData)) {
            this.prevx = this.x;
            this.prevy = this.y;

            this.x = newData.x;
            this.y = newData.y ;
            this.vx = newData.vx;
            this.vy = newData.vy;
        }

        this.idleTime = 0;
        this.floor = null;
        // this.nextStair = null;

        this.resetCustomData();
    };

    Character.prototype.applyVerticalSpeed = function (dt, newData) {
        if(this.affectedByGravity) {
            newData.vy = Math.min(world.getMaxVY(), newData.vy + world.gravity * dt);
        }
        newData.y += newData.vy * dt;
    };

    Character.prototype.isPositionChangeValid = function (bounds, data) {
        if(!bounds) { return; }
        var centerx = bounds.x + bounds.width * .5;
        var centery = bounds.y + bounds.height * .5;

        var right = this.getRightX(data.x, this.width);
        var bottom = this.getBottomY(data.y, this.height);

        // dir > 0 means object moves towards the center of life area, < 0 otherwise (tries to leave)
        var vySign = data.vy >= 0 ? 1 : -1;
        var dirx = (centerx - data.x) / this.direction;
        var diry = (centery - data.y) / vySign;
        var dir = (dirx < 0 || diry < 0) ? -1 : 1;

        if(dir < 0 && (data.x < bounds.x ||
           data.y < bounds.y ||
           right > bounds.x + bounds.width ||
           bottom > bounds.y + bounds.height)) {
            return false;
        }

        return true;
    };

    Character.prototype.render = function (viewportContext) {
        if(!viewportContext) { return; }
        if(Game.debugSettings.drawStats) {
            viewportContext.setFillStyle( 'black' );
            viewportContext.fillText( 'state: ' + this.state, Math.floor(this.x), Math.floor(this.y) - 23 );
            viewportContext.fillText( 'direction: ' + this.direction, Math.floor(this.x), Math.floor(this.y) - 15 );
            viewportContext.fillText( 'targetInRange: ' + this.targetInRange, Math.floor(this.x), Math.floor(this.y) - 3 );
        }
        
        if(Game.debugSettings.drawBoundingBox) {
            viewportContext.setFillStyle( this.color );
            viewportContext.fillRect( Math.floor(this.x), Math.floor(this.y), this.width, this.height );
            if(this.killZone) {
                viewportContext.strokeRect(Math.floor(this.killZone.x), Math.floor(this.killZone.y), this.killZone.width, this.killZone.height);
            }
        }
        
        if(this.hitTimer >= 0) {
            viewportContext.setBlendingMode('xor');
        }

        var animation = this.getAnimation();
        if(animation) {
            animation.render(viewportContext, Math.floor(this.x), Math.floor(this.y));
        }
        viewportContext.setBlendingMode('source-over')
    };

    Character.prototype.setTarget = function (newTarget) {
        if(newTarget && this.target != newTarget) {
            this.target = newTarget;
        }
    };

    //interface methods
    Character.prototype.checkTarget = function () {};

    Character.prototype.beforePositionUpdate = function () {};

    Character.prototype.resetCustomData = function () {};

    //if character bumped the wall or the surface edge
    Character.prototype.bumpCallBack = function () {};

    Character.prototype.getAnimation = function () {
        var state = this.state;
        if(state == undefined) { return; }
        var animation = this.animations[state];
        if(animation) {
            if(this.directionIsRight()) {
                animation.switchOrigin(0);
            } else {
                animation.switchOrigin(1);
            }
        }

        return animation;
    };

    Character.prototype.leftDirection = function () {
        this.direction = directions.left;
    };

    Character.prototype.rightDirection = function () {
        this.direction = directions.right;
    };

    Character.prototype.directionIsLeft = function () {
        if(this.direction == directions.left){ return true; }
        return false;
    };

    Character.prototype.directionIsRight = function () {
        if(this.direction == directions.right){ return true; }
        return false;
    };

    Character.prototype.switchDirection = function () {
        if(this.directionIsLeft()){
            this.rightDirection();
        } else {
            this.leftDirection();
        }
    };

    Character.prototype.incrementHitTimer = function (dt) {
        if(this.hitTimer >= 0 && this.hitTimer < HIT_TIME) {
            this.hitTimer += dt;
        } else {
            this.hitTimer = -1;
        }
    };

    /*
     * @desc: Makes step toward current direction. Changes direction in case
     *        edge of the surface is reached.
     */
    Character.prototype.makeStep = function (dt) {
        var newX = this.x + this.vx * this.direction * dt;
        var leftMostEdge = 0;
        var rightMostEdge = 0;

        if(this.floor != null) {
            if(this.floor.surface != null) {
                leftMostEdge = this.floor.surface.leftMostEdge - world.SURFACE_GAP;
                rightMostEdge = this.floor.surface.rightMostEdge + world.SURFACE_GAP;
            } else {
                leftMostEdge = this.floor.x - world.SURFACE_GAP;
                rightMostEdge = this.floor.x + this.floor.width + world.SURFACE_GAP;
            }

            if(newX < leftMostEdge || newX + this.width > rightMostEdge) {
                newX = this.x;
                this.switchDirection();
                this.bumpCallBack();
            }
        }

        /*
         * @desc: It seems that original dave doesn't have any stairchange mechanism for zombie,
         *        it just falls down on same amount of pixels as stair height.
         *        Anyway I decided to save it for later.
        this.canChangeToDownstairs = false;
        if(this.nextStair == null) {
            this.prevy = this.y;
            this.y += 16;//this.vy * this.idleTime;
        } else if (this.nextStair != null && this.downstairs) {
            this.canChangeToDownstairs = true;
            this.prevy = this.y + 1; //otherwise will cause repultion by stair on collision detection stage
            this.y = this.nextStair - this.height;
        }
        */

        return newX;
    };

    Character.prototype.applyReaction = function (reaction, config) {
        if(!reaction) { return; }
        if(!config) {
            config = {
                ignorx: false,
                ignory: false,
                ignorvx: false,
                ignorvy: false
            };
        }
        if(!config.ignorx) {
            this.x = reaction.x != undefined ? reaction.x : this.x;
        }
        if(!config.ignory) {
            this.y = reaction.y != undefined ? reaction.y : this.y;
        }
        if(!config.ignorvx) {
            this.vx = reaction.vx != undefined ? reaction.vx : this.vx;
        }
        if(!config.ignorvy) {
            this.vy = reaction.vy != undefined ? reaction.vy : this.vy;
        }
    };

    Character.prototype.handleShoot = function () {
        this.hitPoints--;
        this.hitTimer = 0;
        if(this.hitPoints == 0){
            this.dead = true;
            this.hitTimer = -1;
            var gore = SFXPool.allocateGore(this.goreAmount);
            var x = 0;
            var y = this.y;
            var pair = false;
            var vy = 0;
            for(var i = gore.length - 1; i >= 0; i--){
                if(pair) {
                    vx = 0;
                    vy = 0;
                } else {
                    vx = 230;
                    vy = -270;
                }

                if(i % 2 == 0) {
                    gore[i].leftDirection();
                    x = this.x;
                    pair = !pair;
                    if(vy < 0) {
                        y -= gore[i].height * .5;
                    } else {
                        y += gore[i].height;
                    }
                } else {
                    gore[i].rightDirection();
                    x = this.x + this.width;
                    if(vy == 0) {
                        y += gore[i].height * .75;
                    }
                }
                gore[i].spawn(x, y, vx, vy);
            }
        }
    };

    Character.prototype.getRightX = function (x, width) {
        if(x && width) {
            return x + width;
        }
        return this.x + this.width;
    };

    Character.prototype.getBottomY = function (y, height) {
        if(y && height) {
            return y + height;
        }
        return this.y + this.height;
    };

    Character.prototype.getPrevRightX = function () {
        return this.prevx + this.width;
    };

    Character.prototype.getPrevBottomY = function () {
        return this.prevy + this.height;
    };

    return Character;
})();