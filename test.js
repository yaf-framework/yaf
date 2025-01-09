const { Router, run } = require("./lib");
const bodyParser = require("body-parser");
const cors = require("./lib/cors");
const pgp = require('pg-promise')();
const postgre = pgp('ADD POSTGRES URL'); // Replace with your Neon Tech PostgreSQL connection string

// Initialize router
const router = new Router();

// Function to create tables if they don't exist
async function createTables() {
  try {
    await postgre.none(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tokens (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tempData (
        id SERIAL PRIMARY KEY,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Tables created or already exist.");
  } catch (error) {
    console.error("Failed to create tables:", error);
  }
}

// Call the function to create tables when the server starts
createTables();

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
    router.post("/demo", async (req, res) => {
      const transaction = await postgre.tx(async (t) => {
        try {
          // Perform some operations
          const data = { ...req.body };
          await t.none('INSERT INTO tempData(data) VALUES($1)', [data]);

          // Commit the transaction
          return { message: "Transaction successful", data };
        } catch (error) {
          throw error;
        }
      });

      res.json(transaction);
    });
  });

  // Products Resource
  router.group("/products", [], () => {
    // Create product
    router.post("/", async (req, res) => {
      const { name, price, description } = req.body;
      if (!name || !price) {
        return res.status(400).json({ error: "Name and price are required" });
      }

      try {
        const newProduct = await postgre.one(
          'INSERT INTO products(name, price, description, created_at) VALUES($1, $2, $3, $4) RETURNING *',
          [name, price, description, new Date().toISOString()]
        );
        res.status(201).json(newProduct);
      } catch (error) {
        res.status(500).json({ error: "Failed to create product", message: error.message });
      }
    });

    // Get all products
    router.get("/", async (req, res) => {
      try {
        const products = await postgre.any('SELECT * FROM products');
        res.json(products);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch products", message: error.message });
      }
    });

    // Get product by ID
    router.get("/:id", async (req, res) => {
      try {
        const product = await postgre.oneOrNone('SELECT * FROM products WHERE id = $1', [req.params.id]);
        if (!product) {
          return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch product", message: error.message });
      }
    });

    // Update product
    router.put("/:id", async (req, res) => {
      const { name, price, description } = req.body;
      try {
        const updatedProduct = await postgre.one(
          'UPDATE products SET name = $1, price = $2, description = $3, updated_at = $4 WHERE id = $5 RETURNING *',
          [name, price, description, new Date().toISOString(), req.params.id]
        );
        res.json(updatedProduct);
      } catch (error) {
        res.status(500).json({ error: "Failed to update product", message: error.message });
      }
    });

    // Delete product
    router.delete("/:id", async (req, res) => {
      try {
        await postgre.none('DELETE FROM products WHERE id = $1', [req.params.id]);
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: "Failed to delete product", message: error.message });
      }
    });
  });

  // Nested Routers
  const authRouter = new Router();
  const adminRouter = new Router();

  // Auth Router (Nested under /api/v1/auth)
  authRouter.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      const user = await postgre.oneOrNone('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Simulate a login process
      const token = (await postgre.one('SELECT COUNT(*) FROM tokens')).count + 1; // Generate token based on count + 1
      res.json({ message: "Login successful", token });
    } catch (error) {
      res.status(500).json({ error: "Failed to login", message: error.message });
    }
  });

  authRouter.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      const newUser = await postgre.one(
        'INSERT INTO users(username, password) VALUES($1, $2) RETURNING *',
        [username, password]
      );
      res.status(201).json({ message: "Registration successful", user: newUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to register", message: error.message });
    }
  });

  // Admin Router (Nested under /api/v1/admin)
  adminRouter.get("/users", async (req, res) => {
    try {
      const users = await postgre.any('SELECT * FROM users');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users", message: error.message });
    }
  });

  adminRouter.post("/users", async (req, res) => {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: "Username is required" });
    }

    try {
      const newUser = await postgre.one(
        'INSERT INTO users(username) VALUES($1) RETURNING *',
        [username]
      );
      res.status(201).json({ message: "User created", user: newUser });
    } catch (error) {
      res.status(500).json({ error: "Failed to create user", message: error.message });
    }
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