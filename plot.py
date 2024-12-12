import numpy as np
import json
import matplotlib.pyplot as plt


# with open("data/countData.json", "rb") as file:
#     data = json.load(file)

    
# plt.plot(data["T"], data["foxCount"], label="Number of Foxes")
# plt.plot(data["T"], data["rabbitCount"], label="Number of Rabbits")
# plt.legend()
# plt.xlabel("Timestep")
# plt.ylabel("Count")
# plt.show()

 
with open("data/massSimulation2.json", "rb") as file:
    data = json.load(file)

time_vector = np.array(data["T"]["0"][0]) # -> (num_iterations)



fig, axs = plt.subplots(nrows=1, ncols=2, figsize=(10, 5))


ax = axs[0]
for viscek_weight, fox_count_matrix in data["foxCount"].items():
    fox_count_matrix = np.array(fox_count_matrix)
    # num_runs, num_iterations = fox_count_matrix.shape

    fox_mean = np.mean(fox_count_matrix, axis=0)
    fox_std = np.std(fox_count_matrix, axis=0)

    print(time_vector.shape)
    print(fox_mean.shape)
    ax.plot(time_vector, fox_mean, label=f"{viscek_weight}")
    ax.fill_between(time_vector, fox_mean - fox_std, fox_mean + fox_std, color='red', alpha=0.2)
ax.legend()
ax.set_xlabel("t")
ax.set_ylabel("Count")

ax = axs[1]
for viscek_weight, rabbit_count_matrix in data["rabbitCount"].items():
    fox_count_matrix = np.array(rabbit_count_matrix)
    # num_runs, num_iterations = fox_count_matrix.shape

    rabbit_mean = np.mean(rabbit_count_matrix, axis=0)
    rabbit_std = np.std(rabbit_count_matrix, axis=0)

    ax.plot(time_vector, rabbit_mean, label=f"{viscek_weight}")
    ax.fill_between(time_vector, rabbit_mean - rabbit_std, rabbit_mean + rabbit_std, color='brown', alpha=0.2)
ax.legend()
ax.set_xlabel("t")
ax.set_ylabel("Count")

plt.show()





# fox_count_matrix = np.array(data["foxCount"]["0"]) # -> (num_simulations, num_iterations)
# rabbit_count_matrix = np.array(data["rabbitCount"]["0"]) # -> (num_simulations, num_iterations)


# fox_mean = np.mean(fox_count_matrix, axis=0)
# fox_std = np.std(fox_count_matrix, axis=0)

# rabbit_mean = np.mean(rabbit_count_matrix, axis=0)
# rabbit_std = np.std(rabbit_count_matrix, axis=0)


# fig, axs = plt.subplots(nrows=1, ncols=2, figsize=(5, 10))
# for 
# axs[0].errorbar(time_vector, fox_mean, yerr=fox_std, label="Number of Foxes")


# axs[1].errorbar(time_vector, rabbit_mean, yerr=rabbit_std, label="Number of Rabbit")


# plt.legend()
# plt.xlabel("Timestep")
# plt.ylabel("Count")
# plt.show()
