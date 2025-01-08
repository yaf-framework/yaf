const { Router, run } = require("./lib");
const { InMemoryDatabase } = require("./lib/database");
const bodyParser = require("body-parser");
const cors = require("./lib/cors");
const { generateUniqueId } = require("./lib/utils");

// Initialize router and database
const router = new Router();
const db = new InMemoryDatabase();

// Global Middleware Setup
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));
router.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logging Middleware
router.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Version Group
router.group("/api/v1", [], () => {
  // Test Routes
  router.get("/test", (req, res) => {
    res.json({ message: "Basic GET works!" });
  });

  router.post("/test-query", (req, res) => {
    res.json({
      message: "Query parameters work!",
      query: req.query,
      body: req.body,
    });
  });

  // Transaction Demo Routes
  router.group("/transactions", [], () => {
    router.post("/demo", (req, res) => {
      const transactionId = db.beginTransaction();
      try {
        // Perform some operations
        const data = { id: generateUniqueId(), ...req.body };
        db.set("tempData", data);

        // Commit the transaction
        db.commitTransaction(transactionId);
        res.json({ message: "Transaction successful", data });
      } catch (error) {
        db.rollbackTransaction(transactionId);
        res.status(500).json({ error: "Transaction failed", message: error.message });
      }
    });
  });

  // Products Resource (Existing Routes)
  router.group("/products", [], () => {
    // Create product
    router.post("/", (req, res) => {
      const { name, price, description } = req.body;
      if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      const products = db.get("products") || [];
      const newProduct = {
        id: generateUniqueId(),
        name,
        price,
        description,
        createdAt: new Date().toISOString(),
      };

      products.push(newProduct);
      db.set("products", products);
      res.status(201).json(newProduct);
    });

    // Get all products with optional filtering
    // Get all products with optional filtering
    router.get("/", (req, res) => {
      const products = db.get("products") || [];
      res.json(products);
    });

    // Get product by ID
    router.get("/:id", (req, res) => {
      const products = db.get("products") || [];
      const product = products.find((p) => p.id === req.params.id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    });

    // Update product
    router.put("/:id", (req, res) => {
      const products = db.get("products") || [];
      console.log("req.params", req.params);
      const index = products.findIndex((p) => p.id === req.params.id);

      if (index === -1) {
        return res.status(404).json({ error: "Product not found" });
      }

      products[index] = {
        ...products[index],
        ...req.body,
        updatedAt: new Date().toISOString(),
      };

      db.set("products", products);
      res.json(products[index]);
    });

    // Delete product
    router.delete("/:id", (req, res) => {
      const products = db.get("products") || [];
      const filteredProducts = products.filter((p) => p.id !== req.params.id);

      if (filteredProducts.length === products.length) {
        return res.status(404).json({ error: "Product not found" });
      }

      db.set("products", filteredProducts);
      res.status(204).end();
    });
  });

  // Nested Routers (New Addition)
  const authRouter = new Router();
  const adminRouter = new Router();

  // Auth Router (Nested under /api/v1/auth)
  authRouter.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Simulate a login process
    const token = generateUniqueId();
    res.json({ message: "Login successful", token });
  });

  authRouter.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Simulate a registration process
    const user = { id: generateUniqueId(), username, password };
    res.status(201).json({ message: "Registration successful", user });
  });

  // Admin Router (Nested under /api/v1/admin)
  adminRouter.get("/users", (req, res) => {
    // Simulate fetching users (for admin only)
    const users = [
      { id: 1, username: "admin" },
      { id: 2, username: "user1" },
    ];
    res.json(users);
  });

  adminRouter.post("/users", (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Simulate creating a new user
    const newUser = { id: generateUniqueId(), username };
    res.status(201).json({ message: "User created", user: newUser });
  });

  // Nest the routers
  router.nest("/auth", authRouter); // Routes: /api/v1/auth/login, /api/v1/auth/register
  router.nest("/admin", adminRouter); // Routes: /api/v1/admin/users, /api/v1/admin/users
});

// Error handling middleware
router.useErrorHandler((err, req, res) => {
  console.error(`Error: ${err.message}`);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
run(router, PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Test the API at http://localhost:${PORT}/api/v1/test`);
});
