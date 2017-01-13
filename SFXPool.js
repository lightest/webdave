var SFXPool = (function () {

    function allocate (pool, amount) {
        if(!pool) { return; }

        if(isNaN(amount) || amount <= 0) {
            amount = 1;
        }

        if(amount > pool.length){
            amount = pool.length;
        }

        var initialAmount = amount;
        var returned = [];

        //try to find free
        for(var i = pool.length - 1; i >= 0; i--) {
            if(!pool[i].inUse){
                returned.push(pool[i]);
                amount--;
                if(amount == 0) { break; }
            }
        }

        //if not enough allocate those in use
        if(returned.length < initialAmount) {
            for(var i = pool.length - 1; i >= 0; i--){
                if(pool[i].inUse){
                    returned.push(pool[i]);
                    amount--;
                    if(amount == 0) { break; }
                }
            }
        }

        return returned;
    };

    function getSpawned (pool) {
        if(!pool) { return; }

        var inUse = [];
        for(var i = pool.length - 1; i >= 0; i--){
            if(pool[i].inUse){
                inUse.push(pool[i]);
            }
        }

        return inUse;
    };

    function SFXPool () {
        this._scoreSFXPool = [];
        this._gorePool = [];
        this._knivesPool = [];
        this._sparkSFXPool = [];
        this._smokeSFXPool = [];
    };

    SFXPool.prototype.init = function () {
        this._scoreSFXPool = [];
        this._gorePool = [];
        this._knivesPool = [];
        this._sparkSFXPool = [];
        this._smokeSFXPool = [];
        
        var scoreSFXAmount = 4;
        var goreAmount =     20;
        var knivesAmount =   10;
        var sparksAmount =   4;
        var smokeAmount =    2;

        for(var i = scoreSFXAmount - 1; i >= 0; i--) {
            this._scoreSFXPool.push(new ScoreSFX());
        }

        for(var i = goreAmount - 1; i >= 0; i--) {
            this._gorePool.push(new Gore());
        }

        for(var i = knivesAmount - 1; i >= 0; i--) {
            this._knivesPool.push(new Knife());
        }

        for(var i = sparksAmount - 1; i >= 0; i--) {
            this._sparkSFXPool.push(new SparkSFX());
        }

        for(var i = smokeAmount - 1; i >= 0; i--) {
            this._smokeSFXPool.push(new SmokeSFX());
        }
    };

    SFXPool.prototype.allocateSmokeSFX = function (amount) {
        return allocate(this._smokeSFXPool, amount);
    };

    SFXPool.prototype.allocateScoreSFX = function (amount) {
        return allocate(this._scoreSFXPool, amount);
    };

    SFXPool.prototype.getSpawnedScoreSFX = function () {
        return getSpawned(this._scoreSFXPool);
    };

    SFXPool.prototype.allocateGore = function (amount) {
        return allocate(this._gorePool, amount);
    };

    SFXPool.prototype.getSpawnedGore = function () {
        return getSpawned(this._gorePool);
    };

    SFXPool.prototype.allocateKnives = function (amount) {
        return allocate(this._knivesPool, amount);
    };

    SFXPool.prototype.getSpawnedKnives = function () {
        return getSpawned(this._knivesPool);
    };

    SFXPool.prototype.allocateSparkSFX = function (amount) {
        return allocate(this._sparkSFXPool, amount);
    };

    SFXPool.prototype.getSpawnedSparkSFX = function () {
        return getSpawned(this._sparkSFXPool);
    };

    SFXPool.prototype.getSpawnedSmokeSFX = function () {
        return getSpawned(this._smokeSFXPool);
    };

    return SFXPool;
})();