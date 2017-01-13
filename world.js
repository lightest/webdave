var Surface = function (data) {
    this.y = data.y || 0;
    this.leftMostEdge = data.x || 0;
    this.rightMostEdge = 0;
};

Surface.prototype.expand = function () {
    for (var i = arguments.length - 1; i >= 0; i--) {
        if(arguments[i].x < this.leftMostEdge) {
            this.leftMostEdge = arguments[i].x;
        }

        if(arguments[i].x + arguments[i].width > this.rightMostEdge) {
            this.rightMostEdge = arguments[i].x + arguments[i].width;
        }
    }
};

var StairCase = function () {
    this.stairs = [];

    //only for rendering purpose
    this.width = 0;
    this.x = 0;
    this.bottom = 0;
};

StairCase.prototype.addStairs = function () {
    for(var i = arguments.length - 1; i >= 0; i--) {
        if(this.stairs.length > 0) {
            if(arguments[i].y < this.stairs[0]) {
                this.stairs.unshift(arguments[i].y);
                this.width = arguments[i].width;
                this.x = arguments[i].x;
            } else {
                this.stairs.push(arguments[i].y);
                this.bottom = arguments[i].height + arguments[i].y;
            }
        } else {
            this.stairs.push(arguments[i].y);
        }
    }
};

StairCase.prototype.getNextStair = function (y) {
    var nextStairIndex = this.stairs.indexOf(y) + 1;
    return this.stairs[nextStairIndex] == undefined ? this.bottom : this.stairs[nextStairIndex];
};

var world = (function () {
    var MAX_VY = 570;
    var maxScore = 0;
    var mapbg = null;
    var width =  0;
    var height = 0;
    // var STAIR_GAP = 15;
    var surfaces = [];
    // var stairCases = [];

    function generateLevelObjects (levelData) {
        var that = this;
        for(var i = levelData.objects.length - 1; i >= 0; i--) {
            if(levelData.objects[i].type == gameObjects.solid.type) {
                this.mapObjects.push(new SolidBody(levelData.objects[i]));
            } else if (levelData.objects[i].type == gameObjects.jumpable.type) {
                this.mapObjects.push(new JumpableBody(levelData.objects[i]));
            } else if (levelData.objects[i].type == gameObjects.wardrobe.type) {
                var wardrobe = new Wardrobe(levelData.objects[i]);
                if(levelData.objects[i].score) {
                    var score = new Score({score: levelData.objects[i].score});
                    wardrobe.score = score;
                    scores.push(score);
                }
                this.mapObjects.push(wardrobe);
            } else if (levelData.objects[i].type == gameObjects.teleport.type) {
                if( !this.isTeleportExists(levelData.objects[i].x, levelData.objects[i].y) ) {
                    var t1 = new Teleport(levelData.objects[i]);
                    var t2 = null;
                    if(levelData.objects[i].exitPoint) {
                        t2 = new Teleport(levelData.objects[i].exitPoint);
                        t1.exit = t2;
                        t2.exit = t1;
                        this.mapObjects.push(t1, t2);
                    } else {
                        this.mapObjects.push(t1);
                    }
                }
            } else if (levelData.objects[i].type == gameObjects.hundred.type) {
                scores.push(new Score(levelData.objects[i]));
            } else if (levelData.objects[i].type == gameObjects.zombie.type) {
                var monster = new Zombie();
                monster.x = levelData.objects[i].x;
                monster.y = levelData.objects[i].y;
                monsters.push(monster);
                if(monster.score >= 100) {
                    maxScore += monster.score;
                }
            } else if (levelData.objects[i].type == gameObjects.goblin.type) {
                var monster = new Goblin();
                monster.x = levelData.objects[i].x;
                monster.y = levelData.objects[i].y;
                monsters.push(monster);
                if(monster.score >= 100) {
                    maxScore += monster.score;
                }
            }

            if(levelData.objects[i].score >= 100) {
                maxScore += levelData.objects[i].score;
            }
        }
    };

    function detectSurfaces (levelData) {
        var that = this;
        this.mapObjects.forEach(function (item, i) {
            for(var j = i + 1; j < that.mapObjects.length; j++) {
                if(!(item instanceof SolidBody) && !(item instanceof JumpableBody)) { return; }

                if(item.y == that.mapObjects[j].y) {
                    if(!(that.mapObjects[j] instanceof SolidBody) && !(that.mapObjects[j] instanceof JumpableBody)) { continue; }

                    var right1 = item.x + item.width;
                    var right2 = that.mapObjects[j].x + that.mapObjects[j].width;

                    var distLeftAbs = Math.abs(item.x - that.mapObjects[j].x);
                    var distRightAbs = Math.abs(item.x + item.width - that.mapObjects[j].x - that.mapObjects[j].width);

                    if(distRightAbs + distLeftAbs <= item.width + that.mapObjects[j].width + 2 * that.SURFACE_GAP) {
                        if(item.surface != null) {
                            item.surface.expand(that.mapObjects[j]);
                            that.mapObjects[j].surface = item.surface;
                        } else if (that.mapObjects[j].surface != null) {
                            that.mapObjects[j].surface.expand(item);
                            item.surface = that.mapObjects[j].surface;
                        } else {
                            var surface = new Surface({x: item.x, y: item.y});
                            surface.expand(item, that.mapObjects[j]);
                            item.surface = surface;
                            that.mapObjects[j].surface = surface;
                            surfaces.push(surface);
                        }
                    }
                }
            }
        });
    };

    // function detectStairCases (levelData) {
    //     var that = this;
    //     this.mapObjects.forEach(function (item, i) {
    //         if(!(item instanceof JumpableBody)) { return; }

    //         for(var j = i + 1; j < that.mapObjects.length; j++) {
    //             if(!(that.mapObjects[j] instanceof JumpableBody)) { continue; }

    //             var bottom1 = item.y + item.height;
    //             var bottom2 = that.mapObjects[j].y + that.mapObjects[j].height;

    //             var distTopAbs = Math.abs(item.y - that.mapObjects[j].y);
    //             var distBottomAbs = Math.abs(bottom1 - bottom2);

    //             if(distBottomAbs + distTopAbs <= item.height + that.mapObjects[j].height + 2 * that.STAIR_GAP) {
    //                 var deviderX = item.width * .5 + item.x;
    //                 if(deviderX - that.mapObjects[j].x == that.mapObjects[j].width * .5) {
    //                     if(item.staircase != null) {
    //                         item.staircase.addStairs(that.mapObjects[j]);
    //                         that.mapObjects[j].staircase = item.staircase;
    //                     } else if (that.mapObjects[j].staircase != null) {
    //                         that.mapObjects[j].staircase.addStairs(item);
    //                         item.staircase = that.mapObjects[j].staircase;
    //                     } else {
    //                         var staircase = new StairCase();
    //                         staircase.addStairs(item, that.mapObjects[j]);
    //                         item.staircase = staircase;
    //                         that.mapObjects[j].staircase = staircase;
    //                         that.stairCases.push(staircase);
    //                     }
    //                 }
    //             }
    //         }
    //     });
    // };

    var gameObjects = {
        solid: {
            type: 0,
            strokecolor: '',
            selectcolor: 'rgba(255,255,0, .5)'
        },
        jumpable: {
            type: 1,
            strokecolor: '',
            selectcolor: 'rgba(0,255,0, .5)'
        },
        zombie: {
            width: 35,
            height: 80,
            type: 2,
            strokecolor: '',
            selectcolor: 'rgba(0,250,10,1,.5)'
        },
        goblin: {
            width: 30,
            height: 48,
            type: 3,
            strokecolor: '',
            selectcolor: 'rgba(0,150,10,1,.5)'
        },
        hundred: {
            width: 25,
            height: 25,
            type: 4,
            strokecolor: '',
            selectcolor: 'rgba(168,0,0,.5)',
            score: 100
        },
        thundred: {
            width: 25,
            height: 25,
            type: 4,
            strokecolor: '',
            selectcolor: 'rgba(252,84,84,.5)',
            score: 300
        },
        fhundred: {
            width: 25,
            height: 25,
            type: 4,
            strokecolor: '',
            selectcolor: 'rgba(0,168,168,.5)',
            score: 400
        },
        teleport: {
            type: 5,
            width: 64,
            height: 96,
            strokecolor: '',
            selectcolor: ''
        },
        wardrobe: {
            type: 6,
            width: 64,
            height: 96,
            strokecolor: '',
            selectcolor: 'rgba(168,168,168, .5)',
            score: undefined
        }
    };

    return {
        gravity: 1600,
        SURFACE_GAP: 15,
        //objects that collides with this area are updated
        visibilityOffset: {
            left: 50,
            top: 20,
            right: 0,
            bottom: 0
        },

        lifeArea: {
            x: 0,
            y: 0,
            width:   0,
            height:  0,
            varticalPadding: 110,
            horizontalPadding: 150,

            update: function(cameraBounds){
                var rightBorder = Math.min(cameraBounds.x + cameraBounds.width + this.horizontalPadding, width);
                var leftBorder = Math.max(0, cameraBounds.x - this.horizontalPadding);
                var bottomBorder = Math.min(cameraBounds.y + cameraBounds.height + this.varticalPadding, height);
                var topBorder = Math.max(0, cameraBounds.y - this.varticalPadding);
                this.width = rightBorder - leftBorder;
                this.height = bottomBorder - topBorder;
                this.x = Math.min( Math.max(0, cameraBounds.x - this.horizontalPadding), width - this.width );
                this.y = Math.min( Math.max(0, cameraBounds.y - this.varticalPadding), height - this.height );
            },

            render: function(viewportContext){
                viewportContext.setStrokeStyle('rgba(100, 211, 175, 1)');
                viewportContext.strokeRect(this.x, this.y, this.width, this.height);
            }
        },

        levelLoadCallBack: function (levelData) {},

        isTeleportExists: function (x, y) {
            for(var i = this.mapObjects.length - 1; i >= 0; i--) {
                if(this.mapObjects[i].x == x && this.mapObjects[i].y == y) {
                    return this.mapObjects[i];
                }
            }
            return null;
        },

        resetStorages: function () {
           monsters = [];
           scores = [];
           surfaces = [];
           // stairCases = [];
           lifeAreaObjects = [];
           this.mapObjects = [];
        },

        load: function (levelData, cb) {
            if(!levelData) { return; }
            var that = this;
            maxScore = 0;
            this.resetStorages();
            mapbg = new Image();

            generateLevelObjects.call(this, levelData);
            detectSurfaces.call(this, levelData);

            mapbg.onload = function(){
                width = mapbg.width;
                height = mapbg.height;
                // detectStairCases.call(this);
                that.levelLoadCallBack(levelData);
                if(typeof cb === 'function') {
                    cb();
                }
            }
            
            mapbg.src = levelData.img;
        },

        render: function(viewportContext) {
            viewportContext.renderMap(mapbg);
            if(Game.debugSettings.drawBoundingBox) {
                this.renderSolidsBounds(viewportContext);
                this.renderSurfaces(viewportContext);
                this.lifeArea.render(viewportContext);
            }
            // this.renderStairCases(viewportContext);
        },

        renderSolidsBounds: function(viewportContext) {
            viewportContext.setFont('12px Arial');
            viewportContext.setFillStyle('black');

            for(var i = this.mapObjects.length - 1; i >= 0; i--){
                var obj = this.mapObjects[i];
                if(obj instanceof SolidBody){
                    viewportContext.setStrokeStyle('green');
                } else if(obj instanceof JumpableBody){
                    viewportContext.setStrokeStyle('crimson');
                }
                var text = 'x: ' + obj.x + ', y: ' + obj.y + ', width: ' + obj.width + ', height: ' + obj.height;
                viewportContext.fillText(text, obj.x + 5, obj.y - 5);
                viewportContext.strokeRect(obj.x, obj.y, obj.width, obj.height);
            }

            // for(var i = this.solids.length - 1; i >= 0; i--){
            //     var obj = this.solids[i];
            //     if(obj.type == this.types.solid){
            //         viewportContext.setStrokeStyle('green');
            //     } else if(obj.type == this.types.jumpable){
            //         viewportContext.setStrokeStyle('crimson');
            //     }
            //     var text = 'x: ' + obj.x + ', y: ' + obj.y + ', width: ' + obj.width + ', height: ' + obj.height;
            //     viewportContext.fillText(text, obj.x + 5, obj.y - 5);
            //     viewportContext.strokeRect(obj.x, obj.y, obj.width, obj.height);
            // }
        },

        renderSurfaces: function (viewportContext) {
            viewportContext.setStrokeStyle('rgba(0, 100, 200, 1)');
            for(var i = surfaces.length - 1; i >= 0; i--) {
                viewportContext.strokeRect(surfaces[i].leftMostEdge, surfaces[i].y, surfaces[i].rightMostEdge - surfaces[i].leftMostEdge, 10);
            }
        },

        renderStairCases: function (viewportContext) {
            viewportContext.setStrokeStyle('rgba(150, 10, 200, 1)');
            for(var i = this.stairCases.length - 1; i >= 0; i--) {
                viewportContext.strokeRect(this.stairCases[i].x, this.stairCases[i].stairs[0], this.stairCases[i].width, this.stairCases[i].bottom - this.stairCases[i].stairs[0]);
            }
        },

        getLifeAreaBounds: function () {
            return {
                x: this.lifeArea.x,
                y: this.lifeArea.y,
                width:  this.lifeArea.width,
                height: this.lifeArea.height
            };
        },

        getWidth: function () {
            return width;
        },

        getHeight: function () {
            return height;
        },

        getMaxScore: function () {
            return maxScore;
        },

        getMaxVY: function () {
            return MAX_VY;
        },

        mapObjects: [],
    };
}) ();
