
class FunctionCaller {
    constructor(parent, func, args) {
        this.parent = parent;
        this.func = func;
        this.args = args;
    }

    Call() {
        return this.func.call(this.parent, this.args);
    }
}

function LoadImage(source) {
    const image = new Image();
    image.src = source;
    return image;
}

class Averager {
    
    constructor(X, N, tolerance) {
        this.X = X;
        this.N = N;
        this.tolerance = tolerance;
    }

    Stable() {

        if(this.X.length < this.N)
            return false;

        this.average = 0;
        for(let i = this.X.length - this.N; i < this.X.length; ++i)
            this.average += this.X[i];
        this.average /= this.N;

        return Math.abs(this.average - this.X[this.X.length - 1]) <= this.tolerance;
    }
}

class Vec2 {
    constructor(x = 0, y = 0, parent) {
        this.x = x;
        this.y = y;
        this.parent = parent;
    }

    "+"(x, y = 0) {
        if(typeof(x) == "object")
            return new Vec2(this.x + x.x, this.y + x.y, this.parent);
        return new Vec2(this.x + x, this.y + y, this.parent);
    }

    "-"(x, y = 0) {
        if(typeof(x) == "object")
            return new Vec2(this.x - x.x, this.y - x.y);
        return new Vec2(this.x - x, this.y - y);
    }

    "="(x, y = 0) {
        if(typeof(x) == "object") {
            this.x = x.x;
            this.y = x.y;
        }
        else {
            this.x = x;
            this.y = y;
        }
    }
    
    "+="(x, y = 0) {
        if(typeof(x) == "object") {
            this.x += x.x;
            this.y += x.y;
        }
        else {
            this.x += x;
            this.y += y;
        }
    }

    "*"(v, y) {
        if(typeof(v) == "object")
            return new Vec2(this.x * v.x, this.y * v.y, this.parent);
        else if(y != undefined)
            return new Vec2(this.x * v, this.y * y, this.parent);
        return new Vec2(this.x * v, this.y * v, this.parent);
    }

    "*="(v) {
        if(typeof(x) == "object") {
            this.x *= v;
            this.y *= v;
        }
        else {
            this.x *= v;
            this.y *= v;
        }
    }

    relative() {
        if(this.parent)
            return this.parent.relative()["+"](this);
        else return this;
    }

    SquaredDistance(x, y) {
        if(typeof(x) == "object")
            return Math.pow(this.x - x.x, 2) + Math.pow(this.y - x.y, 2);
        return Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2);
    }

    distance(x, y) {
        if(typeof(x) == "object")
            return Math.sqrt(Math.pow(this.x - x.x, 2) + Math.pow(this.y - x.y, 2));
        return Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2));
    }

    angle(position, distance = this.distance(position)) {
        return Math.acos((this.x - position.x)/distance) * (this.y > position.y ? 1 : -1);
    }

    copy() {
        return new Vec2(this.x, this.y);
    }

    periodicDistance(position, width, height) {
        let dx = position.x - this.x;
        let dy = position.y - this.y;

        if (dx > width / 2) dx -= width;
        if (dx < -width / 2) dx += width;
        if (dy > height / 2) dy -= height;
        if (dy < -height / 2) dy += height;

        return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    }

    periodicAngle(position, width, height) {
        let dx = position.x - this.x;
        let dy = position.y - this.y;
    
        if (dx > width / 2) dx -= width;
        if (dx < -width / 2) dx += width;
        if (dy > height / 2) dy -= height;
        if (dy < -height / 2) dy += height;
    
        return Math.atan2(dy, dx);
    }

    angle(position, distance = this.distance(position)) {
        return Math.acos((this.x - position.x)/distance) * (this.y > position.y ? 1 : -1);
    }
}

function LinearFit(X, Y) {
    if (X.length !== Y.length) {
        throw new Error("X and Y must have the same length.");
    }

    const n = X.length;

    const meanX = X.reduce((acc, val) => acc + val, 0) / n;
    const meanY = Y.reduce((acc, val) => acc + val, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        numerator += (X[i] - meanX) * (Y[i] - meanY);
        denominator += (X[i] - meanX) ** 2;
    }

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    return { slope, intercept };
}

function randi(a, b) {
    if(b == undefined) {
        b = a;
        a = 0;
    }

    return Math.floor(Math.random() * (b - a) + a);
}

function copy(v, a = 0, b = v.length) {

    let r = new Array(b - a);

    let k = 0;
    for(let i = a; i < b; ++i)
        r[k++] = v[i];
    return r;
}

function countZerosAfterDecimal(n) {

    let str = n.toString();

    if (str.includes('e-'))
        return parseInt(str.split('e-')[1]);


    if(str[0] == '-') {
        if(str[1] != 0)
            return 2;
    }
    else if(str[0] != 0)
        return 2;

    let decimalPart = str.split('.');
    if(decimalPart.length == 1)
        return 2;
    
    decimalPart = decimalPart[1];

    let zeroCount = 1;
    for (let char of decimalPart) {
        if (char == 0) {
            ++zeroCount;
        } 
        else break;
    }
    
    return zeroCount;
}

function max(v) {

    let result = v[0];
    for(let i = 1; i < v.length; ++i)
        if(v[i] > result)
            result = v[i];

    return result;
}

function min(v) {
    let result = v[0];
    for(let i = 1; i < v.length; ++i)
        if(v[i] < result)
            result = v[i];

    return result;
}

function findElbowPoint(x, y) {
    const xMin = min(x);
    const xMax = max(x);
    const yMin = min(y);
    const yMax = max(y);
  
    const xNormalized = x.map(xi => (xi - xMin) / (xMax - xMin));
    const yNormalized = y.map(yi => (yi - yMin) / (yMax - yMin));
  
    const p1 = [xNormalized[0], yNormalized[0]];
    const pn = [xNormalized[xNormalized.length - 1], yNormalized[yNormalized.length - 1]];
  
    const lineVec = [pn[0] - p1[0], pn[1] - p1[1]];
    const lineVecNorm = Math.sqrt(lineVec[0] ** 2 + lineVec[1] ** 2);
    const lineVecUnit = [lineVec[0] / lineVecNorm, lineVec[1] / lineVecNorm];
  
    const distances = [];
    for (let i = 1; i < x.length - 1; i++) {
        const p = [xNormalized[i], yNormalized[i]];
        const vec = [p[0] - p1[0], p[1] - p1[1]];
        const proj = [vec[0] * lineVecUnit[0] + vec[1] * lineVecUnit[1]];
        const projVec = [proj * lineVecUnit[0], proj * lineVecUnit[1]];
        const distance = Math.sqrt((vec[0] - projVec[0]) ** 2 + (vec[1] - projVec[1]) ** 2);
        distances.push(distance);
    }
  
    const maxDistance = max(distances);
    const elbowIndex = distances.indexOf(maxDistance) + 1;
  
    return {
        index: elbowIndex,
        x: x[elbowIndex],
        y: y[elbowIndex]
    };
}

function Distibution(data, bins, X = [], Y = []) {

    let sortedData = copy(data).sort(function(a, b) { return parseFloat(a) - parseFloat(b); });

    let xMin = sortedData[0];
    let xMax = sortedData[sortedData.length - 1];

    let stepSize = (xMax - xMin) / bins;

    X.length = bins;
    Y.length = bins;

    for (let i = 0, q = 0; i < bins; ++i) {

        let xCurrent = xMin + stepSize * i;
        let xNext = xMin + stepSize * (i + 1);

        let y = 0;
        while (sortedData[q] <= xNext && q < sortedData.length) {
            ++q;
            ++y;
        }

        X[i] = xMin + stepSize * (i + .5);
        Y[i] = y;
    }

    let totalArea = sortedData.length * stepSize;
    for (let i = 0; i < bins; ++i)
        Y[i] = Y[i] / totalArea;

    return [X, Y, stepSize];
}

function RGB(r, g = 0, b = 0, alpha = 1) {
    return "rgb(" + r + ", " + g + ", " + b + ", " + alpha + ")";
}

function RandomColor(alpha) {
    return RGB(Math.random() * 255, Math.random() * 255, Math.random() * 255, Math.random() * 255, alpha);
}

function Average(X) {
    if (X.length === 0) return 0; // Handle empty array
    let sum = 0;
    X.forEach(x => sum += x);
    return sum / X.length;
}

function STD(X) {
    if (X.length === 0) return 0; // Handle empty array
    const mean = Average(X);
    let sumSquaredDiff = 0;
    X.forEach(x => sumSquaredDiff += Math.pow(x - mean, 2));
    return Math.sqrt(sumSquaredDiff / X.length);
}

function Variance(X) {
    if (X.length === 0) return 0; // Handle empty array
    const mean = Average(X);
    let sumSquaredDiff = 0;
    X.forEach(x => sumSquaredDiff += Math.pow(x - mean, 2));
    return sumSquaredDiff / X.length;
}
  
function AngleBetween(x, y) {
    return Math.atan2(Math.sin(x - y), Math.cos(x - y))
}

function GaussianNoise() {
    let u1 = Math.random();
    let u2 = Math.random();
    return [
        Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2),
        Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2),
    ];
}

function Round(value, decimals = countZerosAfterDecimal(value)) {
    let k = Math.pow(10, decimals);
    return Math.round(value * k) / k;
}

// -------------------- Shared Classes -------------------- //

class MassSimulation {
    
    static instances = [];

    draw = true;
    running = true;
    current = 0;
    run = 0;
    constructor(simulations, runs = 1) {
        this.simulations = simulations;
        this.runs = runs;

        this.simulations.forEach(simulation => simulation.paused = true);

        this.SetStates();
        MassSimulation.instances.push(this);
    }

    static Tick() {
        this.instances.forEach(instance => instance.Tick());
    }

    SetStates() {


        for(let i = 0; i < this.simulations.length; ++i) {
            this.simulations[i].paused = true;
            this.simulations[i].draw = false;
        }

        if(this.current < this.simulations.length) {
            this.simulations[this.current].paused = false;
            this.simulations[this.current].draw = true;
        }
    }

    Tick() {

        if(this.current == this.simulations.length) {
            if(this.running) {
                this.End();
                this.running = false;
            }
            return;
        }

        if(this.simulations[this.current].running == false) {
            if(++this.run < this.runs) {
                this.BetweenRuns();
                Simulation.Reset(this.simulations[this.current]);
            }
            else {
                
                this.BetweenRuns();
                this.BetweenSimulations();
                this.run = 0;
                ++this.current;
                this.SetStates();
            }
        }
    }

    BetweenRuns() {

    }

    BetweenSimulations() {

    }

    End() {

    }
}

class Camera {


    static minZoom = 1;
    static maxZoom = 10;
    static zoomSpeed = .1;

    zoom = 1;
    constructor(parent) {
        this.parent = parent;
        this.origin = new Vec2(parent.width/2, parent.height/2);
        this.position = new Vec2(0, 0);
    }

    Relative(position) {
        return this.parent.RelativePosition(this.origin["+"](position["-"](this.origin["-"](this.position))["*"](this.zoom)));
    }

    Tick() {
        if(Mouse.KeyDown("right"))
            this.position["+="](Mouse.move["*"](this.parent.width/(this.zoom * this.parent.windowWidth), this.parent.height/(this.zoom * this.parent.windowHeight)));

        if(move)
            this.position["+="](move["*"](this.parent.width/(this.zoom * this.parent.windowWidth), this.parent.height/(this.zoom * this.parent.windowHeight)));

        if(Mouse.scroll) 
            this.zoom *=  Math.pow(0.8, Math.sign(Mouse.scroll));

        if(initialDistance)
            this.zoom += change * 0.01;

        if(this.zoom < Camera.minZoom)
            this.zoom = Camera.minZoom;
        else if(this.zoom > Camera.maxZoom)
            this.zoom = Camera.maxZoom;
        
        if(this.origin.x - this.position.x + this.parent.width/(2 * this.zoom) > this.parent.width)
            this.position.x = -(this.parent.width - this.parent.width/(2 * this.zoom) - this.origin.x)


        else if(this.origin.x - this.position.x - this.parent.width/(2 * this.zoom) < 0) {
            this.position.x = this.origin.x - this.parent.width/(2 * this.zoom);
        }

        if(this.origin.y - this.position.y + this.parent.height/(2 * this.zoom) > this.parent.height)
            this.position.y = -(this.parent.height - this.parent.height/(2 * this.zoom) - this.origin.y)


        else if(this.origin.y - this.position.y - this.parent.height/(2 * this.zoom) < 0) {
            this.position.y = this.origin.y - this.parent.height/(2 * this.zoom);
        }
    }

    InSpace(position) {

        let p = position["-"](this.parent.position)["*"](this.parent.width/this.parent.windowWidth, this.parent.height/this.parent.windowHeight);

        let diff = p["-"](this.origin)["*"](1/this.zoom);
        return this.origin["-"](this.position)["+"](diff);
    }

    Draw() {
        if(this.zoom > 1) {
            
            let width = this.parent.windowWidth - 40;
            let height = this.parent.windowHeight - 40;
            
            let w = width / (2 * this.zoom);
            let h = height / (2 * this.zoom);
            let x = width * (0.5 - this.position.x / this.parent.width);
            let y = height * (0.5 - this.position.y / this.parent.height);
            
            Bar(this.parent.position["+"](10, this.parent.windowHeight - 10), width, 10, {fill: "rgb(0, 0, 0, .4)"})
            Bar(this.parent.position["+"](10 + x - w, this.parent.windowHeight - 10), w * 2, 10, {fill: "rgb(0, 0, 0, .4)"})

            Bar(this.parent.position["+"](this.parent.windowWidth - 10, 10), 10, height, {fill: "rgb(0, 0, 0, .4)"})
            Bar(this.parent.position["+"](this.parent.windowWidth - 10, 10 + y - h), 10, h * 2, {fill: "rgb(0, 0, 0, .4)"})
        }

        Rectangle(this.parent.position, 100, 20, {fill: "rgb(0, 0, 0, .4)"})
        Text(this.parent.position["+"](50, 10), 10, "Zoom: " + Round(this.zoom * 100, 0) + "%", {color: "white", align: "center", justify: "center"})
    }
}

class Simulation {

    static instances = [];
    static TitleSize = 20;

    draw = true;
    paused = false;
    running = true;
    iteration = 0;
    t = 0;
    dt = 1;

    constructor(position, width, height, windowWidth, windowHeight, title, updatesPerTick) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.windowWidth = windowWidth;
        this.windowHeight = windowHeight;
        
        this.scaleX = this.windowWidth/this.width;
        this.scaleY = this.windowHeight/this.height;

        this.title = title;
        this.updatesPerTick = updatesPerTick;
        this.camera = new Camera(this);
        new Button(this.position["+"](100, 0), 40, 40, new FunctionCaller(this, this.ToggleDraw), './drawIcon.png');
        new Button(this.position["+"](140, 0), 40, 40, new FunctionCaller(this, this.TogglePause), './pause.png');

        Simulation.instances.push(this);
    }

    TogglePause() {
        this.dt = this.dt == 0 ? 0.1 : 0;
    }

    RelativePosition(position) {
        return this.position["+"](position["*"](this.windowWidth/this.width, this.windowHeight/this.height));
    }

    ToggleDraw() {
        this.draw = this.draw ? false : true;
    }

    static Reset(instance) {
        instance.t = 0;
        instance.iteration = 0;
        instance.running = true;
        instance.Reset();
    }

    static Tick() {
        this.instances.forEach(instance => {

            instance.StaticTick();
            if(!instance.paused) {

                instance.camera.Tick();
                
                for(let i = 0; i < instance.updatesPerTick && !instance.EndCondition(); ++i) {
                    instance.Tick();
                    if(instance.dt > 0) {
                        ++instance.iteration;
                        instance.t += instance.dt;
                    }
                }

                if(instance.EndCondition() && instance.running) {
                    instance.End();
                    instance.running = false;
                }
            }
        });
    }

    StaticTick() {

    }

    Title() {
        return this.title + ", Iteration: " + this.iteration;
    }

    EndCondition() {
        return false;
    }

    End() {
        console.log("Ended " + this.title + " without endfunction!");
    }

    static Draw() {
        this.instances.forEach(instance => {
            Rectangle(instance.position, instance.windowWidth, instance.windowHeight, {stroke: "black"})
            Text(instance.position["+"](0, -10), Simulation.TitleSize, instance.Title())
            instance.Draw();
            instance.camera.Draw();
        });
    }
}

class Button {

    static instances = [];
    constructor(position, width, height, func, image) {
        if(image)
            this.image = LoadImage(image);
        this.position = position;
        this.width = width;
        this.height = height;
        this.func = func;
        this.pressed = false;
        Button.instances.push(this);
    }

    Tick() {

        this.hover = InRectangle(this.position, this.width, this.height, Mouse.position);

        if(this.hover && Mouse.KeyUp("left")) {
            this.func.Call();
            this.pressed = this.pressed ? false : true;
        }
    }


    Draw() {
        
        if(this.pressed)
            Rectangle(this.position, this.width, this.height, {fill: "rgb(250, 0, 0, .4)"});
        else Rectangle(this.position, this.width, this.height, {fill: "rgb(0, 0, 250, .4)"});

        if(this.hover)
            Rectangle(this.position, this.width, this.height, {fill: "rgb(250, 250, 250, .4)"})

        if(this.image)
            Photo(this.position["+"](this.width/2, this.height/2), this.width/3, this.height/3, 0, this.image)
    }
}

function InRectangle(_position, width, height, _targetPosition) {
    let position = _position.relative(), targetPosition = _targetPosition.relative();

    return (targetPosition.x > position.x && targetPosition.x < position.x + width
        && targetPosition.y > position.y && targetPosition.y < position.y + height);
}

function DownloadJSON(data, fileName = "data") {

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName + '.json';
    a.click();

    URL.revokeObjectURL(url);
}

function TakeImages() {
    
    imageObjects.forEach(object => {

        let [x, y, width, height, filename] = object.OrderImage();

        x = Math.floor(x);
        y = Math.floor(y);
        width = Math.ceil(width);
        height = Math.ceil(height);
        filename = filename.replace(/\./g, ",");
        
        if (!filename.endsWith('.png')) {
            filename += '.png';
        }

        const paintCanvas = document.createElement('canvas');
        const paintCtx = paintCanvas.getContext('2d');
        paintCanvas.width = canvas.width;
        paintCanvas.height = canvas.height;
        let prevCtx = context;
        context = paintCtx;

        Rectangle(new Vec2(0, 0), canvas.width, canvas.height, {fill: "white"});
        object.Draw();
        
        context = prevCtx;
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        let imageData = paintCtx.getImageData(x, y, width, height);
        tempCtx.putImageData(imageData, 0, 0);
        
        const pngData = tempCanvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = pngData;
        link.download = filename;
        link.click();
    });

    imageObjects.length = 0;
}

function StoreImage(object) {
    imageObjects.push(object);
}

class DynamicVariable {

    static height = 30;
    static width = 150
    static instances = [];
    constructor(position, object, variable, min, max, stepSize, label = variable) {

        this.label = label;
        this.position = position;
        this.object = object;
        this.variable = variable;
        this.min = min;
        this.max = max;
        this.stepSize = stepSize;
        this.steps = (max - min)/stepSize;

        this.SetValue((object[variable] - min)/(max - min));

        DynamicVariable.instances.push(this);
    }

    Tick() {

        if(Mouse.KeyDown("left")) {

            this.handlePosition = this.position["+"](DynamicVariable.width * this.scaledValue);

            if(this.handlePosition.distance(Mouse.position) < DynamicVariable.height * .8) {
                Mouse.Target(this);
            }

            if(Mouse.target == this) {

                let value = (Mouse.position.x - this.position.x) / DynamicVariable.width;
                if(value < 0)
                    value = 0;
                else if(value > 1)
                    value = 1;

                this.SetValue(value);
            }
        }
    }

    SetValue(value) {
        this.scaledValue = Math.floor(this.steps * value + 10e-6) / this.steps;
        this.value = this.min + Math.floor(this.steps * value + 10e-6) * this.stepSize
        this.object[this.variable] = this.value;
    }

    Draw() {
        Bar(this.position, DynamicVariable.width, DynamicVariable.height, {fill: "rgb(0, 0, 250, .2)"});
        Bar(this.position, DynamicVariable.width, DynamicVariable.height * .8, {fill: "rgb(0, 0, 250, .2)"});
        Text(this.position["+"](DynamicVariable.width/2), 15, this.label + ": " + this.object[this.variable], {align: "center", justify: "center", color: "rgb(250, 250, 250, .8)"})
        Circle(this.position["+"](DynamicVariable.width * this.scaledValue), DynamicVariable.height * .8 / 2, {fill: "rgb(250, 250, 250, .6)"});
        Circle(this.position["+"](DynamicVariable.width * this.scaledValue), DynamicVariable.height * .6 / 2, {fill: "rgb(250, 250, 250, .6)"});
    }
}