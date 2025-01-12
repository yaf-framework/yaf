const { Yaf, run } = require("./lib");
const jsonBodyParser = require("./lib/body-parser");
const cors = require("./lib/cors");
const { InMemoryDatabase } = require("./lib/database");

const app = new Yaf();
const db = new InMemoryDatabase();

// Middleware Setup
app.use(jsonBodyParser({ limit: "1mb", strict: true }));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Logger Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }
  const session = db.get(`sessions:${token}`);
  if (!session) {
    return res.status(401).json({ error: "Invalid token" });
  }
  req.user = db.get(`users:${session.userId}`);
  next();
};

// API Routes
app.group("/api/v1/auth", [], () => {
  app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const userId = db.getNextId("users");
    const user = {
      id: userId,
      username,
      password, // In production, hash the password
      created_at: new Date().toISOString(),
    };

    db.set(`users:${userId}`, user);
    res.status(201).json({ message: "User created successfully" });
  });

  app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Find user (simplified version)
    let foundUser = null;
    for (const [key, value] of db.db) {
      if (key.startsWith("users:") && value.username === username && value.password === password) {
        foundUser = value;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create session
    const token = `token_${Date.now()}`;
    db.set(`sessions:${token}`, {
      userId: foundUser.id,
      created_at: new Date().toISOString(),
    });

    res.json({ token });
  });
});

app.group("/api/v1", [], () => {
  // Categories Routes

  app.group("/categories", [authenticate], () => {
    app.post("/", (req, res) => {
      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }
      const id = db.getNextId("categories");
      const category = {
        id,
        name,
        description,
        created_at: new Date().toISOString(),
        created_by: req.user.id,
      };
      db.set(`categories:${id}`, category);
      res.status(201).json(category);
    });

    app.get("/", (req, res) => {
      const categories = [];
      for (const [key, value] of db.db) {
        if (key.startsWith("categories:")) {
          categories.push(value);
        }
      }
      res.json(categories);
    });
  });

  // Products Routes
  app.group("/products", [authenticate], () => {
    app.post("/", (req, res) => {
      const { name, price, categoryId, stock } = req.body;
      if (!name || !price || !categoryId) {
        return res.status(400).json({ error: "Name, price and categoryId are required" });
      }

      // const category = db.get(`categories:${categoryId}`);
      // if (!category) {
      //   return res.status(404).json({ error: "Category not found" });
      // }

      const id = db.getNextId("products");
      const product = {
        id,
        name,
        price,
        // categoryId,
        stock: stock || 0,
        created_at: new Date().toISOString(),
        created_by: req.user.id,
      };
      db.set(`products:${id}`, product);
      res.status(201).json(product);
    });

    app.get("/", (req, res) => {
      const { categoryId } = req.query;
      const products = [];
      for (const [key, value] of db.db) {
        if (key.startsWith("products:")) {
          if (!categoryId || value.categoryId === parseInt(categoryId)) {
            products.push(value);
          }
        }
      }
      res.json(products);
    });
  });

  // Orders Routes
  app.group("/orders", [authenticate], () => {
    app.post("/", (req, res) => {
      const { items } = req.body;
      if (!items || !items.length) {
        return res.status(400).json({ error: "Order items are required" });
      }

      const orderId = db.getNextId("orders");
      const order = {
        id: orderId,
        userId: req.user.id,
        items,
        status: "pending",
        created_at: new Date().toISOString(),
        total: items.reduce((sum, item) => {
          const product = db.get(`products:${item.productId}`);
          return sum + product.price * item.quantity;
        }, 0),
      };

      db.set(`orders:${orderId}`, order);
      res.status(201).json(order);
    });

    app.get("/my-orders", (req, res) => {
      const orders = [];
      for (const [key, value] of db.db) {
        if (key.startsWith("orders:") && value.userId === req.user.id) {
          orders.push(value);
        }
      }
      res.json(orders);
    });
  });
});

// Error Handler
app.useErrorHandler((err, req, res) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;
run(app, PORT);
