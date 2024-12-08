
let imageObjects = [];
let running;
function Awake() {

    running = true;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    Start();
    Reset();
}

function Reset() {

    Rectangle(new Vec2(0, 0), canvas.width, canvas.height, {fill: "white"});
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