(function () {
    var cnv = null;
    var ctx = null;
    var bufferCnv = null;
    var bufferCtx = null;
    var currentCtx = null;
    var offsetX = 0;
    var offsetY = 0;
    var minOffsetX = 0;
    var minOffsetY = 0;
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
    // var quadTreeNodes = [];

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

    function stretchCanvasToScreen () {
        var ratio = cnv.width / cnv.height;
        if(window.innerHeight < window.innerWidth) {
            cnv.style.width = Math.floor(window.innerHeight * ratio) + 'px';
            cnv.style.height = window.innerHeight + 'px';
        } else {
            cnv.style.width = window.innerWidth + 'px';
            cnv.style.height = Math.floor(window.innerWidth * ratio) + 'px';
        }
    };

    function exitFullScreen () {
        cnv.style.width = 'initial';
        cnv.style.height = 'initial';
    };

    function centerCanvas () {
        cnv.style.marginLeft = -Math.floor(cnv.offsetWidth * .5) + 'px';
        cnv.style.marginTop = -Math.floor(cnv.offsetHeight * .5) + 'px';
    };

    window.viewportContext = {
        /*
         * @param: spaceW, spaceH - dimensions of the game space. Actually width and height of the map;
         */
        init: function (leftOffset, topOffset, rightOffset, bottomOffset, spaceW, spaceH) {
            cnv = document.querySelector('#viewportContext');
            ctx = cnv.getContext('2d');
            bufferCnv = document.createElement('canvas');
            bufferCnv.width = cnv.width;
            bufferCnv.height = cnv.height;
            bufferCtx = bufferCnv.getContext('2d');

            offsetX = minOffsetX = leftOffset;
            offsetY = minOffsetY = topOffset;
            maxOffsetX = spaceW - cnv.width - rightOffset;
            maxOffsetY = spaceH - cnv.height - bottomOffset;
            // window.addEventListener('resize', this.resize.bind(this));
            // cnv.removeEventListener('click', this.onclick);
            // cnv.removeEventListener('contextmenu', this.oncontextclick);
            // cnv.addEventListener('click', this.onclick);
            // cnv.addEventListener('contextmenu', this.oncontextclick);
            // this.resize();
            if ('onfullscreenchange' in document) {
                window.addEventListener('fullscreenchange', this.onFullScreenChange.bind(this));
            } else if('onwebkitfullscreenchange' in document) {
                window.addEventListener('webkitfullscreenchange', this.onFullScreenChange.bind(this));
            } else if ('onmozfullscreenchange' in document) {
                window.addEventListener('mozfullscreenchange', this.onFullScreenChange.bind(this));
            } else if ('onmsfullscreenchange' in document) {
                window.addEventListener('msfullscreenchange', this.onFullScreenChange.bind(this));
            }
        },

        onFullScreenChange: function () {
            if(document.fullscreenElement ||
               document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
                stretchCanvasToScreen();
            } else {
                exitFullScreen();
            }
            centerCanvas();
        },

        follow: function (newtarget) {
            if(target != null) {
                target.trackedByCamera = false;
            }
            target = newtarget;
            target.trackedByCamera = true;
            refreshIdleZone();
            this.align();
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
                offsetX = Math.min( Math.max( minOffsetX, Math.floor(target.x - idleZone.x) ), maxOffsetX );
            }
            if(targetRight > idleZone.right){
                offsetX = Math.min( Math.max( minOffsetX, Math.floor(target.x - idleZone.right + target.width) ), maxOffsetX );
            }
            if(targetRltv.y < idleZone.y){
                offsetY = Math.min( Math.max( minOffsetY, Math.floor(target.y - idleZone.y) ), maxOffsetY );
            }
            if(targetBottom > idleZone.bottom){
                offsetY = Math.min( Math.max( minOffsetY, Math.floor(target.y - idleZone.bottom + target.height) ), maxOffsetY );
            }
        },

        renderIdleZone: function () {
            idleZone.render();
        },

        getContext: function () {
            return currentCtx;
        },

        flushCurrentFrameToBuffer: function () {
            bufferCtx.drawImage(cnv, 0, 0);
        },

        switchToBufferContext: function () {
            currentCtx = bufferCtx;
        },

        switchToMainContext: function () {
            currentCtx = ctx;
        },

        renderBufferContextToMain: function () {
            ctx.drawImage(bufferCnv, 0, 0);
        },

        getBounds: function () {
            return {
                x: offsetX,
                y: offsetY,
                width: cnv.width,
                height: cnv.height
            };
        },

        // getQuadTreeNodes: function() {
        //     this.quadTreeNodes = [];
        //     this.quadTree.findAllNodes(this.quadTreeNodes);
        // },

        oncontextclick: function(e) {
            e.preventDefault();

            var origin = getWorldToviewportContextPos(e.pageX, e.pageY);
            Game.spawnMonster(new Goblin(), origin.x, origin.y);

            // var probe = {
            //     x: e.pageX,
            //     y: e.pageY,
            //     width:  3,
            //     height: 3
            // };

            // var obj = [];

            // quadTree.findObjects(probe, obj);
            
            // boxes.forEach(function(item){
            //     item.color = 'hotpink';
            // });
            // console.log(obj);
            // obj.forEach(function(item){
            //     item.color = 'blue';
            // });
        },

        onclick: function(e){
            var origin = getWorldToviewportContextPos(e.pageX, e.pageY);
            Game.spawnMonster(new Zombie(), origin.x, origin.y);
        },

        // resize: function () {
        //     if(document.fullscreenElement ||
        //        document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        //         stretchCanvasToScreen();
        //         centerCanvas();
        //     }
        // },

        clear: function(){
            currentCtx.fillStyle = 'black';
            currentCtx.fillRect(0, 0, cnv.width, cnv.height);
        },

        moveTo: function (x, y) {
            if(x == undefined || y == undefined) {
                console.error('ERR: x or y undefined');
                return;
            }

            var newOrigin = getviewportContextToWorldPos(x, y);
            currentCtx.moveTo(newOrigin.x, newOrigin.y);
        },

        lineTo: function (x, y) {
            if(x == undefined || y == undefined) {
                console.error('ERR: x or y undefined');
                return;
            }

            var newOrigin = getviewportContextToWorldPos(x, y);
            currentCtx.lineTo(newOrigin.x, newOrigin.y);
        },

        setFillStyle: function(color){
            if(!color){ return; }
            currentCtx.fillStyle = color;
        },

        setStrokeStyle: function(color){
            if(!color){ return; }
            currentCtx.strokeStyle = color;
        },

        setBlendingMode: function (blendingMode) {
            if(!blendingMode || blendingMode == currentCtx.globalCompositeOperation) { return; }
            currentCtx.globalCompositeOperation = blendingMode;
        },

        setFont: function(font){
            if(typeof font !== 'string') { return; }
            currentCtx.font = font;
        },

        setTextAlign: function (alignment) {
            if(typeof alignment !== 'string') { return; }
            currentCtx.textAlign = alignment;
        },

        fillRect: function(x, y, width, height) {
            if(x == undefined || y == undefined || width == undefined || height == undefined){
                console.error('ERR: something was undefined:', 'x:', x, 'y:', y, 'width:', width, 'height:', height);
                return;
            }

            var newOrigin = getviewportContextToWorldPos(x, y);
            currentCtx.fillRect(newOrigin.x, newOrigin.y, width, height);
        },

        strokeRect: function(x, y, width, height) {
            if(x == undefined || y == undefined || width == undefined || height == undefined){
                console.error('ERR: something was undefined:', 'x:', x, 'y:', y, 'width:', width, 'height:', height);
                return;
            }

            var newOrigin = getviewportContextToWorldPos(x, y);
            currentCtx.strokeRect(newOrigin.x, newOrigin.y, width, height);
        },

        fillText: function(text, x, y){
            var newOrigin = getviewportContextToWorldPos(x, y);
            currentCtx.fillText(text, newOrigin.x, newOrigin.y);
        },

        strokeText: function(text, x, y){
            var newOrigin = getviewportContextToWorldPos(x, y);
            currentCtx.strokeText(text, newOrigin.x, newOrigin.y);
        },

        drawImage: function(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight){
            var newOrigin = getviewportContextToWorldPos(dx, dy);
            currentCtx.drawImage(img, sx, sy, sWidth, sHeight, newOrigin.x, newOrigin.y, dWidth, dHeight);
        },

        renderMap: function(img){
            currentCtx.drawImage(img, offsetX, offsetY, cnv.width, cnv.height, 0, 0, cnv.width, cnv.height);
        }
    };
})();