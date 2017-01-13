var Score = (function () {
    var ANIMATION_SPEED = 8;

    function playCollectionSound () {
        var soundBuffer = this.sounds[this.score];
        if(soundBuffer) {
            audioAPI.playSound(soundBuffer);
        }
    };

    function initAnimations () {
        this.animations[100] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2538
                }
            ],
            width:     30,
            height:    30,
            frames:    2,
            animSpeed: ANIMATION_SPEED
        }));

        this.animations[200] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2598
                }
            ],
            width:     30,
            height:    30,
            frames:    2,
            animSpeed: ANIMATION_SPEED
        }));

        this.animations[400] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2658
                }
            ],
            width:     30,
            height:    30,
            frames:    2,
            animSpeed: ANIMATION_SPEED
        }));

        //one up
        this.animations[1] = (new Sprite({
            img:       this.spriteImg,
            origins:   [
                {
                    x: 2719
                }
            ],
            width:     30,
            height:    30,
            frames:    2,
            animSpeed: ANIMATION_SPEED
        }));
    };
    
    function Score (data) {
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.score = data.score || 0;
        this.width = 30;
        this.height = 30;
        this.active = data.x > 0 ? true : false;
        this.imperviousToShootingRay = false;

        this.sounds = [];
        this.sounds[100] = resources.get('score_100'),
        this.sounds[200] = resources.get('score_200'),
        this.sounds[400] = resources.get('score_400'),

        this.animations = [];

        this.spriteImg = resources.get('player');
        initAnimations.call(this);
    };

    Score.prototype = new BasicObject();

    Score.prototype.update = function (dt) {
        this.animations[this.score].update(dt);
    };

    Score.prototype.activate = function (data) {
        this.active = true;
        this.x = data.x || 0;
        this.y = data.y || 0;
    }

    Score.prototype.resolveCollision = function (collided) {
        if(collided instanceof Player) {
            this.active = false;
            playCollectionSound.call(this);
        }
    };

    Score.prototype.render = function (viewportContext) {
        // viewportContext.fillRect(Math.floor(this.x), Math.floor(this.y), this.width, this.height);
        this.animations[this.score].render(viewportContext, this.x, this.y);
    };

    return Score;
})();