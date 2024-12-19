
class Vicsek {
    static weight = 0.05;
    static noise = Math.PI / 6;
    static flockRadius = 200;
    static influence = 0.8;
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

            let w = (10e-6 + 12 * (segment.value - min)/del) * this.parent.parent.scaleX;

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
                    if(Math.random() < this.constructor.reproductionChance && simulation.agents.length < 100) {


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

        let radius = this.constructor.radius * this.parent.scaleX
        let visionRadius = this.constructor.visionRadius * this.parent.scaleX;
        let image = this.constructor.image;
        
        Circle(position, radius, {fill: "rgb(0, 0, 250, .2)", onCamera: this.parent.camera});
        Circle(position, radius, {fill: "rgb(0, 0, 250, .2)", end: Math.PI * 2 * (1 - this.CooldownScale("reproductionCooldown")), onCamera: this.parent.camera});
        Circle(position, radius + 5 * this.parent.scaleX, {stroke: "rgb(250, 0, 0, .5)", end: Math.PI * 2 * (1 - this.CooldownScale("lifeTime")), lineWidth: 6 * this.parent.scaleX, onCamera: this.parent.camera});
        Photo(position, radius, radius, this.orientation, image, {onCamera: this.parent.camera})
        this.brain.Draw(position, radius + 10 * this.parent.scaleX);

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
    static radius = 10;
    static growthDelay = 5;
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

            let radius = this.constructor.radius * this.parent.scaleX;
            Circle(this.position, radius, {fill: "rgb(220, 140, 20, 1)", onCamera: this.parent.camera});
            Circle(this.position, radius * .8, {fill: "rgb(250, 170, 50, 1)", onCamera: this.parent.camera});
            Circle(this.position, radius * .4, {fill: "rgb(130, 220, 70, 1)", onCamera: this.parent.camera});
        }
    }
}

class Project extends Simulation {
    totalIterations = 50;

    interactionTracker = {};
    agentCount = {Fox: 0, Rabbit: 0};
    deathCause = {starvation: 0, eaten: 0};
    agents = [];
    dt = 0.1;

    nFoxes = 5;
    nRabbits = 80;
    nCarrots = 100;

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

        // this.plot = new LinePlot(
        //     this.position["+"](100, this.windowHeight + 100),
        //     400,
        //     400,
        //     "Population vs Time, Visek = " + Vicsek.influence,
        //     "Time",
        //     "Population",
        //     [
        //         {
        //             data: [this.T, this.foxCount],
        //             props: {
        //                 label: "Foxes",
        //                 color: "orange"
        //             }
        //         },
        //         {
        //             data:[this.T, this.rabbitCount],
        //             props: {
        //                 label: "Rabbits",
        //                 color: "green",
        //             }
        //         },
        //     ]
        // )

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
    
        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 20), this, "updatesPerTick", 0, 10, 1);
        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 60), this, "dt", 0, 1, 0.01);
        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 100), Rabbit, "visionRadius", 0, 500, 50, "Rabbit Vision Range");
        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 140), Fox, "visionRadius", 0, 500, 50, "Fox Vision Range");
        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 220), Brain, "spreadCoefficient", 0, 10, 0.5, "Spread Coefficient");
        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 260), Vicsek, "influence", 0.1, 1, 0.1, "Vicsek Influence");
        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 300), Vicsek, "weight", 0, 0.5, 0.01, "Vicsek Weight");

        // new DynamicVariable(this.position["+"](this.windowWidth + 30, 340), Fox, "reproductionWeight", 0, 0.5, 0.01, "Reproduction Weight");
    }

    Reset() {

        //this.plot.title = "Population vs Time, Visek = " + Vicsek.influence;
        
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
        //return this.iteration == this.totalIterations;
        return this.agentCount.Fox < 2 || this.agentCount.Rabbit < 2;
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

        Text(new Vec2(100, 100), 20, this.agents.length, {color: "black"})
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

class ProjectMassSimulation extends MassSimulation {

    data = {};
    constructor(simulations, runs, repeats) {
        super(simulations, runs * repeats);
        this.repeats = repeats;
        Vicsek.influence = 0;
    }

    BetweenRuns() {

        let influence = Math.floor((this.run - 1)/this.repeats);
        if(!this.data[influence])
            this.data[influence] = [];

        this.data[influence].push(this.simulations[this.current].t);
        Vicsek.influence = Math.floor(this.run/this.repeats) * .1;
    }

    BetweenSimulations() {

    }

    End() {

        console.log(this.data)

        DownloadJSON(this.data, "SimulationTimeVSinfluence")

        // let V = [];
        // let T = [];
        // for(let prop in this.data) {
        //     V.push(prop);
        //     T.push(this.data[prop]/this.repeats);
        // }

        // StoreImage(new LinePlot(
        //     new Vec2(500, 500),
        //     400,
        //     400,
        //     "Simulation Time vs Vicsek Influence",
        //     "Vicsek Influence",
        //     "Time",
        //     [
        //         {
        //             data: [V, T],
        //             props: {
        //                 color: "orange"
        //             }
        //         },
        //     ],
        //     {
        //         roundX: 1
        //     }
        // ));
    }
}

// let data = {
//     "0": [
//       450.80000000000248,
//       647.20000000000243,
//       671.199999999996,
//       573.1999999999846,
//       469.2000000000018,
//       316.7999999999991,
//       305.59999999999974,
//       494.4000000000004,
//       305.59999999999974,
//       431.5999999999926,
//       320.40000000000205,
//       303.1999999999999,
//       352.79999999999706,
//       682.80000000000103,
//       446.40000000000242,
//       442.00000000000236,
//       490.4000000000006,
//       491.20000000000056,
//       476.0000000000014,
//       496.80000000000024,
//       444.7999999999918,
//       477.60000000000133,
//       474.00000000000153,
//       494.0000000000004,
//       380.3999999999955,
//       480.0000000000012,
//       327.60000000000215,
//       393.19999999999476,
//       319.20000000000203,
//       348.00000000000244
//     ],
//     "1": [
//       409.19999999999953,
//       677.1999999999616,
//       412.39999999999367,
//       652.3999999999971,
//       309.19999999999953,
//       346.3999999999974,
//       495.6000000000003,
//       748.7999999999746,
//       444.0000000000024,
//       366.7999999999622,
//       306.3999999999997,
//       343.99999999999756,
//       424.79999999999296,
//       433.60000000000224,
//       266.40000000000197,
//       430.4000000000022,
//       406.40000000000185,
//       447.60000000000244,
//       410.3999999999825,
//       301.99999999999994,
//       317.99999999999903,
//       444.0000000000024,
//       439.60000000000232,
//       480.40000000000117,
//       478.0000000000013,
//       435.60000000000227,
//       437.2000000000023,
//       597.9999999999832,
//       432.39999999999253,
//       492.80000000000047
//     ],
//     "2": [
//       425.5999999999929,
//       321.59999999999883,
//       616.7999999999821,
//       427.1999999999928,
//       472.4000000000016,
//       322.79999999999876,
//       450.00000000000247,
//       715.9999999999765,
//       417.600000000002,
//       478.80000000000126,
//       430.39999999999264,
//       561.2000000001037,
//       321.59999999999883,
//       484.00000000000097,
//       423.999999999993,
//       347.59999999999735,
//       326.39999999999856,
//       433.99999999999244,
//       348.7999999999973,
//       516.3999999999651,
//       313.5999999999993,
//       306.79999999999967,
//       446.00000000000242,
//       482.0000000000011,
//       464.80000000000206,
//       437.19999999999226,
//       363.59999999999644,
//       456.00000000000256,
//       502.4000000004767,
//       308.79999999999956
//     ],
//     "3": [
//       483.600000000001,
//       482.40000000000106,
//       388.39999999999503,
//       361.2000000000583,
//       333.59999999999815,
//       476.8000000000014,
//       300.8,
//       355.5999999999969,
//       331.99999999999824,
//       454.00000000000253,
//       434.80000000000226,
//       444.7999999999918,
//       586.00000000000085,
//       494.0000000000004,
//       410.3999999999938,
//       317.1999999999991,
//       406.40000000000185,
//       369.1999999999691,
//       394.3999999999947,
//       319.59999999999894,
//       407.60000000000187,
//       438.0000000000023,
//       593.6000000000004,
//       456.00000000000256,
//       475.60000000000144,
//       486.40000000000083,
//       447.1999999999917,
//       449.99999999999153,
//       442.40000000000236,
//       338.3999999999979
//     ],
//     "4": [
//       424.0000000000021,
//       498.3999999999604,
//       423.59999999999303,
//       494.399999999989,
//       330.39999999999833,
//       360.7999999999966,
//       489.5999999999893,
//       349.59999999999724,
//       358.39999999999674,
//       318.7999999999804,
//       364.7999999999964,
//       478.7999999999899,
//       307.19999999999965,
//       299.2000000000001,
//       497.6000000000002,
//       497.6000000000002,
//       408.40000000000188,
//       398.39999999999446,
//       484.40000000000094,
//       400.39999999999435,
//       374.3999999999958,
//       355.9999999999969,
//       417.1999999999934,
//       412.40000000000194,
//       402.4000000000018,
//       446.00000000000242,
//       400.00000000000006,
//       371.599999999996,
//       314.7999999999765,
//       367.5999999999962
//     ],
//     "5": [
//       379.9999999999955,
//       321.19999999999885,
//       438.4000000000023,
//       338.3999999999979,
//       532.3999999999869,
//       305.59999999999974,
//       402.7999999999942,
//       417.9999999999707,
//       475.20000000000147,
//       327.99999999999847,
//       438.0000000000023,
//       533.9999999999868,
//       325.1999999999986,
//       345.5999999999634,
//       480.0000000000012,
//       342.39999999999765,
//       410.4000000000019,
//       471.2000000000017,
//       398.00000000000017,
//       373.99999999999585,
//       320.7999999999989,
//       314.39999999999924,
//       383.200000000001,
//       394.0000000000004,
//       368.3999999999735,
//       356.40000000000254,
//       446.39999999999173,
//       452.79999999999137,
//       393.20000000000044,
//       348.00000000000244
//     ],
//     "6": [
//       373.60000000000156,
//       387.1999999999951,
//       452.399999999988,
//       389.60000000000065,
//       398.8000000000001,
//       313.5999999999993,
//       349.20000000000246,
//       360.3999999999966,
//       277.20000000000135,
//       380.3999999999955,
//       497.9999999999661,
//       373.60000000000156,
//       338.4000000000023,
//       450.7999999999877,
//       359.1999999999967,
//       300.00000000000006,
//       367.2000000000019,
//       497.2000000000437,
//       589.1999999999837,
//       371.599999999996,
//       331.1999999999983,
//       353.599999999997,
//       311.1999999999994,
//       298.40000000000015,
//       453.6000000000793,
//       382.80000000000103,
//       357.99999999999676,
//       300.40000000000003,
//       383.1999999999953,
//       309.19999999999953
//     ],
//     "7": [
//       400.0000000000216,
//       351.200000000192,
//       355.1999999999969,
//       283.200000000001,
//       367.5999999999962,
//       327.1999999999985,
//       214.00000000000196,
//       354.39999999999696,
//       382.79999999999535,
//       378.3999999999956,
//       416.7999999999594,
//       351.9999999999914,
//       345.5999999999918,
//       393.59999999999474,
//       413.5999999999936,
//       298.8000000000001,
//       361.59999999999656,
//       231.2000000000022,
//       365.19999999999635,
//       395.19999999999465,
//       340.79999999999774,
//       313.1999999999766,
//       355.1999999999969,
//       268.40000000000185,
//       311.5999999999994,
//       479.19999999998987,
//       333.9999999999981,
//       339.5999999999978,
//       298.40000000000015,
//       294.0000000000004
//     ],
//     "8": [
//       244.8000000000024,
//       314.7999999999992,
//       238.8000000000023,
//       278.80000000000126,
//       364.3999999999964,
//       285.6000000000009,
//       349.19999999999726,
//       380.79999999999546,
//       355.19999999999123,
//       333.59999999999815,
//       435.1999999999754,
//       395.19999999999465,
//       369.9999999999848,
//       193.20000000000167,
//       277.60000000000133,
//       246.00000000000242,
//       244.8000000000024,
//       222.40000000000208,
//       395.1999999999833,
//       233.60000000000224,
//       240.40000000000234,
//       373.99999999999017,
//       427.5999999999758,
//       229.60000000000218,
//       437.5999999999847,
//       240.40000000000234,
//       299.2000000000001,
//       318.3999999999877,
//       394.3999999999947,
//       395.9999999999889
//     ],
//     "9": [
//       291.59999999999485,
//       281.6000000000011,
//       185.20000000000155,
//       395.9999999999946,
//       345.1999999999975,
//       322.3999999999988,
//       286.00000000000085,
//       269.2000000000018,
//       278.3999999999899,
//       278.0000000000013,
//       235.20000000000226,
//       333.59999999999815,
//       273.2000000000016,
//       222.8000000000021,
//       357.99999999999676,
//       341.99999999999767,
//       232.00000000000222,
//       203.99999999999415,
//       235.60000000000227,
//       246.40000000000242,
//       338.3999999999979,
//       256.8000000000025,
//       277.20000000000135,
//       258.00000000000244,
//       305.19999999999976,
//       252.4000000000025,
//       229.5999999999927,
//       265.600000000002,
//       194.8000000000017,
//       339.5999999999978
//     ],
//     "10": [
//       167.6000000000013,
//       120.40000000000063,
//       162.00000000000122,
//       126.00000000000071,
//       146.000000000001,
//       146.400000000001,
//       134.40000000000083,
//       155.60000000000113,
//       145.600000000001,
//       174.4000000000014,
//       151.60000000000107,
//       176.40000000000143,
//       122.40000000000066,
//       153.6000000000011,
//       153.2000000000011,
//       132.8000000000008,
//       173.6000000000014,
//       156.80000000000115,
//       150.40000000000106,
//       115.20000000000056,
//       142.80000000000095,
//       166.8000000000013,
//       149.60000000000105,
//       143.60000000000096,
//       134.80000000000084,
//       152.40000000000109,
//       151.20000000000107,
//       148.40000000000103,
//       165.60000000000127,
//       176.80000000000143
//     ]
//   }

function Start() {


    let area = 20000000;
    let scale = canvas.width/canvas.height;
    let h = Math.round(Math.sqrt(area/scale));
    let w = Math.round(h * scale);
    new Project(new Vec2(0, 0), w, h, canvas.width, canvas.height, 1)

        // let X = [];
        // let Y = [];
        // let E = [];
        // for(let prop in data) {
        //     X.push(prop * 0.1);
        //     Y.push(Average(data[prop]));
        //     E.push(STD(data[prop]))
        // }

        // let K = [], D = [];
        // for(let i = 0; i < E.length; ++i) {
        //     K.push(Y[i] - E[i]);
        //     D.push(Y[i] + E[i]);
        // }

        // console.log(Y)

        // new LinePlot(
        //     new Vec2(500, 500),
        //     400,
        //     400,
        //     "Simulation Time vs Vicsek Influence",
        //     "Vicsek Influence",
        //     "Time",
        //     [
        //         {
        //             data: [X, Y],
        //             props: {
        //                 color: "orange"
        //             }
        //         },
        //         {
        //             data: [X, K],
        //             props: {
        //                 color: "orange"
        //             }
        //         },
        //         {
        //             data: [X, D],
        //             props: {
        //                 color: "orange"
        //             }
        //         },
        //     ],
        //     {
        //         roundX: 1
        //     }
        // )
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