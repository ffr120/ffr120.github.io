

let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;
    
let imageObjects = [];
let running;
function Awake() {

    running = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    Start();
    Reset();
}

function DisplayFPS() {
    const now = performance.now();
    ++frameCount;
    
    if (now - lastFrameTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastFrameTime = now;
    }

    Rectangle(new Vec2(canvas.width - 100, 0), 100, 20, {fill: "rgb(0, 0, 0, .4)"});
    Text(new Vec2(canvas.width - 50, 10), 10, "FPS: " + fps, {color: "white", align: "center", justify: "center"})
}

function Reset() {


    Rectangle(new Vec2(0, 0), canvas.width, canvas.height, {fill: "white"});
    DisplayFPS();
    
    Button.instances.forEach(instance => instance.Tick());
    Update();
    Button.instances.forEach(instance => instance.Draw());

    TakeImages();
    Mouse.Tick();

    if(running)
        requestAnimationFrame(Reset);

    Keyboard.Reset();
    Mouse.Reset();
}

Awake();