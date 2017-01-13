var Teleport = (function () {
    var states = {
        closed: 0,
        opened: 1
    };

    function Teleport (data) {
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = 64;
        this.height = 96;
        this.state = states.closed;
        this.imperviousToShootingRay = false;
        this.exit = null;

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    Teleport.prototype = new BasicObject();

    Teleport.prototype.update = function (dt) {
        if(this.animations[this.state]){
            this.animations[this.state].update(dt);
        }
    };

    Teleport.prototype.open = function () {
        this.state = states.opened;
        if(this.exit) {
            this.exit.state = states.opened;
        }
    };

    Teleport.prototype.render = function (viewportContext) {
        if(this.animations[this.state]) {
            this.animations[this.state].render(viewportContext, this.x, this.y);
        }
    };

    Teleport.prototype.enter = function (traveller) {
        if(this.state != states.opened) { return; }
        if(this.exit == null) {
            Game.nextLevel();
            //next level
        } else {
            traveller.setPos(this.exit.x + this.exit.width - traveller.width * .9, this.exit.y);
        }
    };

    Teleport.prototype.getCollisionReaction = function (collided) {
        var reaction = {};
        if(this.state == states.opened) {
            reaction = {
                x: this.x + 16
            };
        } else {
            reaction = {
                x: this.x + this.width - collided.width * .9
            };
        }
        

        return reaction;
    };

    Teleport.prototype.initAnimations = function () {
        this.animations[states.opened] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 68,
                    y: 648
                }
            ],
            width:     68,
            height:    96,
            frames:    1,
            animSpeed: 1,
        }));
    };

    Teleport.prototype.isOpened = function () {
        return this.state == states.opened ? true : false;
    };

    return Teleport;
})();