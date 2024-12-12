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

 
with open("data/massSimulation.json", "rb") as file:
    data = json.load(file)

time_vector = np.array(data["T"]["0"][0]) # -> (num_iterations)
fox_count_matrix = np.array(data["foxCount"]["0"]) # -> (num_simulations, num_iterations)
rabbit_count_matrix = np.array(data["rabbitCount"]["0"]) # -> (num_simulations, num_iterations)

fox_mean = np.mean(fox_count_matrix, axis=0)
fox_std = np.std(fox_count_matrix, axis=0)

rabbit_mean = np.mean(rabbit_count_matrix, axis=0)
rabbit_std = np.std(rabbit_count_matrix, axis=0)
print(rabbit_count_matrix)

plt.errorbar(time_vector, fox_mean, yerr=fox_std, label="Number of Foxes")
plt.errorbar(time_vector, rabbit_mean, yerr=rabbit_std, label="Number of Rabbit")


plt.legend()
plt.xlabel("Timestep")
plt.ylabel("Count")
plt.show()
