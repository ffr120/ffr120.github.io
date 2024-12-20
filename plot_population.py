import numpy as np
import json
import matplotlib.pyplot as plt


with open("data/massSimulation.json", "rb") as file:
    data = json.load(file)

time_vector = np.array(data["T"]["0"][0]) # -> (num_iterations)

fig, axs = plt.subplots(nrows=2, ncols=1, figsize=(10, 10))

colors = ["red", "green", "blue"]
ax = axs[0]
for i, (vicsek_influence, fox_count_matrix) in enumerate(data["foxCount"].items()):
    vicsek_influence = float(vicsek_influence)
    fox_count_matrix = np.array(fox_count_matrix) # -> (num_runs, num_iterations)

    fox_mean = np.mean(fox_count_matrix, axis=0)
    fox_std = np.std(fox_count_matrix, axis=0)

    color = colors[i]
    ax.plot(time_vector, fox_mean, color=color, label=f"Flocking degree: {vicsek_influence}")
    ax.fill_between(time_vector, fox_mean - fox_std, fox_mean + fox_std, color=color, alpha=0.2)
ax.legend()
ax.set_xlabel("t")
ax.set_ylabel("Count")
ax.set_title("Fox population over time with varying flocking degree")

ax = axs[1]
for i, (vicsek_influence, rabbit_count_matrix) in enumerate(data["rabbitCount"].items()):
    vicsek_influence = float(vicsek_influence)
    rabbit_count_matrix = np.array(rabbit_count_matrix) # -> (num_runs, num_iterations)

    rabbit_mean = np.mean(rabbit_count_matrix, axis=0)
    rabbit_std = np.std(rabbit_count_matrix, axis=0)

    color = colors[i]
    ax.plot(time_vector, rabbit_mean, color=color, label=f"Flocking degree: {vicsek_influence}")
    ax.fill_between(time_vector, rabbit_mean - rabbit_std, rabbit_mean + rabbit_std, color=color, alpha=0.2)
ax.legend()
ax.set_xlabel("t")
ax.set_ylabel("Count")
ax.set_title("Rabbit population over time with varying flocking degree")

plt.savefig("figures/population_5_runs_1000_iter.png")
plt.show()