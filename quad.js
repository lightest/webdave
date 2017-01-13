/*
 * quadrants numbered as this:
 *   1 | 0  
 *  ---+---
 *   2 | 3
 */
function QuadTree(boundBox, lvl){
    this.MAX_OBJECTS = 10;
    this.MAX_LEVELS  = 5;

    this.bounds = boundBox || {
        x: 0,
        y: 0,
        width:  0,
        height: 0,
    };

    this.nodes   = [];  //sub quadTrees
    this.objects = [];  //objects contained by one quad
    this.level   = lvl || 0;
};

QuadTree.prototype.clear = function(){
    this.objects = [];
    for(var i = this.nodes.length - 1; i >= 0; i--){
        this.nodes[i].clear();
    }
    this.nodes = [];
};

QuadTree.prototype.getAllObjects = function(returnedObjects){
    for(var i = this.nodes.length - 1; i >= 0; i--){
        this.nodes[i].getAllObjects(returnedObjects);
    }

    for(var i = this.objects.length - 1; i >= 0; i--){
        returnedObjects.push(this.objects[i]);
    }

    return returnedObjects;
};

/*
 * get objects that can potentially collide with the given one
 */
QuadTree.prototype.findObjects = function(obj, returnedObjects){
    if(obj == undefined){
        console.log('undefined object');
        return;
    }
    var index = this.getIndex(obj);
    if(index != -1){
        this.nodes[index].findObjects(obj, returnedObjects);
    }
    for(var i = this.objects.length - 1; i >= 0; i--){
        returnedObjects.push(this.objects[i]);
    }
};

/*
 * inserts object in the tree. If the tree
 * excedes the capacity, it will split and add all
 * objects to their corresponding nodes.
 */
QuadTree.prototype.insert = function(obj){
    if(typeof obj == undefined) { return; }
    
    if(obj instanceof Array){
        for(var i = obj.length - 1; i >= 0; i--){
            this.insert(obj[i]);
        }
        return;
    }
    if(this.nodes.length){
        var index = this.getIndex(obj);
        // Only add the object to a subnode if it can fit completely
        // within one
        if(index != -1){
            this.nodes[index].insert(obj);
            return;
        }
    }

    this.objects.push(obj);
    //prevent infinite splitting
    if(this.objects.length > this.MAX_OBJECTS && this.level < this.MAX_LEVELS){
        if(this.nodes[0] == null){
            this.split();
        }
        var i = 0;
        while(i < this.objects.length){
            var index = this.getIndex(this.objects[i]);
            if(index != -1){
                this.nodes[index].insert((this.objects.splice(i,1))[0]);
            } else {
                i++;
            }
        }
    }
};

/*
 * Determine which node the object belongs to. -1 means
 * object cannot completely fit within a node and is part
 * of the current node
 */
QuadTree.prototype.getIndex = function(obj){
    var index = -1;
    if(this.nodes.length == 0) { return index; }
    var verticalMidPoint = this.bounds.x + this.bounds.width * .5;
    var horizontalMidPoint = this.bounds.y + this.bounds.height * .5;
    //object can fit completely within top quads
    var topQuad = (obj.y + obj.height < horizontalMidPoint);
    //object can fit completely within bottom quads
    var bottomQuad = (obj.y > horizontalMidPoint);
    //object fits completely within left quads
    if(obj.x + obj.width < verticalMidPoint){
        if(topQuad){
            index = 1;
        } else if(bottomQuad) {
            index = 2;
        }
    } else if(obj.x > verticalMidPoint){
        //object fits completely within right quiads
        if(topQuad){
            index = 0;
        } else if(bottomQuad) {
            index = 3;
        }
    }

    return index;
};

/*
 * split the node into four subnodes
 */
QuadTree.prototype.split = function(){
    var subWidth = (this.bounds.width * .5) | 0;
    var subHeight = (this.bounds.height * .5) | 0;

    this.nodes.push(new QuadTree({
        x: this.bounds.x + subWidth,
        y: this.bounds.y,
        width:  subWidth,
        height: subHeight,
    }, this.level + 1));

    this.nodes.push(new QuadTree({
        x: this.bounds.x,
        y: this.bounds.y,
        width:  subWidth,
        height: subHeight
    }, this.level + 1));

    this.nodes.push(new QuadTree({
        x: this.bounds.x,
        y: this.bounds.y + subHeight,
        width:  subWidth,
        height: subHeight
    }, this.level + 1));

    this.nodes.push(new QuadTree({
        x: this.bounds.x + subWidth,
        y: this.bounds.y + subHeight,
        width:  subWidth,
        height: subHeight
    }, this.level + 1));
}

/*
 * draws all quads. Just for sake of visual representation
 */
QuadTree.prototype.render = function(viewportContext){
    for(var i = this.nodes.length - 1; i >= 0; i--){
        this.nodes[i].render(viewportContext);
    }
    // var ctx = viewportContext.getContext();
    // ctx.strokeRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
    viewportContext.strokeRect(this.bounds.x, this.bounds.y, this.bounds.width, this.bounds.height);
};

QuadTree.prototype.checkCollisions = function(cb){
    if(typeof cb !== 'function'){ return; }
    for(var i = this.nodes.length - 1; i >= 0; i--){
        this.nodes[i].checkCollisions(cb);
    }

    var collideableObjects = [];
    var probe = {
        x: this.bounds.x + 1,
        y: this.bounds.y + 1,
        width:  3,
        height: 3
    };
    this.findObjects(probe, collideableObjects);

    var that = this;
    collideableObjects.forEach(function(item, i){
        for(var j = i + 1; j < collideableObjects.length; j++){
            cb(item, collideableObjects[j]);
        }
    });
};

QuadTree.prototype.findAllNodes = function(returnedObjects){
    for(var i = this.nodes.length - 1; i >= 0; i--){
        this.nodes[i].findAllNodes(returnedObjects);
        returnedObjects.push(this.nodes[i]);
    }
};