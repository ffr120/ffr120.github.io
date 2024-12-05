
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
    Update();
    TakeImages();
    Mouse.Tick();

    if(running)
        requestAnimationFrame(Reset);

    Keyboard.Reset();
    Mouse.Reset();
}

Awake();

function StoreImage(object) {
    imageObjects.push(object);
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

        console.log(filename)
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        let imageData = canvas.getContext('2d').getImageData(x, y, width, height);
        tempCtx.putImageData(imageData, 0, 0);
        
        const pngData = tempCanvas.toDataURL('image/png');
        
        const link = document.createElement('a');
        link.href = pngData;
        link.download = filename;
        link.click();
    });

    imageObjects.length = 0;
}