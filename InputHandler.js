
class Keyboard {

    static KeyDown(key, duration = 1) {
        return this[key] >= duration;
    }

    static KeyUp(key) {
        return this[key] == 0;
    }

    static Reset() {
        for(let key in this)
            if(this[key] == 0)
                delete this[key];
    }
}

onkeydown = (event) => {!Keyboard[event.key] ? Keyboard[event.key] = 1 : ++Keyboard[event.key];}
onkeyup = (event) => {Keyboard[event.key] = 0;}

class Mouse {

    static position = new Vec2(0, 0);
    static previousPosition = new Vec2(0, 0);
    static move = new Vec2(0, 0);
    static scroll = 0;
    
    static Target(object) {
        if(!this.target)
            this.target = object;
    }

    static Tick() {

        for(let key in this)
            if(this[key] > 0)
                ++this[key];
    }

    static KeyDown(key, duration = 4) {
        return this[key] >= duration;
    }

    static KeyUp(key) {
        return this[key] == 0;
    }

    static Inside(position, width, height) {
        return this.position.x >= position.x && this.position.x <= position.x + width
        && this.position.y >= position.y && this.position.y <= position.y + height; 
    }

    static Reset() {

        if(!this.KeyDown("left"))
            Mouse.target = undefined;

        for(let key in this)
            if(this[key] == 0)
                delete this[key];

        this.move["="](this.position["-"](this.previousPosition));
        this.previousPosition["="](this.position);
        this.scroll = 0;
        move = null;
    }

    static Convert(key) {
        if(key == "0")
            return "left";
        else if(key == "2")
            return "right";
        else if(key == "1")
            return "scroll";
        else return key;
    }
}

document.addEventListener('contextmenu', event => event.preventDefault());
onmousemove = (event) => {Mouse.position["="]({x: event.clientX + window.scrollX, y: event.clientY + window.scrollY});}
onmousedown = (event) => {Mouse[Mouse.Convert(event.button)] = 1;}
onmouseup = (event) => {Mouse[Mouse.Convert(event.button)] = 0;}
onmousewheel = (event) => {
    Mouse.scroll = event.deltaY;
    Mouse.position["="]({x: event.clientX + window.scrollX, y: event.clientY + window.scrollY});
}

let pos = null, last = null, move = null;
let initialDistance = null;
let change = null;

function calculateDistance(touches) {
    const [touch1, touch2] = touches;
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

document.addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
        // Two fingers detected
        initialDistance = calculateDistance(event.touches);
    }
});

document.addEventListener("touchmove", (event) => {
    if (event.touches.length === 2 && initialDistance) {
        const currentDistance = calculateDistance(event.touches);
        change = currentDistance - initialDistance;
        initialDistance = currentDistance; // Update the distance
        
        pos = new Vec2((event.touches[0].clientX + event.touches[1].clientX)/2, (event.touches[0].clientY + event.touches[1].clientY)/2);
        if(last)
            move = pos["-"](last);
        last = pos.copy();
    }
    else if(event.touches.length == 1) {
        pos = new Vec2(event.touches[0].clientX, event.touches[0].clientY);
        if(last)
            move = pos["-"](last);
        last = pos.copy();
    }
});

document.addEventListener("touchend", (event) => {
    if (event.touches.length < 2) {
        // Reset when fingers are lifted
        initialDistance = null;
        change = null;
        pos = null;
        last = null;
    }
});