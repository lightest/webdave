var JumpableBody = (function () {
    function JumpableBody (data) {
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = data.width || 0;
        this.height = data.height || 0;
        this.surface = null;
        this.staircase = null;
        this.imperviousToShootingRay = false;
    };

    JumpableBody.prototype = new BasicObject();

    JumpableBody.prototype.getCollisionReaction = function (collided) {
        var reaction = {
            x: undefined,
            y: undefined,
            vx: undefined,
            vy: undefined
        };
        var prevBottom = undefined;
        var elastic = false;

        if(collided instanceof Box) {
            elastic = true;
        }

        if(collided.prevy != undefined) {
            prevBottom = collided.getPrevBottomY();
        }

        if(collided.y < this.y && collided.vy > 0 && prevBottom <= this.y){
            reaction.y = this.y - collided.height
            reaction.vy = elastic ? collided.vy * -1 : 0;
        }

        return reaction;
    };

    return JumpableBody;
})();