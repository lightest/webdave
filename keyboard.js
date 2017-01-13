/*
 * Object that allows to track pressed keys
 * basically the only purpose of this is to have
 * convenient access to pressed keys across the system
 */
var keyboard = {

    keys: {
        UP:    38,
        DOWN:  40,
        LEFT:  37,
        RIGHT: 39,
        SPACE: 32,
        TAB:   9,
        ALT:   18
    },

    pressed: [],

    _lastTouches: [],

    init: function(){
        window.addEventListener('keydown', this.onkeydown.bind(this));
        window.addEventListener('keyup', this.onkeyup.bind(this));
        window.addEventListener('touchstart', this.ontouchstart.bind(this));
        window.addEventListener('touchend', this.ontouchend.bind(this));
    },

    ontouchstart: function (e) {
        e.preventDefault();
        var x = 0;
        var y = 0;
        for(var i in e.touches) {
            x = e.touches[i].clientX;
            y = e.touches[i].clientY;
            // alert(x + ' ' + y);
            if(x > 390 && x < 650 && y < 230) {
                this.pressed[this.keys.SPACE] = true;
            } else if (x > 390 && x < 650 && y > 230) {
                this.pressed[this.keys.ALT] = true;
            } else if (x < 340) {
                this.pressed[this.keys.LEFT] = true;
            } else if (x > 720) {
                this.pressed[this.keys.RIGHT] = true;
            }
        }
    },

    ontouchend: function (e) {
        e.preventDefault();
        var x = 0;
        var y = 0;
        var data = '';
        for(var i in this._lastTouches) {
            alert(x + ' ' + y);
            if(x > 390 && x < 650 && y < 230) {
                this.pressed[this.keys.SPACE] = false;
            } else if (x > 390 && x < 650 && y > 230) {
                this.pressed[this.keys.ALT] = false;
            } else if (x < 340) {
                this.pressed[this.keys.LEFT] = false;
            } else if (x > 720) {
                this.pressed[this.keys.RIGHT] = false;
            }
        }
    },

    onkeydown: function(e){
        // switch(e.which){
        //     case this.keys.ALT:
        //         e.preventDefault();
        //         e.stopPropagation();
        //     break;
        // }
        //if F1 - F12 do nothing
        if(116 <= e.which && e.which <= 123){
            return;
        }
        e.preventDefault();
        e.stopPropagation();
        console.log('keydown:', e.which);
        this.pressed[e.which] = true;
    },

    onkeyup: function(e){
        // console.log('keyup:', e.which);
        this.pressed[e.which] = false;
    }
};