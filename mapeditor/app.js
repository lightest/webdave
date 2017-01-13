var requestAnimFrame = 
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

var debug = {
    el: null,
    data: {},

    init: function(){
        this.el = document.querySelector('.debug');
    },

    update: function(key, value){
        this.data[key] = value;
    },

    print: function(){
        var html = '';
        for(var i in this.data){
            html += i + ': ' + this.data[i] + '<br>';
        }
        this.el.innerHTML = html;
    }
};

var viewportContextanchor = {
    x: 490,
    y: 20,
    width: 48,
    height: 64
};

var ui = {
    x: null,
    y: null,
    width: null,
    height: null,

    init: function () {
        this.x = document.querySelector('#x');
        this.y = document.querySelector('#y');
        this.width = document.querySelector('#width');
        this.height = document.querySelector('#height');

        var types = document.querySelectorAll('.game-object-type');
        for(var i = types.length - 1; i >= 0; i--) {
            types[i].addEventListener('click', function () {
                selectedType = parseInt(this.id);
                selectedScore = this.dataset.score ? parseInt(this.dataset.score) : undefined;
            });
        }
    },

    render: function (object) {
        var x, y, w, h = 0;
        if(!object) {
            x = Mouse.x > Mouse.mdownX ? Mouse.mdownX : Mouse.x;
            y = Mouse.y > Mouse.mdownY ? Mouse.mdownY : Mouse.y;
            w = Math.abs(Mouse.x - Mouse.mdownX);
            h = Math.abs(Mouse.y - Mouse.mdownY);
        } else {
            x = object.x;
            y = object.y;
            w = object.width;
            h = object.height;
        }
        this.x.innerHTML = x;
        this.y.innerHTML = y;
        this.width.innerHTML = w;
        this.height.innerHTML = h;
    },

    renderSelectedTypes: function () {
        var currentSelected = document.querySelector('.selected');
        if(currentSelected != null && currentSelected.id == selectedType && currentSelected.dataset.score == selectedScore) { return; }

        var types = document.querySelectorAll('.game-object-type');
        for(var j = types.length - 1; j >= 0; j--) {
            types[j].classList.remove('selected');
        }
        if(selectedType != undefined) {
            document.querySelector('[id="' + selectedType + '"]'+
            (selectedScore ? ('[data-score="'+ selectedScore +'"]') : '')).classList.add('selected');
        }
    }
};

var game = {
    lastTime: null,

    init: function(){
        this.lastTime = new Date();
    }
};

function save () {
    window.localStorage.setItem('map', JSON.stringify(world.objects));
};

function load () {
    var map = window.localStorage.getItem('map');
    if(map != null) {
        selectedObject = null;
        world.objects = JSON.parse(map);
    }
};

function copypaste () {
    if(selectedObject != undefined) {
        var newObj = {};
        for(var i in selectedObject) {
            newObj[i] = selectedObject[i];
        }
        world.objects.push(newObj);
        selectedObject = newObj;
    }
};

function findObject (x, y) {
    for(var i in world.objects) {
        if(world.objects[i].x == x && world.objects[i].y == y) {
            return world.objects[i];
        }
    }

    return null;
};

//sort of vocabulary
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
        width: 30,
        height: 30,
        type: 4,
        strokecolor: '',
        selectcolor: 'rgba(168,0,0,.5)',
        score: 100
    },
    thundred: {
        width: 30,
        height: 30,
        type: 4,
        strokecolor: '',
        selectcolor: 'rgba(252,84,84,.5)',
        score: 200
    },
    fhundred: {
        width: 30,
        height: 30,
        type: 4,
        strokecolor: '',
        selectcolor: 'rgba(0,168,168,.5)',
        score: 400
    },
    oneup: {
        width: 30,
        height: 30,
        type: 4,
        strokecolor: '',
        selectcolor: 'rgba(255,0,0,.5)',
        score: 1  
    },
    teleport: {
        type: 5,
        width: 64,
        height: 96,
        exitPoint: {},
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

var Mouse = {
    x:      0,
    y:      0,
    down:   false,
    mdownX: 0,
    mdownY: 0
};

var selectedType = undefined;
var selectedScore = undefined;
var selectedObject = undefined;
var selectedOffset = {x: 0, y: 0};
var creatingObject = false;

function update (dt) {
    //ctrl + zee
    if (keyboard.pressed[90] && keyboard.pressed[17]) {
        world.objects.pop();
        selectedObject = undefined;
    }

    viewportContext.updateTarget(dt);
    var bounds = viewportContext.getBounds();
    world.lifeArea.update( {
        x: viewportContextanchor.x,
        y: viewportContextanchor.y,
        width: bounds.width,
        height: bounds.height
    } );
};

function boxCollides (b1, b2) {
    var bottom1 = b1.y + b1.height;
    var right1 = b1.x + b1.width;
    var bottom2 = b2.y + b2.height;
    var right2 = b2.x + b2.width;
    return !(b1.x > right2 ||
             b1.y > bottom2 ||
             right1 < b2.x ||
             bottom1 < b2.y);
};

function render (viewportContext) {
    world.render(viewportContext);
    world.lifeArea.render(viewportContext);
    viewportContext.renderIdleZone();
    if(selectedType == gameObjects.solid.type || selectedType == gameObjects.jumpable.type) {
        if(creatingObject) {
            ui.render();
            viewportContext.setStrokeStyle('yellow');
            viewportContext.strokeRect(Mouse.mdownX + .5, Mouse.mdownY + .5, Mouse.x - Mouse.mdownX, Mouse.y - Mouse.mdownY, true);
        }
    }
    
    if(selectedObject) {
        for(var i in gameObjects) {
            if(gameObjects[i].type == selectedObject.type && gameObjects[i].score == selectedObject.score) {
                viewportContext.setFillStyle(gameObjects[i].selectcolor);
                break;
            }
        }
        viewportContext.fillRect(selectedObject.x, selectedObject.y, selectedObject.width, selectedObject.height);
        ui.render(selectedObject);
    }

    ui.renderSelectedTypes();
};

function mainLoop() {
    requestAnimFrame(mainLoop);
    var now = new Date();
    var dt = (now - game.lastTime) / 1000;
    game.lastTime = now;
    debug.update('dt', dt);
    update(dt);
    render(viewportContext);
    debug.print();
}

function collidesWithDoor(score) {
    for(var i = world.objects.length - 1; i >= 0; i--) {
    if(world.objects[i].type == gameObjects.wardrobe.type) {
    if(boxCollides(world.objects[i], score)) { return world.objects[i]; }}}
};

function getPropertiesByType (type, score) {
    for(var i in gameObjects) {
    if(gameObjects[i].type == type && score == gameObjects[i].score){ return gameObjects[i]; }}
}

function handleMouseUp (e) {
    if(!creatingObject) { return; }

    switch (selectedType) {
        case gameObjects.solid.type:
        case gameObjects.jumpable.type:
            var x = Mouse.x > Mouse.mdownX ? Mouse.mdownX : Mouse.x;
            var y = Mouse.y > Mouse.mdownY ? Mouse.mdownY : Mouse.y;
            var origin = viewportContext.getWorldCoordinates(x, y);
            world.objects.push({
                x:      origin.x,
                y:      origin.y,
                width:  Math.abs(Mouse.x - Mouse.mdownX),
                height: Math.abs(Mouse.y - Mouse.mdownY),
                type:   selectedType
            });
        break;

        case undefined:
        break;

        default:
            var origin = viewportContext.getWorldCoordinates(e.pageX, e.pageY);
            var props = getPropertiesByType(selectedType, selectedScore);
            if(selectedType == gameObjects.hundred.type) {
                var wardrobe = collidesWithDoor({
                    x: origin.x,
                    y: origin.y,
                    width: props.width,
                    height: props.height
                });
                if(wardrobe) { wardrobe.score = props.score; break; }
            }
            world.objects.push({
                x:      origin.x,
                y:      origin.y,
                width:  props.width,
                height: props.height,
                type:   selectedType,
                score:  props.score
            });
        break;
    }

    selectedType = undefined;
    selectedScore = undefined;
    creatingObject = false;
};

function handleMouseDown (e) {
    if(!keyboard.pressed[keyboard.keys.SPACE] && selectedType != undefined) {
        creatingObject = true;
    }

    if(!keyboard.pressed[keyboard.keys.SPACE]) {
        selectedObject = undefined;
    }
    var relativeOrigin = viewportContext.getWorldCoordinates(e.pageX, e.pageY)
    for (var i = world.objects.length - 1; i >= 0; i--) {
        if(relativeOrigin.x >= world.objects[i].x &&
           relativeOrigin.x <= world.objects[i].x + world.objects[i].width &&
           relativeOrigin.y >= world.objects[i].y &&
           relativeOrigin.y <= world.objects[i].y + world.objects[i].height) {
            ui.render(world.objects[i]);
            selectedObject = world.objects[i];
            selectedOffset.x = relativeOrigin.x - world.objects[i].x;
            selectedOffset.y = relativeOrigin.y - world.objects[i].y;
            break;
        }
    };

    if(keyboard.pressed[keyboard.keys.ALT]) {
        copypaste();
    }
};

function handleMouseMove (e) {
    if(keyboard.pressed[keyboard.keys.SPACE]) { return; }
    if(!Mouse.down) { return; }
    if(!selectedObject) { return; }
    var relativeOrigin = viewportContext.getWorldCoordinates(e.pageX, e.pageY);
    selectedObject.x = relativeOrigin.x - selectedOffset.x;
    selectedObject.y = relativeOrigin.y - selectedOffset.y;
};

function handleKeyDown (e) {
    if(!selectedObject) { return; }
    
    if(e.which == 46) {
        world.objects.splice(world.objects.indexOf(selectedObject), 1);
        selectedObject = undefined;
    }

    if(e.which == keyboard.keys.UP) {
        console.log('up pressed');
        if(keyboard.pressed[16]) {
            selectedObject.height--;
        } else {
            selectedObject.y--;
        }
    } else if (e.which == keyboard.keys.DOWN) {
        if(keyboard.pressed[16]) {
            selectedObject.height++;
        } else {
            selectedObject.y++;
        }
    } else if (e.which == keyboard.keys.LEFT) {
        if(keyboard.pressed[16]) {
            selectedObject.width--;
        } else {
            selectedObject.x--;
        }
    } else if (e.which == keyboard.keys.RIGHT) {
        if(keyboard.pressed[16]) {
            selectedObject.width++;
        } else {
            selectedObject.x++;
        }
    }
};

function bindviewportContextMouseHandlers () {
    var cnv = viewportContext.getCanvas();
    cnv.addEventListener('mouseup', handleMouseUp);
    cnv.addEventListener('mousedown', handleMouseDown);
    cnv.addEventListener('mousemove', handleMouseMove);
};

function bindKeyHandlers () {
    window.addEventListener('keydown', handleKeyDown);
};

function appendTypesHtml () {
    var html = '';

    for(var i in gameObjects) {
        html += ('<div id="'+ gameObjects[i].type + 
                (gameObjects[i].type == gameObjects.hundred.type ? ('" data-score="' + gameObjects[i].score): '') +
                '" class="game-object-type">' + i + '</div>');
    }

    html = document.querySelector('.info').innerHTML + html;
    document.querySelector('.info').innerHTML = html;
};

/*
 * invoke when all assets are loaded
 */
function init() {
    debug.init();
    keyboard.init();
    appendTypesHtml();
    ui.init();
    viewportContext.init(world.width, world.height);
    viewportContext.follow(viewportContextanchor);
    bindviewportContextMouseHandlers();
    bindKeyHandlers();

    game.init();
    mainLoop();
};

window.onload = function () {
    console.log('hello');
    world.init(init);
};