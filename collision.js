function resolveVertical(obj, h){
    obj.y = Math.min(h - obj.height, Math.max(0, obj.y));
    obj.vy *= -1;
}

function resolveHorizontal(obj, w){
    obj.x = Math.min(w - obj.width, Math.max(0, obj.x));
    obj.vx *= -1;
}

function handleWorldCollision(obj, worldW, worldH){
    if(obj.x + obj.width > worldW || obj.x < 0){
        resolveHorizontal(obj, worldW);
    } else if(obj.y + obj.height > worldH || obj.y < 0) {
        resolveVertical(obj, worldH);
    }
};

function boxCollides(box1, box2){
    var bottom1 = box1.y + box1.height;
    var right1 = box1.x + box1.width;
    var bottom2 = box2.y + box2.height;
    var right2 = box2.x + box2.width;

    return !(bottom1 <= box2.y ||
             box1.y >= bottom2 ||
             box1.x >= right2  ||
             right1 <= box2.x
             );
}