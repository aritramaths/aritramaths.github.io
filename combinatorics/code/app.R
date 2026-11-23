# Interactive Barnsley fern laboratory
# Install once: install.packages("shiny")
# Run: shiny::runApp("app.R")

library(shiny)

barnsley_fern <- function(n, seed, probability, start = c(0, 0)) {
  set.seed(seed)
  rule <- sample(1:4, size = n, replace = TRUE, prob = probability)
  point <- matrix(0, nrow = n, ncol = 2)
  x <- start[1]
  y <- start[2]

  for (k in seq_len(n)) {
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

ui <- fluidPage(
  titlePanel("A Mathematical Ludo: the Barnsley Fern"),
  sidebarLayout(
    sidebarPanel(
      numericInput("n", "Number of moves", value = 150000,
                   min = 50, max = 500000, step = 1000),
      numericInput("seed", "Random seed", value = 2026, min = 1),
      radioButtons(
        "probability_mode", "Rule probabilities",
        choices = c(
          "Standard: 1%, 85%, 7%, 7%" = "standard",
          "Equal: 25%, 25%, 25%, 25%" = "equal"
        )
      ),
      checkboxInput(
        "connect", "Connect consecutive points (wrong on purpose)", FALSE
      ),
      actionButton("run", "Play the game")
    ),
    mainPanel(
      plotOutput("fern", height = "720px"),
      verbatimTextOutput("frequency")
    )
  )
)

server <- function(input, output, session) {
  simulation <- eventReactive(input$run, {
    probability <- if (input$probability_mode == "standard") {
      c(0.01, 0.85, 0.07, 0.07)
    } else {
      rep(0.25, 4)
    }
    barnsley_fern(input$n, input$seed, probability)
  }, ignoreNULL = FALSE)

  output$fern <- renderPlot({
    out <- simulation()
    if (input$connect) {
      plot(out$point[, 1], out$point[, 2], type = "l",
           lwd = 0.15, asp = 1, axes = FALSE,
           xlab = "", ylab = "")
    } else {
      plot(out$point[, 1], out$point[, 2], pch = ".",
           asp = 1, axes = FALSE, xlab = "", ylab = "")
    }
  })

  output$frequency <- renderPrint({
    out <- simulation()
    cat("Observed rule proportions:\n")
    print(prop.table(table(factor(out$rule, levels = 1:4))))
  })
}

shinyApp(ui, server)
