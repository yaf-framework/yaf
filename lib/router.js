const { HTTP_METHODS } = require("./constants");
const { fastDecode } = require("./utils");

/**
 * Represents a node in the route trie.
 */
class RouteNode {
  /**
   * Initializes a new instance of RouteNode.
   */
  constructor() {
    /**
     * Map of child nodes keyed by path segment.
     * @type {Map<String, RouteNode>}
     */
    this.children = new Map();

    /**
     * Map of handlers keyed by HTTP method.
     * @type {Map<String, Function>}
     */
    this.handlers = new Map();

    /**
     * Array of parameter names in the route.
     * @type {Array<String>}
     */
    this.params = [];

    /**
     * Parsed query parameters.
     * @type {Object}
     */
    this.query = {};

    /**
     * Array of middleware functions for the route.
     * @type {Array<Function>}
     */
    this.middleware = [];
  }
}

/**
 * Represents response methods
 */
class Response {
  constructor(res) {
    this.res = res;
    this.statusCode = 200;
    this.headers = {};
    this.sent = false; // Track if response has been sent
  }

  // Prevent multiple sends
  #ensureNotSent() {
    if (this.sent) {
      throw new Error("Cannot send more than one response");
    }
  }

  // Set response status
  status(code) {
    this.statusCode = code;
    return this;
  }

  // Set header
  setHeader(name, value) {
    this.headers[name] = value;
    return this;
  }

  // Send JSON response
  json(data) {
    this.#ensureNotSent();
    this.sent = true;
    this.res.writeHead(this.statusCode, {
      ...this.headers,
      "Content-Type": "application/json",
    });
    this.res.end(JSON.stringify(data));
    return this;
  }

  // Send general response
  send(data) {
    this.#ensureNotSent();
    this.sent = true;

    if (data === null) {
      this.res.writeHead(this.statusCode, this.headers);
      return this.res.end();
    }

    switch (typeof data) {
      case "string":
        if (!this.headers["Content-Type"]) {
          this.headers["Content-Type"] = "text/plain";
        }
        break;
      case "object":
        if (!this.headers["Content-Type"]) {
          this.headers["Content-Type"] = "application/json";
        }
        data = JSON.stringify(data);
        break;
      case "number":
        data = data.toString();
        break;
    }

    this.res.writeHead(this.statusCode, this.headers);
    this.res.end(data);
    return this;
  }

  // Send status with message
  sendStatus(statusCode) {
    this.status(statusCode);
    return this.send(statusCode.toString());
  }

  // Redirect response
  redirect(url) {
    this.#ensureNotSent();
    this.sent = true;
    this.res.writeHead(302, {
      ...this.headers,
      Location: url,
    });
    this.res.end();
    return this;
  }

  // Download file
  download(path, filename) {
    this.#ensureNotSent();
    this.sent = true;
    const fs = require("fs");

    this.setHeader("Content-Disposition", `attachment; filename="${filename || path}"`);
    this.setHeader("Content-Type", "application/octet-stream");

    const fileStream = fs.createReadStream(path);
    fileStream.pipe(this.res);
    return this;
  }

  // Send file
  sendFile(path) {
    this.#ensureNotSent();
    this.sent = true;
    const fs = require("fs");
    const mime = require("mime-types");

    const contentType = mime.lookup(path) || "application/octet-stream";
    this.setHeader("Content-Type", contentType);

    const fileStream = fs.createReadStream(path);
    fileStream.pipe(this.res);
    return this;
  }

  // End response
  end(data) {
    this.#ensureNotSent();
    this.sent = true;
    this.res.writeHead(this.statusCode, this.headers);
    this.res.end(data);
    return this;
  }
}

/**
 * The main router class that manages routes and handles requests.
 */
class Yaf {
  /**
   * Initializes a new instance of Router.
   */
  constructor() {
    /**
     * The root node of the route trie.
     * @type {RouteNode}
     */
    this.root = new RouteNode();

    /**
     * Array of global middleware functions.
     * @type {Array<Function>}
     */
    this.globalMiddleware = [];

    /**
     * Error-handling middleware function.
     * @type {Function}
     */
    this.errorHandler = null;

    this.middlewareStack = [];

    // Dynamically add HTTP method-specific functions
    Object.keys(HTTP_METHODS).forEach((methodKey) => {
      const httpMethod = HTTP_METHODS[methodKey];
      Router.prototype[httpMethod.toLowerCase()] = function (path, ...handlers) {
        const handler = handlers.pop(); // Last argument is the route handler
        const middleware = handlers.flat(); // Flatten middleware array and get all but last handler
        this.#addRoute(path, httpMethod, handler, middleware);
        return this; // Enable method chaining
      };
    });
  }

  /**
   * Verifies the inputs for adding a route.
   * @private
   * @param {String} path - The path of the route.
   * @param {Function} handler - The handler function for the route.
   * @param {String} method - The HTTP method of the route.
   */
  #verifyInputs(path, handler, method) {
    if (typeof path !== "string" || path[0] !== "/") {
      throw new Error("Malformed path provided.");
    }
    if (typeof handler !== "function") {
      throw new Error("Handler should be a function.");
    }
    if (!Object.values(HTTP_METHODS).includes(method)) {
      throw new Error("Invalid HTTP method provided.");
    }
  }

  /**
   * Verifies the path and method for finding a route.
   * @private
   * @param {String} path - The path of the route.
   * @param {String} method - The HTTP method of the route.
   */
  #verifyPathAndMethod(path, method) {
    if (typeof path !== "string" || path[0] !== "/") {
      throw new Error("Malformed path provided.");
    }
    if (!Object.values(HTTP_METHODS).includes(method)) {
      throw new Error("Invalid HTTP method provided.");
    }
  }
  /**
   * Combines global, group, and route-specific middleware into a single array.
   * @param {Array<Function>} globalMiddleware - Global middleware functions.
   * @param {Array<Object>} middlewareStack - Group middleware stack.
   * @param {Array<Function>} routeMiddleware - Route-specific middleware functions.
   * @returns {Array<Function>} - Combined middleware array.
   */
  #combineMiddleware(globalMiddleware, middlewareStack, routeMiddleware) {
    const groupMiddleware = middlewareStack.flatMap((group) => group.middleware).flat();
    return [...globalMiddleware, ...groupMiddleware, ...routeMiddleware].flat();
  }

  /**
   * Adds a route to the trie structure.
   * @private
   * @param {String} path - The path of the route.
   * @param {String} method - The HTTP method of the route.
   * @param {Function} handler - The handler function for the route.
   * @param {Array<Function>} middleware - Route-specific middleware.
   */
  #addRoute(path, method, handler, middleware = []) {
    this.#verifyInputs(path, handler, method);

    // Combine middleware
    const allMiddleware = this.#combineMiddleware(this.globalMiddleware, this.middlewareStack, middleware);

    // Apply path prefix
    const fullPath = this.middlewareStack.reduce((acc, group) => acc + group.prefix, "") + path;
    // Step 3: Process the full path (with prefix)
    let currentNode = this.root;
    let routeParts = fullPath.split("/").filter(Boolean); // Split and remove empty segments
    let dynamicParams = [];

    for (const segment of routeParts) {
      if (segment.includes(" ")) throw new Error("Malformed `path` parameter");

      const isDynamic = segment.startsWith(":");

      const key = isDynamic ? ":" : segment.toLowerCase();

      if (isDynamic) {
        let paramString = segment.substring(1);
        dynamicParams.push(paramString);
      }

      if (!currentNode.children.has(key)) {
        currentNode.children.set(key, new RouteNode());
      }

      currentNode = currentNode.children.get(key);
    }

    // Step 4: Store the handler, params, and combined middleware
    currentNode.handlers.set(method, handler);
    currentNode.params = dynamicParams;
    currentNode.middleware = allMiddleware; // Store combined middleware
  }
  /**
   * Parses the query string and stores it in the current node.
   * @private
   * @param {String} queryString - The query string.
   * @param {RouteNode} currentNode - The current node in the trie.
   */
  #parseQueryParams(queryString, currentNode) {
    if (!queryString) return; // If no query string, return early

    const queryPairs = queryString.split("&"); // Split into individual key-value pairs
    const queryParams = {};

    for (const pair of queryPairs) {
      let [key, value] = pair.split("="); // Split into key and value

      // Handle missing values (e.g., "key=" or "key")
      if (value === undefined) {
        value = "";
      }

      // Decode both key and value using fastDecode
      const decodedKey = fastDecode(key);
      const decodedValue = fastDecode(value);

      // Overwrite if the key already exists (handles duplicate keys)
      queryParams[decodedKey] = decodedValue;
    }

    // Assign the parsed query parameters to currentNode.query
    currentNode.query = queryParams;
  }

  /**
   * Finds the route handler and parameters for a given path and method.
   * @param {String} path - The path of the request.
   * @param {String} method - The HTTP method of the request.
   * @returns { { params: Object, handler: Function } | null } - The route information or null if not found.
   */
  findRoute(path, method) {
    this.#verifyPathAndMethod(path, method);
    const [pathWithoutQuery, queryString] = path.split("?", 2);

    // Process path segments
    const segments = pathWithoutQuery.split("/").filter(Boolean);

    let currentNode = this.root;
    let extractedParams = [];

    for (const segment of segments) {
      let childNode = currentNode.children.get(segment.toLowerCase());
      if (childNode) {
        currentNode = childNode;
      } else if ((childNode = currentNode.children.get(":"))) {
        extractedParams.push(segment);
        currentNode = childNode;
      } else {
        return null;
      }
    }

    this.#parseQueryParams(queryString, currentNode);

    let params = Object.create(null);

    for (let idx = 0; idx < extractedParams.length; idx++) {
      let key = currentNode.params[idx];
      let value = extractedParams[idx];

      // Parse numeric parameters (e.g., :id) as numbers
      if (!isNaN(value)) {
        value = Number(value);
      }

      params[key] = value;
    }

    return {
      params,
      handler: currentNode.handlers.get(method),
      query: currentNode.query,
      middleware: currentNode.middleware, // Include route-specific middleware
    };
  }

  /**
   * Register global middleware.
   * @param {Function} middleware - The middleware function.
   */
  use(middleware) {
    if (typeof middleware !== "function") {
      throw new Error("Middleware must be a function.");
    }

    this.globalMiddleware.push(middleware);
  }

  /**
   * Register error-handling middleware.
   * @param {Function} middleware - The error-handling middleware.
   */
  useErrorHandler(middleware) {
    if (typeof middleware !== "function") {
      throw new Error("Error-handling middleware must be a function.");
    }
    this.errorHandler = middleware;
  }

  /**
   * Execute middleware and route handler.
   * @private
   * @param {Array<Function>} middleware - Middleware functions.
   * @param {Function} handler - The route handler.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  async #executeMiddlewareAndHandler(middleware, handler, req, res) {
    const context = {}; // Create empty context object
    const execute = async (index) => {
      if (index < middleware.length) {
        const currentMiddleware = middleware[index];
        try {
          await currentMiddleware(req, res, () => execute(index + 1));
        } catch (err) {
          throw err; // Pass errors to the error handler
        }
      } else {
        try {
          await handler(req, res, context);
        } catch (err) {
          throw err; // Pass errors to the error handler
        }
      }
    };
    await execute(0);
  }

  /**
   * Handle a request.
   * @param {Object} req - The request object.
   * @param {Object} res - The response object.
   */
  async handleRequest(req, res) {
    const response = new Response(res);
    try {
      const result = this.findRoute(req.url, req.method);
      if (result && result.handler) {
        // Attach query parameters to the request object
        req.query = result.query;

        // Attach route parameters to the request object
        req.params = result.params;

        // Combine global middleware with route-specific middleware
        const allMiddleware = [...this.globalMiddleware, ...result.middleware];
        await this.#executeMiddlewareAndHandler(allMiddleware, result.handler, req, response);
      } else {
        response.status(404).json({ error: "Not Found" });
      }
    } catch (err) {
      if (this.errorHandler) {
        await this.errorHandler(err, req, response, () => {});
      } else {
        response.status(500).json({ error: "Internal Server Error" });
      }
    }
  }

  /**
   * Merges routes from another router into this router.
   * @param {Router} otherRouter - The router whose routes are to be merged.
   */
  merge(otherRouter) {
    // Merge global middleware
    this.globalMiddleware = [...this.globalMiddleware, ...otherRouter.globalMiddleware];

    const routes = [];
    // Start collecting routes from the root's children
    for (const [key, childNode] of otherRouter.root.children) {
      const segment = key === ":" ? `:${childNode.params[0]}` : key;
      this.collectRoutes(childNode, `/${segment}`, [...childNode.params], routes);
    }
    for (const route of routes) {
      this.#addRoute(route.path, route.method, route.handler, route.middleware);
    }
  }

  group(prefixOrMiddleware, middlewareOrCallback, callback) {
    let prefix, middleware;
    if (typeof prefixOrMiddleware === "string") {
      prefix = prefixOrMiddleware;
      middleware = middlewareOrCallback;
    } else {
      prefix = "";
      middleware = prefixOrMiddleware;
      callback = middlewareOrCallback;
    }

    this.middlewareStack.push({ prefix, middleware });
    callback();
    this.middlewareStack.pop();
  }

  /**
   * Recursively collects routes from a given node in the trie.
   * @param {RouteNode} node - The current node in the trie.
   * @param {String} currentPath - The path constructed so far.
   * @param {Array<String>} currentParams - The parameters collected so far.
   * @param {Array<Object>} routes - The array to store collected routes.
   */
  collectRoutes(node, currentPath, currentParams, routes) {
    // If the node has handlers, add them to the routes array
    if (node.handlers.size > 0) {
      for (const [method, handler] of node.handlers) {
        routes.push({ path: currentPath, method, handler, params: currentParams, middleware: node.middleware });
      }
    }
    // Recursively collect routes from child nodes
    for (const [key, childNode] of node.children) {
      const segment = key === ":" ? `:${childNode.params[0]}` : key;
      this.collectRoutes(childNode, `${currentPath}/${segment}`, [...currentParams, ...childNode.params], routes);
    }
  }

  /**
   * Nest a router under a specific path prefix.
   * @param {String} prefix - The path prefix (e.g., "/api/v1").
   * @param {Router} router - The router to nest.
   */
  nest(prefix, router) {
    if (typeof prefix !== "string" || prefix[0] !== "/") {
      throw new Error("Prefix must be a string starting with '/'.");
    }
    if (!(router instanceof Router)) {
      throw new Error("Nested object must be an instance of Router.");
    }

    const routes = [];
    this.collectRoutes(router.root, prefix, [], routes);

    for (const route of routes) {
      this.#addRoute(route.path, route.method, route.handler, route.middleware);
    }
  }

  /**
   * Prints the route tree for debugging purposes.
   * @param {RouteNode} [node=this.root] - The current node in the trie.
   * @param {number} [indentation=0] - The level of indentation for printing.
   * @param {Array<String>} [dynamicParams=[]] - The list of dynamic parameters encountered so far.
   */
  printTree(node = this.root, indentation = 0, dynamicParams = []) {
    const indent = "  ".repeat(indentation);

    for (const key of node.children.keys()) {
      const childNode = node.children.get(key);
      const isDynamic = key === ":";

      const paramName = isDynamic ? childNode.params[0] : null;

      // Collect dynamic parameters
      const currentDynamicParams = isDynamic ? [...dynamicParams, paramName] : dynamicParams;

      // Display dynamic parameters or 'No'
      const dynamicStr = isDynamic ? currentDynamicParams.join(",") : "No";

      console.log(`${indent}(${key}) Dynamic: ${dynamicStr}`);

      // Print handlers if they exist
      if (childNode.handlers.size > 0) {
        const methods = Array.from(childNode.handlers.keys()).join(", ");
        console.log(`${indent}  Handlers: ${methods}`);
      }

      // Recursively print child nodes
      this.printTree(childNode, indentation + 1, currentDynamicParams);
    }
  }
}

module.exports = Yaf;
