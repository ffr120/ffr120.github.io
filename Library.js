
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

    "*"(v) {
        if(typeof(v) == "object")
            return new Vec2(this.x * v.x, this.y * v.y, this.parent);
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

function Variance(X) {
    let v = 0;
    X.forEach(x => v += Math.pow(x, 2));
    v /= X.length;

    return v;
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
        MassSimulation.instances.push(this);
    }

    static Tick() {
        this.instances.forEach(instance => instance.Tick());
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
            if(++this.run < this.runs)
                Simulation.Reset(this.simulations[this.current]);
            else {
                this.Between();
                this.run = 0;
                ++this.current;
            }
        }

        for(let i = 0; i < this.simulations.length; ++i) {
            this.simulations[i].paused = true;
            this.simulations[i].draw = false;
        }

        if(this.current < this.simulations.length) {
            this.simulations[this.current].paused = false;
            this.simulations[this.current].draw = true;
        }

    }
}

class Simulation {

    static instances = [];
    static TitleSize = 20;

    scale = 1;
    draw = true;
    paused = false;
    running = true;
    iteration = 0;
    t = 0;
    dt = 1;

    constructor(position, width, height, title, updatesPerTick) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.title = title;
        this.updatesPerTick = updatesPerTick;

        // new Rectangle(this, {stroke: "black"})
        // new Text(this, Simulation.TitleSize, new FunctionCaller(this, this.Title));

        Simulation.instances.push(this);
    }

    static Reset(instance) {
        instance.iteration = 0;
        instance.running = true;
        instance.Reset();
    }

    static Tick() {
        this.instances.forEach(instance => {
            if(!instance.paused) {
                for(let i = 0; i < instance.updatesPerTick && !instance.EndCondition(); ++i) {
                    instance.Tick();
                    ++instance.iteration;
                    instance.t = instance.iteration * instance.dt;
                }

                if(instance.EndCondition() && instance.running) {
                    instance.End();
                    instance.running = false;
                }
            }
        });
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
            Rectangle(instance.position, instance.width, instance.height, {stroke: "black"})
            Text(instance.position, Simulation.TitleSize, instance.Title())
            instance.Draw();
        });
    }
}