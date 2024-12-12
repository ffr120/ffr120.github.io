import numpy as np
import json
import matplotlib.pyplot as plt


with open("data/SimulationTimeVSinfluence.json", "rb") as file:
    data = json.load(file)
    

mean_vector = np.zeros(len(data))
std_vector = np.zeros(len(data))
vicsek_influence_vector = np.zeros(len(data))
for i, (vicsek_influence, simulation_time) in enumerate(data.items()):
    vicsek_influence = float(vicsek_influence) / 10
    vicsek_influence_vector[i] = vicsek_influence

    mean = np.mean(simulation_time)
    mean_vector[i] = mean

    std = np.std(simulation_time)
    std_vector[i] = std


# plt.errorbar(vicsek_influence_vector, mean_vector, yerr=std_vector, fmt='o', capsize=5)

plt.plot(vicsek_influence_vector, mean_vector, color="red", label="30 runs mean")
plt.fill_between(vicsek_influence_vector, mean_vector - std_vector, mean_vector + std_vector, color="red", alpha=0.2, label=r"$\pm$ Standard deviation")
plt.legend()
plt.title("Simulation time before extentinction for varying Vicsek influence")
plt.xlabel("Vicsek Influence")
plt.ylabel("Simulation Time")

plt.savefig("figures/simulation_time.png")
plt.show()
