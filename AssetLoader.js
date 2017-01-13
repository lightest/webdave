var AssetLoader = (function () {
    function AssetLoader () {
        this.assets = {};
        this.onAssetsLoaded = null;
    };

    AssetLoader.prototype.init = function (files) {
        this.total = files.length;
        for(var i = files.length - 1; i >= 0; i--) {
            var extension = files[i].path.match(/.\w+$/)[0];
            var asset = null;

            switch(extension) {
                case '.png':
                case '.jpg':
                case '.bmp':
                    asset = new Image();
                    asset.onload = this.onLoadComplete.bind(this);
                break;
                case '.txt':
                    var that = this;
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', files[i].path, true);
                    xhr.filename = files[i].name;
                    xhr.onload = function (e) {
                        that.assets[this.filename] = JSON.parse(this.response);
                        that.onLoadComplete();
                    };
                    xhr.send();
                    asset = false;
                break;
                case '.mp3':
                    var that = this;
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', files[i].path, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.filename = files[i].name;
                    xhr.onload = function (e) {
                        //some hackery...
                        var xhrScope = this;
                        audioAPI.ctx.decodeAudioData(this.response, function (buffer) {
                            that.assets[xhrScope.filename] = buffer;
                            that.onLoadComplete();
                        });
                    };
                    xhr.send();
                    asset = false;
                break;
            }

            if(asset == null) {
                console.log('INF: extension: "%s" is not supported', extension);
                this.onLoadComplete();
                continue;
            } else if(asset == false) {
                continue;
            }

            asset.src = files[i].path;
            this.assets[files[i].name] = asset;
        }
        
    };

    AssetLoader.prototype.onLoadComplete = function () {
        this.total--;
        if(this.total == 0) {
            if(typeof this.onAssetsLoaded === 'function') {
                this.onAssetsLoaded();
            }
        }
    };

    AssetLoader.prototype.get = function (name) {
        if(this.assets[name]) {
            return this.assets[name];
        }

        return null;
    };

    return AssetLoader;
})();