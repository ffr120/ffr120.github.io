

let Rf = 100;
let eta = 1;
class BrainSegment {
    value = 0;
    constructor(orientation, width) {
        this.orientation = orientation;
        this.width = width;
    }
}

class Brain {
    
    static propogationReduction = 2;
    static distanceBias = .1;
    segments = [];
    constructor(parent, N) {
        this.parent = parent;
        this.N = N;
        
        for(let i = 0; i < this.N; ++i)
            this.segments.push(new BrainSegment(Math.PI / this.N + i * Math.PI * 2 / this.N, Math.PI/ this.N));
    }

    Reset() {
        this.segments.forEach(segment => segment.value = 0);
    }

    Observe(agent) {

        let angle = this.parent.position.periodicAngle(agent.position, this.parent.parent.width, this.parent.parent.height);
        let distance = this.parent.position.periodicDistance(agent.position, this.parent.parent.width, this.parent.parent.height) - this.parent.constructor.radius - agent.constructor.radius;
        if(distance < 0)
            distance = 0;

        if(this.parent.constructor.visionRadius > 0 && distance > this.parent.constructor.visionRadius)
            return;


        let reward = this.parent["Observe" + agent.constructor.name](agent) / (1 + Brain.distanceBias * distance);
        if(reward == 0)
            return;
        
        this.AddReward(reward, angle);
    }

    AddReward(reward, orientation) {
        if(orientation < 0)
            orientation += Math.PI * 2;

        let segment = Math.floor(this.N * orientation / (Math.PI * 2));

        let propogationLength = Math.ceil((this.N - 1)/2);

        for(let i = 0; i <= propogationLength; ++i) {

            let nextSegment = segment + i, prevSegment = segment - i;
            
            if(nextSegment >= this.N)
                nextSegment -= this.N;

            if(prevSegment < 0)
                prevSegment += this.N;

            this.segments[nextSegment].value += reward * Math.exp(-i*Brain.propogationReduction/propogationLength);

            if(nextSegment != prevSegment)
                this.segments[prevSegment].value += reward * Math.exp(-i*Brain.propogationReduction/propogationLength);
        }
    }

    Vicsek(simulation) {
        let sin = 0, cos = 0;

        simulation.agents.forEach(agent => {
            if(agent.constructor.name == "Rabbit") {
                if (this.parent.position.periodicDistance(agent.position, simulation.width, simulation.height) < Rf) {
                    cos += Math.cos(agent.orientation);
                    sin += Math.sin(agent.orientation);
                }
            }
        })
        let orientation =  Math.atan2(sin, cos) + eta * (-0.5 + Math.random()) * simulation.dt;

        this.AddReward(0.1, orientation);
    }

    Evaluate(simulation) {

        this.Reset();

        if(this.parent.constructor.name == "Rabbit") {
            this.Vicsek(simulation);
        }

        simulation.agents.forEach(agent => {
            if(this.parent != agent)
                this.Observe(agent);
        });

        let maxValue = Math.max(...this.segments.map(segment => segment.value));
        if(maxValue == 0)
            return false;
        let bestOptions = this.segments.filter(segment => segment.value === maxValue);
        this.selected = bestOptions[randi(bestOptions.length)];
        return this.selected.orientation;
    }

    Draw(position, radius) {
        let maxValue = Math.max(...this.segments.map(segment => Math.abs(segment.value)));
        let min = Math.min(...this.segments.map(segment => segment.value));
        let max = Math.max(...this.segments.map(segment => segment.value));
        let scale = 1;
        let del = (max - min);
        if(del == 0)
            del = 1;

        if(maxValue != 0)
            scale *= 255/maxValue
        
        this.segments.forEach(segment => {
            let color = segment.value < 0 ? RGB(-segment.value * scale, 0, 0, .4) : RGB(0, segment.value * scale, 0, .4);

            Circle(position, radius + 2 + 3, {stroke: color, begin: segment.orientation - segment.width + .01, end: segment.orientation + segment.width - .01, lineWidth: 2 + 6 * (segment.value - min)/del})
        });
    }
}

class Agent {

    static IDs = 0;
    t_levy = 0;
    alive = true;
    cooldowns = { propagation: 0 };
    turnSpeed = 2 * Math.PI;
    orientation = Math.random() * Math.PI * 2;
    targetOrientation = Math.random() * Math.PI * 2;

    constructor(parent, position) {
        this.parent = parent;
        this.position = position;
        this.ID = Agent.IDs++;
        this.brain = new Brain(this, 40);
        ++parent.agentCount[this.constructor.name];
    }

    Intent(simulation) {
        
        let targetOrientation = this.brain.Evaluate(simulation);

        if(targetOrientation == false)
            this.Levy(simulation.dt);
        else {
            this.targetOrientation = targetOrientation;
            this.Turn(simulation.dt);
        }

        this.Walk(simulation.dt);
    }

    Turn(dt) {
        let diff = AngleBetween(this.targetOrientation, this.orientation);
        let change = this.turnSpeed * dt;

        if(Math.abs(diff) > change)
            this.orientation += change * Math.sign(diff);
        else this.orientation = this.targetOrientation;
    }

    static Tick(simulation, agent) {
        
        agent.Intent(simulation);

        for(let cooldown in agent.cooldowns) {
            if(agent.cooldowns[cooldown] > 0)
                agent.cooldowns[cooldown] -= simulation.dt;
            else agent.cooldowns[cooldown] = 0;
        }

        agent.Tick(simulation);
    }

    Levy(dt) {

        if(this.t_levy <= 0) {

            this.Walk(this.t_levy)
            this.targetOrientation = Math.random() * Math.PI * 2;
            this.Turn(-this.t_levy);
            this.Walk(-this.t_levy)
            this.t_levy = 1 / Math.max(0.1, Math.random());
        }

        this.Turn(dt);
        this.Walk(dt);
        this.t_levy -= dt;
    }

    Walk(dt) {
        this.newPosition = this.position["+"](this.constructor.velocity * Math.cos(this.orientation) * dt, this.constructor.velocity * Math.sin(this.orientation) * dt);
    }

    Set() {
        this.position = this.newPosition;
    }

    Interact(agent, simulation) {
        
        let interactionID = simulation.InteractionID(this, agent);

        if(!simulation.interactionTracker[interactionID]) {
            if(this.constructor.name == agent.constructor.name) {

                if(this.cooldowns["propagation"] <= 0 && agent.cooldowns["propagation"] <= 0) {
                    simulation.interactionTracker[interactionID] = simulation.interactionCooldown;
                    if(Math.random() < this.constructor.propagationChance) {


                        let newAgent = new this.constructor(simulation, this.position["+"](agent.position)["*"](1/2));
                        newAgent.cooldowns["propagation"] = this.constructor.propagationCooldown;
                        this.cooldowns["propagation"] = this.constructor.propagationCooldown;
                        agent.cooldowns["propagation"] = this.constructor.propagationCooldown;
                        simulation.interactionTracker[simulation.InteractionID(newAgent, this)] = simulation.interactionCooldown;
                        simulation.interactionTracker[simulation.InteractionID(newAgent, agent)] = simulation.interactionCooldown;

                        if(this.constructor.name == "Fox") {
                            newAgent.cooldowns["starvation"] = this.constructor.nutritionValue * 2;
                            agent.cooldowns["starvation"] -= this.constructor.nutritionValue;
                            this.cooldowns["starvation"] -= this.constructor.nutritionValue;
                        }

                        simulation.agents.push(newAgent);
                    }
                }
            }
            else {
                simulation.interactionTracker[interactionID] = simulation.interactionCooldown;
                if(Math.random() < simulation.eatChance) {

                    if(this.constructor.name == "Rabbit") {
                        agent.cooldowns["starvation"] += 5;
                        this.alive = false;
                    }
                    else {
                        this.cooldowns["starvation"] += 5;
                        agent.alive = false;
                    }
                }
            }
        }
    }

    Birth() {
        return Math.PI * 2 * this.cooldowns["propagation"] / this.constructor.propagationCooldown;
    }

    CooldownScale(cooldown) {
        return (this.constructor[cooldown + "Cooldown"] - this.cooldowns[cooldown]) / this.constructor[cooldown + "Cooldown"];
    }
}

class Rabbit extends Agent {

    static image = document.getElementById("rabbit");
    static velocity = 30;
    static radius = 15;
    static visionRadius = 0;

    static propagationChance = .6;
    static propagationCooldown = 10;
    static propagationWeight = .1;
    static antiClusteringWeight = -.2;

    constructor(parent, position) {
        super(parent, position);
    }

    Tick(simulation) {

    }

    ObserveFox(agent) {
        return -1;
    }

    ObserveRabbit(agent) {
        if(!this.parent.CanInteract(this, agent) || this.CooldownScale("propagation") < 1 || agent.CooldownScale("propagation") < 1)
            return Rabbit.antiClusteringWeight;
        return Rabbit.propagationWeight;
    }

    Draw(position) {
        Circle(position, Rabbit.radius, {fill: "rgb(0, 0, 250, .2)"});
        Circle(position, Rabbit.radius, {fill: "rgb(0, 0, 250, .2)", end: this.Birth()});
        Image(position, Rabbit.radius, Rabbit.radius, this.orientation, Rabbit.image)
        this.brain.Draw(position, Rabbit.radius);

        if(Rabbit.visionRadius > 0)
            Circle(position, Rabbit.radius + Rabbit.visionRadius, {stroke: "rgb(0, 0, 250, .2)"});
    }
}

class Fox extends Agent {

    static image = document.getElementById("fox");
    static velocity = 50;
    static radius = 30;
    static visionRadius = 0;

    static propagationChance = .4;
    static propagationCooldown = 25;
    
    static nutritionValue = 15;
    static starvationCooldown = 60;
    static propagationWeight = .3;
    static antiClusteringWeight = -.2;

    constructor(parent, position) {
        super(parent, position);

        this.cooldowns.starvation = Fox.starvationCooldown * 0.75;
    }

    Tick(simulation) {
        if(this.cooldowns["starvation"] == 0)
            this.alive = false;
        else if(this.cooldowns["starvation"] > Fox.starvationCooldown)
            this.cooldowns["starvation"] = Fox.starvationCooldown;
    }

    ObserveFox(agent) {
        
        if(!this.parent.CanInteract(this, agent) || this.CooldownScale("propagation") < 1 || agent.CooldownScale("propagation") < 1)
            return Fox.antiClusteringWeight;
        return Fox.propagationWeight;
    }

    ObserveRabbit(agent) {
        if(!this.parent.CanInteract(this, agent))
            return 0;
        return this.CooldownScale("starvation");
    }
    
    Draw(position) {

        Circle(position, Fox.radius, {fill: "rgb(0, 0, 250, .2)"});
        Circle(position, Fox.radius, {fill: "rgb(0, 0, 250, .2)", end: this.Birth()});
        Circle(position, Fox.radius + 4, {stroke: "rgb(250, 0, 0, .5)", end: Math.PI * 2 * (1 - this.CooldownScale("starvation")), lineWidth: 4});
        this.brain.Draw(position, Fox.radius + 8);
        
        Image(position, Fox.radius, Fox.radius, this.orientation, Fox.image)
        if(Fox.visionRadius > 0)
            Circle(position, Fox.radius + Fox.visionRadius, {stroke: "rgb(0, 0, 250, .2)"});
    }
}

class Project extends Simulation {

    T = [];
    Rabbits = [];
    Foxes = [];
    interactionTracker = {};

    agentCount = {Fox: 0, Rabbit: 0};
    agents = [];
    dt = 0.01;

    // nFoxes = 10;
    nFoxes = 0;
    nRabbits = 50;

    eatChance = .8;
    interactionCooldown = 8;


    constructor(position, width, height, updatesPerTick) {
        super(position, width, height, "Inbreeding Simulator", updatesPerTick)

        // this.fox = new Fox(this, new Vec2(200, 100, this.position));
        // let rabbit = new Rabbit(this, new Vec2(100, 100, this.position));
        // this.agents.push(this.fox);
        // this.agents.push(rabbit);
        // this.agents.push(new Rabbit(this, new Vec2(300, 100, this.position)));
        // this.agents.push(new Fox(this, new Vec2(300, 200, this.position)));

        for(let i = 0;  i < this.nFoxes; ++i)
            this.agents.push(new Fox(this, new Vec2(this.width * Math.random(), this.height * Math.random(), this.position)));

        for(let i = 0;  i < this.nRabbits; ++i)
            this.agents.push(new Rabbit(this, new Vec2(this.width * Math.random(), this.height * Math.random(), this.position)));

        // this.plot = new LinePlot(
        //     new Vec2(2250, 800),
        //     400,
        //     400,
        //     "Population by time",
        //     "Time",
        //     "Population",
        //     [
        //         {data: [this.T, this.Rabbits], props: {label: "Rabbits", color: "red"}},
        //         {data: [this.T, this.Foxes], props: {label: "Foxes", color: "blue"}}
        //     ], 
        //     {
        //         roundX: 1,
        //         roundY: 0,
        //     }
        // )
    }

    CanInteract(firstAgent, secondAgent) {
        return !this.interactionTracker[this.InteractionID(firstAgent, secondAgent)];
    }

    EndCondition() {
        // return this.agentCount["Fox"] == 0 || this.agentCount["Rabbit"] == 0;
        return this.agentCount["Rabbit"] == 0;
    }

    Title() {

        let str = "";
        for(let type in this.agentCount)
            str += type + ": " + this.agentCount[type] + " "
        return this.title + ", Iteration: " + this.iteration + ", " + str;
    }

    Tick() {

        if(Keyboard.KeyDown("w"))
            this.fox.cooldowns["starvation"] -= .1;

        if(Keyboard.KeyUp("p"))
            propogationReduction += 1;
        
        if(Keyboard.KeyDown("d")) {
            distanceBias += 0.0001;
            console.log(distanceBias)
        }
        if(Keyboard.KeyDown("a")) {
            distanceBias -= 0.0001;
            console.log(distanceBias)
        }
        if(Keyboard.KeyUp("e")) {
            this.agents.push(new Rabbit(this, new Vec2(300, 100, this.position)))
        }

        this.ResetInteractions();
        this.agents.forEach(agent => Agent.Tick(this, agent));
        this.agents.forEach(agent => agent.Set(this));
        this.BoundaryConditions();        
        this.RunInteractions();
        this.Rabbits.push(this.agentCount["Rabbit"])
        this.Foxes.push(this.agentCount["Fox"])
        this.T.push(this.t)
    }

    InteractionID(firstAgent, secondAgent) {
        let smallestID = Math.min(firstAgent.ID, secondAgent.ID), largestID = Math.max(firstAgent.ID, secondAgent.ID);
        return smallestID + "," + largestID;
    }

    BoundaryConditions() {
        this.agents.forEach(agent => {
            if(agent.position.x > this.width)
                agent.position.x -= this.width;
            else if(agent.position.x < 0)
                agent.position.x += this.width;

            if(agent.position.y > this.height)
                agent.position.y -= this.height;
            else if(agent.position.y < 0)
                agent.position.y += this.height;
        });
    }

    RunInteractions() {
        for(let i = 0; i < this.agents.length - 1; ++i)
            for(let q = i + 1; q < this.agents.length; ++q)
                if(this.agents[i].position.periodicDistance(this.agents[q].position) <= this.agents[i].constructor.radius + this.agents[q].constructor.radius)
                    this.agents[i].Interact(this.agents[q], this);
    }

    ResetInteractions() {

        for(let i = 0; i < this.agents.length; ++i)
            if(!this.agents[i].alive) {
                --this.agentCount[this.agents[i].constructor.name];
                this.agents.splice(i--, 1);
            }

        
        for(let interaction in this.interactionTracker)
            if(this.interactionTracker[interaction] <= 0)
                delete this.interactionTracker[interaction];
            else this.interactionTracker[interaction] -= this.dt;
    }

    Draw() {

        
        ClipRectangle(this.position, this.width, this.height);
        this.agents.forEach(agent => {
            agent.Draw(agent.position);

            let margin = agent.constructor.radius * 2;
            let x = agent.position.x < margin ? -1 : (agent.position.x > this.width - margin ? 1 : 0),
                y = agent.position.y < margin ? -1 : (agent.position.y > this.height - margin ? 1 : 0);

            if(x == -1) {
                agent.Draw(agent.position["+"](this.width));
                if(y == -1)
                    agent.Draw(agent.position["+"](this.width, this.height));
                else if(y == 1)
                    agent.Draw(agent.position["+"](this.width, -this.height));
            }
            else if(x == 1) {
                agent.Draw(agent.position["+"](-this.width));
                if(y == -1)
                    agent.Draw(agent.position["+"](-this.width, this.height));
                else if(y == 1)
                    agent.Draw(agent.position["+"](-this.width, -this.height));
            }

            if(y == -1)
                agent.Draw(agent.position["+"](0, this.height));
            else if(y == 1)
                agent.Draw(agent.position["+"](0, -this.height));
        });

        context.restore();
    }
}

class DynamicVariable {

    static height = 50;
    static width = 400
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

                let value = (Mouse.position.x - this.position.x)/DynamicVariable.width;
                if(value < 0)
                    value = 0;
                else if(value > 1)
                    value = 1;

                this.SetValue(value);
            }
        }
    }

    SetValue(value) {
        this.scaledValue = Math.floor(this.steps * value) / this.steps;
        this.value = this.min + Math.floor(this.steps * value) * this.stepSize
        this.object[this.variable] = this.value;
    }

    Draw() {
        Bar(this.position, DynamicVariable.width, DynamicVariable.height, {fill: "rgb(0, 0, 250, .2)"});
        Bar(this.position, DynamicVariable.width, DynamicVariable.height * .8, {fill: "rgb(0, 0, 250, .2)"});
        Text(this.position["+"](DynamicVariable.width/2), 30, this.label + ": " + this.object[this.variable], {align: "center", justify: "center", color: "rgb(250, 250, 250, .8)"})
        Circle(this.position["+"](DynamicVariable.width * this.scaledValue), DynamicVariable.height * .8 / 2, {fill: "rgb(250, 250, 250, .6)"});
        Circle(this.position["+"](DynamicVariable.width * this.scaledValue), DynamicVariable.height * .6 / 2, {fill: "rgb(250, 250, 250, .6)"});
    }
}

function GrabFunction() {
    project.agents.forEach(agent => {
        
        if(Mouse.KeyDown("left") && Mouse.position["+"](-project.position.x, - project.position.y).periodicDistance(agent.position, project.width, project.height) < agent.constructor.radius)
                Mouse.Target(agent);
        
        if(Mouse.target == agent) {


            let x = Mouse.position.x - project.position.x
                y = Mouse.position.y - project.position.y;

            if(x < 0)
                x = 0;
            else if(x > project.width)
                x = project.width;

            if(y < 0)
                y = 0;
            else if(y > project.height)
                y = project.height;

            agent.position["="](x, y)
        }

    });
}

let project;
function Start() {
    project = new Project(new Vec2(100, 100), 2000, 2000, 1)
    
    new DynamicVariable(project.position["+"](project.width + 30, 20), project, "updatesPerTick", 0, 10, 1);
    new DynamicVariable(project.position["+"](project.width + 30, 80), project, "dt", 0, 0.2, 0.01);
    new DynamicVariable(project.position["+"](project.width + 30, 140), Rabbit, "visionRadius", 0, 500, 50, "Rabbit Vision Range");
    new DynamicVariable(project.position["+"](project.width + 30, 200), Fox, "visionRadius", 0, 500, 50, "Fox Vision Range");
    new DynamicVariable(project.position["+"](project.width + 30, 260), Fox, "starvationCooldown", 15, 80, 5, "Fox Vision Range");
}

function Update() {
    DynamicVariable.instances.forEach(instance => instance.Tick());
    Simulation.Tick();
    Plot.Tick();
    GrabFunction();

    DynamicVariable.instances.forEach(instance => instance.Draw());
    Simulation.Draw();
    Plot.Draw();
}