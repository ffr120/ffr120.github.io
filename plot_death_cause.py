import numpy as np
import json
import matplotlib.pyplot as plt


with open("data/population-death_cause2.json", "rb") as file:
    data = json.load(file)

time_vector = np.array(data["T"]["0"][0]) # -> (num_iterations)

fig, axs = plt.subplots(nrows=2, ncols=1, figsize=(10, 10))

colors = ["red", "green", "blue"]
# starvation plot
ax = axs[0]
for i, [rabbit_matrix, (vicsek_influence, starvation_matrix)] in enumerate(zip(data["rabbitCount"].values(), data["starvation"].items())):
    vicsek_influence = float(vicsek_influence)
    starvation_matrix = np.array(starvation_matrix) # -> (num_runs, num_iterations)
    rabbit_matrix = np.array(rabbit_matrix)

    # Normalize starvation matrix
    print(starvation_matrix.shape)
    print(rabbit_matrix.shape)
    starvation_matrix = np.diff(starvation_matrix)
    print(starvation_matrix.shape)
    starvation_matrix = np.insert(starvation_matrix, 0, np.zeros(starvation_matrix.shape[0]), axis=1)
    print(starvation_matrix.shape)

    starvation_matrix = np.where(rabbit_matrix != 0, starvation_matrix / rabbit_matrix, 0)
    print(starvation_matrix.shape)

    starvation_mean = np.mean(starvation_matrix, axis=0)
    starvation_std = np.std(starvation_matrix, axis=0)

    color = colors[i]
    ax.plot(time_vector, starvation_mean, color=color, label=f"Flocking degree: {vicsek_influence}")
    ax.fill_between(time_vector, starvation_mean - starvation_std, starvation_mean + starvation_std, color=color, alpha=0.2)
ax.legend()
ax.set_xlabel("t")
ax.set_ylabel("Deaths")
ax.set_title("Rabbit deaths due to starvation with varying flocking degree")

# Eaten plot
ax = axs[1]
for i, (vicsek_influence, eaten_matrix) in enumerate(data["eaten"].items()):
    vicsek_influence = float(vicsek_influence)
    eaten_matrix = np.array(eaten_matrix) # -> (num_runs, num_iterations)

    eaten_mean = np.mean(eaten_matrix, axis=0)
    eaten_std = np.std(eaten_matrix, axis=0)

    color = colors[i]
    ax.plot(time_vector, eaten_mean, color=color, label=f"Flocking degree: {vicsek_influence}")
    ax.fill_between(time_vector, eaten_mean - eaten_std, eaten_mean + eaten_std, color=color, alpha=0.2)
ax.legend()
ax.set_xlabel("t")
ax.set_ylabel("Count")
ax.set_title("Rabbit deaths due to predation with varying flocking degree")

plt.savefig("figures/death_cause_5_runs_1000_iter.png")
plt.show()