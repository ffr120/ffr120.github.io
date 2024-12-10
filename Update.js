
class Vicsek {
    static influence = 0.02; //0.05;
    static noiseWeight = Math.PI/6;
    static flockRadius = 200;
}

class BrainSegment {
    value = 0;
    constructor(orientation, width) {
        this.orientation = orientation;
        this.width = width;
    }
}

class Brain {
    
    static nSegments = 40;
    static spreadCoefficient  = 1;
    static distanceBias = 0.1;
    
    segments = [];
    constructor(parent) {
        this.parent = parent;
        this.N = Brain.nSegments;
        
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

            this.segments[nextSegment].value += reward * Math.exp(-i / (propogationLength * Brain.spreadCoefficient));

            if(nextSegment != prevSegment)
                this.segments[prevSegment].value += reward * Math.exp(-i / (propogationLength * Brain.spreadCoefficient));
        }
    }

    Vicsek(simulation) {
        let sin = 0, cos = 0;

        simulation.agents.forEach(agent => {
            if(agent.constructor.name == "Rabbit" && agent != this) {
                if (this.parent.position.periodicDistance(agent.position, simulation.width, simulation.height) < Vicsek.flockRadius) {
                    cos += Math.cos(agent.orientation);
                    sin += Math.sin(agent.orientation);
                }
            }
        })
        let orientation =  Math.atan2(sin, cos) + Vicsek.noiseWeight * (-0.5 + Math.random()) * simulation.dt;

        this.AddReward(Vicsek.influence, orientation);
    }

    Evaluate(simulation) {

        this.Reset();

        if(this.parent.constructor.name == "Rabbit") {
            this.Vicsek(simulation);
            simulation.carrots.forEach(carrot => {
                if (carrot.alive)
                    this.Observe(carrot)
            })
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

            let w = 1 + 12 * (segment.value - min) * this.parent.parent.scale * 10;

            Circle(position, radius + w/2, {stroke: color, begin: segment.orientation - segment.width + .01, end: segment.orientation + segment.width - .01, lineWidth: w, onCamera: this.parent.parent.camera})
        });
    }
}

class Agent {

    static reproductionDamper = 60;
    static IDs = 0;
    t_levy = 0;
    alive = true;
    cooldowns = { reproductionCooldown: 0, lifeTime: this.constructor.lifeTime};
    turnSpeed = Math.PI/2;
    orientation = Math.random() * Math.PI * 2;
    targetOrientation = Math.random() * Math.PI * 2;

    constructor(parent, position) {

        this.parent = parent;
        this.position = position;
        this.ID = Agent.IDs++;
        this.brain = new Brain(this);
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
        agent.Tick(simulation);
        agent.DecreaseCooldowns(simulation.dt);

        if(agent.cooldowns["lifeTime"] <= 0) {
            agent.alive = false;
            if(agent.constructor.name == "Rabbit")
                agent.parent.deathCause.starvation++;
        }
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

    SetPosition(simulation) {
        this.position["="](this.newPosition);

        if(this.position.x > simulation.width)
            this.position.x -= simulation.width;
        else if(this.position.x < 0)
            this.position.x += simulation.width;

        if(this.position.y > simulation.height)
            this.position.y -= simulation.height;
        else if(this.position.y < 0)
            this.position.y += simulation.height;
    }

    Interact(agent, simulation) {
        
        let interactionID = simulation.InteractionID(this, agent);

        if(!simulation.interactionTracker[interactionID]) {
            if(this.constructor.name == agent.constructor.name) {

                if(this.cooldowns["reproductionCooldown"] <= 0 && agent.cooldowns["reproductionCooldown"] <= 0) {
                    simulation.interactionTracker[interactionID] = simulation.interactionCooldown;
                    if(Math.random() < this.constructor.reproductionChance) {


                        let newAgent = new this.constructor(simulation, this.position["+"](agent.position)["*"](1/2));
                        newAgent.cooldowns["reproductionCooldown"] = this.constructor.reproductionCooldown;
                        this.cooldowns["reproductionCooldown"] = this.constructor.reproductionCooldown;
                        agent.cooldowns["reproductionCooldown"] = this.constructor.reproductionCooldown;
                        simulation.interactionTracker[simulation.InteractionID(newAgent, this)] = simulation.interactionCooldown;
                        simulation.interactionTracker[simulation.InteractionID(newAgent, agent)] = simulation.interactionCooldown;
                        newAgent.cooldowns["lifeTime"] = this.constructor.birthCost * 2;
                        agent.cooldowns["lifeTime"] -= this.constructor.birthCost;
                        this.cooldowns["lifeTime"] -= this.constructor.birthCost;

                        simulation.agents.push(newAgent);
                    }
                }
            }
            else {
                simulation.interactionTracker[interactionID] = simulation.interactionCooldown;
                if(Math.random() < Fox.eatChance) {

                    if(this.constructor.name == "Rabbit")
                        agent.Eat(this);
                    else this.Eat(agent);
                }
            }
        }
    }

    CooldownScale(cooldown) {

        return (this.constructor[cooldown] - this.cooldowns[cooldown]) / this.constructor[cooldown];
    }

    DecreaseCooldowns(dt) {
        for(let cooldown in this.cooldowns) {

            if(this.cooldowns[cooldown] > this.constructor[cooldown])
                this.cooldowns[cooldown] = this.constructor[cooldown];
            
            if(this.cooldowns[cooldown] > 0)
                this.cooldowns[cooldown] -= dt;
            else this.cooldowns[cooldown] = 0;
        }
    }

    Draw(position) {

        let radius = this.constructor.radius * this.parent.scale
        let visionRadius = this.constructor.visionRadius * this.parent.scale;
        let image = this.constructor.image;
        
        Circle(position, radius, {fill: "rgb(0, 0, 250, .2)", onCamera: this.parent.camera});
        Circle(position, radius, {fill: "rgb(0, 0, 250, .2)", end: Math.PI * 2 * (1 - this.CooldownScale("reproductionCooldown")), onCamera: this.parent.camera});
        Circle(position, radius + 5 * this.parent.scale, {stroke: "rgb(250, 0, 0, .5)", end: Math.PI * 2 * (1 - this.CooldownScale("lifeTime")), lineWidth: 6 * this.parent.scale, onCamera: this.parent.camera});
        Photo(position, radius, radius, this.orientation, image, {onCamera: this.parent.camera})
        this.brain.Draw(position, radius + 10 * this.parent.scale);

        if(visionRadius > 0)
            Circle(position, radius + visionRadius, {stroke: "rgb(0, 0, 250, .2)", onCamera: this.parent.camera});
    }

    Eat(object) {

        if(!object.alive)
            return;

        object.alive = false;
        if(object.constructor.name == "Carrot")
            object.respawnCooldown = Carrot.growthDelay;

        if(object.constructor.name == "Rabbit")
            this.parent.deathCause.eaten++;

        this.cooldowns["lifeTime"] += object.constructor.nutritionValue;
    }
}

class Rabbit extends Agent {

    static image = LoadImage('./rabbit.png')
    static velocity = 110;
    static radius = 20;
    static visionRadius = 0;

    static reproductionChance = .6;
    static reproductionCooldown = 3 * Agent.reproductionDamper * this.reproductionChance;
    
    static lifeTime = 60;

    static reproductionWeight = .25;
    static antiClusteringWeight = -.2;
    
    static nutritionValue = 60;
    static birthCost = 20;

    constructor(parent, position) {
        super(parent, position);
    }

    Tick(simulation) {
        simulation.carrots.forEach(carrot => {
            if(this.position.periodicDistance(carrot.position) < Rabbit.radius + Carrot.radius)
                this.Eat(carrot);
        });
    }

    ObserveCarrot(carrot) {
        return this.CooldownScale("lifeTime");
        // return .2;
    }

    ObserveFox(agent) {
        return -1;
    }

    ObserveRabbit(agent) {
        if(!this.parent.CanInteract(this, agent) || this.CooldownScale("reproductionCooldown") < 1 || agent.CooldownScale("reproductionCooldown") < 1)
            return Rabbit.antiClusteringWeight;
        return Rabbit.reproductionWeight;
    }
}

class Fox extends Agent {

    static image = LoadImage('./fox.png')
    static velocity = 140;
    static radius = 45;
    static visionRadius = 0;

    static reproductionChance = .4;
    static reproductionCooldown = Agent.reproductionDamper * this.reproductionChance;
    static lifeTime = 90;

    static reproductionWeight = .25;
    static antiClusteringWeight = -.2;
    static birthCost = 30;

    static eatChance = .8;

    constructor(parent, position) {
        super(parent, position);
    }

    Tick(simulation) {

    }

    ObserveFox(agent) {
        
        if(!this.parent.CanInteract(this, agent) || this.CooldownScale("reproductionCooldown") < 1 || agent.CooldownScale("reproductionCooldown") < 1)
            return Fox.antiClusteringWeight;
        return Fox.reproductionWeight;
    }

    ObserveRabbit(agent) {
        if(!this.parent.CanInteract(this, agent))
            return 0;
        return this.CooldownScale("lifeTime");
    }
}

class Carrot {
    
    static nutritionValue = 30;
    static radius = 4;
    static growthDelay = 10;
    respawnCooldown = 0;

    alive = true;
    constructor(parent, position) {
        this.parent = parent;
        this.position = position;
        this.orientation = Math.random() * 2 * Math.PI;
    }

    Tick(simulation) {
        if (this.respawnCooldown <= 0 && !this.alive) {
            this.alive = true;
            this.position["="](simulation.width * Math.random(), simulation.height * Math.random());
        }
        else {
            this.respawnCooldown -= simulation.dt;
        }
    }

    Draw() {
        if (this.alive) {

            let radius = this.constructor.radius * this.parent.scale;
            Circle(this.position, radius, {fill: "rgb(220, 140, 20, 1)", onCamera: this.parent.camera});
            Circle(this.position, radius * .8, {fill: "rgb(250, 170, 50, 1)", onCamera: this.parent.camera});
            Circle(this.position, radius * .4, {fill: "rgb(130, 220, 70, 1)", onCamera: this.parent.camera});
        }
    }
}

class Project extends Simulation {

    interactionTracker = {};
    agentCount = {Fox: 0, Rabbit: 0};
    deathCause = {starvation: 0, eaten: 0};
    agents = [];
    dt = 0;

    nFoxes = 5;
    nRabbits = 100;
    nCarrots = 150;

    interactionCooldown = 8;
    carrots = [];

    foxCount = [];
    rabbitCount = [];
    T = [];
    eaten = [];
    starvation = [];


    constructor(position, width, height, windowWidth, windowHeight, updatesPerTick) {
        super(position, width, height, windowWidth, windowHeight, "Inbreeding Simulator", updatesPerTick);

        for(let i = 0; i < this.nCarrots; ++i)
            this.carrots.push(new Carrot(this, new Vec2(Math.random() * this.width, Math.random() * this.height)));

        for(let i = 0; i < this.nRabbits; ++i)
            this.agents.push(new Rabbit(this, new Vec2(Math.random() * this.width, Math.random() * this.height)));

        for(let i = 0; i < this.nFoxes; ++i)
            this.agents.push(new Fox(this, new Vec2(Math.random() * this.width, Math.random() * this.height)));

        
        this.plot = new LinePlot(
            this.position["+"](100, this.windowHeight + 100),
            400,
            400,
            "Population vs Time",
            "Time",
            "Population",
            [
                {
                    data: [this.T, this.foxCount],
                    props: {
                        label: "Foxes",
                        color: "orange"
                    }
                },
                {
                    data:[this.T, this.rabbitCount],
                    props: {
                        label: "Rabbits",
                        color: "green",
                    }
                },
            ]
        )

        new LinePlot(
            this.position["+"](600, this.windowHeight + 100),
            400,
            400,
            "Death by Cause vs Time",
            "Time",
            "Deaths",
            [
                {
                    data: [this.T, this.starvation],
                    props: {
                        label: "Starvation",
                        color: "orange"
                    }
                },
                {
                    data:[this.T, this.eaten],
                    props: {
                        label: "Eaten",
                        color: "green",
                    }
                },
            ]
        )
    
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 20), this, "updatesPerTick", 0, 10, 1);
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 60), this, "dt", 0, 0.2, 0.01);
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 100), Rabbit, "visionRadius", 0, 500, 50, "Rabbit Vision Range");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 140), Fox, "visionRadius", 0, 500, 50, "Fox Vision Range");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 180), Brain, "distanceBias", 0, 1, 0.01, "Distance Bias");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 220), Brain, "spreadCoefficient", 0.01, 1, 0.01, "Spread Coefficient");

    }
    
    Tick() {

        if(Keyboard.KeyDown("1"))
            this.fox.cooldowns["lifeTime"] = Rabbit.lifeTime;
        
        if(Keyboard.KeyDown("2"))
            this.fox.cooldowns["lifeTime"] = Rabbit.lifeTime * .74;
        
        if(Keyboard.KeyDown("3"))
            this.fox.cooldowns["lifeTime"] = Rabbit.lifeTime * .5;
        
        if(Keyboard.KeyDown("4"))
            this.fox.cooldowns["lifeTime"] = Rabbit.lifeTime * .25;

        this.ResetInteractions();
        this.agents.forEach(agent => Agent.Tick(this, agent));
        this.agents.forEach(agent => agent.SetPosition(this));
        this.carrots.forEach(carrot => carrot.Tick(this));
        this.RunInteractions();
        this.CleanUp();

        this.T.push(this.t)
        this.foxCount.push(this.agentCount.Fox)
        this.rabbitCount.push(this.agentCount.Rabbit)

        let total = this.deathCause.starvation + this.deathCause.eaten;
        if(total == 0)
            total = 1;
        this.starvation.push(this.deathCause.starvation);
        this.eaten.push(this.deathCause.eaten);
    }

    CanInteract(firstAgent, secondAgent) {
        return !this.interactionTracker[this.InteractionID(firstAgent, secondAgent)];
    }

    InteractionID(firstAgent, secondAgent) {
        let smallestID = Math.min(firstAgent.ID, secondAgent.ID), largestID = Math.max(firstAgent.ID, secondAgent.ID);
        return smallestID + "," + largestID;
    }

    RunInteractions() {
        for(let i = 0; i < this.agents.length - 1; ++i)
            for(let q = i + 1; q < this.agents.length; ++q) {

                if(this.agents[i].position.periodicDistance(this.agents[q].position) <= this.agents[i].constructor.radius + this.agents[q].constructor.radius)
                    this.agents[i].Interact(this.agents[q], this);
            }
    }

    CleanUp() {

        for(let i = 0; i < this.agents.length; ++i)
            if(!this.agents[i].alive) {
                --this.agentCount[this.agents[i].constructor.name];
                this.agents.splice(i--, 1);
            }

        // for(let i = 0; i < this.carrots.length; ++i) {
        //     let carrot = this.carrots[i];
        //     if(!carrot.alive) {
        //         carrot.position["="](this.width * Math.random(), this.height * Math.random());
        //         carrot.alive = true;
        //     }
        // }

    }

    ResetInteractions() {
        for(let interaction in this.interactionTracker)
            if(this.interactionTracker[interaction] <= 0)
                delete this.interactionTracker[interaction];
            else this.interactionTracker[interaction] -= this.dt;
    }

    EndCondition() {
        return false;
    }

    End() {
        DownloadJSON(
            {
                T: this.T,
                foxCount: this.foxCount,
                rabbitCount: this.rabbitCount,
            },
            "countData"
        )

        StoreImage(this.plot)
    }

    Title() {
        let str = "";
        for(let type in this.agentCount)
            str += type + ": " + this.agentCount[type] + " ";
        return this.title + ", Iteration: " + this.iteration + ", " + str;
    }

    Draw() {

        if(!this.draw)
            return; 
        
        ClipRectangle(this.position, this.windowWidth, this.windowHeight);
        this.carrots.forEach(carrot => carrot.Draw());
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

    StaticTick() {
        this.GrabFunction();
    }

    GrabFunction() {

        let position = this.camera.InSpace(Mouse.position);

        this.agents.forEach(agent => {
            
            if(Mouse.KeyDown("left") && InRectangle(this.position, this.windowWidth, this.windowHeight, Mouse.position) && position.periodicDistance(agent.position, this.width, this.height) < agent.constructor.radius)
                Mouse.Target(agent);
            
            if(position.x > this.width)
                position.x = this.width;
            else if(position.x < 0)
                position.x = 0;

            if(position.y > this.height)
                position.y = this.height;
            else if(position.y < 0)
                position.y = 0;

            if(Mouse.target == agent) {

                if(Keyboard.KeyDown("Alt"))
                    agent.cooldowns.lifeTime -= Mouse.move.y;
                else agent.position["="](position);
            }
        });
    }
}

function Start() {
    new Project(new Vec2(50, 50), 2000, 2000, 500, 500, 1)
}

function Update() {
    
    DynamicVariable.instances.forEach(instance => instance.Tick());
    Simulation.Tick();
    Plot.Tick();

    DynamicVariable.instances.forEach(instance => instance.Draw());
    Simulation.Draw();
    Plot.instances.forEach(instance => instance.Draw(instance));
}