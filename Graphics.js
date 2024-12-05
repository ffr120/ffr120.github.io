
let canvas = document.getElementById("canvas");
let context = canvas.getContext("2d")

class Plot {

    static TitleSize = 20;
    static Margin = 50;
    static SmallMargin = 15;
    static AxisTextSize = 15;

    static LabelWindow = {padding: 10, margin: 10, textMargin: 5};

    static instances = [];
    constructor(position, width, height, title, xLabel, yLabel, dataPoints, props = {}) {
        this.position = position;
        this.width = width;
        this.height = height;
        this.props = props;
        this.xLabel = xLabel;
        this.yLabel = yLabel;
        this.dataPoints = dataPoints;
        this.title = title;

        this.labelData = [];
        dataPoints.forEach(dataPoint => {
            if(dataPoint.props.label)
                this.labelData.push(dataPoint.props);
        });

        Plot.instances.push(this);
    }

    GetData(ID) {
        return [...this.dataPoints[ID].data];
    }

    GetDecimalX() {
        return this.roundX;
    }

    GetDecimalY() {
        return this.roundY;
    }

    static Tick() {
        this.instances.forEach(instance => {
            instance.CalculateDimentions();
            instance.Tick();
        });
    }

    static Draw() {
        Plot.instances.forEach(instance => {
            Rectangle(instance.position, instance.width, instance.height, {stroke: "black"})

            Text(new Vec2(instance.width/2, -Plot.SmallMargin, instance.position), Plot.TitleSize, instance.title, {align: "center"})
            Text(new Vec2(instance.width/2, instance.height + Plot.SmallMargin, instance.position), Plot.TitleSize, instance.xLabel, {align: "center", justify: "down"})
            Text(new Vec2(-Plot.SmallMargin, instance.height/2, instance.position), Plot.TitleSize, instance.yLabel, {rotate: -Math.PI/2, align: "center"})

            for(let i = 0; i < 7; ++i) {

                let x = i * instance.width/6, y = i * instance.height/6;
    
                Line(new Vec2(0, y, instance.position), new Vec2(instance.width, y, instance.position), "lightgray");
                Line(new Vec2(x, 0, instance.position), new Vec2(x, instance.height, instance.position), "lightgrey");
                Text(new Vec2(-Plot.Margin, y, instance.position), Plot.AxisTextSize, instance.GetY(y), {round: instance.GetDecimalY(), justify: "center", align: "right"});
                Text(new Vec2(x, instance.height + Plot.Margin, instance.position), Plot.AxisTextSize, instance.GetX(y), {round: instance.GetDecimalX(), justify: "center", align: "right", rotate: -Math.PI/2});
            }

            if(instance.labelData.length > 0) {

                let heights = [];
                let width = 0;
                let height = Plot.LabelWindow.padding * 2 + Plot.LabelWindow.textMargin * (instance.labelData.length - 1);
                instance.labelData.forEach(data => {
                    
                    context.font = Plot.AxisTextSize + "px Arial";
                    let [w, h] = MeasureText(data.label + ": \u2014");
                    if(w > width)
                        width = w;
                    height += h;
                    heights.push(h);
                });
                
                width += Plot.LabelWindow.padding * 2;
    
                Rectangle(new Vec2(instance.width - width - Plot.LabelWindow.margin, Plot.LabelWindow.margin, instance.position), width, height, {fill: "white", stroke: "black"});
                
                height = -2;
                instance.labelData.forEach((data, i) => {
    
                    Text(new Vec2(instance.width - Plot.LabelWindow.margin - Plot.LabelWindow.padding, Plot.LabelWindow.margin + Plot.LabelWindow.padding + height, instance.position), Plot.AxisTextSize, data.label + ": \u2014", {align: "right", justify: "down", color: data.color});
                    height += heights[i] + Plot.LabelWindow.textMargin;
                });
            }

            instance.Draw();
        });
    }

    Tick() {

    }
    
    GetY(height) {
        return this.yMin + (this.yMax - this.yMin) * (1 - height/this.height);
    }

    GetX(width) {
        return this.xMin + (this.xMax - this.xMin) * width/this.width;
    }

    CalculateDimentions() {

        this.xMin = undefined;
        this.xMax = undefined;
        this.yMin = undefined;
        this.yMax = undefined;
        this.roundX = this.props.roundX ? this.props.roundX : 0;
        this.roundY = this.props.roundY ? this.props.roundY : 0;

        for(let i = 0; i < this.dataPoints.length; ++i) {

            let [X, Y] = this.GetData(i);

            for(let q = 0; q < X.length; ++q) {
                if(this.xMin == undefined || X[q] < this.xMin)
                    this.xMin = X[q];
    
                if(this.xMax == undefined || X[q] > this.xMax)
                    this.xMax = X[q];
    
                if(this.yMin == undefined || Y[q] < this.yMin)
                    this.yMin = Y[q];
    
                if(this.yMax == undefined || Y[q] > this.yMax)
                    this.yMax = Y[q];
            }
        }

        if(this.props.alignAxes == "center") {

            let w = this.xMax - this.xMin, h = this.yMax - this.yMin;

            if(h > w) {
                let xMid = (this.xMin + this.xMax)/2;
                this.xMin = xMid - h / 2;
                this.xMax = xMid + h / 2;
            }
            else if(w > h) {
                let yMid = (this.yMin + this.yMax)/2;
                this.yMin = yMid - w / 2;
                this.yMax = yMid + w / 2;
            }
        }
        else {
            if(this.props.alignX) {
                this.xMin = this.props.alignX[0];
                this.xMax = this.props.alignX[1];
            }

            if(this.props.alignY) {
                this.yMin = this.props.alignY[0];
                this.yMax = this.props.alignY[1];
            }
        }
    }

    OrderImage() {

        let photoMargin = 20;

        let leftMargin = 0, bottomMargin = 0, topMargin = 0, rightMargin = photoMargin;

        context.font = Plot.AxisTextSize + "px Arial";
        for(let i = 0; i < 7; ++i) {

            let [w, h] = MeasureText(Round(this.GetY(i * this.height / 6), this.roundY));
            
            if(w > leftMargin)
                leftMargin = w;

            [w, h] = MeasureText(Round(this.GetX(i * this.width / 6), this.roundX));
            
            if(w > bottomMargin)
                bottomMargin = w;
        }

        context.font = Plot.TitleSize + "px Arial";
        topMargin += MeasureText(this.title)[1] + Plot.SmallMargin + photoMargin;

        leftMargin += Plot.Margin + photoMargin;
        bottomMargin += Plot.Margin + photoMargin;

        return [this.position.x - leftMargin, this.position.y - topMargin, this.width + leftMargin + rightMargin, this.height + topMargin + bottomMargin, this.title];
    }
}

class LinePlot extends Plot {
    constructor(position, width, height, title, xLabel, yLabel, dataPoints, props = {}) {
        super(position, width, height, title, xLabel, yLabel, dataPoints, props);
    }

    Draw() {

        this.dataPoints.forEach(dataPoint => {
            
            let [X, Y, E] = [...dataPoint.data];

            if(X.length < 1)
                return;
    
            let startPosition = this.position.relative()["+"](0, this.height);
    
    
            BeginPath();
            for(let i = 0; i < X.length; ++i) {
                let x = this.width * (X[i] - this.xMin)/(this.xMax - this.xMin);
                let y = this.height * (Y[i] - this.yMin)/(this.yMax - this.yMin);
                LineTo(startPosition["+"](x, -y));
            }

            Stroke(dataPoint.props.color)
        });
    }
}

function MeasureText(sentence) {
    let metrics = context.measureText(sentence);
    return [metrics.width, metrics.actualBoundingBoxAscent];
}

function MoveTo(position) {
    context.moveTo(position.x, position.y);
}

function LineTo(position) {
    context.lineTo(position.x, position.y);
}

function ClosePath() {
    context.closePath();
}

function BeginPath() {
    context.beginPath();
}

function Fill(color = "black") {
    context.fillStyle = color;
    context.fill();
}

function Stroke(color = "black", lineWidth = 1) {
    context.strokeStyle = color;
    context.lineWidth = lineWidth;
    context.stroke();
}

function Line(_head, _tail, color, lineWidth) {
    let head = _head.relative(), tail = _tail.relative();
    BeginPath();
    MoveTo(head);
    LineTo(tail);
    Stroke(color, lineWidth);
}

function Rectangle(_position, width, height, props) {
    let position = _position.relative();

    BeginPath();
    MoveTo(position);
    LineTo(position["+"](width));
    LineTo(position["+"](width, height));
    LineTo(position["+"](0, height));
    ClosePath();
    Paint(props)
}

function Bar(_position, width, height, props) {

    let position = _position.relative();

    BeginPath();
    Arc(position, height / 2, Math.PI / 2, 3 * Math.PI / 2);
    Arc(position["+"](width), height / 2, 3 * Math.PI / 2, Math.PI / 2);
    Paint(props);
}

function Circle(_position, radius, props) {

    let position = _position.relative();
    let begin = props.begin != undefined  ? props.begin : 0;
    if(begin?.constructor?.name == "FunctionCaller")
        begin = begin.Call();

    let end = props.end != undefined ? props.end : Math.PI * 2;
    if(end?.constructor?.name == "FunctionCaller")
        end = end.Call();
    

    if(Math.abs(begin - end) < 10e-6)
        return;
    
    BeginPath();

    if(props.fill) {
        MoveTo(position);
        LineTo(position["+"](Math.cos(begin) * radius, Math.sin(begin) * radius));
    }

    Arc(position, radius, begin, end);
    Paint(props);
}

function Arc(position, radius, start = 0, end = Math.PI * 2) {
    context.arc(position.x, position.y, radius, start, end);
}

function Text(_position, size, _sentence, props = {}) {

    let sentence = _sentence.constructor?.name == "FunctionCaller" ? _sentence.Call() : _sentence;

    let position = _position.relative();

    if(props.translate)
        position["+="](props.translate);

    if(props.round != undefined) {

        let round = props.round;
        if(round.constructor?.name == "FunctionCaller")
            round = round.Call();
            
        let power = Math.pow(10, round);
        sentence = Math.round(sentence * power)/power;
    }       

    BeginPath();
    context.fillStyle = props.color ? props.color : "black";
    context.font = size + "px Arial";

    let [w, h] = MeasureText(sentence);

    let dx = 0, dy = 0;
    if(props.align == "center")
        dx = -w/2;
    else if(props.align == "right")
        dx = -w

    if(props.justify == "center")
        dy = h/2;
    else if(props.justify == "down")
        dy = h;

    if (props.rotate) {
        context.save();
        context.translate(position.x, position.y);
        context.rotate(props.rotate);
        context.fillText(sentence, dx, dy);
        context.restore();
    }
    else context.fillText(sentence, position.x + dx, position.y + dy);
}

function Paint(props) {
    if(props.fill)
        Fill(props.fill);

    if(props.stroke)
        Stroke(props.stroke, props.lineWidth);
}

function Image(_position, width, height, orientation, image) {

    let position = _position.relative();
    context.save();
    context.translate(position.x, position.y);
    context.rotate(orientation);
    context.drawImage(image, -width, -height, width * 2, height * 2);
    context.restore();
}

function ClipRectangle(_position, width, height) {
    let position = _position.relative();

    BeginPath();
    MoveTo(position);
    LineTo(position["+"](width));
    LineTo(position["+"](width, height));
    LineTo(position["+"](0, height));
    ClosePath();

    context.save();
    context.clip()
}