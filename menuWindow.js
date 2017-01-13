var menuWindow = (function () {
    var idleTime = 0;
    var rows = 1;
    var cols = 1;
    var curRow = 1;
    var curCol = 1;
    var fontSize = '22px';
    var text = '';

    var presets = {
        gameover: {
            text: 'G A M E  O V E R',
            textAlign: 'center'
        },
    };

    var spriteImg = null;
    var topLeft = {
        x: 866,
        y: 66,
        width: 16,
        height: 16
    };
    var bottomLeft = {
        x: 882,
        y: 66,
        width: 16,
        height: 16
    };
    var topRight = {
        x: 898,
        y: 66,
        width: 16,
        height: 16
    };
    var bottomRight = {
        x: 914,
        y: 66,
        width: 16,
        height: 16
    };
    var leftVertical = {
        x: 930,
        y: 66,
        width: 16,
        height: 16
    };
    var rightVertical = {
        x: 946,
        y: 66,
        width: 16,
        height: 16
    };
    var topHorisontal = {
        x: 962,
        y: 66,
        width: 16,
        height: 16
    };
    var bottomHorizontal = {
        x: 978,
        y: 66,
        width: 16,
        height: 16
    };

    function update (dt) {
        idleTime += dt;

        // if(idleTime < .016) {
        //     return;
        // }

        if(curCol < cols) {
            curCol = Math.min(curCol + 2, cols);
        } else if(curRow < rows) {
            curRow = Math.min(curRow + 2, rows);
        }
        idleTime = 0;
    };

    function render (viewportContext) {
        var bounds = viewportContext.getBounds();
        var x = Math.floor(bounds.x + bounds.width * .5);
        var y = Math.floor(bounds.y + bounds.height * .5);
        var topLeftX = Math.floor(x - topLeft.width - topHorisontal.width * curCol * .5);
        var topLeftY = Math.floor(y - topLeft.height - leftVertical.height * curRow * .5);
        var bottomLeftY = topLeftY + topLeft.height + leftVertical.height * curRow;
        var topRightX = topLeftX + topLeft.width + topHorisontal.width * curCol;
        //corners
        viewportContext.drawImage(spriteImg, topLeft.x, topLeft.y, topLeft.width, topLeft.height, topLeftX, topLeftY, topLeft.width, topLeft.height);
        viewportContext.drawImage(spriteImg, topRight.x, topRight.y, topRight.width, topRight.height, topRightX, topLeftY, topRight.width, topRight.height);
        viewportContext.drawImage(spriteImg, bottomLeft.x, bottomLeft.y, bottomLeft.width, bottomLeft.height, topLeftX, bottomLeftY, bottomLeft.width, bottomLeft.height);
        viewportContext.drawImage(spriteImg, bottomRight.x, bottomRight.y, bottomRight.width, bottomRight.height, topRightX, bottomLeftY, bottomRight.width, bottomRight.height);
        //horizontal blocks
        for(var i = 0; i < curCol; i++) {
            viewportContext.drawImage(spriteImg, topHorisontal.x, topHorisontal.y, topHorisontal.width, topHorisontal.height, topLeftX + topLeft.width + topHorisontal.width * i, topLeftY, topHorisontal.width, topHorisontal.height);
            viewportContext.drawImage(spriteImg, bottomHorizontal.x, bottomHorizontal.y, bottomHorizontal.width, bottomHorizontal.height, topLeftX + topLeft.width + bottomHorizontal.width * i, bottomLeftY, bottomHorizontal.width, bottomHorizontal.height);
        }
        //vertical blocks
        for(var i = 0; i < curRow; i++) {
            viewportContext.drawImage(spriteImg, leftVertical.x, leftVertical.y, leftVertical.width, leftVertical.height, topLeftX, topLeftY + topLeft.height + leftVertical.height * i, leftVertical.width, leftVertical.height);
            viewportContext.drawImage(spriteImg, rightVertical.x, rightVertical.y, rightVertical.width, rightVertical.height, topRightX, topLeftY + topLeft.height + rightVertical.height * i, rightVertical.width, rightVertical.height);
        }

        viewportContext.setFillStyle('rgba(252,252,252,1)');
        x = topLeftX + topLeft.width;
        y = topLeftY + topLeft.height;
        viewportContext.fillRect(x, y, topRightX - x, bottomLeftY - y);
        
        if(curCol >= cols && curRow >= rows) {
            viewportContext.setFillStyle('black');
            viewportContext.fillText(text, Math.floor(bounds.x + bounds.width * .5), Math.floor(bounds.y + bounds.height * .5) + Math.floor(parseInt(fontSize) * .5) - 2) ;
        }
    };

    return {
        update: update,
        render: render,

        init: function () {
            spriteImg = resources.get('player');
        },

        setUpFontSettings: function () {
            viewportContext.setFont(Game.composeFontString({
                fontSize: fontSize
            }));
            viewportContext.setTextAlign('center');
        },

        showText: function (newText, newRows) {
            if(!newText) { return; }
            text = newText;
            cols = newText.length;
            rows = newRows || 1;
        }
    };
})();