# YAF Framework
> A lightweight, zero-dependency Node.js web framework for modern applications

[NPM Version
[Node Version
[License: ISC

## Overview

YAF (Yet Another Framework) is a modern, lightweight Node.js framework designed for building scalable web applications. It provides a robust foundation with essential features while maintaining simplicity and performance.

## Key Features

- **High-Performance Routing**: Trie-based routing system for efficient request handling
- **Middleware Architecture**: Flexible middleware system with global, route-specific, and error-handling support
- **Built-in Security**: CORS middleware with comprehensive configuration options
- **Database Integration**: Transactional in-memory database for rapid prototyping
- **Modern JavaScript Support**: Built for Node.js ≥14.0.0
- **Type Safety**: Well-structured codebase with type definitions
- **Modular Design**: Support for nested routers and route grouping
- **Request Processing**: Advanced body parsing and query parameter handling

## Installation

```bash
npm install yaf-framework
```

## Quick Start

```javascript
const { Yaf, run } = require('yaf-framework');
const bodyParser = require('yaf-framework/body-parser');
const cors = require('yaf-framework/cors');

const app = new Yaf();

// Middleware configuration
app.use(cors());
app.use(bodyParser());

// Route handlers
app.get('/api', (req, res) => {
  res.json({ status: 'API is running' });
});

// Start server
run(app, 3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Core Components

### Router Module
```javascript
const { Yaf } = require('yaf-framework');
const router = new Yaf();

// Route definition
router.get('/users/:id', (req, res) => {
  res.json({ userId: req.params.id });
});

// Middleware attachment
router.use('/admin', authMiddleware);
```

### Database Operations
```javascript
const { InMemoryDatabase } = require('yaf-framework/database');
const db = new InMemoryDatabase();

// Transaction management
const txId = db.beginTransaction();
try {
  db.set('user:1', { name: 'John' });
  db.commitTransaction(txId);
} catch (error) {
  db.rollbackTransaction(txId);
}
```

### CORS Configuration
```javascript
const cors = require('yaf-framework/cors');

app.use(cors({
  origin: ['https://example.com'],
  methods: ['GET', 'POST'],
  credentials: true
}));
```

## API Reference

### Router Methods
- `router.get(path, ...handlers)`
- `router.post(path, ...handlers)`
- `router.put(path, ...handlers)`
- `router.delete(path, ...handlers)`
- `router.use(middleware)`
- `router.group(prefix, middleware, callback)`

### Database Methods
- `db.set(key, value)`
- `db.get(key)`
- `db.delete(key)`
- `db.beginTransaction()`
- `db.commitTransaction(id)`
- `db.rollbackTransaction(id)`

### Response Methods
- `res.status(code)`
- `res.json(data)`
- `res.send(data)`

## Configuration Options

### Body Parser
```javascript
app.use(bodyParser({
  limit: '1mb',
  strict: true,
  type: 'application/json'
}));
```

### CORS Options
```javascript
{
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  exposedHeaders: []
}
```

## Requirements

- Node.js ≥ 14.0.0
- NPM or Yarn package manager

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Author

Veli Furkan TÜRKOĞLU

## Links

- [Homepage](https://yaf.velifurkanturkoglu.me)
- [GitHub Repository](https://github.com/furkancodes/yaf)
- [Issue Tracker](https://github.com/yourusername/my-node-framework/issues)

---

*Built with precision and expertise for modern web development.*

Citations:
[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/31127038/cc065526-d22d-4e57-b046-d8f5c65bffae/paste.txt