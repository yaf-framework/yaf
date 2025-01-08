const { Router, run } = require("./lib");
const { InMemoryDatabase } = require("./lib/database");
const bodyParser = require("body-parser");
const cors = require("./lib/cors");

// Initialize router and database
const router = new Router();
const db = new InMemoryDatabase();

// Global Middleware Setup
router.use(bodyParser.json()); // Parse JSON bodies
router.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies
router.use(
  cors({
    origin: "*", // Allow all origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"], // Allowed HTTP methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
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
        const data = { id: (db.get("tempData") || []).length + 1, ...req.body };
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

  // Products Resource
  router.group("/products", [], () => {
    // Create product
    router.post("/", (req, res) => {
      const { name, price, description } = req.body;
      if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      const products = db.get("products") || [];
      const newProduct = {
        id: products.length + 1, // Generate ID based on length + 1
        name,
        price,
        description,
        createdAt: new Date().toISOString(),
      };

      products.push(newProduct);
      db.set("products", products);
      res.status(201).json(newProduct);
    });

    // Get all products
    router.get("/", (req, res) => {
      const products = db.get("products") || [];
      res.json(products);
    });

    // Get product by ID
    router.get("/:id", (req, res) => {
      const products = db.get("products") || [];
      const product = products.find((p) => p.id === parseInt(req.params.id));

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json(product);
    });

    // Update product
    router.put("/:id", (req, res) => {
      const products = db.get("products") || [];
      const index = products.findIndex((p) => p.id === parseInt(req.params.id));

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
      const filteredProducts = products.filter((p) => p.id !== parseInt(req.params.id));

      if (filteredProducts.length === products.length) {
        return res.status(404).json({ error: "Product not found" });
      }

      db.set("products", filteredProducts);
      res.status(204).end();
    });
  });

  // Nested Routers
  const authRouter = new Router();
  const adminRouter = new Router();

  // Auth Router (Nested under /api/v1/auth)
  authRouter.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Simulate a login process
    const token = (db.get("tokens") || []).length + 1; // Generate token based on length + 1
    res.json({ message: "Login successful", token });
  });

  authRouter.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    // Simulate a registration process
    const users = db.get("users") || [];
    const newUser = { id: users.length + 1, username, password }; // Generate ID based on length + 1
    users.push(newUser);
    db.set("users", users);
    res.status(201).json({ message: "Registration successful", user: newUser });
  });

  // Admin Router (Nested under /api/v1/admin)
  adminRouter.get("/users", (req, res) => {
    // Simulate fetching users (for admin only)
    const users = db.get("users") || [];
    res.json(users);
  });

  adminRouter.post("/users", (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    // Simulate creating a new user
    const users = db.get("users") || [];
    const newUser = { id: users.length + 1, username }; // Generate ID based on length + 1
    users.push(newUser);
    db.set("users", users);
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

// GET /api/v1/test - Basic GET request.

// POST /api/v1/test-query - Test query parameters and body parsing.
// {
//   "email": "john@example.com",
//   "city": "New York"
// }
// POST /api/v1/transactions/demo - Test transactions.
// {
//   "item": "Laptop",
//   "price": 1200
// }
// POST /api/v1/products - Create a product.
// {
//   "name": "Smartphone",
//   "price": 599.99,
//   "description": "A high-end smartphone with 128GB storage."
// }
// GET /api/v1/products - Fetch all products.

// GET /api/v1/products/:id - Fetch a product by ID.
// {
//   "id": 1,
//   "name": "Smartphone",
//   "price": 599.99,
//   "description": "A high-end smartphone with 128GB storage.",
//   "createdAt": "2023-10-05T12:34:56.789Z"
// }
// PUT /api/v1/products/:id - Update a product.
// {
//   "price": 549.99,
//   "description": "A high-end smartphone with 128GB storage and 5G support."
// }
// DELETE /api/v1/products/:id - Delete a product.

// POST /api/v1/auth/login - Simulate login.
// {
//   "username": "john_doe",
//   "password": "password123"
// }
// POST /api/v1/auth/register - Simulate registration.
// {
//   "username": "john_doe",
//   "password": "password123"
// }
// GET /api/v1/admin/users - Fetch users (admin only).
