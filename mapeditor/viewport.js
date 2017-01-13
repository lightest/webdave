(function () {
    var cnv = null;
    var ctx = null;
    var offsetX = 0;
    var offsetY = 0;
    var maxOffsetX = 0;
    var maxOffsetY = 0;
    var target = null;
    var idleZoneVertPadding = 54;
    var idleZoneHorPadding = 35;
    var idleZone = {
        x:      0,
        y:      0,
        right:  0,
        bottom: 0,

        render: function () {
            ctx.strokeStyle = 'red';
            ctx.strokeRect(this.x, this.y, this.right - this.x, this.bottom - this.y);
        }
    };

    function getviewportContextToWorldPos (x, y) {
        return {
            x: x - offsetX,
            y: y - offsetY
        };
    };

    function getWorldToviewportContextPos (x, y) {
        return {
            x: x + offsetX,
            y: y + offsetY
        };
    };

    function refreshIdleZone () {
        idleZone.x = Math.floor(cnv.width * .5) - Math.floor(target.width * .5) - idleZoneHorPadding + 25;
        idleZone.y = Math.floor(cnv.height * .5) - Math.floor(target.height * .5) - idleZoneVertPadding + 31;
        idleZone.right = idleZone.x + idleZoneHorPadding * 2 + target.width;
        idleZone.bottom = idleZone.y + idleZoneVertPadding * 2 + target.height;
    }

    window.viewportContext = {
        /*
         * @param: spaceW, spaceH - dimensions of the game space. Actually width and height of the map;
         */
        init: function (spaceW, spaceH) {
            cnv = document.querySelector('#viewportContext');
            ctx = cnv.getContext('2d');
            maxOffsetX = spaceW - cnv.width;
            maxOffsetY = spaceH - cnv.height;
            // window.addEventListener('resize', this.resize.bind(this));
            cnv.addEventListener('mousedown', this.onMouseDown.bind(this));
            cnv.addEventListener('mouseup', this.onMouseUp.bind(this));
            cnv.addEventListener('mousemove', this.onMouseMove.bind(this));
            // this.resize();
        },

        follow: function (newtarget) {
            if(target != null) {
                target.trackedByCamera = false;
            }
            target = newtarget;
            target.trackedByCamera = true;
            refreshIdleZone();
        },

        /*
         * calls update method of the target. This one works in conjunction with main update function
         */
        updateTarget: function (dt) {
            if(typeof target.update !== 'function'){ return; }
            target.update(dt);
        },

        /*
         * updates the viewportContext position according to target object
         */
        align: function () {
            // offsetX = Math.floor(target.x - cnv.width * .5);
            // offsetY = Math.floor(target.y - cnv.height * .5);

            var targetRltv = getviewportContextToWorldPos(target.x, target.y);
            var targetRight = targetRltv.x + target.width;
            var targetBottom = targetRltv.y + target.height;

            if(targetRltv.x < idleZone.x){
                offsetX = Math.min( Math.max( 0, Math.floor(target.x - idleZone.x) ), maxOffsetX );
            }
            if(targetRight > idleZone.right){
                offsetX = Math.min( Math.max( 0, Math.floor(target.x - idleZone.right + target.width) ), maxOffsetX );
            }
            if(targetRltv.y < idleZone.y){
                offsetY = Math.min( Math.max( 0, Math.floor(target.y - idleZone.y) ), maxOffsetY );
            }
            if(targetBottom > idleZone.bottom){
                offsetY = Math.min( Math.max( 0, Math.floor(target.y - idleZone.bottom + target.height) ), maxOffsetY );
            }
        },

        renderIdleZone: function () {
            idleZone.render();
        },

        getWorldCoordinates: function (x, y) {
            return getWorldToviewportContextPos(x, y);
        },

        getCanvas: function () {
            return cnv;
        },

        getContext: function () {
            return ctx;
        },

        getBounds: function () {
            return {
                x: offsetX,
                y: offsetY,
                width: cnv.width,
                height: cnv.height
            };
        },

        onMouseDown: function (e) {
            Mouse.down = true;
            Mouse.mdownX = e.pageX;
            Mouse.mdownY = e.pageY;
        },

        onMouseUp: function () {
            Mouse.down = false;
        },

        onMouseMove: function (e) {
            if(keyboard.pressed[keyboard.keys.SPACE] && Mouse.down) {
                offsetX = Math.min( Math.max( 0, offsetX - e.pageX + Mouse.x ), maxOffsetX );
                offsetY = Math.min( Math.max( 0, offsetY - e.pageY + Mouse.y ), maxOffsetY );
            }

            Mouse.x = e.pageX;
            Mouse.y = e.pageY;
        },

        resize: function(){
            this.cnv.width = window.innerWidth;
            this.cnv.height = window.innerHeight;
        },

        clear: function(){
            ctx.fillStyle = 'black';
            ctx.fillRect(0, 0, cnv.width, cnv.height);
        },

        moveTo: function (x, y) {
            if(x == undefined || y == undefined) {
                console.error('ERR: x or y undefined');
                return;
            }

            var newOrigin = getviewportContextToWorldPos(x, y);
            ctx.moveTo(newOrigin.x, newOrigin.y);
        },

        lineTo: function (x, y) {
            if(x == undefined || y == undefined) {
                console.error('ERR: x or y undefined');
                return;
            }

            var newOrigin = getviewportContextToWorldPos(x, y);
            ctx.lineTo(newOrigin.x, newOrigin.y);
        },

        setFillStyle: function(color){
            if(!color){ return; }
            ctx.fillStyle = color;
        },

        setStrokeStyle: function(color){
            if(!color){ return; }
            ctx.strokeStyle = color;
        },

        setFont: function(font){
            if(typeof font !== 'string') { return; }
            ctx.font = font;
        },

        fillRect: function(x, y, width, height) {
            if(x == undefined || y == undefined || width == undefined || height == undefined){
                console.error('ERR: something was undefined:', 'x:', x, 'y:', y, 'width:', width, 'height:', height);
                return;
            }

            var newOrigin = getviewportContextToWorldPos(x, y);
            ctx.fillRect(newOrigin.x, newOrigin.y, width, height);
        },

        strokeRect: function(x, y, width, height, offsetIrrelevant) {
            if(x == undefined || y == undefined || width == undefined || height == undefined){
                console.error('ERR: something was undefined:', 'x:', x, 'y:', y, 'width:', width, 'height:', height);
                return;
            }

            var newOrigin = null;
            if(offsetIrrelevant) {
                newOrigin = {x: x, y: y};
            } else {
                newOrigin = getviewportContextToWorldPos(x, y);
            }
            ctx.strokeRect(newOrigin.x, newOrigin.y, width, height);
        },

        fillText: function(text, x, y){
            var newOrigin = getviewportContextToWorldPos(x, y);
            ctx.fillText(text, newOrigin.x, newOrigin.y);
        },

        strokeText: function(text, x, y){
            var newOrigin = getviewportContextToWorldPos(x, y);
            ctx.strokeText(text, newOrigin.x, newOrigin.y);
        },

        drawImage: function(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight){
            var newOrigin = getviewportContextToWorldPos(dx, dy);
            ctx.drawImage(img, sx, sy, sWidth, sHeight, newOrigin.x, newOrigin.y, dWidth, dHeight);
        },

        renderMap: function(img){
            ctx.drawImage(img, offsetX, offsetY, cnv.width, cnv.height, 0, 0, cnv.width, cnv.height);
        }
    };
})();