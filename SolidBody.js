var SolidBody = (function () {
    function SolidBody (data) {
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.width = data.width || 0;
        this.height = data.height || 0;
        this.surface = null;
    };

    SolidBody.prototype = new BasicObject();

    SolidBody.prototype.getCollisionReaction = function (collided) {
        var reaction = {
            x: undefined,
            y: undefined,
            vx: undefined,
            vy: undefined
        };
        var prevBottom = undefined;
        var prevRight = undefined;
        var elastic = false;
        var vxSign = collided.direction != undefined ? collided.direction : collided.vx;

        if(collided instanceof Box) {
            elastic = true;
        }

        if(collided.prevy != undefined) {
            prevBottom = collided.getPrevBottomY();
        }

        if(collided.prevx != undefined) {
            prevRight = collided.getPrevRightX();
        }

        if(prevBottom <= this.y && collided.vy >= 0) {
            reaction.y = this.y - collided.height;
            reaction.vy = elastic ? collided.vy * -1 : 0;
        } else if (collided.prevy >= this.getBottomY() && collided.vy <= 0) {
            reaction.y = this.y + this.height;
            reaction.vy = elastic ? collided.vy * -1 : 0;
        } else if ( (collided.prevx >= this.getRightX() && vxSign <= 0) || (collided.getRightX() > this.getRightX()) ) {
            reaction.x = this.x + this.width;
            reaction.vx = elastic ? collided.vx * -1 : 0;
        } else if ( (prevRight <= this.x && vxSign >= 0) || collided.x < this.x) {
            reaction.x = this.x - collided.width;
            reaction.vx = elastic ? collided.vx * -1 : 0;
        }
        
        // if(collided.y < this.y && prevBottom <= this.y) {
        //     reaction.y = this.y - collided.height;
        //     reaction.vy = elastic ? collided.vy * -1 : 0;
        // } else if(collided.y + collided.height > this.y + this.height && collided.prevy >= this.y + this.height) {
        //     reaction.y = this.y + this.height + 1;
        //     reaction.vy = elastic ? collided.vy * -1 : 0;
        // } else if(collided.x < this.x) {
        //     var newx = this.x - collided.width - 1;
        //     reaction.x = newx;
        //     reaction.vx = elastic ? collided.vx * -1 : 0;
        //     // collided.leftDirection();
        // } else {
        //     var newx = this.x + this.width + 1;
        //     reaction.x = newx;
        //     reaction.vx = elastic ? collided.vx * -1 : 0;
        //     // collided.rightDirection();
        // }

        return reaction;
    };

    return SolidBody;
})();