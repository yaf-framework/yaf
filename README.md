# YAF 🚀

_Yet Another Framework (That I'm Building to Learn)_

<!-- <div align="center">
  <img src="logo.svg" alt="YAF Logo" width="400"/>
  <br/>
  <em>Because the JavaScript ecosystem definitely needed another framework</em>
</div> -->

[NPM Version][npm-url]
[Build Status][travis-url]
[Downloads Stats][npm-url]

## About YAF

Is the world ready for another Node.js framework? No.
Am I building one anyway to learn? Absolutely.

Welcome to YAF, where we're not trying to replace Express.js, we're just trying to figure out how Express.js works by building something similar but probably worse.

---

## Features 🌟

- **Blazingly Fast™** (when it works)
- **Lightweight** (because I haven't added any features yet)
- **Zero Dependencies** (because I haven't figured out how to use them properly)
- **Type Safe** (I think, haven't tested)
- **Production Ready** (if your production standards are very, very low)
- **Trie-Based Routing**: Efficient route matching with a trie data structure.
- **Middleware Support**: Global, route-specific, and error-handling middleware.
- **Dynamic Routes**: Handle routes like `/users/:id` with ease.
- **Query Parsing**: Automatically parse query parameters.
- **In-Memory Database**: A transactional key-value store for quick prototyping.
- **CORS Support**: Configurable CORS middleware for cross-origin requests.
- **Nested Routers**: Modularize your routes with nested routers.
- **Route Grouping**: Group routes under a common prefix or middleware stack.

---

## Installation 💾 NOT ADDED YET

```bash
npm install yaf-framework

# Or if you're feeling brave
npm install yaf-framework@latest
```

---

## Quick Start 🚀

```javascript
const { Router, run } = require("yaf-framework");
const { InMemoryDatabase } = require("yaf-framework/database");
const cors = require("yaf-framework/cors");

// Initialize router and database
const router = new Router();
const db = new InMemoryDatabase();

// Global Middleware
router.use(cors({ origin: "*" }));

// Routes
router.get("/", (req, res) => {
  res.json({ message: "Welcome to YAF! If you see this, something actually worked!" });
});

router.post("/products", (req, res) => {
  const { name, price } = req.body;
  const products = db.get("products") || [];
  const newProduct = { id: products.length + 1, name, price };
  products.push(newProduct);
  db.set("products", products);
  res.status(201).json(newProduct);
});

// Start the server
run(router, 3000, () => {
  console.log("YAF is running! (Surprising, I know)");
});
```

---

## API Reference 📚

### **Router**

- **`new Router()`**: Create a new router instance.
- **`router.get(path, ...handlers)`**: Register a GET route.
- **`router.post(path, ...handlers)`**: Register a POST route.
- **`router.put(path, ...handlers)`**: Register a PUT route.
- **`router.delete(path, ...handlers)`**: Register a DELETE route.
- **`router.use(middleware)`**: Register global middleware.
- **`router.useErrorHandler(middleware)`**: Register error-handling middleware.
- **`router.group(prefix, middleware, callback)`**: Group routes under a prefix.
- **`router.nest(prefix, router)`**: Nest a router under a prefix.

### **Response**

- **`res.status(code)`**: Set the response status code.
- **`res.json(data)`**: Send a JSON response.
- **`res.send(data)`**: Send a response (string, object, or number).
- **`res.redirect(url)`**: Redirect to a URL.
- **`res.sendFile(path)`**: Send a file as a response.
- **`res.download(path, filename)`**: Trigger a file download.

### **InMemoryDatabase**

- **`new InMemoryDatabase()`**: Create a new in-memory database instance.
- **`db.set(key, value)`**: Set a value in the database.
- **`db.get(key)`**: Get a value from the database.
- **`db.delete(key)`**: Delete a value from the database.
- **`db.beginTransaction()`**: Start a transaction.
- **`db.commitTransaction(id)`**: Commit a transaction.
- **`db.rollbackTransaction(id)`**: Rollback a transaction.

---

## Examples 🛠️

### **Basic Route**

```javascript
router.get("/hello", (req, res) => {
  res.json({ message: "Hello, world!" });
});
```

### **Dynamic Route**

```javascript
router.get("/users/:id", (req, res) => {
  const userId = req.params.id;
  res.json({ userId });
});
```

### **Middleware**

```javascript
router.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

### **Error Handling**

```javascript
router.useErrorHandler((err, req, res) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong!" });
});
```

### **Nested Routers**

```javascript
const authRouter = new Router();
authRouter.post("/login", (req, res) => {
  res.json({ message: "Logged in!" });
});

router.nest("/auth", authRouter);
```

---

## Performance Benchmarks 📊

```
YAF vs Express vs Fastify
(Results pending because I'm still learning how to do benchmarks)
```

---

## Why YAF? 🤔

- You want to learn how frameworks work.
- You enjoy living dangerously.
- You've used every other framework and are running out of options.
- You appreciate documentation with humor because it helps mask the pain.

---

## Contributing 🤝

Want to contribute? Really? Are you sure? Well, okay then!

1. Fork it.
2. Create your feature branch (`git checkout -b feature/something-that-might-work`).
3. Commit your changes (`git commit -am 'Added some feature that probably breaks everything'`).
4. Push to the branch (`git push origin feature/something-that-might-work`).
5. Create a new Pull Request.
6. Cross your fingers.

---

## Documentation 📚

Full documentation available at [docs.yaf.dev](https://docs.yaf.dev)\*

\*Domain not actually purchased because this is a learning project.

---

## License 📝

MIT License - See [LICENSE.md](LICENSE.md) for details.

---

## Acknowledgments 🙏

- Stack Overflow, for solving 99% of my problems.
- Express.js, for being the inspiration (sorry for copying you).
- Coffee, for making this possible.
- My rubber duck, for the moral support.

---

---

<div align="center">
  <sub>Built with ❤️ and considerable confusion</sub>
</div>

---

Let me know if you'd like to tweak anything further! 🚀

[npm-image]: https://img.shields.io/npm/v/yaf-framework.svg
[npm-url]: https://npmjs.org/package/yaf-framework
[npm-downloads]: https://img.shields.io/npm/dm/yaf-framework.svg
[travis-image]: https://travis-ci.org/username/yaf-framework.svg?branch=master
[travis-url]: https://travis-ci.org/username/yaf-framework
