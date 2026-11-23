from random import Random
from math import pi, sin

def run(n=100000, seed=2026):
    if not isinstance(n, int) or n <= 0:
        raise ValueError("n must be a positive integer")
    rng = Random(seed)
    inside = triangles = crossings = 0
    for _ in range(n):
        x, y = rng.random(), rng.random()
        inside += x*x + y*y <= 1
        a, b = sorted((rng.random(), rng.random()))
        triangles += max(a, b-a, 1-b) < 0.5
        theta = (pi/2) * rng.random()
        distance = 0.5 * rng.random()
        crossings += distance <= 0.5*sin(theta)
    print("pi from area:", 4*inside/n)
    print("two-cut triangle frequency:", triangles/n)
    print("needle crossing frequency:", crossings/n)
    if crossings:
        print("pi from needle:", 2*n/crossings)

if __name__ == "__main__":
    run()
