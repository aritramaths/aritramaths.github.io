barnsley_fern <- function(n = 150000, seed = 2026,
                          start = c(0, 0),
                          probability = c(0.01, 0.85, 0.07, 0.07)) {
  set.seed(seed)
  rule <- sample(1:4, size = n, replace = TRUE,
                 prob = probability)

  point <- matrix(0, nrow = n, ncol = 2)
  x <- start[1]
  y <- start[2]

  for (k in seq_len(n)) {
    # Both new coordinates use the old x and old y.
    if (rule[k] == 1) {
      new_x <- 0
      new_y <- 0.16 * y
    } else if (rule[k] == 2) {
      new_x <- 0.85 * x + 0.04 * y
      new_y <- -0.04 * x + 0.85 * y + 1.60
    } else if (rule[k] == 3) {
      new_x <- 0.20 * x - 0.26 * y
      new_y <- 0.23 * x + 0.22 * y + 1.60
    } else {
      new_x <- -0.15 * x + 0.28 * y
      new_y <- 0.26 * x + 0.24 * y + 0.44
    }

    x <- new_x
    y <- new_y
    point[k, ] <- c(x, y)
  }

  list(point = point, rule = rule)
}

out <- barnsley_fern()

# Plot points, not connected line segments.
plot(out$point[, 1], out$point[, 2],
     pch = ".", asp = 1, axes = FALSE,
     xlab = "", ylab = "")

# Observed proportions of the four rules.
prop.table(table(out$rule))
