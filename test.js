// Get the `Router` and `run` function from our library
const { Router, run } = require("./lib");

// Create a new instance of the `Router` class
const router = new Router();

// Define the routes
router.get("/", (req, res) => {
  res.end("Hello from the root endpoint");
});

router.get("/user/:name", (req, res) => {
  res.end(`Hello, ${req.params.name}!`);
});

router.get("/user/:age/class/:subject", (req, res) => {
  res.end(`You're ${req.params.age} years old, and you're studying ${req.params.subject}.`);
});

// Start the server at port 3000
run(router, 3000);
