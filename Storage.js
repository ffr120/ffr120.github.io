

// Intent(simulation) {

//     this.brain.Reset();
//     simulation.agents.forEach(agent => {
//         if(this != agent && !simulation.interactionTracker[simulation.InteractionID(this, agent)])
//             this.brain.Observe(agent);
//     });

//     this.orientation = this.brain.BestOption();
//     this.Walk(simulation.dt);
// }

// class ProjectMassSimulation extends MassSimulation {
//     constructor(simulations, runs) {
//         super(simulations, runs);
//     }

//     Between() {
//         console.log(this.simulations[this.current].iterationCounter/this.runs);
//     }
// }