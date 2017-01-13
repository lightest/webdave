var requestAnimFrame = 
    window.requestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.msRequestAnimationFrame;

var debug = {
    el: null,
    data: {},
    enabled: false,

    enable: function () {
        this.enabled = true;
        this.el.style.display = 'block';
    },

    disable: function () {
        this.enabled = false;
        this.el.style.display = 'none';
    },

    init: function(){
        this.el = document.querySelector('.debug');
        if(this.enabled) { this.enable(); }
    },

    update: function(key, value){
        if(!this.enabled) { return; }
        this.data[key] = value;
    },

    print: function(){
        if(!this.enabled) { return; }
        var html = '';
        for(var i in this.data){
            html += i + ': ' + this.data[i] + '<br>';
        }
        this.el.innerHTML = html;
    }
};

function Box() {
    this.x = 100;
    this.y = 100;
    this.vx = Math.floor(Math.random()*50 + 50);
    this.vy = Math.floor(Math.random()*50 + 50);
    this.affectedByGravity = false;
    this.width = 5;
    this.height = 5;
    this.color = 'hotpink';
    this.prevx = 0;
    this.prevy = 0;
};

Box.prototype = new Character();

Box.prototype.resolveCollision = function(collided, dt){
    var reaction = null;
    if(collided instanceof SolidBody) {
        reaction = collided.getCollisionReaction(this);
        this.x = reaction.x != undefined ? reaction.x : this.x;
        this.y = reaction.y != undefined ? reaction.y : this.y;
        this.vx = reaction.vx != undefined ? reaction.vx : this.vx;
        this.vy = reaction.vy != undefined ? reaction.vy : this.vy;
    }
};

// function getQuadTreeNodes(){
//     quadTreeNodes = [];
//     quadTree.findAllNodes(quadTreeNodes);
//     quadTreeNodes.push(quadTree);
// }

function fillboxes (len) {
    if(!len) { return; }
    for(var i = len - 1; i >=0; i--){
        boxes.push(new Box());
    }
}

function showCanvas () {
    document.querySelector('.loading').style.display = 'none';
    document.querySelector('canvas').style.display = 'block';
};

function goFullScreen (e) {
    if (!document.fullscreenElement &&
       !document.webkitFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement) {
        if (document.body.requestFullscreen) {
            document.body.requestFullscreen();
        } else if (document.body.webkitRequestFullscreen) {
            document.body.webkitRequestFullScreen();
        } else if (document.body.mozRequestFullScreen) {
            document.body.mozRequestFullScreen();
        } else if (document.body.msRequestFullscreen) {
            document.body.msRequestFullscreen();
        }
        if(e) {
            e.currentTarget.classList.add('fs-active');
        }
    } else {
        if (document.exitFullscreen) {
            document.requestFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        if(e) {
            e.currentTarget.classList.remove('fs-active');
        }
    }
};

function compatibilityTest () {
    var el = document.createElement('canvas');
    var canvasAvailable = !!(el.getContext && el.getContext('2d'));
    var autioctxAvailable = typeof AudioContext == 'undefined' ? false : true;
    var isOpera = !!navigator.userAgent.match(/OPR/);
    return (canvasAvailable && autioctxAvailable && !!requestAnimFrame && !isOpera);
};

/*
 * invoke when all assets are loaded
 */
function init() {
    // quadTree = new QuadTree();
    showCanvas();
    debug.init();
    keyboard.init();
    menuWindow.init();
    // fillboxes(100);
    Game.init();
};

/*
 * @desc: globals
 */
var player = null;
var boxes = [];
var SFXPool = new SFXPool();
var monsters = [];
var scores = [];
var lifeAreaObjects = [];
// var quadTree = null;
// var quadTreeNodes = [];
var resources = null;

var audioAPI = {
    ctx: null,
    source: null,

    init: function () {
        this.ctx = new AudioContext();
        // this.src.connect(this.ctx.destination);
    },

    playSound: function (bufferSound, canBeStopped, dontInterruptCurrent, cb) {
        if(!bufferSound) {
            if(typeof cb == 'function') {
                cb();
            }
            return;
        }
        if(this.source && !this.source.canStopCurrentSound) { return; }

        if(this.source) {
            if(!this.source.ended && dontInterruptCurrent) {
                return;
            }
            this.source.stop(0);
        }

        this.source = audioAPI.ctx.createBufferSource();
        this.source.connect(audioAPI.ctx.destination);
        this.source.ended = false;

        if(canBeStopped == undefined) {
            this.source.canStopCurrentSound = true;
        } else {
            this.source.canStopCurrentSound = canBeStopped;
        }

        this.source.buffer = bufferSound;
        this.source.onended = function () {
            this.ended = true;
            this.stop(0);
            if(!this.canStopCurrentSound) {
                this.canStopCurrentSound = true;
            }
            if(typeof cb == 'function') {
                cb();
            }
        };
        this.source.start(0);
    },
};

window.onload = function () {
    if(!compatibilityTest()) {
        document.querySelector('.loading').innerHTML = 'This game is not supported in your browser. <br> May be try <a href="https://www.google.ru/chrome/browser/desktop/">chrome</a> out of curiocity';
        return;
    }
    resources = new AssetLoader();
    audioAPI.init();
    resources.onAssetsLoaded = init;
    resources.init([
        {
            name: 'levels',
            path: 'levels.txt'
        },
        {
            name: 'player',
            path: 'sprites/dave.png'
        },
        {
            name: 'shoot',
            path: 'sounds/shoot.mp3'
        },
        {
            name: 'shoothit',
            path: 'sounds/shoot_hit.mp3'
        },
        {
            name: 'reload',
            path: 'sounds/reload.mp3'
        },
        {
            name: 'jump',
            path: 'sounds/jump.mp3'
        },
        {
            name: 'land',
            path: 'sounds/land.mp3'
        },
        {
            name: 'ceilBump',
            path: 'sounds/ceil_bump.mp3'
        },
        {
            name: 'oneUp',
            path: 'sounds/oneUp.mp3'
        },
        {
            name: 'score_100',
            path: 'sounds/score_100.mp3'
        },
        {
            name: 'score_200',
            path: 'sounds/score_200.mp3'
        },
        {
            name: 'score_400',
            path: 'sounds/score_400.mp3'
        },
        {
            name: 'doorOpen',
            path: 'sounds/doorOpen.mp3'
        },
        {
            name: 'noAmmo',
            path: 'sounds/noAmmo.mp3'
        },
        {
            name: 'throwKnife',
            path: 'sounds/throw_knife.mp3'
        },
        {
            name: 'gameStart',
            path: 'sounds/game_start.mp3'
        },
        {
            name: 'gameOver',
            path: 'sounds/game_over.mp3'
        },
        {
            name: 'nextLevel',
            path: 'sounds/next_level.mp3'
        },
        {
            name: 'death',
            path: 'sounds/death.mp3'
        }
    ]);
};