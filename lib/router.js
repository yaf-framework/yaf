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
  }
}

/**
 * The main router class that manages routes and handles requests.
 */
class Router {
  /**
   * Initializes a new instance of Router.
   */
  constructor() {
    /**
     * The root node of the route trie.
     * @type {RouteNode}
     */
    this.root = new RouteNode();

    // Dynamically add HTTP method-specific functions
    Object.keys(HTTP_METHODS).forEach((methodKey) => {
      const httpMethod = HTTP_METHODS[methodKey];
      Router.prototype[httpMethod.toLowerCase()] = function (path, handler) {
        this.#addRoute(path, httpMethod, handler);
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
   * Adds a route to the trie structure.
   * @private
   * @param {String} path - The path of the route.
   * @param {String} method - The HTTP method of the route.
   * @param {Function} handler - The handler function for the route.
   */
  #addRoute(path, method, handler) {
    this.#verifyInputs(path, handler, method);
    let currentNode = this.root;
    let routeParts = path.split("/").filter(Boolean);
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

    currentNode.handlers.set(method, handler);
    currentNode.params = dynamicParams;
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

      params[key] = value;
    }

    return {
      params,
      handler: currentNode.handlers.get(method),
      query: currentNode.query,
    };
  }
  merge(otherRouter) {
    const routes = [];
    // Start collecting routes from the root's children, not the root itself
    for (const [key, childNode] of otherRouter.root.children) {
      const segment = key === ":" ? `:${childNode.params[0]}` : key;
      this.collectRoutes(childNode, `/${segment}`, [...childNode.params], routes);
    }
    for (const route of routes) {
      this.#addRoute(route.path, route.method, route.handler);
    }
  }
  collectRoutes(node, currentPath, currentParams, routes) {
    if (node.handlers.size > 0) {
      for (const [method, handler] of node.handlers) {
        routes.push({ path: currentPath, method, handler, params: currentParams });
      }
    }
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
      this.#addRoute(route.path, route.method, route.handler);
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

module.exports = Router;
