
class Vicsek {
    static weight = 0.05;
    static noise = Math.PI / 6;
    static flockRadius = 200;
    static influence = 0.5;
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


        let reward = (1 - Vicsek.influence) * this.parent["Observe" + agent.constructor.name](agent) / (1 + this.parent.constructor.distanceBias * distance);
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
            
            this.segments[nextSegment].value += reward * Math.exp(-i * Brain.spreadCoefficient / propogationLength);

            if(nextSegment != prevSegment)
                this.segments[prevSegment].value += reward * Math.exp(-i * Brain.spreadCoefficient / propogationLength);
        }
    }

    Vicsek(simulation) {
        let sin = 0, cos = 0;

        simulation.agents.forEach(agent => {
            if(agent.constructor.name == "Rabbit") {
                if (this.parent.position.periodicDistance(agent.position, simulation.width, simulation.height) < Vicsek.flockRadius) {
                    cos += Math.cos(agent.orientation);
                    sin += Math.sin(agent.orientation);
                }
            }
        })
        let orientation =  Math.atan2(sin, cos) + Vicsek.noise * (-0.5 + Math.random()) * simulation.dt;

        this.AddReward(Vicsek.influence * Vicsek.weight, orientation);
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

            let w = (10e-6 + 12 * (segment.value - min)/del) * this.parent.parent.scale;

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

    constructor(parent, position, orientation = Math.random() * 2 * Math.PI) {
        this.parent = parent;
        this.position = position;
        this.velocity = this.constructor.velocity;
        this.orientation = orientation;
        this.targetOrientation = orientation;
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
        this.newPosition = this.position["+"](this.velocity * Math.cos(this.orientation) * dt, this.velocity * Math.sin(this.orientation) * dt);
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

        if(object.constructor.name == "Rabbit") {
            this.parent.deathCause.eaten++;
            this.cooldowns.predationCooldown = this.constructor.predationCooldown;
        }

        this.cooldowns["lifeTime"] += object.constructor.nutritionValue;
    }
}

class Rabbit extends Agent {

    static image = LoadImage('./rabbit.png')
    static velocity = 110;
    static radius = 20;
    static visionRadius = 0;
    static distanceBias = 0.005;

    static reproductionChance = .6;
    static reproductionCooldown = Agent.reproductionDamper * this.reproductionChance/3;
    
    static lifeTime = 60;

    static reproductionWeight = .05;
    static antiClusteringWeight = -.2;
    
    static nutritionValue = 60;
    static birthCost = 20;

    constructor(parent, position, orientation) {
        super(parent, position, orientation);
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
    static distanceBias = 0.02;

    static reproductionChance = .4;
    static reproductionCooldown = Agent.reproductionDamper * this.reproductionChance;
    static lifeTime = 90;

    static reproductionWeight = .25;
    static antiClusteringWeight = -.2;
    static birthCost = 30;

    static eatChance = .8;
    static predationCooldown = Fox.reproductionCooldown/5;

    constructor(parent, position, orientation) {
        super(parent, position, orientation);
        this.cooldowns.predationCooldown = Fox.predationCooldown;
    }

    Tick(simulation) {
        if(this.cooldowns.predationCooldown > 0)
            this.velocity = 0;
        else this.velocity = Fox.velocity;
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
    totalIterations = 1000;

    interactionTracker = {};
    agentCount = {Fox: 0, Rabbit: 0};
    deathCause = {starvation: 0, eaten: 0};
    agents = [];
    dt = 0.5;

    nFoxes = 5;
    nRabbits = 100;
    nCarrots = 50;

    interactionCooldown = 8;
    carrots = [];

    foxCount = [];
    rabbitCount = [];
    T = [];
    eaten = [];
    starvation = [];

    initialCarrots = [];
    initialRabbits = [];
    initialFoxes = [];
    run = 0;

    constructor(position, width, height, windowWidth, windowHeight, updatesPerTick) {
        super(position, width, height, windowWidth, windowHeight, "Inbreeding Simulator", updatesPerTick);

        for(let i = 0; i < this.nCarrots; ++i) {
            let position = new Vec2(Math.random() * this.width, Math.random() * this.height);
            this.carrots.push(new Carrot(this, position));
            this.initialCarrots.push(position.copy());
        }

        for(let i = 0; i < this.nRabbits; ++i) {
            let position = new Vec2(Math.random() * this.width, Math.random() * this.height);
            let orientation = Math.random() * Math.PI * 2;
            this.agents.push(new Rabbit(this, position, orientation));
            this.initialRabbits.push({position: position.copy(), orientation: orientation});
        }

        for(let i = 0; i < this.nFoxes; ++i) {
            let position = new Vec2(Math.random() * this.width, Math.random() * this.height);
            let orientation = Math.random() * Math.PI * 2;
            this.agents.push(new Fox(this, position, orientation));
            this.initialFoxes.push({position: position.copy(), orientation: orientation});
        }

        this.plot = new LinePlot(
            this.position["+"](100, this.windowHeight + 100),
            400,
            400,
            "Population vs Time, Visek = " + Vicsek.influence,
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

        // new LinePlot(
        //     this.position["+"](600, this.windowHeight + 100),
        //     400,
        //     400,
        //     "Death by Cause vs Time",
        //     "Time",
        //     "Deaths",
        //     [
        //         {
        //             data: [this.T, this.starvation],
        //             props: {
        //                 label: "Starvation",
        //                 color: "orange"
        //             }
        //         },
        //         {
        //             data:[this.T, this.eaten],
        //             props: {
        //                 label: "Eaten",
        //                 color: "green",
        //             }
        //         },
        //     ]
        // )
    
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 20), this, "updatesPerTick", 0, 10, 1);
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 60), this, "dt", 0, 1, 0.01);
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 100), Rabbit, "visionRadius", 0, 500, 50, "Rabbit Vision Range");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 140), Fox, "visionRadius", 0, 500, 50, "Fox Vision Range");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 180), Brain, "distanceBias", 0, 0.1, 0.001, "Distance Bias");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 220), Brain, "spreadCoefficient", 0, 10, 0.5, "Spread Coefficient");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 260), Vicsek, "influence", 0.1, 1, 0.1, "Vicsek Influence");
        new DynamicVariable(this.position["+"](this.windowWidth + 30, 300), Vicsek, "weight", 0, 0.5, 0.01, "Vicsek Weight");

        new DynamicVariable(this.position["+"](this.windowWidth + 30, 340), Fox, "reproductionWeight", 0, 0.5, 0.01, "Reproduction Weight");
    }

    Reset() {

        this.plot.title = "Population vs Time, Visek = " + Vicsek.influence;
        
        this.agents.length = 0;
        this.carrots.length = 0;

        this.interactionTracker = {};
        this.agentCount = {Fox: 0, Rabbit: 0};
        this.deathCause = {starvation: 0, eaten: 0};
        this.foxCount.length = 0;
        this.rabbitCount.length = 0;
        this.T.length = 0;
        this.eaten.length = 0;
        this.starvation.length = 0;

        this.initialRabbits.forEach(rabbit => {
            this.agents.push(new Rabbit(this, rabbit.position.copy(), rabbit.orientation));
        });

        this.initialFoxes.forEach(fox => {
            this.agents.push(new Fox(this, fox.position, fox.orientation));
        });

        this.initialCarrots.forEach(carrot => this.carrots.push(new Carrot(this, carrot)));
        
    }
    
    Tick() {
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
    }

    ResetInteractions() {
        for(let interaction in this.interactionTracker)
            if(this.interactionTracker[interaction] <= 0)
                delete this.interactionTracker[interaction];
            else this.interactionTracker[interaction] -= this.dt;
    }

    EndCondition() {
        return this.iteration == this.totalIterations;
        // return this.agentCount.Fox == 0 || this.agentCount.Rabbit == 0;
    }

    End() {
        // DownloadJSON(
        //     {
        //         T: this.T,
        //         foxCount: this.foxCount,
        //         rabbitCount: this.rabbitCount,
        //     },
        //     "countData"
        // )

        //StoreImage(this.plot)
    }

    Title() {
        let str = "";
        for(let type in this.agentCount)
            str += type + ": " + this.agentCount[type] + " ";
        return this.title + ", Iteration: " + this.iteration + ", " + str + ", Vicsek = " + Vicsek.influence;
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
                else if(Keyboard.KeyDown("Shift")) {
                    let distance = agent.position.distance(position);

                    if(distance > 0)
                        agent.orientation = position.angle(agent.position, distance)
                }
                else agent.position["="](position);
            }
        });
    }
}

class JakobMassSimulation extends MassSimulation {

    data = {};
    foxCountList = {};
    tList = {};
    rabbitCountList = {};
    constructor(simulations, runs, repeats) {
        super(simulations, runs * repeats);
        this.repeats = repeats;
        Vicsek.influence = 0;
    }

    BetweenRuns() {


        let influence = Round(Vicsek.influence, 1)

        console.log("new viscek influence");
        console.log(Vicsek.influence);

        // Update simulation time data
        if(!this.data[influence])
            this.data[influence] = 0;

        this.data[influence] += this.simulations[this.current].t;

        // Update time list
        if (!this.tList[influence]) {
            this.tList[influence] = [];
        }
        this.tList[influence].push(copy(this.simulations[this.current].T));

        // Update fox count list
        if (!this.foxCountList[influence]) {
            this.foxCountList[influence] = [];
        }
        this.foxCountList[influence].push(copy(this.simulations[this.current].foxCount));

        // Update fox count list
        if (!this.rabbitCountList[influence]) {
            this.rabbitCountList[influence] = [];
        }
        this.rabbitCountList[influence].push(copy(this.simulations[this.current].rabbitCount));

        Vicsek.influence = Math.floor((this.run)/this.repeats) * .5;

    }

    BetweenSimulations() {

    }

    End() {

        console.log("Downloading json");
        DownloadJSON(
            {
                T: this.tList,
                foxCount: this.foxCountList,
                rabbitCount: this.rabbitCountList,
            },
            "countData"
        )
    }
}


function Start() {
    let simulations = [new Project(new Vec2(50, 50), 4000, 4000, 500, 500, 1)];
    new JakobMassSimulation(simulations, 3, 5);
}

function Update() {
    
    MassSimulation.Tick()
    DynamicVariable.instances.forEach(instance => instance.Tick());
    Simulation.Tick();
    Plot.Tick();

    DynamicVariable.instances.forEach(instance => instance.Draw());
    Simulation.Draw();
    Plot.instances.forEach(instance => instance.Draw(instance));
}