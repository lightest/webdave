var Game = (function () {
    var states = {
        inGame:            0,
        playerDeathZombie: 1,
        playerDeathKnife:  2,
        fadeIn:            3,
        fadeOut:           4,
        loading:           5,
        menu:              6,
        home:              7,
        gameFinished:      8
    };

    var settings = {
        font:       'lucida console',
        fontWeight: 'bold',
        fontSize:   '10px',
        textAlign:  'left'
    };

    var currentLevel = 1;
    var levels = null;
    var loadScreenTimeout = 3;
    var loadingScreenTime = 0;
    var lastDeathFrameTimeout = .3;
    var lastDeathFrameTime = -1;

    var updateFunc = undefined;
    var renderFunc = undefined;
    var updateFuncTo = undefined;
    var renderFuncTo = undefined; //to which we're going to fadeIn

    var deathX = undefined;
    var deathY = undefined;

    var lastTime =       null;
    var frameDuration =  0;
    var frameTime =      0;
    var maxDt =          0;
    var animations =     [];
    var spriteImg =      null;
    var state =          states.inGame;
    var newState =       undefined;
    var fadeDuration =   0;
    var fadeTime =       0;
    var fadeAlpha =      0;
    var fadeOutCallBack = undefined;
    var fadeInCallBack = undefined;
    var canSkipScreen = true;

    var sounds = {
        gameStart: null,
        gameOver: null,
        nextLevel: null,
        playerDeath: null,

        init: function () {
            this.gameStart = resources.get('gameStart');
            this.gameOver = resources.get('gameOver');
            this.playerDeath = resources.get('death');
            this.nextLevel = resources.get('nextLevel');
        }
    };

    function setPlayerAsMonstersTarget () {
        for(var i = monsters.length - 1; i >= 0; i--) {
            monsters[i].target = player;
        }
    };

    function scheduleStateSwitch (stateUpdate) {
        if(stateUpdate == undefined || stateUpdate == state) { return; }
        newState = stateUpdate;
    };

    function switchState (stateUpdate) {
        newState = undefined;
        state = stateUpdate;

        var descriptor = getStateDescription(stateUpdate);
        updateFunc = descriptor.updateFunc;
        renderFunc = descriptor.renderFunc;
        viewportContext.setBlendingMode('source-over');

        switch(stateUpdate) {
            case states.gameFinished:
                
            break;
            case states.home:
            break;
            case states.menu:
                menuWindow.setUpFontSettings();
            break;
            case states.loading:
                loadingScreenTime = 0;
            break;
            case states.inGame:
                fadeAlpha = 0;
                viewportContext.setFont(Game.composeFontString());
                viewportContext.setTextAlign(settings.textAlign);
            break;
            case states.playerDeathZombie:
            case states.playerDeathKnife:
                audioAPI.playSound(sounds.playerDeath, true);
            break;
            case states.fadeIn:
                viewportContext.switchToBufferContext();
                fadeAlpha = 1.2;
                updateFuncTo(frameDuration);
                renderFuncTo(viewportContext);
                viewportContext.switchToMainContext();
            break;
            case states.fadeOut:
                viewportContext.flushCurrentFrameToBuffer();
            break;
        }

        resetAnimations();
    };

    function getStateDescription (state) {
        var descriptor = {
            updateFunc: null,
            renderFunc: null
        };

        switch(state) {
            case states.gameFinished:
                descriptor.updateFunc = updateGameFinishedScreen;
                descriptor.renderFunc = renderGameFinishedScreen;
            break;
            case states.home:
                descriptor.updateFunc = updateHomeScreen;
                descriptor.renderFunc = renderHomeScreen;
            break;
            case states.menu:
                descriptor.updateFunc = updateMenuScreen;
                descriptor.renderFunc = renderMenuScreen;
            break;
            case states.loading:
                descriptor.updateFunc = updateLoadingScreen;
                descriptor.renderFunc = renderLoadingScreen;
            break;
            case states.inGame:
                descriptor.updateFunc = updateGame;
                descriptor.renderFunc = renderGame;
            break;
            case states.playerDeathZombie:
            case states.playerDeathKnife:
                descriptor.updateFunc = updateDeathScreen;
                descriptor.renderFunc = renderDeathScreen;
            break;
            case states.fadeIn:
            case states.fadeOut:
                descriptor.updateFunc = updateFade;
                descriptor.renderFunc = renderFade;
            break;
        }

        return descriptor;
    };

    function fadeIn (newState, cb) {
        var descriptor = getStateDescription(newState);
        updateFuncTo = descriptor.updateFunc;
        renderFuncTo = descriptor.renderFunc;
        scheduleStateSwitch(states.fadeIn);
        if(cb) {
            fadeInCallBack = cb;
        } else {
            fadeInCallBack = undefined;
        }
    };

    function fadeOut (cb) {
        scheduleStateSwitch(states.fadeOut);
        if(cb) {
            fadeOutCallBack = cb;
        } else {
            fadeOutCallBack = undefined;
        }
    };

    function transitionTo (state) {
        if(state == undefined) { return; }
        if(!canSkipScreen) { return; }
        fadeOut(function () {
            fadeIn(state, function () {
                scheduleStateSwitch(state)
            });
        });
    };

    function resetAnimations () {
        for(var i in animations) {
            animations[i].reset();
        }
    };

    function deathCallBack () {
        lastDeathFrameTime = 0;
    };

    function extractLifeAreaObjects(objects, lifeAreaObjects) {
        for(var i = objects.length - 1; i >= 0; i--){
            for(var j = objects[i].length - 1; j >= 0; j--){
                if(boxCollides( objects[i][j], world.getLifeAreaBounds() )){
                    lifeAreaObjects.push(objects[i][j]);
                }
            }
        }
    }

    function updateLifeObjects(dt) {
        lifeAreaObjects = [];
        /*
         * update the viewportContext's target first
         * then adjust position of the camera
         * to work only with inside of camera objects
         */
        viewportContext.updateTarget(dt);
        viewportContext.align();
        world.lifeArea.update( viewportContext.getBounds() );

        extractLifeAreaObjects([boxes,
         world.mapObjects,
         SFXPool.getSpawnedGore(),
         monsters,
         SFXPool.getSpawnedKnives(),
         SFXPool.getSpawnedScoreSFX(),
         SFXPool.getSpawnedSparkSFX(),
         SFXPool.getSpawnedSmokeSFX(),
         getActiveScores()],
         lifeAreaObjects);

        if(boxCollides( player, world.getLifeAreaBounds() )) {
            lifeAreaObjects.push(player);
        }

        for(var i = lifeAreaObjects.length - 1; i >= 0; i--) {
            if(lifeAreaObjects[i].update != undefined) {
                if(lifeAreaObjects[i].trackedByCamera) { continue; }
                lifeAreaObjects[i].update(dt);
            }
        }
    }

    function updateState(dt) {
        for(var i = lifeAreaObjects.length - 1; i >= 0; i--){
            if(lifeAreaObjects[i].updateState != undefined){
                lifeAreaObjects[i].updateState(dt);
            }
        }
    };

    function renderGame(viewportContext){
        // viewportContext.clear();
        viewportContext.setBlendingMode('source-over');
        world.render(viewportContext);

        // for(var i = boxes.length - 1; i >= 0; i--){
        //     boxes[i].render(viewportContext);
        // }

        for(var i = lifeAreaObjects.length - 1; i >= 0; i--){
            if(lifeAreaObjects[i].render != undefined){
                lifeAreaObjects[i].render(viewportContext);
            }
        }

        player.render(viewportContext);
        if(Game.debugSettings.drawBoundingBox) {
            viewportContext.renderIdleZone();
        }
        // quadTree.render(viewportContext);
    }

    function handleCollisions(dt){
        for(var i = boxes.length - 1; i >= 0; i--){
            handleWorldCollision(boxes[i], world.width, world.height);
        }

        var t = new Date();

        lifeAreaObjects.forEach(function (item, i) {
            for(var j = i + 1; j < lifeAreaObjects.length; j++) {
                if(boxCollides(item, lifeAreaObjects[j])) {
                    if(item.resolveCollision !== undefined) {
                        item.resolveCollision(lifeAreaObjects[j], dt);
                    }
                    if(lifeAreaObjects[j].resolveCollision !== undefined) {
                        lifeAreaObjects[j].resolveCollision(item, dt);
                    }
                }
            }

            if(item.updateState != undefined) {
                item.updateState(dt);
            }
        });

        debug.update('collisionDetectionTime', new Date() - t);
    }

    function getIntersectionPoint(ray, object){
        //parametric form of line
        var r_px = ray.a.x;
        var r_py = ray.a.y;
        var r_dx = ray.b.x - ray.a.x;
        var r_dy = ray.b.y - ray.a.y;

        var objectLines = object.getLinesForm();
        var closest = null;

        for(var i = objectLines.length - 1; i >= 0; i--){
            var o_px = objectLines[i].a.x;
            var o_py = objectLines[i].a.y;
            var o_dx = objectLines[i].b.x - objectLines[i].a.x;
            var o_dy = objectLines[i].b.y - objectLines[i].a.y;

            // SOLVE FOR T1 & T2
            // r_px+r_dx*T1 = s_px+s_dx*T2 && r_py+r_dy*T1 = s_py+s_dy*T2
            // ==> T1 = (s_px+s_dx*T2-r_px)/r_dx = (s_py+s_dy*T2-r_py)/r_dy
            // ==> s_px*r_dy + s_dx*T2*r_dy - r_px*r_dy = s_py*r_dx + s_dy*T2*r_dx - r_py*r_dx
            // ==> T2 = (r_dx*(s_py-r_py) + r_dy*(r_px-s_px))/(s_dx*r_dy - s_dy*r_dx)
            var T2 = (r_dx*(o_py-r_py) + r_dy*(r_px-o_px))/(o_dx*r_dy - o_dy*r_dx);
            var T1 = (o_px+o_dx*T2-r_px)/r_dx;
            if(T1<0) {continue};
            if(T2<0 || T2>1) {continue};

            if(!closest || T1 < closest.param){
                closest = {
                    x: r_px + r_dx * T1,
                    y: r_py + r_dy * T1,
                    param: T1
                };
            }
        }

        return closest;
    }

    function handleShootingCollisions () {
        var shootingrays = player.getShootingRays();
        if(!shootingrays) { return; }
        var hitPoints = [];//only for rendering
        var closestHitObjects = [];
        var t = new Date();
        for(var i = 0; i < shootingrays.length; i++) {
            var closest = null;
            var hitObject = null;
            for(var j = lifeAreaObjects.length - 1; j >= 0; j--) {
                if(!lifeAreaObjects[j].imperviousToShootingRay) { continue; }

                var point = getIntersectionPoint(shootingrays[i], lifeAreaObjects[j]);
                if(point == undefined) { continue; }
                if(closest == null || point.param < closest.param){
                    closest = point;
                    hitObject = lifeAreaObjects[j];
                }
            }
            if(closest) {
                closestHitObjects.push({
                    point: closest,
                    entity: hitObject
                });
                hitPoints.push(closest);
            }
        }
        
        debug.update('raycast', new Date() - t);

        if(closestHitObjects.length) {
            var closest = null;
            var closestCharacter = null;
            var hitCharacters = [];
            for(var i = 0; i < closestHitObjects.length; i++) {
                if(closestHitObjects[i].entity instanceof Character) {
                    hitCharacters.push(closestHitObjects[i]);
                }
                if(closest == null || closestHitObjects[i].point.param < closest.point.param){
                    closest = closestHitObjects[i];
                }
            }

            for(var i = 0; i < hitCharacters.length; i++) {
                if(closestCharacter == null || hitCharacters[i].point.param < closestCharacter.point.param){
                    closestCharacter = hitCharacters[i];
                }
            }

            if(closestCharacter) {
                closest = closestCharacter;
            }

            if(closest.entity.handleShoot != undefined) {
                closest.entity.handleShoot();
                if(closest.entity.dead) {
                    player.obtainScore(closest.entity);
                }
            }

            player.shootSuccess(closest.point, hitPoints);
        } else {
            player.shootFail();
        }
    };

    function updateMonstersWithTarget(dt) {
        for(var i = monsters.length - 1; i >= 0; i--){
            if(this.monsters[i].checkTarget != undefined){
                this.monsters[i].checkTarget(dt);
            }
        }
    }

    function removeDeadMonsters(){
        for(var i = monsters.length - 1; i >= 0; i--){
            if(monsters[i].dead){
                monsters.splice(i, 1);
            }
        }
    }

    function getActiveScores () {
        var active = [];
        for(var i = scores.length - 1; i >= 0; i--) {
            if(scores[i].active) {
                active.push(scores[i]);
            }
        }

        return active;
    };

    function updateDeathScreen (dt) {
        var animation = animations[state];
        if(animation) {
            animation.update(dt);
        }
        if(lastDeathFrameTime >= 0 && lastDeathFrameTime < lastDeathFrameTimeout) {
            lastDeathFrameTime += dt;
        } else if(lastDeathFrameTime >= lastDeathFrameTimeout) {
            lastDeathFrameTime = -1;
            player.death();
            if(player.getLives() == -1) {
                Game.gameOver();
            } else {
                Game.restartLevel();
            }
        }
    };

    function renderDeathScreen (viewportContext) {
        renderGame(viewportContext);
        var animation = animations[state];
        if(animation) {
            var x = 0;
            var y = 0;
            x = Math.floor(deathX - animation.width * .5);
            y = Math.floor(deathY - animation.height * .5);
            var bounds = viewportContext.getBounds();
            var maxRight = bounds.x + bounds.width - animation.width;
            var maxBottom = bounds.y + bounds.height - animation.height;
            x = Math.max(0, Math.min(x, maxRight));
            y = Math.max(0, Math.min(y, maxBottom));
            animation.render(viewportContext, x, y);
        }
    };

    function updateFade (dt) {
        fadeTime += dt;

        if(fadeTime < fadeDuration) {
            return;
        }

        if(fadeAlpha == 1 && state == states.fadeOut && fadeOutCallBack) {
            fadeOutCallBack();
            return;
        } else if (fadeAlpha == 0 && state == states.fadeIn && fadeInCallBack) {
            fadeInCallBack();
            return;
        }

        var k = state == states.fadeIn ? -1 : 1;
        fadeAlpha += (.4 * k);
        fadeAlpha = Math.max(0, Math.min(1, fadeAlpha));

        fadeTime = 0;
    };

    function renderFade (viewportContext) {
        var bounds = viewportContext.getBounds();
        viewportContext.setBlendingMode('source-over');
        viewportContext.renderBufferContextToMain();

        if(fadeAlpha < 1) {
            viewportContext.setBlendingMode('overlay');
        }

        viewportContext.setFillStyle('rgba(0,0,0,'+ fadeAlpha +')');
        viewportContext.fillRect(bounds.x,bounds.y,bounds.width, bounds.height);
        viewportContext.fillRect(bounds.x,bounds.y,bounds.width, bounds.height);
    };

    function updateLoadingScreen (dt) {
        loadingScreenTime += dt;
        if(state == states.loading && (loadingScreenTime >= loadScreenTimeout || keyboard.pressed[keyboard.keys.SPACE])) {
            transitionTo(states.inGame);
            return;
        }
    };

    function renderLoadingScreen (viewportContext) {
        var ctx = viewportContext.getContext();
        var bounds = viewportContext.getBounds();
        var animation = animations[states.loading];
        if(animation) {
            animation.render(viewportContext, bounds.x, bounds.y);
        }
        ctx.font = (Game.composeFontString({
            fontSize: '24px'
        }));
        viewportContext.setTextAlign(settings.textAlign);
        ctx.fillStyle = 'black';
        ctx.fillText('LEVEL ' + currentLevel, 35, 40);
        ctx.fillText('LOADING', 35, 120);
        ctx.fillStyle = '#A80000';
        ctx.fillText('SCORE', 350, 349);
        ctx.fillStyle = '#545454';
        ctx.fillText(player.score, 490, 349);
        var animation = player.getStandingSprite();
        if(animation) {
            animation.switchOrigin(0);
            var davesLeft = Math.min(player.getLives(), 10, 7);
            for(var i = 0; i < davesLeft; i++) {
                animation.render(ctx, 92 + i*animation.width - 16*i, 330);
            }
        }
    };

    function updateMenuScreen (dt) {
        menuWindow.update(dt);
    };

    function renderMenuScreen (viewportContext) {
        menuWindow.render(viewportContext);
    };

    function updateHomeScreen (dt) {
        if(keyboard.pressed[keyboard.keys.SPACE]) {
            transitionTo(states.loading);
            canSkipScreen = false;
            audioAPI.playSound(sounds.gameStart, false, false, function () {
                canSkipScreen = true;
                transitionTo(states.inGame);
            });
            return;
        }
    };

    function renderHomeScreen (viewportContext) {
        var animation = animations[states.home];

        if(animation) {
            var bounds = viewportContext.getBounds();
            animation.render(viewportContext, bounds.x, bounds.y);
        }
    };

    function updateGameFinishedScreen (dt) {
        if(state == states.gameFinished && keyboard.pressed[keyboard.keys.SPACE]) {
            Game.restartGame();
        }
    };

    function renderGameFinishedScreen (viewportContext) {
        var animation = animations[states.gameFinished];
        if(animation) {
            var bounds = viewportContext.getBounds();
            animation.render(viewportContext, bounds.x, bounds.y);
            viewportContext.setFont(Game.composeFontString({
                fontSize: '12px',
                fontWeight: 'normal',
            }));
            viewportContext.setFillStyle('#fcfc54');
            viewportContext.setTextAlign('center');
            viewportContext.fillText('YOUR SCORE IS ' + player.score, bounds.x + (bounds.width * .5) | 0, bounds.y + 330);
        }
    };

    function updateGame (dt, now) {
        // if(frameTime < frameDuration) {
        //     return;
        // }
        // var timeOffset = frameTime % frameDuration;
        
        debug.update('dt', dt);
        debug.print();
        debug.update('dt MAX', maxDt);
        removeDeadMonsters();
        updateMonstersWithTarget(dt);
        updateLifeObjects(dt);
        // quadTree.clear();
        // quadTree.bounds = world.getLifeAreaBounds();
        // quadTree.insert(lifeAreaObjects);
        // getQuadTreeNodes();
        
        // world.quadTree.clear();
        // world.quadTree.insert(boxes);
        // world.getQuadTreeNodes();
        handleCollisions(dt);
        // updateState(dt);
        handleShootingCollisions();

        debug.update('update time', new Date() - now);
    };

    function mainLoop () {
        requestAnimFrame(mainLoop);
        var now = new Date();
        var dt = Math.min( (now - lastTime) / 1000, frameDuration ); //when switching to other tab big dt causes shit
        lastTime = now;
        maxDt = Math.max(dt, maxDt);
        frameTime += dt; 

        if(newState != undefined) {
            switchState(newState);
        }

        updateFunc(dt, now);

        if(frameTime < frameDuration) {
            return;
        }

        var beforeRender = new Date();
        renderFunc(viewportContext);
        debug.update('render time', new Date() - beforeRender);

        frameTime = 0;
        maxDt = 0;
    }

    return {
        debugSettings: {
            drawBoundingBox: false,
            drawStats: false
        },

        init: function() {
            levels = resources.get('levels');
            frameDuration = this.calculateFrameDuration(30);
            fadeDuration = this.calculateFrameDuration(10);
            spriteImg = resources.get('player');
            this.initAnimations();
            sounds.init();

            world.levelLoadCallBack = function (levelData) {
                viewportContext.init(world.visibilityOffset.left,
                              world.visibilityOffset.top,
                              world.visibilityOffset.right,
                              world.visibilityOffset.bottom,
                              world.getWidth(),
                              world.getHeight());
                SFXPool.init();
                if(player == null) {
                    player = new Player();
                }
                player.setInitialPosition(levelData.playerPos.x, levelData.playerPos.y);
                viewportContext.follow(player);
                setPlayerAsMonstersTarget();
            };
            world.load(levels[currentLevel], function () {
                Game.start();
            });
        },

        start: function () {
            viewportContext.switchToMainContext();
            switchState(states.home);
            lastTime = new Date();
            mainLoop();
        },

        getFrameDuration: function () {
            return frameDuration;
        },

        composeFontString: function (data) {
            data = data || {};
            return  (data.fontWeight ? data.fontWeight : settings.fontWeight) + ' ' +
                    (data.fontSize ? data.fontSize : settings.fontSize) + ' ' +
                    (data.font ? data.font : settings.font);

        },

        calculateFrameDuration: function (FPS, base) {
            // 16(ms) is the approximate time between requestAnimFrame calls
            if(base) {
                return Math.round( Math.floor(1000 / FPS) / (base * 1000) ) * base;
            }
            return Math.round( Math.floor(1000 / FPS) / 16 ) * .016;
        },

        gameOver: function () {
            scheduleStateSwitch(states.menu);
            menuWindow.showText('G A M E  O V E R', 3);
            audioAPI.playSound(sounds.gameOver, false, false, this.restartGame.bind(this));
        },

        playerDeathByZombie: function (player) {
            if(!(player instanceof Player)) { return; }
            deathX = player.x + player.width * .5;
            deathY = player.y + player.height * .5;
            scheduleStateSwitch(states.playerDeathZombie);
        },

        playerDeathByKnife: function (player) {
            if(!(player instanceof Player)) { return; }
            deathX = player.x + player.width * .5;
            deathY = player.y + player.height * .5;
            scheduleStateSwitch(states.playerDeathKnife);
        },

        spawnMonster: function (monster, x, y){
            monster.x = x;
            monster.y = y;
            monster.target = player;
            monsters.push(monster);
        },

        restartLevel: function () {
            fadeOut(function () {
                fadeIn(states.loading, function () {
                    world.load(levels[currentLevel], function () {
                        player.reset(true, true);
                        scheduleStateSwitch(states.loading);
                    });
                });
                
            });
        },

        nextLevel: function () {
            var that = this;
            audioAPI.playSound(sounds.nextLevel);
            fadeOut(function () {
                if(levels.length == currentLevel + 1) {
                    fadeIn(states.gameFinished, function () {
                        scheduleStateSwitch(states.gameFinished);
                    });
                } else {
                    currentLevel++;
                    fadeIn(states.loading, function () {
                        world.load(levels[currentLevel], function () {
                            scheduleStateSwitch(states.loading);
                        });
                    });
                }
            });
        },

        restartGame: function () {
            fadeOut(function () {
                fadeIn(states.home, function () {
                    currentLevel = 1;
                    player.reset();
                    world.load(levels[currentLevel], function () {
                        scheduleStateSwitch(states.home);
                    });
                });
            });
        },

        initAnimations: function () {
            animations[states.playerDeathZombie] = (new Sprite({
                img:       spriteImg,
                origins:   [
                    {
                        x: 0,
                        y: 66
                    }
                ],
                width:     96,
                height:    96,
                frames:    5,
                animSpeed: 4,
                repeat:    false,
                callbacks: [{
                    frame: 4,
                    cb:    deathCallBack.bind(this)
                }]
            }));

            animations[states.playerDeathKnife] = (new Sprite({
                img:       spriteImg,
                origins:   [
                    {
                        x: 480,
                        y: 66
                    }
                ],
                width:     96,
                height:    96,
                frames:    4,
                animSpeed: 4,
                repeat:    false,
                callbacks: [{
                    frame: 3,
                    cb:    deathCallBack.bind(this)
                }]
            }));

            animations[states.home] = (new Sprite({
                img:       spriteImg,
                origins:   [
                    {
                        x: 0,
                        y: 164
                    }
                ],
                width:     640,
                height:    400,
                frames:    1,
                animSpeed: 1,
                repeat:    false
            }));

            animations[states.loading] = (new Sprite({
                img:       spriteImg,
                origins:   [
                    {
                        x: 1284,
                        y: 164
                    }
                ],
                width:     640,
                height:    400,
                frames:    1,
                animSpeed: 1,
                repeat:    false
            }));

            animations[states.gameFinished] = (new Sprite({
                img:       spriteImg,
                origins:   [
                    {
                        x: 642,
                        y: 164
                    }
                ],
                width:     640,
                height:    400,
                frames:    1,
                animSpeed: 1,
                repeat:    false
            }));
        }
    };
}) ();