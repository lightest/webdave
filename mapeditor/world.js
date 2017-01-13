var world = {
    mapbg: null,
    width:  0,
    height: 0,

    lifeArea: {
        x: 0,
        y: 0,
        width:   0,
        height:  0,
        horizontalPadding: 150,
        varticalPadding: 110,

        update: function(cameraBounds){
            var rightBorder = Math.min(cameraBounds.x + cameraBounds.width + this.horizontalPadding, world.width);
            var leftBorder = Math.max(0, cameraBounds.x - this.horizontalPadding);
            var bottomBorder = Math.min(cameraBounds.y + cameraBounds.height + this.varticalPadding, world.height);
            var topBorder = Math.max(0, cameraBounds.y - this.varticalPadding);
            this.width = rightBorder - leftBorder;
            this.height = bottomBorder - topBorder;
            this.x = Math.min( Math.max(0, cameraBounds.x - this.horizontalPadding), world.width - this.width );
            this.y = Math.min( Math.max(0, cameraBounds.y - this.varticalPadding), world.height - this.height );
        },

        render: function(viewportContext){
            viewportContext.setStrokeStyle('rgba(100, 211, 175, 1)');
            viewportContext.strokeRect(this.x, this.y, this.width, this.height);
        }
    },

    init: function(cb){
        var that = this;
        this.mapbg = new Image();

        this.mapbg.onload = function(){
            that.width = that.mapbg.width;
            that.height = that.mapbg.height;
            if(typeof cb === 'function'){
                cb();
            }
        }
        
        this.mapbg.src = '../sprites/level01.png';
    },

    render: function(viewportContext) {
        viewportContext.renderMap(this.mapbg);
        this.renderSolidsBounds(viewportContext);
    },

    renderSolidsBounds: function(viewportContext) {
        viewportContext.setFillStyle('yellow');
        viewportContext.setStrokeStyle('yellow');
        viewportContext.setFont('12px Arial');
        for(var i = this.objects.length - 1; i >= 0; i--) {
            var obj = this.objects[i];
            var text = 'x: ' + obj.x + ', y: ' + obj.y;
            if(this.objects[i].type == gameObjects.wardrobe.type || this.objects[i].type == gameObjects.hundred.type) {
                text += (', score: ' + this.objects[i].score);
            } else if (this.objects[i].type == gameObjects.solid.type || this.objects[i].type == gameObjects.solid.type) {
                text += (', width: ' + obj.width + ', height: ' + obj.height);
            }
            viewportContext.fillText(text, obj.x + 5, obj.y - 5);
            viewportContext.strokeRect(obj.x + .5, obj.y + .5, obj.width - 1, obj.height - 1);
        }
    },

    objects: []
};