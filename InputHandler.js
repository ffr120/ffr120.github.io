
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
    }

    static Convert(key) {
        if(key == "0")
            return "left";
        else if(key == "1")
            return "right";
        else if(key == "3")
            return "scroll";
        else return key;
    }
}

onmousemove = (event) => {Mouse.position["="]({x: event.clientX, y: event.clientY});}
onmousedown = (event) => {Mouse[Mouse.Convert(event.button)] = 1;}
onmouseup = (event) => {Mouse[Mouse.Convert(event.button)] = 0;}
onmousewheel = (event) => {Mouse.scroll = Math.sign(event.deltaY);}