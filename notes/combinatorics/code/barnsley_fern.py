import numpy as np
import matplotlib.pyplot as plt


def barnsley_fern(n=150_000, seed=2026,
                  start=(0.0, 0.0),
                  probabilities=(0.01, 0.85, 0.07, 0.07)):
    rng = np.random.default_rng(seed)
    rules = rng.choice(4, size=n, p=probabilities)

    points = np.empty((n, 2), dtype=float)
    x, y = start

    for k, rule in enumerate(rules):
        # Both new coordinates must use the old x and old y.
        if rule == 0:
            new_x = 0.0
            new_y = 0.16 * y
        elif rule == 1:
            new_x = 0.85 * x + 0.04 * y
            new_y = -0.04 * x + 0.85 * y + 1.60
        elif rule == 2:
            new_x = 0.20 * x - 0.26 * y
            new_y = 0.23 * x + 0.22 * y + 1.60
        else:
            new_x = -0.15 * x + 0.28 * y
            new_y = 0.26 * x + 0.24 * y + 0.44

        x, y = new_x, new_y
        points[k] = (x, y)

    return points, rules


points, rules = barnsley_fern()

# Plot points. Do not connect successive positions by lines.
plt.figure(figsize=(6, 10))
plt.scatter(points[:, 0], points[:, 1], s=0.08, marker=".")
plt.gca().set_aspect("equal")
plt.axis("off")
plt.tight_layout()
plt.show()

# Check the observed proportions of the four rules.
counts = np.bincount(rules, minlength=4)
print("counts:", counts)
print("relative frequencies:", counts / len(rules))
