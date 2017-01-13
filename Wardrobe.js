var Wardrobe = (function () {
    var SCORE_PLACEMENT_OFFSETX = 2;
    var SCORE_PLACEMENT_OFFSETY = 32;

    var states = {
        closed: 0,
        opened: 1
    };

    function Wardrobe (data) {
        this.score = undefined;
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = 64;
        this.height = 96;
        this.state = states.closed;
        this.imperviousToShootingRay = false;

        this.spriteImg = resources.get('player');
        this.animations = [];
        this.initAnimations();
    };

    Wardrobe.prototype = new BasicObject();

    Wardrobe.prototype.update = function (dt) {
        if(this.animations[this.state]){
            this.animations[this.state].update(dt);
        }
    };

    Wardrobe.prototype.open = function () {
        this.state = states.opened;
        if(this.score) {
            this.score.activate({
                x: this.getRightX() - SCORE_PLACEMENT_OFFSETX - this.score.width,
                y: this.y + SCORE_PLACEMENT_OFFSETY - this.score.height
            });
        }
    };

    Wardrobe.prototype.render = function (viewportContext) {
        if(this.animations[this.state]){
            this.animations[this.state].render(viewportContext, this.x, this.y);
        }
    };

    Wardrobe.prototype.getCollisionReaction = function (collided) {
        reaction = {
            x: this.x + this.width - collided.width * .9
        };

        return reaction;
    };

    Wardrobe.prototype.initAnimations = function () {
        this.animations[states.opened] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 0,
                    y: 648
                }
            ],
            width:     63,
            height:    96,
            frames:    1,
            animSpeed: 1,
        }));
    };

    Wardrobe.prototype.isOpened = function () {
        return this.state == states.opened ? true : false;
    };

    return Wardrobe;
})();